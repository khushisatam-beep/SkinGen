"""SkinGen ML service. Run: uvicorn app.main:app --port 8001      Swagger UI: /docs"""
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app import errors
from app.conditions import CLASS_ORDER, LABELS
from app.config import MIN_ANSWERS, MODEL_DIR
from app.explain import explain
from app.family import RELATIONS, CONDITIONS as FAMILY_CONDITIONS, analyse as analyse_family
from app.questionnaire import FEATURE_COLUMNS, QUESTIONS, public_questionnaire, to_feature_row
from app.registry import ModelRegistry
from app.safety import RED_FLAG_QUESTIONS, evaluate_red_flags
from app.schemas import AssessRequest, FamilyHistory, FamilyHistoryRequest

DISCLAIMER = ("This is NOT a medical diagnosis. It is a research prototype trained on a small public dataset of 366 patients. "
              "Please see a doctor or dermatologist for any skin problem.")
LIMITATIONS = [
    "Trained on the real UCI Dermatology dataset (366 patients, donated to UCI in 1998, single source). It may not represent you.",
    "The dataset's features were scored by clinicians; your own answers may differ, and this has never been validated.",
    "Only four outcome groups exist. Eczema subtypes such as atopic or contact dermatitis, and vitiligo, are NOT covered by this dataset.",
    "Scores are model outputs, not calibrated real-world probabilities. Hiding answers ('not sure') lowers accuracy a lot.",
]
URGENT_STEP = "Because you reported warning signs, get medical help today - do not wait for this result."
NEXT_STEPS = ["Show this to a doctor or dermatologist - a clinician (sometimes with a biopsy) must confirm any diagnosis.",
              "See a doctor soon if the rash is painful, spreading fast, blistering, infected, or comes with fever."]


def basic_care_plan(condition: Optional[str]):
    """Return short, low-risk educational steps matched to the leading group."""
    if condition == "psoriasis":
        return {"title": "Basic plan for a likely psoriasis pattern", "summary": "Gentle care while you arrange professional advice.", "steps": ["Moisturise regularly, especially after bathing.", "Avoid picking or scratching plaques and protect irritated skin from friction.", "Arrange a clinician review if patches persist, spread, or affect joints."]}
    elif condition == "seborrheic_dermatitis":
        return {"title": "Basic plan for a likely seborrheic dermatitis pattern", "summary": "Simple scalp and skin support while you arrange professional advice.", "steps": ["Use a gentle cleanser and avoid fragranced products on irritated areas.", "Keep the scalp routine consistent and follow product labels carefully.", "Arrange a clinician review if scaling, redness, or discomfort continues."]}
    elif condition == "chronic_dermatitis":
        return {"title": "Basic plan for a likely dermatitis pattern", "summary": "Support the skin barrier and reduce avoidable irritation.", "steps": ["Use a fragrance-free moisturiser several times a day.", "Keep showers lukewarm and choose gentle, fragrance-free cleansers.", "Arrange a clinician review if itching or irritation keeps returning."]}
    elif condition == "other_scaly_rash":
        return {"title": "Basic plan for a likely scaly-rash pattern", "summary": "Keep the routine gentle until the pattern is reviewed professionally.", "steps": ["Moisturise with a plain, fragrance-free product.", "Avoid new active products and do not scratch or peel scaling skin.", "Arrange a clinician review for a persistent, spreading, or changing rash."]}
    else:
        return {"title": "Basic gentle-skin plan", "summary": "A simple starting routine while you arrange professional advice.", "steps": ["Use a mild, fragrance-free cleanser.", "Moisturise after washing and avoid products that sting.", "Track changes and seek care if symptoms persist or worsen."]}

CAPABILITIES = {
    "assess": {"status": "implemented", "data": "UCI Dermatology (real, 366 patients)",
               "note": "Scores 4 groups from a plain-language questionnaire; not validated on lay-reported answers."},
    "explanation": {"status": "implemented", "note": "Included in /assess. Exact for the logistic-regression model."},
    "family_history_insight": {"status": "implemented", "note": "Descriptive counts from the real dataset + the answer's effect in the model + a descriptive summary of the relatives the user reports (no percentages)."},
    "safety_routing": {"status": "implemented", "note": "Separate red-flag questions; any 'yes' returns an urgent-review notice that the model score cannot override."},
    "model_comparison": {"status": "implemented", "note": "LogReg vs RandomForest vs XGBoost vs baseline on real data."},
    "eczema_subtypes": {"status": "partial", "note": "Only 'seborrheic dermatitis' and 'chronic dermatitis' exist as labels. Atopic, contact and dyshidrotic eczema: no data."},
    "psoriasis_subtypes": {"status": "blocked", "note": "No dataset with plaque/guttate/scalp/nail labels was obtained."},
    "vitiligo": {"status": "blocked", "note": "No real vitiligo dataset reachable; vitiligo is absent from the UCI data."},
    "hereditary_risk_model": {"status": "blocked", "note": "No real family-history cohort available. Only a descriptive family-history fact is provided."},
    "genetic_risk": {"status": "blocked", "note": "Needs individual genotypes and verified GWAS data; none were obtained."},
}


