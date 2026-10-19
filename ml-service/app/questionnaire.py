"""
Plain-language questionnaire. ONE source of truth used by the API, the model and the tests.

Each question maps to a column of the real UCI Dermatology dataset that a person can judge
WITHOUT a biopsy (the dataset's 22 histopathology columns are deliberately not used).
Graded answers map to the dataset's clinician scale 0-3 (0 = absent, 3 = strongest).
"""
from typing import Any, Dict, List, Optional

GRADES = {"none": 0, "mild": 1, "moderate": 2, "severe": 3}
YES_NO = {"no": 0, "yes": 1}
GRADE_SYNONYMS = {"no": "none", "0": "none", "nothing": "none", "slight": "mild", "slightly": "mild", "low": "mild", "little": "mild",
                  "medium": "moderate", "moderately": "moderate", "strong": "severe", "high": "severe", "bad": "severe",
                  "very": "severe", "extreme": "severe"}
YES_NO_SYNONYMS = {"y": "yes", "true": "yes", "n": "no", "false": "no"}
NOT_SURE = {"not sure", "not_sure", "unknown", "don't know", "dont know", "idk", ""}

QUESTIONS: List[Dict[str, Any]] = [
    {"id": "age", "short": "your age", "feature": "Age", "type": "number", "min": 0, "max": 110,
     "text": "How old are you (in years)?", "help": "Enter a whole number."},
    {"id": "redness", "short": "redness", "feature": "erythema", "type": "grade",
     "text": "How red is the affected skin?", "help": "Compare with your normal skin colour."},
    {"id": "scaling", "short": "flaking/scaling", "feature": "scaling", "type": "grade",
     "text": "How much dry flaking or scaling is there on the patches?",
     "help": "Silvery-white or greasy yellowish flakes both count."},
    {"id": "clear_edges", "short": "sharp edges", "feature": "definite_borders", "type": "grade",
     "text": "Do the patches have sharp, clearly defined edges?",
     "help": "'Severe' = you can easily trace the edge with a finger; 'none' = the edges fade gradually."},
    {"id": "itching", "short": "itching", "feature": "itching", "type": "grade",
     "text": "How much do the patches itch?"},
    {"id": "new_patches_after_injury", "short": "new patches after injury", "feature": "koebner_phenomenon", "type": "grade",
     "text": "Do new patches appear where your skin was scratched, cut or otherwise injured?"},
    {"id": "flat_purple_bumps", "short": "flat purple bumps", "feature": "polygonal_papules", "type": "grade",
     "text": "Do you have small, flat-topped, shiny, purplish bumps?"},
    {"id": "bumps_around_hairs", "short": "bumps around hair follicles", "feature": "follicular_papules", "type": "grade",
     "text": "Do you have tiny bumps centred on hair follicles?"},
    {"id": "mouth_lesions", "short": "mouth lesions", "feature": "oral_mucosal_involvement", "type": "grade",
     "text": "Do you have whitish, lacy patches or sores inside your mouth (e.g. inner cheeks)?"},
    {"id": "knees_elbows", "short": "knee/elbow involvement", "feature": "knee_and_elbow_involvement", "type": "grade",
     "text": "Are your knees or elbows affected?"},
    {"id": "scalp", "short": "scalp involvement", "feature": "scalp_involvement", "type": "grade",
     "text": "Is your scalp affected?"},
    {"id": "family_history", "short": "family history", "feature": "family_history", "type": "yes_no",
     "text": "Has anyone in your close family (parents, brothers, sisters, children) had psoriasis or a similar scaly skin condition?",
     "help": "Answer 'not sure' if you don't know. Not knowing is treated as missing, never as 'no'. (In the training data this item mainly reflects psoriasis-type family history.)"},
]
BY_ID = {q["id"]: q for q in QUESTIONS}
FEATURE_COLUMNS = [q["feature"] for q in QUESTIONS]          # model input order (dataset column names)
FEATURE_TO_ID = {q["feature"]: q["id"] for q in QUESTIONS}


def choices(q: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
    if q["type"] == "grade":
        return [{"value": k, "label": k.capitalize()} for k in GRADES] + [{"value": "not_sure", "label": "Not sure"}]
    if q["type"] == "yes_no":
        return [{"value": "yes", "label": "Yes"}, {"value": "no", "label": "No"}, {"value": "not_sure", "label": "Not sure"}]
    return None


def public_questionnaire() -> List[Dict[str, Any]]:
    out = []
    for q in QUESTIONS:
        item = {k: q[k] for k in ("id", "text", "type") if k in q}
        for k in ("help", "min", "max"):
            if k in q: item[k] = q[k]
        item["required"] = False
        item["choices"] = choices(q)
        out.append(item)
    return out


def normalise(value: Any) -> Any:
    """Be forgiving: 'Moderate ', 'NOT SURE', '' -> canonical lowercase / None."""
    if value is None: return None
    if isinstance(value, str):
        v = value.strip().lower()
        return None if v in NOT_SURE else v
    return value


def to_feature_row(answers: Dict[str, Any]) -> Dict[str, Optional[float]]:
    """Validated answers (by question id) -> {dataset column: number or None(missing)}."""
    row: Dict[str, Optional[float]] = {}
    for q in QUESTIONS:
        v = answers.get(q["id"])
        if v is None:
            row[q["feature"]] = None
        elif q["type"] == "number":
            row[q["feature"]] = float(v)
        elif q["type"] == "grade":
            row[q["feature"]] = float(GRADES[v])
        else:
            row[q["feature"]] = float(YES_NO[v])
    return row


def normalise_answers(data: dict) -> dict:
    """Lower-case keys, tidy values, accept everyday synonyms. Unknown keys are kept so they can be rejected politely."""
    out = {}
    for key, value in data.items():
        k = key.strip().lower().replace(" ", "_") if isinstance(key, str) else key
        v = normalise(value)
        q = BY_ID.get(k)
        if q and isinstance(v, str):
            if q["type"] == "grade":
                v = GRADE_SYNONYMS.get(v, v)
            elif q["type"] == "yes_no":
                v = YES_NO_SYNONYMS.get(v, v)
        out[k] = v
    return out
