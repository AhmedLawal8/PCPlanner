from budget_split import BUDGET_SPLITS, allocate_budget
from models.tables import CPU, Case, Cooler, GPU, Motherboard, PSU, RAM, Storage

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


def recommend_parts(category, allocation):
    """
    Return up to RESULT_COUNT parts for `category` priced within a window
    below `allocation`, never exceeding it.

    If the window is too narrow to find RESULT_COUNT parts (common for
    cheaper categories with few listings in a tight range), fall back to
    the closest parts under the allocation with no lower bound.
    """
    model = CATEGORY_MODELS[category]
    floor = max(allocation * (1 - WINDOW_PCT), 0)

    parts = (
        model.query.filter(model.price <= allocation, model.price >= floor)
        .order_by(model.price.desc())
        .limit(RESULT_COUNT)
        .all()
    )

    if len(parts) < RESULT_COUNT:
        parts = (
            model.query.filter(model.price <= allocation)
            .order_by(model.price.desc())
            .limit(RESULT_COUNT)
            .all()
        )

    return parts


def get_minimum_budget(use_case):
    """
    Return the lowest total_budget for which every category this use case
    actually requires can afford its cheapest available part, given that
    use case's percentage split.

    This is driven by whichever required category has the tightest
    percentage relative to its cheapest available price -- e.g. if GPU is
    26% of the "streaming" split and the cheapest GPU is $139.97, that
    category alone needs a $139.97 / 0.26 ~= $538 total budget to be
    affordable, and other categories' true minimums are checked the same
    way. The largest of these is the real floor for that use case.
    """
    use_case = use_case.lower()
    if use_case not in BUDGET_SPLITS:
        valid = ", ".join(BUDGET_SPLITS.keys())
        raise ValueError(f"Unknown use case '{use_case}'. Valid options: {valid}")

    minimum = 0
    for category, pct in BUDGET_SPLITS[use_case].items():
        model = CATEGORY_MODELS[category]
        cheapest = (
            model.query.filter(model.price.isnot(None))
            .order_by(model.price.asc())
            .first()
        )
        if cheapest is None:
            raise ValueError(f"No priced parts available for {model.__tablename__}")
        minimum = max(minimum, cheapest.price / pct)
    return minimum


def recommend_build(total_budget, use_case):
    """
    Given a total budget and use case, return a dict mapping each category
    to a list of up to RESULT_COUNT recommended parts.
    """
    minimum = get_minimum_budget(use_case)
    if total_budget < minimum:
        raise ValueError(
            f"Budget too low for a '{use_case}' build: at least ${minimum:.2f} "
            f"is needed so every required category can afford its cheapest "
            f"available part."
        )

    allocations = allocate_budget(total_budget, use_case)
    return {
        category: recommend_parts(category, allocation)
        for category, allocation in allocations.items()
    }