def create_app(model_dir: Optional[Path] = None) -> FastAPI:
    app = FastAPI(title="SkinGen ML Service", version="3.1.0",
                  description="Plain-language skin-condition questionnaire scored by a model trained on REAL data (UCI Dermatology).")
    errors.install(app)
    reg = ModelRegistry(model_dir or MODEL_DIR)
    app.state.registry = reg

    def need_model():
        if not reg.healthy:
            raise errors.ApiError(503, "model_unavailable", "The prediction model could not be loaded.", {"reason": reg.error})
        return reg.model

    @app.get("/health", tags=["meta"])
    def health():
        body = {"status": "ok" if reg.healthy else "degraded", "modelVersion": (reg.metadata or {}).get("model_version"), "modelError": reg.error}
        return JSONResponse(body, status_code=200 if reg.healthy else 503)

    @app.get("/v1/questionnaire", tags=["for the app UI"])
    def questionnaire():
        return {"intro": "Answer what you can. 'Not sure' is always allowed (accuracy drops as more answers are missing).",
                "minimumAnswers": MIN_ANSWERS, "questions": public_questionnaire(),
                "redFlagQuestions": [{**q, "type": "yes_no", "required": False} for q in RED_FLAG_QUESTIONS],
                "familyHistoryForm": {"conditions": FAMILY_CONDITIONS, "relations": RELATIONS,
                                      "answers": ["yes", "no", "not_sure"],
                                      "extraQuestions": ["asthma_or_hay_fever", "autoimmune_disease"]}}

    @app.get("/v1/capabilities", tags=["meta"])
    def capabilities():
        return CAPABILITIES

    @app.get("/v1/model-info", tags=["meta"])
    def model_info():
        if reg.metadata is None:
            raise errors.ApiError(503, "model_unavailable", "Model metadata missing.", {"reason": reg.error})
        return reg.metadata

    @app.get("/v1/model-comparison", tags=["meta"])
    def model_comparison():
        if reg.comparison is None:
            raise errors.ApiError(503, "comparison_unavailable", "comparison_report.json missing.")
        return reg.comparison
    
    
    @app.post("/v1/family-history-analysis", tags=["family history"])
    def family_history_analysis(req: FamilyHistoryRequest):
        """Summarise reported family history. This is descriptive, not a risk prediction."""
        result = analyse_family((req.familyHistory or FamilyHistory()).model_dump())
        return {
            "apiVersion": app.version,
            "result": result,
            "status": "descriptive_only",
            "disclaimer": (
                "This summarises reported family history. It does not diagnose disease "
                "or calculate an individual's genetic or hereditary risk."
            ),
        }

    @app.post("/v1/hereditary-risk", tags=["family history"])
    def hereditary_risk(req: FamilyHistoryRequest):
        """Return qualitative family-history observations, not a genetic risk score."""
        summary = analyse_family((req.familyHistory or FamilyHistory()).model_dump())

        if summary is None:
            raise errors.ApiError(
                422,
                "insufficient_family_history",
                "Provide family-history answers to assess the information available.",
            )

        assessments = {}
        for condition, details in summary["conditions"].items():
            assessments[condition] = {
                "status": details["status"],
                "label": details["label"],
                "familyHistoryReported": details["status"] == "family_history_reported",
                "closeRelativeAffected": details["closeRelativeAffected"],
                "interpretation": details["interpretation"],
                "relatedFamilyHistory": details["relatedFamilyHistory"],
                "riskPercentage": None,
                "riskEstimateAvailable": False,
                "limitations": (
                    "Family history alone cannot establish an individual's disease risk. "
                    "This is not a validated hereditary-risk model or genetic assessment."
                ),
            }

        return {
            "apiVersion": app.version,
            "status": "qualitative_only",
            "assessments": assessments,
            "familyHistorySummary": summary,
            "disclaimer": (
                "These observations describe reported family history, not a diagnosis "
                "or a validated prediction of future disease."
            ),
        }


    @app.post("/v1/assess", tags=["main"])
    def assess(req: AssessRequest):
        model = need_model()
        safety = evaluate_red_flags(req.redFlags.model_dump() if req.redFlags else None)
        answers = req.answers.model_dump()
        answered = [q for q, v in answers.items() if v is not None]
        if len(answered) < MIN_ANSWERS:
            raise errors.ApiError(422, "too_few_answers", f"Please answer at least {MIN_ANSWERS} questions (you answered {len(answered)}).",
                                  {"answered": len(answered), "minimum": MIN_ANSWERS, "safety": safety})
        # Only classify the case as "no symptoms reported" when every symptom question
        # was explicitly answered "none". Missing / unknown answers must never count as none.
        symptom_question_ids = [q["id"] for q in QUESTIONS if q["type"] == "grade"]
        no_symptoms_reported = all(answers.get(qid) == "none" for qid in symptom_question_ids)

        # The dataset has no healthy class, and isolated mild itching is too nonspecific
        # to support a meaningful ranking across its four disease groups. Suppress the
        # classifier only when itching is the sole reported symptom and every other
        # symptom item was explicitly answered "none". Missing/unknown answers do not
        # satisfy this rule. The red-flag assessment above remains independent.
        isolated_mild_itching = (
            answers.get("itching") == "mild"
            and all(
                answers.get(qid) == "none"
                for qid in symptom_question_ids
                if qid != "itching"
            )
        )

        row = to_feature_row(answers)
        X = pd.DataFrame([row])[FEATURE_COLUMNS]
        fam = reg.metadata["family_history_in_dataset"]
        fh_answer = answers.get("family_history")

        if no_symptoms_reported:
            # The classifier has no healthy/no-symptoms class. Suppress its four-class
            # ranking for this explicitly symptom-free questionnaire instead of showing
            # a misleading disease label. Red-flag safety routing remains independent.
            preds = []
            top_condition = None
            explanation = None
            screening_status = {
                "code": "no_symptoms_reported",
                "title": "No skin symptoms reported",
                "message": "Your answers indicate that you reported none of the listed skin symptoms. This does not prove that you are disease-free or rule out a skin condition.",
                "modelOutputSuppressed": True,
            }
        elif isolated_mild_itching:
            # Do not turn a single nonspecific symptom into a strong disease ranking.
            preds = []
            top_condition = None
            explanation = None
            screening_status = {
                "code": "limited_symptom_specificity",
                "title": "Limited symptom information",
                "message": (
                    "Only mild itching was reported, with all other listed skin symptoms explicitly marked none. "
                    "Mild itching alone is nonspecific, so this tool cannot responsibly rank a skin condition from this pattern. "
                    "If itching persists, worsens, or concerns you, seek advice from a healthcare professional."
                ),
                "modelOutputSuppressed": True,
            }
        else:
            proba = model.predict_proba(X)[0]
            order = np.argsort(-proba)
            preds = [{"rank": r + 1, "condition": CLASS_ORDER[i], "label": LABELS[CLASS_ORDER[i]], "modelScore": round(float(proba[i]), 4)}
                     for r, i in enumerate(order)]
            top_condition = preds[0]
            explanation = explain(model, row, answers, int(order[0]))
            screening_status = {
                "code": "symptoms_reported_or_incomplete_no_symptom_pattern",
                "title": "Screening model output available",
                "message": "The model ranks only its four supported skin-condition groups. Its scores are not calibrated real-world probabilities and cannot diagnose or rule out disease.",
                "modelOutputSuppressed": False,
            }
        return {
            "screeningStatus": screening_status,
            "safety": safety,
            "disclaimer": DISCLAIMER,
            "answeredCount": len(answered), "totalQuestions": len(answers),
            "notSure": [q for q, v in answers.items() if v is None],
            "accuracyWarning": ("Many answers are missing; results are much less reliable." if len(answered) < 8 else None),
            "predictions": preds,
            "topCondition": top_condition,
            "carePlan": basic_care_plan(top_condition["condition"] if top_condition else None),
            "scoreNote": (
                "No disease ranking is shown because every symptom question was explicitly answered 'none'."
                if no_symptoms_reported else
                "No disease ranking is shown because only mild itching was reported and all other symptom questions were explicitly answered 'none'."
                if isolated_mild_itching else
                "Scores sum to 1 across the four groups. They are NOT calibrated real-world probabilities, and can be extreme (near 0 or 1) when the answers match a typical pattern in the training data; that is not certainty."
            ),
            "explanation": explanation,
            "familyHistory": {
                "yourAnswer": fh_answer,
                "datasetFacts": {g: v for g, v in fam.items()},
                "note": ("Share of training patients who had a family history, per group (real data). In this dataset it was far more "
                         "common in psoriasis than in the other groups; it is not a hereditary-risk estimate for you.")},
            "model": {"name": reg.metadata["chosen_model"], "version": reg.metadata["model_version"],
                      "trainedOn": "UCI Dermatology, 366 real patients", "validatedOnLayAnswers": False},
            "familyHistoryAnalysis": analyse_family(req.familyHistory.model_dump() if req.familyHistory else None),
            "limitations": LIMITATIONS,
            "nextSteps": ([URGENT_STEP] if safety["level"] == "urgent_review" else []) + NEXT_STEPS,
        }

    return app


app = create_app()
