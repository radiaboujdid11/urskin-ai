"""
Rule-based acne cause inference engine.

Combines:
  - Face zone analysis  (where is the acne?)
  - Acne morphology     (severity level from the model)
  - Questionnaire       (patient-reported lifestyle data)

Returns normalised confidence scores for each cause.
"""

from dataclasses import dataclass
from typing import Optional


# ── Cause definitions ─────────────────────────────────────────────────────────

CAUSES = {
    "hormonal": {
        "label":       "Hormonal",
        "description": "Linked to hormonal fluctuations (menstrual cycle, androgens). "
                       "Typically appears along the jawline and chin as deep, cystic breakouts.",
        "advice": [
            "Track your cycle and note flare-up patterns.",
            "Consider consulting a dermatologist or endocrinologist.",
            "Low-glycemic diet and stress management can help regulate hormones.",
            "Spearmint tea and zinc supplements have shown mild anti-androgenic effects.",
        ],
        "color": "#E879A0",
    },
    "diet": {
        "label":       "Diet / Nutrition",
        "description": "High-glycemic foods and dairy products can spike insulin and IGF-1, "
                       "increasing sebum production and inflammation.",
        "advice": [
            "Reduce high-sugar and processed foods.",
            "Try eliminating dairy for 4–6 weeks and monitor changes.",
            "Increase omega-3 intake (fish, flaxseed, walnuts).",
            "Drink more water and eat antioxidant-rich vegetables.",
        ],
        "color": "#F59E0B",
    },
    "oily_skin": {
        "label":       "Excess Sebum / Oily Skin",
        "description": "Overactive sebaceous glands clog pores, especially in the T-zone "
                       "(forehead, nose, chin), leading to blackheads and whiteheads.",
        "advice": [
            "Use a gentle, non-comedogenic cleanser twice daily.",
            "Apply a lightweight, oil-free moisturiser.",
            "Include niacinamide or salicylic acid in your routine.",
            "Avoid over-washing — it triggers more oil production.",
        ],
        "color": "#10B981",
    },
    "friction": {
        "label":       "Friction / Environmental Contact",
        "description": "Mechanical rubbing from phones, pillowcases, helmets, or hands "
                       "transfers bacteria and irritates the skin barrier.",
        "advice": [
            "Change pillowcases every 2–3 days.",
            "Clean your phone screen daily.",
            "Avoid touching your face with unwashed hands.",
            "Use a headset or speakerphone for long calls.",
        ],
        "color": "#6366F1",
    },
    "products": {
        "label":       "Hair / Cosmetic Products",
        "description": "Comedogenic ingredients in hair products, sunscreens, or makeup "
                       "can clog follicles along the hairline and temples.",
        "advice": [
            "Check product labels for comedogenic ingredients (coconut oil, isopropyl myristate).",
            "Tie hair back during workouts.",
            "Choose non-comedogenic, fragrance-free cosmetics.",
            "Wash your hair regularly if using heavy styling products.",
        ],
        "color": "#8B5CF6",
    },
    "stress": {
        "label":       "Stress",
        "description": "Elevated cortisol increases androgen activity and sebum production, "
                       "worsening existing breakouts and delaying healing.",
        "advice": [
            "Practise mindfulness or meditation for 10 minutes daily.",
            "Maintain a consistent sleep schedule (7–9 hours).",
            "Regular aerobic exercise reduces cortisol levels.",
            "Consider speaking with a counsellor if stress is chronic.",
        ],
        "color": "#EC4899",
    },
}


# ── Scoring weights ───────────────────────────────────────────────────────────

# zone → {cause: points}
ZONE_WEIGHTS: dict[str, dict[str, float]] = {
    "jawline_chin":     {"hormonal": 4.0, "stress": 1.0},
    "t_zone":           {"oily_skin": 3.5, "diet": 1.5},
    "nose":             {"oily_skin": 3.0, "diet": 1.0},
    "cheeks":           {"friction": 3.0, "products": 1.0, "diet": 1.0},
    "hairline_temples": {"products": 4.0, "friction": 1.0},
}

