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
        "cpu": 0.29,
        "motherboard": 0.15,
        "storage": 0.15,
        "ram": 0.14,
        "gpu": 0.10,
        "psu": 0.08,
        "case": 0.06,
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


def allocate_budget(total_budget, use_case):
    """
    Split total_budget across part categories according to the
    percentages in BUDGET_SPLITS for the given use_case.

    Returns a dict like {"cpu": 250.00, "gpu": 430.00, etc}.
    """
    use_case = use_case.lower()

    if use_case not in BUDGET_SPLITS:
        valid = ", ".join(BUDGET_SPLITS.keys())
        raise ValueError(f"Unknown use case '{use_case}'. Valid options: {valid}")

    percentages = BUDGET_SPLITS[use_case]
    return {category: round(total_budget * pct, 2) for category, pct in percentages.items()}
