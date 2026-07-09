# Percentage of total budget allocated to each part category, per use case.
# Each use case's values sum to 1.0 (100%).

BUDGET_SPLITS = {
    "gaming": {
        "gpu": 0.33,
        "cpu": 0.19,
        "ram": 0.10,
        "storage": 0.09,
        "motherboard": 0.09,
        "psu": 0.08,
        "case": 0.07,
        "cooler": 0.05,
    },
    "production": {
        "cpu": 0.28,
        "gpu": 0.19,
        "ram": 0.14,
        "storage": 0.11,
        "motherboard": 0.09,
        "psu": 0.07,
        "case": 0.06,
        "cooler": 0.06,
    },
    "general": {
        # no dedicated GPU allocation here, integrated graphics are enough
        # for browsing/light work. that budget share got redistributed to
        # the other parts instead (this used to be a 10% GPU cut)
        "cpu": 0.32,
        "motherboard": 0.17,
        "storage": 0.17,
        "ram": 0.15,
        "psu": 0.09,
        "case": 0.07,
        "cooler": 0.03,
    },
    "streaming": {
        "cpu": 0.27,
        "gpu": 0.26,
        "ram": 0.14,
        "motherboard": 0.10,
        "storage": 0.09,
        "psu": 0.06,
        "case": 0.03,
        "cooler": 0.05,
    },
}


# every category that shows up in any preset. built from the presets
# themselves so it can't drift out of sync with them. used to validate
# custom splits so a typo'd category gets rejected instead of silently
# ignored
VALID_CATEGORIES = set().union(*BUDGET_SPLITS.values())


def validate_custom_splits(splits):
    """Check a user-provided percentage breakdown before using it."""
    unknown = set(splits) - VALID_CATEGORIES
    if unknown:
        raise ValueError(f"Unknown categories: {sorted(unknown)}")

    # values could come in as strings or other junk since this is user
    # input from a request body, so check the type here first. otherwise
    # a bad value throws a raw TypeError instead of a clean ValueError.
    not_numeric = [
        c for c, pct in splits.items()
        if not isinstance(pct, (int, float)) or isinstance(pct, bool)
    ]
    if not_numeric:
        raise ValueError(
            f"Percentages must be numbers: {sorted(not_numeric)}")

    if any(pct < 0 for pct in splits.values()):
        raise ValueError("Percentages cannot be negative")

    total = sum(splits.values())
    # allowing 0.99-1.01 instead of requiring exactly 1.0 since a slider
    # UI on the frontend will rarely land on precisely 100% because of
    # normal rounding
    if not (0.99 <= total <= 1.01):
        raise ValueError(
            f"Custom split must sum to 1.0 (100%), got {total:.3f}")

    return splits


def resolve_splits(use_case):
    """
    Turn `use_case` into a percentage-split dict.

    Accepts either a preset name (str, looked up in BUDGET_SPLITS) or a
    ready-made custom split (dict, validated and returned as-is).

    The dict option exists so /api/builds/generate can accept a custom
    split with zero changes on the Flask side. request.get_json() already
    turns a JSON object into a Python dict automatically, and that dict
    flows straight through data.get("use_case") into generate_build()
    unchanged, so the route never needs to know which kind it's forwarding.
    """
    if isinstance(use_case, dict):
        return validate_custom_splits(use_case)

    # request bodies are untrusted, so use_case could technically be
    # anything (a number, None, a list). catch that here with a clean
    # ValueError instead of letting .lower() below throw a raw AttributeError
    if not isinstance(use_case, str):
        raise ValueError(
            "use_case must be a preset name (string) or a custom split "
            f"(dict), got {type(use_case).__name__}")

    use_case = use_case.lower()
    if use_case not in BUDGET_SPLITS:
        valid = ", ".join(BUDGET_SPLITS.keys())
        raise ValueError(
            f"Unknown use case '{use_case}'. Valid options: {valid}")
    return BUDGET_SPLITS[use_case]


def allocate_budget(total_budget, use_case):
    """
    Split total_budget across part categories according to the
    percentages for the given use_case (preset name or custom dict).

    Returns a dict like {"cpu": 250.00, "gpu": 430.00, etc}.
    """
    splits = resolve_splits(use_case)
    return {category: round(total_budget * pct, 2)
            for category, pct in splits.items()}
