"""
Exact, model-derived explanation for the multinomial logistic-regression pipeline.

For the predicted condition k, each question i gets
    c_i = (coef[k,i] - mean_j coef[j,i]) * z_i        (z = standardised, imputed answer)
and baseline = intercept[k] - mean_j intercept[j]. Then   baseline + sum(c_i) = log p_k - mean_j log p_j
exactly (the softmax is unchanged by subtracting a constant from all class scores). The identity is
recomputed for every request and returned as `additivityCheck`.
Other model types (random forest, XGBoost) return status "unsupported".
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression

from app.conditions import CLASS_ORDER, LABELS
from app.questionnaire import BY_ID, FEATURE_COLUMNS, FEATURE_TO_ID

SCOPE = ("This shows how each answer moved this model's score for the condition, compared with an average patient in the "
         "training data. It explains the model only - it does not prove cause or confirm a diagnosis.")


def _strength(abs_c, max_abs):
    r = abs_c / max_abs if max_abs > 0 else 0
    return "strong" if r >= 0.5 else "moderate" if r >= 0.2 else "small"


def _answer_text(qid, raw):
    return f"{raw}" if BY_ID[qid]["type"] != "number" else f"{int(raw)} years"


def explain(model, row: dict, answers: dict, k: int, top_n: int = 6) -> dict:
    clf = model.steps[-1][1]
    if not isinstance(clf, LogisticRegression):
        return {"status": "unsupported", "reason": f"No exact explainer for {type(clf).__name__}.", "scope": SCOPE}
    X = pd.DataFrame([row])[FEATURE_COLUMNS].astype(float)
    z = model.named_steps["scale"].transform(model.named_steps["imp"].transform(X))[0]
    coef, b = clf.coef_, clf.intercept_
    c = (coef[k] - coef.mean(axis=0)) * z
    base = float(b[k] - b.mean())
    proba = model.predict_proba(X)[0]
    target = float(np.log(proba[k]) - np.log(proba).mean())
    total = base + float(c.sum())

    answered, unsure_sum = [], 0.0
    for i, col in enumerate(FEATURE_COLUMNS):
        qid = FEATURE_TO_ID[col]
        if answers.get(qid) is None:
            unsure_sum += float(c[i])
        else:
            answered.append((qid, float(c[i])))
    answered.sort(key=lambda t: abs(t[1]), reverse=True)
    mx = abs(answered[0][1]) if answered else 0
    reasons = []
    for qid, v in answered[:top_n]:
        effect = "raises" if v > 1e-9 else "lowers" if v < -1e-9 else "no effect on"
        reasons.append({"question": BY_ID[qid]["text"], "id": qid, "yourAnswer": _answer_text(qid, answers[qid]),
                        "effect": effect, "strength": _strength(abs(v), mx), "contribution": round(v, 4),
                        "text": f"Your answer \"{_answer_text(qid, answers[qid])}\" for {BY_ID[qid]['short']} {effect} the score for {LABELS[CLASS_ORDER[k]].split(' (')[0]} "
                                f"({_strength(abs(v), mx)})."})
    return {"status": "ok", "method": "exact linear contributions of the logistic-regression model (log-score, centred across conditions)",
            "condition": CLASS_ORDER[k], "reasons": reasons,
            "unsureAnswersEffect": round(unsure_sum, 4),
            "unsureAnswersNote": "Questions marked 'not sure' were filled with the typical training value; their combined effect is shown here, not in the list.",
            "strengthNote": "strong / moderate / small = size relative to the biggest effect in this list (a display choice, not a medical grade).",
            "additivityCheck": {"baselinePlusContributions": round(total, 6), "modelValue": round(target, 6),
                                "absoluteDifference": round(abs(total - target), 9)},
            "scope": SCOPE}
