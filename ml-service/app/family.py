"""
Family-history analysis from the user's own answers (descriptive only).
NOT a hereditary-risk model and NOT a genetic score: no percentages are produced. Unknown / missing is never 'no'.
"""
from typing import Any, Dict, List, Optional

CONDITIONS = ["psoriasis", "eczema", "vitiligo"]
LABELS = {"psoriasis": "psoriasis", "eczema": "eczema / atopic dermatitis", "vitiligo": "vitiligo"}
FIRST_DEGREE = {"mother", "father", "sibling", "child"}
RELATIONS = [
    "mother", "father", "sibling", "child", "grandparent",
    "maternal_grandmother", "maternal_grandfather",
    "paternal_grandmother", "paternal_grandfather",
    "aunt_or_uncle", "cousin", "other",
]

INTERPRETATION = {
    "psoriasis": "Psoriasis in a close relative can be relevant, but it does not mean you will develop psoriasis.",
    "eczema": "Eczema, asthma or hay fever in the family can point to an 'atopic' tendency, but it does not mean you will develop eczema.",
    "vitiligo": "Vitiligo or autoimmune disease in the family can be relevant, but it does not mean you will develop vitiligo.",
}
LIMITATIONS = [
    "This summarises what you reported. It is not a validated hereditary or genetic risk score and gives no percentage.",
    "'Not sure' and unanswered items are never counted as 'no'.",
    "These family answers are NOT fed into the prediction model unless you also answer the model's own 'family_history' question.",
    "A clinician must interpret family history together with your symptoms and an examination.",
]


def _norm(v: Any) -> str:
    if v is True or v == "yes": return "yes"
    if v is False or v == "no": return "no"
    return "not_sure"


def analyse(fh: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not fh:
        return None
    tally = {c: {"yes": 0, "no": 0, "not_sure": 0} for c in CONDITIONS}
    affected: Dict[str, List[Dict[str, Any]]] = {c: [] for c in CONDITIONS}
    unknown: Dict[str, List[str]] = {c: [] for c in CONDITIONS}

    for c in CONDITIONS:                                   # yourself-level summary answers (any relative), optional
        if fh.get(c) is not None:
            tally[c][_norm(fh[c])] += 1
    for r in fh.get("relatives") or []:
        c, a = r["condition"], _norm(r["answer"])
        tally[c][a] += 1
        if a == "yes":
            affected[c].append({"relation": r["relation"], "firstDegree": r["relation"] in FIRST_DEGREE})
        elif a == "not_sure":
            unknown[c].append(r["relation"])

    extra = {k: _norm(fh[k]) for k in ("asthma_or_hay_fever", "autoimmune_disease") if fh.get(k) is not None}
    # Related conditions are returned as context, not folded into the direct-condition status.
    # For example, asthma/hay fever can be relevant to atopic tendency but is not a report of eczema.
    related_context = {
        "psoriasis": [],
        "eczema": [(
            "asthma_or_hay_fever",
            "Asthma or hay fever in the family may be relevant to atopic tendency, but it is not a report of eczema in a relative and does not estimate personal risk.",
        )],
        "vitiligo": [(
            "autoimmune_disease",
            "Another autoimmune condition in the family may be relevant context, but it is not a report of vitiligo in a relative and does not estimate personal risk.",
        )],
    }

    out = {}
    for c in CONDITIONS:
        t = tally[c]
        status = ("family_history_reported" if t["yes"] else
                  "insufficient_information" if (t["not_sure"] or (t["yes"] + t["no"] == 0)) else
                  "no_family_history_reported")
        related = [
            {"field": field, "answer": extra[field], "relevance": note}
            for field, note in related_context[c]
            if field in extra
        ]
        out[c] = {"label": LABELS[c], "status": status, "reportedCount": t["yes"], "unknownCount": t["not_sure"],
                  "affectedRelatives": affected[c], "unknownRelatives": unknown[c],
                  "closeRelativeAffected": any(x["firstDegree"] for x in affected[c]),
                  "relatedFamilyHistory": related,
                  "interpretation": INTERPRETATION[c]}
    return {"conditions": out, "otherFamilyConditions": extra,
            "summary": {
                "reported": [c for c in CONDITIONS if out[c]["status"] == "family_history_reported"],
                "insufficientInformation": [c for c in CONDITIONS if out[c]["status"] == "insufficient_information"],
                "unknownAnswers": [c for c in CONDITIONS if out[c]["unknownCount"] > 0],
                "missingInformation": [c for c in CONDITIONS if not any(tally[c].values())],
            },
            "limitations": LIMITATIONS}
