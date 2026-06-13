"""
Product matcher — selects the best products from skincare_product_database.json.

Scoring per product (higher = better match):
  +4  skin type match
  +3  per concern supported that overlaps user's concerns
  +2  sensitivity compatible
  +2  climate fit
  +1  experience level match
  +1  per cause keyword found in concerns_supported
  -99 budget exceeds user budget (hard exclusion)
  -99 user is in avoid_for list (hard exclusion)
"""

import json, os
from typing import List, Optional

# ── Load database ──────────────────────────────────────────────────────────────
_DB_PATH = os.path.join(os.path.dirname(__file__), "skincare_product_database.json")
with open(_DB_PATH, encoding="utf-8") as f:
    _RAW = json.load(f)
_PRODUCTS: List[dict] = _RAW["products"]

# ── Budget ranking ─────────────────────────────────────────────────────────────
_BUDGET_RANK = {"budget": 0, "low": 0, "moderate": 1, "medium": 1, "premium": 2, "high": 2}

# ── Condition → concern keywords ───────────────────────────────────────────────
_CONDITION_CONCERNS = {
    "Level_0": ["acne", "oiliness", "clogged pores", "post-acne marks"],
    "Level_1": ["acne", "oiliness", "inflamed blemishes", "clogged pores", "post-acne marks"],
    "Level_2": ["acne", "inflamed blemishes", "clogged pores", "oiliness", "post-acne marks", "sensitivity"],
    "Eczema":  ["sensitivity", "redness", "dryness", "barrier repair", "flaking"],
    "Rosacea": ["redness", "sensitivity", "barrier repair"],
    "Normal":  ["barrier repair", "sun protection"],
}

# ── Routine step definitions ───────────────────────────────────────────────────
_STEPS = [
    {"key": "cleanser",      "label": "Nettoyant",          "emoji": "🫧", "timing": "Matin & Soir",       "categories": ["cleanser"]},
    {"key": "treatment",     "label": "Sérum / Traitement",  "emoji": "✨", "timing": "Matin ou Soir",     "categories": ["treatment"]},
    {"key": "spot",          "label": "Soin ciblé",          "emoji": "🎯", "timing": "Soir (sur boutons)", "categories": ["spot_treatment"]},
    {"key": "moisturizer",   "label": "Hydratant",           "emoji": "🌸", "timing": "Matin & Soir",       "categories": ["moisturizer"]},
    {"key": "sunscreen",     "label": "Protection solaire",  "emoji": "☀️", "timing": "Matin uniquement",   "categories": ["sunscreen"]},
    {"key": "mask",          "label": "Masque (optionnel)",  "emoji": "🌿", "timing": "1-2x par semaine",   "categories": ["mask"]},
]

# ── Goal → concern keywords ────────────────────────────────────────────────────
_GOAL_CONCERNS = {
    "acne":              ["acne", "oiliness", "inflamed blemishes", "clogged pores", "post-acne marks"],
    "dark_circles":      ["dark circles", "brightening", "hydration"],
    "hyperpigmentation": ["hyperpigmentation", "dark spots", "post-acne marks", "brightening"],
    "brightening":       ["brightening", "radiance", "dullness"],
    "glow":              ["radiance", "dullness", "brightening", "hydration"],
    "redness":           ["redness", "sensitivity", "barrier repair"],
    "wrinkles":          ["anti-aging", "fine lines", "firmness", "hydration"],
    "hydration":         ["hydration", "dryness", "barrier repair"],
    "barrier":           ["barrier repair", "sensitivity", "dryness"],
    "pores":             ["clogged pores", "oiliness", "pore minimizing"],
    "oiliness":          ["oiliness", "sebum control", "acne"],
    "blackheads":        ["clogged pores", "blackheads", "oiliness"],
    "texture":           ["texture", "exfoliation", "smoothing", "brightening"],
}

# ── Concern keywords from causes ───────────────────────────────────────────────
_CAUSE_CONCERN_MAP = {
    "hormonal":    ["acne", "oiliness", "post-acne marks"],
    "stress":      ["barrier repair", "sensitivity", "redness"],
    "diet":        ["acne", "oiliness"],
    "hygiene":     ["acne", "congestion", "clogged pores"],
    "cosmetics":   ["sensitivity", "barrier repair", "redness"],
    "sleep":       ["dullness", "sensitivity"],
    "environment": ["sensitivity", "barrier repair", "redness"],
}


