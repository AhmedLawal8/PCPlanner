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

UPPER_WINDOW_PCT = 0.10 # Look up to 10% higher the allocation
CANDIDATE_POOL_SIZE = 12 # How many candiates to check through when querying

RESULT_COUNT = 4


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

def select_representative_parts(parts, allocation):
    """
    Given a list of parts sorted by price (highest -> lowest),
    return up to RESULT_COUNT parts that represent:
        - budget
        - best value
        - recommend
        - performance

    Select based on proximity to target prices
    """
    if len(parts) <= RESULT_COUNT:
        return parts
    sorted_parts = sorted(parts, key=lambda p: p.price or 0)
    n = len(sorted_parts)

    indices = [
        0,                    # cheapest  → budget
        n // 3,               # lower-mid → best_value
        2 * n // 3,           # upper-mid → recommend
        n - 1,                # priciest  → performance
    ]

    seen = set()
    selected = []

    for i in indices:
        if i not in seen:
            seen.add(i)
            selected.append(sorted_parts[i])
    return selected

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
    ceiling = allocation * (1 + UPPER_WINDOW_PCT)

    igpu_only = require_igpu and category == "cpu"  # only CPU has .graphics

    query = model.query.filter(model.price <= ceiling)
    
    if igpu_only:
        query = query.filter(model.graphics.isnot(None))
        
    parts = query.order_by(model.price.desc()).limit(CANDIDATE_POOL_SIZE * 3).all()

    return select_representative_parts(parts, allocation)


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


def build_platform_candidates(allocations, igpu_only_cpu):
    """
    Picking cpu/motherboard/ram independently, like every other category
    does, can land you a CPU tier and a motherboard tier that don't
    actually fit together (Intel CPU next to an AMD board), since each
    one just grabs whatever's closest to its own budget with no clue what
    the other picked. So instead we build all three together here.

    Returns (cpu_candidates, mobo_candidates, ram_candidates, links).
    links is {"cpu_to_mobo": {cpu_id: mobo_id}, "mobo_to_ram": {mobo_id: ram_id}}
    so generate_build() can carry a CPU's tier over to whichever specific
    board/RAM it was actually paired with here.
    """
    mobo_ceiling = allocations["motherboard"] * (1 + UPPER_WINDOW_PCT)
    available_sockets = {
        row[0] for row in
        Motherboard.query.filter(Motherboard.price <= mobo_ceiling)
        .with_entities(Motherboard.socket).distinct().all()
        if row[0]
    }

    cpu_query = CPU.query.filter(
        CPU.price <= allocations["cpu"] * (1 + UPPER_WINDOW_PCT),
        CPU.socket.in_(available_sockets),
    )
    if igpu_only_cpu:
        cpu_query = cpu_query.filter(CPU.graphics.isnot(None))
    cpu_pool = cpu_query.order_by(CPU.price.desc()).limit(CANDIDATE_POOL_SIZE * 3).all()
    cpu_candidates = select_representative_parts(cpu_pool, allocations["cpu"])

    mobo_candidates = []
    cpu_to_mobo = {}
    for cpu in cpu_candidates:
        mobo_options = Motherboard.query.filter(
            Motherboard.socket == cpu.socket, Motherboard.price <= mobo_ceiling,
        ).all()
        mobo = min(
            mobo_options, key=lambda m: abs((m.price or 0) - allocations["motherboard"]),
            default=None,
        )
        if mobo is None:
            continue
        cpu_to_mobo[cpu.id] = mobo.id
        if mobo not in mobo_candidates:
            mobo_candidates.append(mobo)

    # pull RAM from every memory_type across the chosen boards, not just
    # the closest single stick, or multiple DDR5 boards collapse to 1 pick
    memory_types = {m.memory_type for m in mobo_candidates if m.memory_type}
    ram_pool = RAM.query.filter(
        RAM.price <= allocations["ram"] * (1 + UPPER_WINDOW_PCT),
        RAM.memory_type.in_(memory_types),
    ).order_by(RAM.price.desc()).limit(CANDIDATE_POOL_SIZE * 3).all()
    ram_candidates = select_representative_parts(ram_pool, allocations["ram"])

    mobo_to_ram = {}
    for mobo in mobo_candidates:
        if not mobo.memory_type:
            continue
        matches = [r for r in ram_candidates if r.memory_type == mobo.memory_type]
        if matches:
            closest = min(matches, key=lambda r: abs((r.price or 0) - allocations["ram"]))
            mobo_to_ram[mobo.id] = closest.id

    links = {"cpu_to_mobo": cpu_to_mobo, "mobo_to_ram": mobo_to_ram}
    return cpu_candidates, mobo_candidates, ram_candidates, links


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

    candidates = {
        category: recommend_parts(
            category, allocation,
            require_igpu=(category == "cpu" and igpu_only_cpu),
        )
        for category, allocation in allocations.items()
        if category not in ("cpu", "motherboard", "ram")
    }

    cpu_candidates, mobo_candidates, ram_candidates, platform_links = (
        build_platform_candidates(allocations, igpu_only_cpu)
    )
    candidates["cpu"] = cpu_candidates
    candidates["motherboard"] = mobo_candidates
    candidates["ram"] = ram_candidates

    return candidates, platform_links



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