# severity → hormonal / diet weight bonus (severe cystic → more hormonal)
SEVERITY_WEIGHTS: dict[str, dict[str, float]] = {
    "Level_0": {"oily_skin": 1.5, "diet": 1.0},
    "Level_1": {"hormonal": 1.5, "diet": 1.0, "stress": 1.0},
    "Level_2": {"hormonal": 3.0, "stress": 2.0},
}


@dataclass
class CauseScore:
    cause: str
    label: str
    score: float          # 0–100 normalised
    description: str
    advice: list[str]
    color: str


def infer_causes(
    zones_affected: list[str],           # zone names where acne was detected
    acne_severity: Optional[str],        # "Level_0" | "Level_1" | "Level_2" | None
    questionnaire: dict,                 # see key list below
) -> list[CauseScore]:
    """
    Compute a ranked list of CauseScore from zone + questionnaire data.

    Questionnaire keys (all optional, boolean or 0/1 unless noted):
      - is_female          : True/False
      - period_correlation : True/False — acne worse before/during period
      - cycle_irregular    : True/False — irregular menstrual cycle
      - dairy_intake       : True/False — high dairy consumption
      - sugar_intake       : True/False — high sugar / processed food consumption
      - stress_level       : int 1–5 (1=low, 5=very high)
      - changed_products   : True/False — recently changed hair/cosmetic products
      - touches_face       : True/False — frequently touches face
      - phone_contact      : True/False — acne on the cheek where phone rests
      - same_pillowcase    : True/False — rarely changes pillowcase
      - sleep_hours        : int (hours per night)
      - medications        : True/False — currently on medications
    """
    raw: dict[str, float] = {c: 0.0 for c in CAUSES}

    # ── Zone contribution ─────────────────────────────────────────────────────
    for zone in zones_affected:
        for cause, pts in ZONE_WEIGHTS.get(zone, {}).items():
            raw[cause] += pts

    # ── Severity contribution ─────────────────────────────────────────────────
    if acne_severity and acne_severity in SEVERITY_WEIGHTS:
        for cause, pts in SEVERITY_WEIGHTS[acne_severity].items():
            raw[cause] += pts

    # ── Questionnaire contribution ────────────────────────────────────────────
    q = questionnaire

    if q.get("period_correlation"):
        raw["hormonal"] += 4.0
    if q.get("cycle_irregular"):
        raw["hormonal"] += 2.5
    if q.get("is_female"):
        raw["hormonal"] += 1.0

    if q.get("dairy_intake"):
        raw["diet"] += 3.0
    if q.get("sugar_intake"):
        raw["diet"] += 2.5

    stress = int(q.get("stress_level", 1))
    raw["stress"] += stress * 0.8          # up to +4 for max stress
    if stress >= 4:
        raw["hormonal"] += 1.0             # high stress also disrupts hormones

    if q.get("changed_products"):
        raw["products"] += 3.5
    if q.get("touches_face"):
        raw["friction"] += 2.5
    if q.get("phone_contact"):
        raw["friction"] += 2.0
    if q.get("same_pillowcase"):
        raw["friction"] += 2.0

    sleep = int(q.get("sleep_hours", 7))
    if sleep < 6:
        raw["stress"] += 2.0
        raw["hormonal"] += 1.0

    if q.get("medications"):
        raw["hormonal"] += 1.5            # many medications affect hormones

    # ── Normalise to 0–100 ────────────────────────────────────────────────────
    total = sum(raw.values()) or 1.0
    normalised = {c: round(v / total * 100, 1) for c, v in raw.items()}

    # ── Build result, sorted descending ──────────────────────────────────────
    results: list[CauseScore] = []
    for cause, score in sorted(normalised.items(), key=lambda x: -x[1]):
        if score == 0:
            continue
        meta = CAUSES[cause]
        results.append(CauseScore(
            cause=cause,
            label=meta["label"],
            score=score,
            description=meta["description"],
            advice=meta["advice"],
            color=meta["color"],
        ))

    return results
