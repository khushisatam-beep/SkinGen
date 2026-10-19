"""
Red-flag safety routing. Deliberately separate from the ML model: a low model score can NEVER cancel a red flag.
The questions are a plain-language screen for symptoms that should be seen by a clinician promptly. They are a
conservative design choice (not derived from the training data).
"""
from typing import Any, Dict, List, Optional

RED_FLAG_QUESTIONS: List[Dict[str, str]] = [
    {"id": "rapidly_worsening", "text": "Is the rash getting worse very quickly (over hours to a few days)?"},
    {"id": "fever_or_very_unwell", "text": "Do you have a fever or feel very unwell along with the rash?"},
    {"id": "pus_or_fluid", "text": "Is there pus, yellow crusting or oozing fluid from the skin?"},
    {"id": "painful_hot_swelling", "text": "Is the skin painful, hot and swollen?"},
    {"id": "blisters", "text": "Do you have blisters or open sores?"},
]
RED_FLAG_IDS = [q["id"] for q in RED_FLAG_QUESTIONS]
_TEXT = {q["id"]: q["text"] for q in RED_FLAG_QUESTIONS}

URGENT_MESSAGE = ("Some of your answers can go with skin problems that need prompt medical assessment. Please contact a doctor, "
                  "urgent-care service or emergency service today. Do not wait for, or rely on, this tool.")


def evaluate_red_flags(red_flags: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    level:
      urgent_review  - at least one red flag answered 'yes'
      none_reported  - every red-flag question was answered 'no'
      not_assessed   - one or more red-flag questions are unanswered; missing answers are never treated as 'no'
    """
    rf = red_flags or {}
    triggered = [{"id": i, "text": _TEXT[i]} for i in RED_FLAG_IDS if rf.get(i) is True]
    unanswered = [i for i in RED_FLAG_IDS if rf.get(i) is None]
    if triggered:
        level, msg = "urgent_review", URGENT_MESSAGE
    elif unanswered:
        level = "not_assessed"
        if len(unanswered) == len(RED_FLAG_IDS):
            msg = "Red-flag questions were not answered, so urgent warning signs were not checked."
        else:
            msg = ("Some red-flag questions were not answered, so not all urgent warning signs were checked. "
                   "If you are worried or symptoms are severe or worsening, contact a clinician promptly.")
    else:
        level, msg = "none_reported", ("No urgent warning signs were reported. If the skin becomes painful, "
                                       "blistered, infected or you feel unwell, see a doctor promptly.")
    return {"level": level, "message": msg, "triggeredBy": triggered, "unanswered": unanswered,
            "note": "This check runs separately from the model: a low model score never overrides it."}