# The four tier labels Gemini may assign. If two candidates would share a label,
#  pick the better fit for that label and give the other the next-closest label.


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

    # Build a compact example block showing the expected shape for two
    # categories so Gemini has a concrete template to follow.
    example = (
        '{\n'
        '  "cpu": [\n'
        '    {"name": "<exact name>", "tier": "recommend",   "why": "..."},\n'
        '    {"name": "<exact name>", "tier": "performance", "why": "..."},\n'
        '    {"name": "<exact name>", "tier": "best_value",  "why": "..."},\n'
        '    {"name": "<exact name>", "tier": "budget",      "why": "..."}\n'
        '  ],\n'
        '  "gpu": [ ... same pattern ... ],\n'
        '  ... (all eight categories) ...,\n'
        '  "summary": "<2-3 sentence overview of the whole build>"\n'
        '}'
    )

    return (
        f"You are building a PC for {describe_use_case(use_case)} with a "
        f"total budget of ${total_budget:.2f}.\n\n"
        "Assign tier labels based strictly by price rank within each category: "
        f"cheapest = 'budget', second cheapest = 'recommend', "
        f"second most expensive = 'best_value', most expensive = 'performance'. "
        "The 'why' sentence should explain the "
        "performance or value tradeoff for that price point given this use case "
        "it is NOT used to justify the tier assignment. You may only reference parts that "
        'appear in these lists, copying the "name" field exactly. '
        "Consider compatibility (socket, memory_type, PSU wattage) and "
        "value for money.\n\n"
        f"{parts_block}\n\n"
        "Respond with ONLY a JSON object in exactly this shape, nothing "
        "else, no markdown code fences:\n"
        f"{example}"
    )

TIER_LABELS = ["recommend", "best_value", "performance", "budget"]

def build_option_group(category, candidates, ai_result):
    """
    Return a flat list of option dicts for one category, each with:
    id, name, price, tier, why

    Gemini's response for a category is expected to be a list like:
      [{"name": "...", "tier": "recommend", "why": "..."}, ...]

    Validation rules (keeps AI from inventing parts or bad tiers):
    - Any entry whose "name" doesn't exactly match a real candidate is
      dropped silently.
    - Any entry with an unrecognised tier gets tier "budget" as a fallback.
    - If the AI gave no entry for a candidate, it still appears in the list
      with tier "budget" and a generic why.
    - If no entry has tier "recommend" after all of the above (AI returned
      garbage for the whole category), the first candidate is promoted to
      "recommend" so the frontend always has something to default to.
    """

    # Build a name -> DB row lookup so we can attach id/price and validate names
    candidate_by_name = {part.name: part for part in candidates}
    valid_names = list(candidate_by_name)  # preserves DB order for fallbacks

    # Parse what Gemini returned for this category; tolerate wrong types
    ai_entries = ai_result.get(category, [])
    if not isinstance(ai_entries, list):
        ai_entries = []

    ai_by_name = {}
    for entry in ai_entries:
        if not isinstance(entry, dict):
            continue
        name = entry.get("name")
        if name in candidate_by_name:
            ai_by_name[name] = entry

    options = []
    for name in valid_names:
        part = candidate_by_name[name]
        ai_entry = ai_by_name.get(name, {})

        raw_tier = ai_entry.get("tier", "")
        tier = raw_tier if raw_tier in TIER_LABELS else "budget"
        why = ai_entry.get("why") or ""

        options.append({
            "id":    part.id,
            "name":  part.name,
            "price": part.price,
            "tier":  tier,
            "why":   why,
        })

    # Guarantee at least one "recommend" so the frontend always has a default
    has_recommend = any(o["tier"] == "recommend" for o in options)
    if options and not has_recommend:
        options[0]["tier"] = "recommend"
        if not options[0]["why"]:
            options[0]["why"] = "Selected automatically as closest to budget."

    return options


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
def _force_recommended_tier(options, target_id):
    """Make the option with id == target_id the "recommend" one, demoting
    whichever option currently holds that tier (if it's a different id).
    Used to carry the recommended CPU's paired motherboard/RAM forward as
    the recommended pick for those categories too, see generate_build."""
    if target_id is None or not options:
        return
    for option in options:
        if option["tier"] == "recommend" and option["id"] != target_id:
            option["tier"] = "budget"
    for option in options:
        if option["id"] == target_id:
            option["tier"] = "recommend"
            return


