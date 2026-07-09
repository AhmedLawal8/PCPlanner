import json

from budget_split import allocate_budget, resolve_splits
from gemini_client import ask_gemini, parse_json_answer
from models.tables import (
    CPU, Case, Cooler, GPU, Motherboard, PSU, RAM, Storage,
)

# ---------------------------------------------------------------------
# Candidate selection. pulls real DB rows in budget for each category.
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


def describe_use_case(use_case):
    """Human-readable phrase for error/prompt text. use_case may be a
    preset name (str) or a custom split (dict), and a raw dict would
    print as ugly Python repr text if used directly in an f-string."""
    if isinstance(use_case, dict):
        return "a custom budget breakdown"
    return f"a '{use_case}' use case"


def requires_igpu(use_case):
    """A CPU needs integrated graphics if this use case's split has no
    dedicated GPU allocation at all, otherwise the build would have no
    video output. Works for a preset name or a custom split dict."""
    return "gpu" not in resolve_splits(use_case)


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
    igpu_only = require_igpu and category == "cpu"  # only CPU has .graphics

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
    splits = resolve_splits(use_case)
    igpu_only_cpu = requires_igpu(use_case)

    minimum = 0
    for category, pct in splits.items():
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
            f"Budget too low for {describe_use_case(use_case)}: at least "
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



# AI pick. Gemini picks the best combination from the candidates above.
# ---------------------------------------------------------------------

# Which fields actually matter for compatibility/value reasoning, per
# category, keeps the prompt small and focused instead of dumping every
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
    # section of the prompt below. these sections are the ONLY parts
    # Gemini is allowed to pick from for that category.
    sections = []
    for category in COMPAT_FIELDS:
        parts = candidates_by_category.get(category, [])
        serialized = [serialize_part(category, p) for p in parts]
        sections.append(f"{category}:\n{json.dumps(serialized, indent=2)}")

    parts_block = "\n\n".join(sections)

    return (
        f"You are building a PC for {describe_use_case(use_case)} with a "
        f"total budget of ${total_budget:.2f}. For each category below, "
        "pick the single best option as your recommendation, and also "
        "write one short sentence about EVERY option listed, not just "
        "your recommendation, noting a strength or tradeoff of that "
        "specific part. You may only reference parts that appear in "
        'these lists, copying the "name" field exactly. Consider '
        "compatibility (socket, memory_type, wattage vs PSU) and value "
        "for money.\n\n"
        f"{parts_block}\n\n"  # per-category candidate lists land here
        "Respond with ONLY a JSON object in this exact shape, nothing "
        "else, no markdown code fences:\n"
        "{\n"
        '  "cpu": {\n'
        '    "recommended": "<exact name of your pick>",\n'
        '    "notes": {"<exact name>": "<short note>", "...": "..."}\n'
        "  },\n"
        '  "motherboard": {"recommended": "...", "notes": {...}},\n'
        '  "gpu": {"recommended": "...", "notes": {...}},\n'
        '  "ram": {"recommended": "...", "notes": {...}},\n'
        '  "storage": {"recommended": "...", "notes": {...}},\n'
        '  "psu": {"recommended": "...", "notes": {...}},\n'
        '  "case": {"recommended": "...", "notes": {...}},\n'
        '  "cooler": {"recommended": "...", "notes": {...}},\n'
        '  "summary": "<2-3 sentence overview of the whole build>"\n'
        "}"
    )


def build_option_group(category, candidates, ai_result):
    """
    Return {"category", "options", "recommendedIndex"} for one category,
    matching the frontend's PartCategoryGroup/PartOption shape.

    Every candidate gets its own note if the AI gave one. The
    recommended pick is validated against the real candidate list the
    same way the old single-pick version worked, falling back to the
    closest-to-budget option (index 0) if the AI's pick doesn't match a
    real name. This is what keeps the AI from ever "inventing" a part
    that doesn't exist.
    """
    # category_result/notes might not even be the right shape if Gemini's
    # JSON was malformed for this one category specifically (still valid
    # JSON overall, just not the shape we asked for), so don't trust
    # their type. this keeps one bad category from crashing the whole
    # build instead of just losing its AI notes
    category_result = ai_result.get(category, {})
    if not isinstance(category_result, dict):
        category_result = {}
    notes = category_result.get("notes", {})
    if not isinstance(notes, dict):
        notes = {}
    recommended_name = category_result.get("recommended")

    valid_names = [part.name for part in candidates]
    if recommended_name not in valid_names:
        recommended_name = valid_names[0]
    recommended_index = valid_names.index(recommended_name)

    options = []
    for i, part in enumerate(candidates):
        note = notes.get(part.name, "")
        # compare by index here, not name, so if two candidates happen
        # to share the same name (does happen, two listings of the same
        # board), only the actual recommended one gets this fallback text
        if i == recommended_index and not note:
            note = "Selected automatically (closest to budget)."
        options.append({"name": part.name, "price": part.price, "note": note})

    return {
        "category": category,
        "options": options,
        "recommendedIndex": recommended_index,
    }


