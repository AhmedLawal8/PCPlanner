import json

from budget_split import BUDGET_SPLITS, allocate_budget
from gemini_client import ask_gemini, parse_json_answer
from models.tables import (
    CPU, Case, Cooler, GPU, Motherboard, PSU, RAM, Storage,
)

# ---------------------------------------------------------------------
# Candidate selection -- pulls real DB rows in budget for each category.
# ---------------------------------------------------------------------

CATEGORY_MODELS = {
    "cpu": CPU,
    "gpu": GPU,
    "motherboard": Motherboard,
    "ram": RAM,
    "storage": Storage,
    "psu": PSU,
    "case": Case,
    "cooler": Cooler,
}

WINDOW_PCT = 0.20  # look up to 20% below the allocation
RESULT_COUNT = 5


def requires_igpu(use_case):
    """A CPU needs integrated graphics if this use case's split has no
    dedicated GPU allocation at all -- otherwise the build would have no
    video output."""
    return "gpu" not in BUDGET_SPLITS[use_case.lower()]


def recommend_parts(category, allocation, require_igpu=False):
    """
    Return up to RESULT_COUNT parts for `category` priced within a window
    below `allocation`, never exceeding it.

    require_igpu only applies to CPUs. when True, only CPUs with
    integrated graphics are considered, for use cases with no dedicated
    GPU allocation at all.

    If the window is too narrow to find RESULT_COUNT parts (common for
    cheaper categories with few listings in a tight range), fall back to
    the closest parts under the allocation with no lower bound.
    """
    model = CATEGORY_MODELS[category]
    floor = max(allocation * (1 - WINDOW_PCT), 0)
    igpu_only = require_igpu and category == "cpu"

    query = model.query.filter(model.price <= allocation, model.price >= floor)
    if igpu_only:
        query = query.filter(model.graphics.isnot(None))
    parts = query.order_by(model.price.desc()).limit(RESULT_COUNT).all()

    if len(parts) < RESULT_COUNT:
        query = model.query.filter(model.price <= allocation)
        if igpu_only:
            query = query.filter(model.graphics.isnot(None))
        parts = query.order_by(model.price.desc()).limit(RESULT_COUNT).all()

    return parts


def get_minimum_budget(use_case):
    """
    Return the lowest total_budget for which every category this use case
    actually requires can afford its cheapest available part, given that
    use case's percentage split.

    This is driven by whichever required category has the tightest
    percentage relative to its cheapest available price for example if GPU is
    26% of the "streaming" split and the cheapest GPU is $139.97, that
    category alone needs a $139.97 / 0.26 ~= $538 total budget to be
    affordable, and other categories' true minimums are checked the same
    way. The largest of these is the real floor for that use case.
    """
    use_case = use_case.lower()
    if use_case not in BUDGET_SPLITS:
        valid = ", ".join(BUDGET_SPLITS.keys())
        raise ValueError(
            f"Unknown use case '{use_case}'. Valid options: {valid}")

    igpu_only_cpu = requires_igpu(use_case)

    minimum = 0
    for category, pct in BUDGET_SPLITS[use_case].items():
        model = CATEGORY_MODELS[category]
        query = model.query.filter(model.price.isnot(None))
        if category == "cpu" and igpu_only_cpu:
            query = query.filter(model.graphics.isnot(None))
        cheapest = query.order_by(model.price.asc()).first()
        if cheapest is None:
            raise ValueError(
                f"No priced parts available for {model.__tablename__}")
        minimum = max(minimum, cheapest.price / pct)
    return minimum


def recommend_build(total_budget, use_case):
    """
    Given a total budget and use case, return a dict mapping each category
    to a list of up to RESULT_COUNT candidate parts.
    """
    minimum = get_minimum_budget(use_case)
    if total_budget < minimum:
        raise ValueError(
            f"Budget too low for a '{use_case}' build: at least "
            f"${minimum:.2f} is needed so every required category can "
            f"afford its cheapest available part."
        )

    allocations = allocate_budget(total_budget, use_case)
    igpu_only_cpu = requires_igpu(use_case)
    return {
        category: recommend_parts(
            category, allocation,
            require_igpu=(category == "cpu" and igpu_only_cpu),
        )
        for category, allocation in allocations.items()
    }



# AI pick -- Gemini picks the best combination from the candidates above.
# ---------------------------------------------------------------------