def _find_matching_option_id(options, rows_by_id, attr, target_value):
    """Fallback for when build_platform_candidates() didn't record a
    pairing for this specific part (e.g. no RAM was affordable when that
    motherboard was being paired up). Look for any candidate in `options`
    whose real row shares the given attribute (socket/memory_type) with
    target_value, space-insensitive since sources format these
    differently ("LGA 1700" vs "LGA1700")."""
    if not target_value:
        return None
    normalized_target = target_value.replace(" ", "")
    for option in options or []:
        row = rows_by_id.get(option["id"])
        value = getattr(row, attr, None) if row is not None else None
        if value and value.replace(" ", "") == normalized_target:
            return option["id"]
    return None


def generate_build(total_budget, use_case):
    """Get candidates, ask Gemini for notes on each option, build result."""
    candidates_by_category, platform_links = recommend_build(total_budget, use_case)

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
            continue

        options = build_option_group(category, candidates, ai_result)
        parts[category] = options

    # Gemini picks "recommend" per category on its own, so it can tag a
    # CPU and a motherboard that were never actually paired. Force the
    # motherboard/RAM tiers to match whichever board/RAM the recommended
    # CPU was actually built with.
    cpu_options = parts.get("cpu")
    if cpu_options:
        mobo_rows = {m.id: m for m in candidates_by_category.get("motherboard", [])}
        ram_rows = {r.id: r for r in candidates_by_category.get("ram", [])}
        cpu_to_mobo = platform_links["cpu_to_mobo"]
        mobo_to_ram = platform_links["mobo_to_ram"]

        # prefer a CPU whose whole chain actually has RAM available,
        # otherwise we'd recommend one whose only board has no RAM in budget
        fully_paired_ids = {
            cpu_id for cpu_id, mobo_id in cpu_to_mobo.items()
            if mobo_id in mobo_to_ram
        }
        recommended_cpu = (
            next((o for o in cpu_options
                  if o["tier"] == "recommend" and o["id"] in fully_paired_ids), None)
            or next((o for o in cpu_options if o["id"] in fully_paired_ids), None)
            or next((o for o in cpu_options if o["tier"] == "recommend"), cpu_options[0])
        )
        _force_recommended_tier(cpu_options, recommended_cpu["id"])

        mobo_options = parts.get("motherboard", [])
        mobo_id = cpu_to_mobo.get(recommended_cpu["id"])
        if mobo_id is None:
            cpu_row = next(
                (c for c in candidates_by_category.get("cpu", [])
                 if c.id == recommended_cpu["id"]), None,
            )
            if cpu_row is not None:
                mobo_id = _find_matching_option_id(
                    mobo_options, mobo_rows, "socket", cpu_row.socket
                )
        _force_recommended_tier(mobo_options, mobo_id)

        recommended_mobo = next(
            (o for o in mobo_options if o["tier"] == "recommend"), None,
        )
        ram_options = parts.get("ram", [])
        ram_id = None
        if recommended_mobo is not None:
            ram_id = mobo_to_ram.get(recommended_mobo["id"])
            if ram_id is None:
                mobo_row = mobo_rows.get(recommended_mobo["id"])
                if mobo_row is not None:
                    ram_id = _find_matching_option_id(
                        ram_options, ram_rows, "memory_type", mobo_row.memory_type
                    )
        _force_recommended_tier(ram_options, ram_id)

    for category, options in parts.items():
        if not options:
            continue
        recommended = next(
            (o for o in options if o["tier"] == "recommend"), options[0]
        )
        total_price += recommended["price"] or 0

    return {
        "parts": parts,
        "total_price": round(total_price, 2),
        "summary": ai_result.get("summary", ""),
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