# this is the main entry point for the frontend. already wired up:
# POST /api/builds/generate (backend/api/builds.py) calls this directly
# with generate_build(budget, use_case), where use_case is either a
# preset name string ("gaming") or a custom split dict. no route changes
# needed to support either one, see resolve_splits() above for why.
#
# the "parts" dict in the return value matches the frontend's
# PartCategoryGroup/PartOption types (frontend/src/constants/parts.ts)
# almost exactly, name/price/recommendedIndex line up already. the one
# new thing frontend needs to add is a "note" field on PartOption to
# actually show the per-option AI commentary that's now in the response
def generate_build(total_budget, use_case):
    """Get candidates, ask Gemini for notes on each option, build result."""
    candidates_by_category = recommend_build(total_budget, use_case)

    try:
        prompt = build_prompt(candidates_by_category, use_case, total_budget)
        # search grounding off on purpose. the free tier gives zero
        # search-grounding quota for the model family we're on right now
        # (confirmed on the rate limit dashboard, not a usage issue, a
        # new key won't fix it). plain generation still works fine and
        # already gets the real candidate specs directly in the prompt
        ai_result = parse_json_answer(ask_gemini(prompt, use_search=False))
    except Exception as error:
        print(f"generate_build: AI call/parse failed, using fallback: {error}")
        ai_result = {}

    parts = {}
    missing_categories = []
    total_price = 0
    for category, candidates in candidates_by_category.items():
        if not candidates:
            missing_categories.append(category)
            continue

        group = build_option_group(category, candidates, ai_result)
        parts[category] = group
        recommended = group["options"][group["recommendedIndex"]]
        total_price += recommended["price"] or 0

    return {
        "parts": parts,
        "total_price": round(total_price, 2),
        "summary": ai_result.get("summary", ""),
        "missing_categories": missing_categories,
    }


# ---------------------------------------------------------------------
# Compatibility checks. meant to run whenever a user swaps a part in the
# UI, so this needs to be fast and consistent, not another AI call on
# every click.
# ---------------------------------------------------------------------

# size tiers for case/motherboard form factor fit. a case can hold any
# motherboard at its own tier or smaller, but not a bigger one, checked
# after stripping spaces so "Micro ATX" (motherboard.type) and
# "MicroATX" (case.case_type) both match the same keyword. sorted
# longest-keyword-first so "microatx" gets checked before the bare "atx"
# substring it also contains
FORM_FACTOR_SIZE = {
    "microatx": 2,
    "miniitx": 1,
    "ssiceb": 5,
    "eatx": 4,
    "atx": 3,
}


def _form_factor_size(type_string):
    """Best-effort size tier for a form factor string. Returns None if
    nothing recognizable is found, so the caller can skip the check
    instead of guessing."""
    if not type_string:
        return None
    normalized = type_string.lower().replace(" ", "")
    for keyword, size in FORM_FACTOR_SIZE.items():
        if keyword in normalized:
            return size
    return None


# heads up, this isn't hooked up to a route yet. it needs to run in the
# PATCH /api/builds/<id> route (api/builds.py) after a swap, so the
# frontend actually finds out if the new combo doesn't work.
#
# no page reload needed for this btw, as long as the swap on the
# frontend hits the route with fetch() and just updates state with
# whatever comes back, that's already how a PATCH request works
#
# selected_parts needs the real DB rows, not ids. Build already has the
# relationships set up though so it's just:
#
#   selected = {
#       "cpu": build.cpu, "gpu": build.gpu,
#       "motherboard": build.motherboard, "ram": build.ram,
#       "psu": build.psu, "case": build.case,
#   }
#   warnings = check_compatibility(selected)
#
# skip whatever category the user hasn't picked yet, it just won't run
# that check. send warnings back with the updated build so frontend can
# show them
def check_compatibility(selected_parts):
    """
    Given a dict of chosen parts by category (real DB rows, any category
    can be missing), return a list of plain-text warnings for anything
    that doesn't actually work together.
    """
    warnings = []

    cpu = selected_parts.get("cpu")
    gpu = selected_parts.get("gpu")
    motherboard = selected_parts.get("motherboard")
    ram = selected_parts.get("ram")
    psu = selected_parts.get("psu")
    case = selected_parts.get("case")

    if cpu and motherboard and cpu.socket and motherboard.socket:
        # compare with spaces stripped since the CPU socket (AI-derived)
        # and motherboard socket (scraped) don't always agree on
        # spacing, e.g. "LGA 1700" vs "LGA1700" for the exact same socket
        cpu_socket = cpu.socket.replace(" ", "")
        mobo_socket = motherboard.socket.replace(" ", "")
        if cpu_socket != mobo_socket:
            warnings.append(
                f"CPU socket ({cpu.socket}) doesn't match motherboard "
                f"socket ({motherboard.socket})."
            )

    if ram and motherboard and ram.memory_type and motherboard.memory_type:
        if ram.memory_type != motherboard.memory_type:
            warnings.append(
                f"RAM type ({ram.memory_type}) doesn't match motherboard "
                f"memory type ({motherboard.memory_type})."
            )

    if psu and psu.wattage:
        cpu_watts = (cpu.wattage or 0) if cpu else 0
        gpu_watts = (gpu.wattage or 0) if gpu else 0
        draw = cpu_watts + gpu_watts
        if draw and psu.wattage < draw:
            warnings.append(
                f"PSU wattage ({psu.wattage}W) may not cover the "
                f"estimated CPU + GPU draw (~{draw}W)."
            )

    if case and motherboard:
        case_size = _form_factor_size(case.case_type)
        mobo_size = _form_factor_size(motherboard.type)
        if case_size is not None and mobo_size is not None:
            if case_size < mobo_size:
                warnings.append(
                    f"Case ({case.case_type}) size may not fit "
                    f"{motherboard.type} motherboards."
                )

    return warnings