# Which fields actually matter for compatibility/value reasoning, per
# category -- keeps the prompt small and focused instead of dumping every
# column we happen to store. Also doubles as the list of valid categories,
# so there's only one place that needs to know what they are.
COMPAT_FIELDS = {
    "cpu": [
        "name", "price", "cores", "base_clock", "boost_clock",
        "wattage", "socket",
    ],
    "motherboard": [
        "name", "price", "socket", "type", "memory_type", "max_memory",
    ],
    "gpu": ["name", "price", "vram", "wattage", "chipset"],
    "ram": ["name", "price", "capacity", "speed", "memory_type"],
    "storage": ["name", "price", "capacity", "drive_type", "interface"],
    "psu": ["name", "price", "wattage", "efficiency_rating"],
    "case": ["name", "price", "case_type", "color"],
    "cooler": ["name", "price", "rpm", "noise_level", "radiator_size"],
}


def serialize_part(category, part):
    """Turn a SQLAlchemy part row into a plain dict of just the fields
    relevant to picking/compatibility for its category."""
    return {field: getattr(part, field) for field in COMPAT_FIELDS[category]}


def build_prompt(candidates_by_category, use_case, total_budget):
    """Build the single prompt asking Gemini to pick one part per
    category, from the given shortlist only."""

    # This is the actual hand-off point: candidates_by_category holds up
    # to 5 real DB rows per category (from recommend_build() above). Each
    # list gets serialized to plain JSON and dropped into its own labeled
    # section of the prompt below -- these sections are the ONLY parts
    # Gemini is allowed to pick from for that category.
    sections = []
    for category in COMPAT_FIELDS:
        parts = candidates_by_category.get(category, [])
        serialized = [serialize_part(category, p) for p in parts]
        sections.append(f"{category}:\n{json.dumps(serialized, indent=2)}")

    parts_block = "\n\n".join(sections)

    return (
        f'You are building a PC for a "{use_case}" use case with a total '
        f"budget of ${total_budget:.2f}. For each category below, pick "
        "EXACTLY ONE part from the given options -- you may only choose "
        'parts that appear in these lists, copying the "name" field '
        "exactly. Consider compatibility (socket, memory_type, wattage vs "
        "PSU) and value for money.\n\n"
        f"{parts_block}\n\n"  # per-category candidate lists land here
        "Respond with ONLY a JSON object in this exact shape, nothing "
        "else, no markdown code fences:\n"
        "{\n"
        '  "cpu": {"name": "<exact name>", "why": "<one short sentence>"},\n'
        '  "motherboard": {"name": "...", "why": "..."},\n'
        '  "gpu": {"name": "...", "why": "..."},\n'
        '  "ram": {"name": "...", "why": "..."},\n'
        '  "storage": {"name": "...", "why": "..."},\n'
        '  "psu": {"name": "...", "why": "..."},\n'
        '  "case": {"name": "...", "why": "..."},\n'
        '  "cooler": {"name": "...", "why": "..."},\n'
        '  "summary": "<2-3 sentence overview of the whole build>"\n'
        "}"
    )


def pick_part(category, candidates, ai_result):
    """
    Return (chosen_part, why) for one category: the AI's pick if it's
    actually one of the real candidates it was given, otherwise the
    closest-to-budget candidate as a safe fallback.

    This is the one place that keeps the AI from ever "inventing" a part
    that doesn't exist -- every returned part is either a validated AI
    pick or our own explicit fallback, never trusted blindly.
    """
    by_name = {part.name: part for part in candidates}
    pick = ai_result.get(category, {})
    chosen_part = by_name.get(pick.get("name"))

    if chosen_part is not None:
        return chosen_part, pick.get("why", "")

    return candidates[0], "Selected automatically (closest to budget)."


def generate_build(total_budget, use_case):
    """Get candidates, ask Gemini to pick one per category, build result."""
    candidates_by_category = recommend_build(total_budget, use_case)

    try:
        prompt = build_prompt(candidates_by_category, use_case, total_budget)
        ai_result = parse_json_answer(ask_gemini(prompt, use_search=True))
    except Exception as error:
        print(f"generate_build: AI call/parse failed, using fallback: {error}")
        ai_result = {}

    build = {}
    missing_categories = []
    total_price = 0
    for category, candidates in candidates_by_category.items():
        if not candidates:
            missing_categories.append(category)
            continue

        part, why = pick_part(category, candidates, ai_result)
        build[category] = {"name": part.name, "price": part.price, "why": why}
        total_price += part.price or 0

    return {
        "parts": build,
        "total_price": round(total_price, 2),
        "summary": ai_result.get("summary", ""),
        "missing_categories": missing_categories,
    }