def _sensitivity_level(skin_type: str, condition: str) -> str:
    """Infer sensitivity level from skin type and condition."""
    if condition in ("Eczema", "Rosacea") or skin_type == "sensitive":
        return "high"
    if condition == "Level_2":
        return "medium"
    return "low"


def _score(
    product: dict,
    skin_type: str,
    concerns: List[str],
    sensitivity: str,
    budget_level: str,
    experience: str,
    climate: str,
    causes: List[str],
) -> float:
    score = 0.0

    # Hard exclusion — budget
    prod_budget = product.get("budget_level", "medium")
    if _BUDGET_RANK.get(prod_budget, 1) > _BUDGET_RANK.get(budget_level, 1):
        return -99

    # Hard exclusion — sensitivity incompatible
    prod_compat = product.get("sensitivity_compatibility", ["low", "medium", "high"])
    if sensitivity not in prod_compat:
        return -99

    # Hard exclusion — experience level
    prod_exp = product.get("experience_level", ["beginner", "intermediate", "advanced"])
    if experience not in prod_exp:
        return -99

    # Skin type match (+4)
    if skin_type in product.get("best_for_skin_types", []):
        score += 4

    # Concern overlap (+3 each)
    prod_concerns = [c.lower() for c in product.get("concerns_supported", [])]
    for concern in concerns:
        if any(concern in pc or pc in concern for pc in prod_concerns):
            score += 3

    # Climate fit (+2)
    prod_climate = product.get("climate_fit", [])
    if climate in prod_climate or not prod_climate:
        score += 2

    # Cause-derived concern overlap (+1 each)
    for cause in causes:
        extra = _CAUSE_CONCERN_MAP.get(cause.lower(), [])
        for ec in extra:
            if any(ec in pc or pc in ec for pc in prod_concerns):
                score += 1

    # Prefer branded products slightly (+0.5)
    if product.get("brand"):
        score += 0.5

    return score


def match_routine(
    skin_type: str = "combination",
    budget: str = "moderate",
    condition: str = "",
    causes: List[str] = [],
    sensitivity: Optional[str] = None,
    climate: str = "hot",
    experience: str = "beginner",
    goals: List[str] = [],
) -> List[dict]:
    """
    Returns the best-match product per routine step.
    Steps with no eligible product are skipped.
    """
    # Derive concerns from condition
    concerns = list(_CONDITION_CONCERNS.get(condition, ["barrier repair"]))

    # Extend concerns from user goals
    for goal in goals:
        for gc in _GOAL_CONCERNS.get(goal, []):
            if gc not in concerns:
                concerns.append(gc)

    # Infer sensitivity if not provided
    if not sensitivity:
        sensitivity = _sensitivity_level(skin_type, condition)

    # Budget normalisation
    budget_level = budget  # already "low"/"medium"/"high" or "budget"/"moderate"/"premium"

    is_acne = condition in ("Level_0", "Level_1", "Level_2")
    is_sensitive = condition in ("Eczema", "Rosacea") or skin_type == "sensitive"

    routine = []

    for step in _STEPS:
        # Skip spot treatment if no acne
        if step["key"] == "spot" and not is_acne:
            continue
        # Skip mask for high sensitivity
        if step["key"] == "mask" and is_sensitive:
            continue

        # Candidates for this step
        candidates = [p for p in _PRODUCTS if p.get("category") in step["categories"]]

        # Score each
        scored = []
        for p in candidates:
            s = _score(p, skin_type, concerns, sensitivity, budget_level, experience, climate, causes)
            if s >= 0:
                scored.append((p, s))

        if not scored:
            continue

        # Pick best
        best, best_score = max(scored, key=lambda x: x[1])

        routine.append({
            "step":    step["key"],
            "label":   step["label"],
            "emoji":   step["emoji"],
            "timing":  step["timing"],
            "product": {
                "id":           best.get("id", ""),
                "name":         best.get("product_name", ""),
                "brand":        best.get("brand", ""),
                "price":        best.get("estimated_price_range", ""),
                "key_ingredients": best.get("key_ingredients", []),
                "usage":        best.get("usage", ""),
                "why":          best.get("reason", ""),
            },
        })

    return routine
