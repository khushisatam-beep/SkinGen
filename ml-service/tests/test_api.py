import json, shutil
import pytest
from fastapi.testclient import TestClient
from app.config import MODEL_DIR
from app.main import create_app
from app.questionnaire import QUESTIONS
from tests.conftest import PSORIASIS_LIKE

CONDITIONS = {"psoriasis", "seborrheic_dermatitis", "chronic_dermatitis", "other_scaly_rash"}


def assess(c, answers):
    return c.post("/v1/assess", json={"answers": answers})


def test_health_and_questionnaire(client):
    assert client.get("/health").json()["status"] == "ok"
    q = client.get("/v1/questionnaire").json()
    assert len(q["questions"]) == 12 and all(x["required"] is False for x in q["questions"])
    graded = [x for x in q["questions"] if x["type"] == "grade"]
    assert all([c["value"] for c in x["choices"]] == ["none", "mild", "moderate", "severe", "not_sure"] for x in graded)


def test_valid_assessment_schema(client):
    r = assess(client, PSORIASIS_LIKE)
    assert r.status_code == 200
    b = r.json()
    assert {p["condition"] for p in b["predictions"]} == CONDITIONS
    assert abs(sum(p["modelScore"] for p in b["predictions"]) - 1) < 1e-3
    assert [p["rank"] for p in b["predictions"]] == [1, 2, 3, 4]
    assert b["topCondition"]["condition"] == "psoriasis"          # typical psoriasis answers
    assert b["model"]["validatedOnLayAnswers"] is False and b["limitations"] and "NOT a medical diagnosis" in b["disclaimer"]
    assert b["answeredCount"] == 9 and set(b["notSure"]) == {"flat_purple_bumps", "bumps_around_hairs", "mouth_lesions"}


def test_lichen_planus_like_answers_not_psoriasis(client):
    a = {"age": 45, "redness": "moderate", "itching": "severe", "flat_purple_bumps": "severe", "mouth_lesions": "severe",
         "scaling": "none", "clear_edges": "moderate", "knees_elbows": "none", "scalp": "none", "family_history": "no"}
    assert assess(client, a).json()["topCondition"]["condition"] == "other_scaly_rash"


def test_forgiving_input_and_not_sure(client):
    r = assess(client, {"scaling": " SEVERE ", "itching": "Not sure", "age": "40", "redness": "Mild", "family_history": "No"})
    assert r.status_code == 200 and "itching" in r.json()["notSure"]


def test_everyday_wording_is_understood(client):
    a = {"Scaling": "Strong", "redness": "slight", "Itching": "no", "AGE": "40", "family history": "Y", "scalp": "medium"}
    r = assess(client, a)
    assert r.status_code == 200
    f = r.json()
    assert f["answeredCount"] == 6 and f["familyHistory"]["yourAnswer"] == "yes"


def test_null_and_omitted_are_missing_not_negative(client):
    a = assess(client, {"scaling": "severe", "redness": "mild", "itching": "mild", "age": 30, "family_history": None}).json()
    assert "family_history" in a["notSure"] and a["familyHistory"]["yourAnswer"] is None


@pytest.mark.parametrize("body,field", [
    ({"scaling": "huge"}, "scaling"), ({"age": -3}, "age"), ({"age": 300}, "age"), ({"age": "abc"}, "age"),
    ({"family_history": "maybe"}, "family_history"), ({"colour": "red"}, "colour"), ({"itching": 3}, "itching"),
])
def test_invalid_answers_422_with_friendly_message(client, body, field):
    r = assess(client, {**PSORIASIS_LIKE, **body})
    assert r.status_code == 422
    e = r.json()["error"]
    assert e["code"] == "invalid_answers" and any(d["field"] == field for d in e["details"])
    assert all(isinstance(d["message"], str) and len(d["message"]) > 10 for d in e["details"])


def test_too_few_answers(client):
    r = assess(client, {"scaling": "mild", "itching": "mild"})
    assert r.status_code == 422 and r.json()["error"]["code"] == "too_few_answers"
    assert assess(client, {}).status_code == 422


def test_bad_top_level_shape(client):
    assert client.post("/v1/assess", json={}).status_code == 422
    assert client.post("/v1/assess", json={"answers": PSORIASIS_LIKE, "extra": 1}).status_code == 422


def test_explanation_is_exact_and_input_dependent(client):
    e1 = assess(client, PSORIASIS_LIKE).json()["explanation"]
    assert e1["status"] == "ok" and e1["additivityCheck"]["absoluteDifference"] < 1e-6
    assert all(r["id"] not in ("flat_purple_bumps",) for r in e1["reasons"])        # 'not sure' answers are not listed as reasons
    e2 = assess(client, {**PSORIASIS_LIKE, "family_history": "no", "scaling": "none"}).json()["explanation"]
    assert e1["reasons"] != e2["reasons"]


def test_explanation_matches_prediction_target(client):
    b = assess(client, PSORIASIS_LIKE).json()
    assert b["explanation"]["condition"] == b["topCondition"]["condition"]


def test_family_history_facts_come_from_real_data(client):
    f = assess(client, PSORIASIS_LIKE).json()["familyHistory"]["datasetFacts"]
    assert f["psoriasis"] == {"with_family_history": 32, "patients": 112, "percent": 28.6}
    assert f["chronic_dermatitis"]["with_family_history"] == 0


def test_metadata_is_real_data_only(client):
    m = client.get("/v1/model-info").json()
    assert m["dataset"]["real_data"] is True and m["dataset"]["rows"] == 366
    assert sum(m["dataset"]["grouped_class_counts"].values()) == 366
    c = client.get("/v1/model-comparison").json()
    assert {"MajorityBaseline", "LogisticRegression", "RandomForest", "XGBoost"} == set(c["candidates"])
    t = c["candidates"][c["chosen_model"]]["test_holdout"]
    assert t["accuracy"] > c["candidates"]["MajorityBaseline"]["test_holdout"]["accuracy"]


def test_capabilities_report_blocked_features_honestly(client):
    c = client.get("/v1/capabilities").json()
    for k in ("vitiligo", "genetic_risk", "hereditary_risk_model", "psoriasis_subtypes"):
        assert c[k]["status"] == "blocked"


def test_missing_model_dir_gives_degraded_and_503(tmp_path):
    c = TestClient(create_app(tmp_path / "nothing"))
    assert c.get("/health").status_code == 503
    r = assess(c, PSORIASIS_LIKE)
    assert r.status_code == 503 and r.json()["error"]["code"] == "model_unavailable"
    assert c.get("/v1/questionnaire").status_code == 200          # static parts still work


def test_tampered_model_detected(tmp_path):
    shutil.copytree(MODEL_DIR, tmp_path / "m")
    (tmp_path / "m" / "model.joblib").write_bytes(b"corrupt")
    c = TestClient(create_app(tmp_path / "m"))
    assert c.get("/health").status_code == 503 and "SHA-256" in c.get("/health").json()["modelError"]


# ---------------- v3.1: safety routing + family history ----------------
def post(c, **body):
    return c.post("/v1/assess", json={"answers": PSORIASIS_LIKE, **body})


def test_safety_not_assessed_when_red_flags_missing(client):
    s = post(client).json()["safety"]
    assert s["level"] == "not_assessed" and s["triggeredBy"] == [] and len(s["unanswered"]) == 5


def test_safety_none_reported_when_all_no(client):
    rf = {k: False for k in ("rapidly_worsening", "fever_or_very_unwell", "pus_or_fluid", "painful_hot_swelling", "blisters")}
    assert post(client, redFlags=rf).json()["safety"]["level"] == "none_reported"


def test_partially_answered_red_flags_are_not_treated_as_all_clear(client):
    safety = post(client, redFlags={"rapidly_worsening": False}).json()["safety"]
    assert safety["level"] == "not_assessed"
    assert safety["triggeredBy"] == []
    assert set(safety["unanswered"]) == {"fever_or_very_unwell", "pus_or_fluid", "painful_hot_swelling", "blisters"}
    assert "not all urgent warning signs were checked" in safety["message"]


def test_red_flag_is_urgent_and_not_overridden_by_model(client):
    b = post(client, redFlags={"fever_or_very_unwell": True}).json()
    assert b["safety"]["level"] == "urgent_review" and b["safety"]["triggeredBy"][0]["id"] == "fever_or_very_unwell"
    assert b["topCondition"]["condition"] == "psoriasis"              # model output unchanged ...
    assert "today" in b["nextSteps"][0]                               # ... but urgent advice comes first


def test_red_flag_reported_even_when_too_few_answers(client):
    r = client.post("/v1/assess", json={"answers": {"scaling": "mild"}, "redFlags": {"blisters": True}})
    assert r.status_code == 422 and r.json()["error"]["details"]["safety"]["level"] == "urgent_review"


def test_unknown_red_flag_rejected(client):
    r = post(client, redFlags={"nope": True})
    assert r.status_code == 422 and r.json()["error"]["details"][0]["field"].endswith("nope")


def test_family_history_relatives_summary(client):
    fh = {"psoriasis": "not sure", "eczema": False, "asthma_or_hay_fever": "yes",
          "relatives": [{"relation": "Mother", "condition": "eczema", "answer": "yes"},
                        {"relation": "cousin", "condition": "psoriasis", "answer": True},
                        {"relation": "sibling", "condition": "vitiligo", "answer": "not sure"}]}
    f = post(client, familyHistory=fh).json()["familyHistoryAnalysis"]["conditions"]
    assert f["eczema"]["status"] == "family_history_reported" and f["eczema"]["closeRelativeAffected"] is True
    assert f["psoriasis"]["status"] == "family_history_reported" and f["psoriasis"]["closeRelativeAffected"] is False
    assert f["vitiligo"]["status"] == "insufficient_information" and f["vitiligo"]["unknownRelatives"] == ["sibling"]


def test_unknown_family_history_is_never_negative(client):
    f = post(client, familyHistory={"psoriasis": "not sure", "eczema": None, "vitiligo": False}).json()["familyHistoryAnalysis"]
    assert f["conditions"]["psoriasis"]["status"] == "insufficient_information"
    assert f["conditions"]["eczema"]["status"] == "insufficient_information"
    assert f["conditions"]["vitiligo"]["status"] == "no_family_history_reported"
    assert "percent" not in str(f).lower().replace("percentage", "")      # no invented risk numbers


def test_family_history_does_not_change_model_scores(client):
    a = post(client).json()["predictions"]
    b = post(client, familyHistory={"psoriasis": "yes", "relatives": [{"relation": "mother", "condition": "psoriasis", "answer": "yes"}]}).json()["predictions"]
    assert a == b and post(client).json()["familyHistoryAnalysis"] is None


def test_bad_relative_rejected(client):
    assert post(client, familyHistory={"relatives": [{"relation": "mother", "condition": "cancer", "answer": "yes"}]}).status_code == 422


def test_questionnaire_exposes_red_flag_and_family_forms(client):
    q = client.get("/v1/questionnaire").json()
    assert len(q["redFlagQuestions"]) == 5 and "mother" in q["familyHistoryForm"]["relations"]


def test_all_explicit_none_answers_suppress_misleading_disease_ranking(client):
    no_symptoms = {"age": 22, "redness": "none", "scaling": "none", "clear_edges": "none", "itching": "none",
                   "new_patches_after_injury": "none", "flat_purple_bumps": "none", "bumps_around_hairs": "none",
                   "mouth_lesions": "none", "knees_elbows": "none", "scalp": "none", "family_history": "no"}
    b = assess(client, no_symptoms).json()
    assert b["screeningStatus"]["code"] == "no_symptoms_reported"
    assert b["screeningStatus"]["modelOutputSuppressed"] is True
    assert b["predictions"] == [] and b["topCondition"] is None and b["explanation"] is None
    assert "does not prove" in b["screeningStatus"]["message"]


def test_isolated_mild_itching_suppresses_misleading_disease_ranking(client):
    isolated_mild_itching = {
        "age": 22, "redness": "none", "scaling": "none", "clear_edges": "none",
        "itching": "mild", "new_patches_after_injury": "none",
        "flat_purple_bumps": "none", "bumps_around_hairs": "none",
        "mouth_lesions": "none", "knees_elbows": "none", "scalp": "none",
        "family_history": "no",
    }
    b = assess(client, isolated_mild_itching).json()
    assert b["screeningStatus"]["code"] == "limited_symptom_specificity"
    assert b["screeningStatus"]["modelOutputSuppressed"] is True
    assert b["predictions"] == [] and b["topCondition"] is None and b["explanation"] is None
    assert "mild itching alone is nonspecific" in b["screeningStatus"]["message"].lower()
    assert "no disease ranking is shown" in b["scoreNote"].lower()
    assert b["safety"]["level"] == "not_assessed"  # no safety answers were supplied


def test_isolated_mild_itching_does_not_override_urgent_safety_routing(client):
    isolated_mild_itching = {
        "age": 22, "redness": "none", "scaling": "none", "clear_edges": "none",
        "itching": "mild", "new_patches_after_injury": "none",
        "flat_purple_bumps": "none", "bumps_around_hairs": "none",
        "mouth_lesions": "none", "knees_elbows": "none", "scalp": "none",
        "family_history": "no",
    }
    b = client.post(
        "/v1/assess",
        json={"answers": isolated_mild_itching, "redFlags": {"rapidly_worsening": True}},
    ).json()
    assert b["screeningStatus"]["code"] == "limited_symptom_specificity"
    assert b["predictions"] == [] and b["topCondition"] is None
    assert b["safety"]["level"] == "urgent_review"
    assert "today" in b["nextSteps"][0]


def test_missing_symptom_answers_do_not_count_as_no_symptoms(client):
    a = {"age": 22, "redness": "none", "scaling": "none", "clear_edges": "none", "itching": "none",
         "new_patches_after_injury": "none", "flat_purple_bumps": "none", "bumps_around_hairs": "none",
         "mouth_lesions": "none", "knees_elbows": "none", "scalp": None, "family_history": "no"}
    b = assess(client, a).json()
    assert b["screeningStatus"]["code"] != "no_symptoms_reported"
    assert len(b["predictions"]) == 4


def test_urgent_red_flag_stays_visible_when_no_symptoms_reported(client):
    no_symptoms = {"age": 22, "redness": "none", "scaling": "none", "clear_edges": "none", "itching": "none",
                   "new_patches_after_injury": "none", "flat_purple_bumps": "none", "bumps_around_hairs": "none",
                   "mouth_lesions": "none", "knees_elbows": "none", "scalp": "none", "family_history": "no"}
    b = client.post("/v1/assess", json={"answers": no_symptoms, "redFlags": {"fever_or_very_unwell": True}}).json()
    assert b["safety"]["level"] == "urgent_review"
    assert b["screeningStatus"]["code"] == "no_symptoms_reported"
    assert "today" in b["nextSteps"][0]
    

def test_family_history_analysis_endpoint(client):
    response = client.post(
        "/v1/family-history-analysis",
        json={
            "familyHistory": {
                "psoriasis": "yes",
                "relatives": [
                    {
                        "relation": "mother",
                        "condition": "psoriasis",
                        "answer": "yes",
                    }
                ],
            }
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "descriptive_only"

    psoriasis = data["result"]["conditions"]["psoriasis"]
    assert psoriasis["status"] == "family_history_reported"
    assert psoriasis["closeRelativeAffected"] is True


def test_hereditary_risk_endpoint_is_qualitative_only(client):
    response = client.post(
        "/v1/hereditary-risk",
        json={
            "familyHistory": {
                "psoriasis": "yes",
                "vitiligo": "not_sure",
                "relatives": [
                    {
                        "relation": "mother",
                        "condition": "psoriasis",
                        "answer": "yes",
                    }
                ],
            }
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "qualitative_only"

    assessments = data["assessments"]
    assert assessments["psoriasis"]["status"] == "family_history_reported"
    assert assessments["psoriasis"]["riskPercentage"] is None
    assert assessments["psoriasis"]["riskEstimateAvailable"] is False
    assert assessments["vitiligo"]["status"] == "insufficient_information"


def test_family_history_endpoints_treat_missing_answers_as_unknown(client):
    for endpoint in ("/v1/family-history-analysis", "/v1/hereditary-risk"):
        response = client.post(endpoint, json={})

        assert response.status_code == 200
        data = response.json()

        if endpoint == "/v1/family-history-analysis":
            conditions = data["result"]["conditions"]
        else:
            conditions = data["assessments"]

        for condition in ("psoriasis", "eczema", "vitiligo"):
            assert conditions[condition]["status"] == "insufficient_information"


def test_family_history_summary_separates_unknown_answers_from_missing_information(client):
    response = client.post(
        "/v1/family-history-analysis",
        json={"familyHistory": {"psoriasis": "not_sure"}},
    )
    assert response.status_code == 200
    summary = response.json()["result"]["summary"]
    assert "psoriasis" in summary["unknownAnswers"]
    assert "psoriasis" not in summary["missingInformation"]
    assert set(summary["missingInformation"]) == {"eczema", "vitiligo"}
    assert set(summary["insufficientInformation"]) == {"psoriasis", "eczema", "vitiligo"}


def test_family_history_supports_maternal_and_paternal_grandparents(client):
    response = client.post(
        "/v1/family-history-analysis",
        json={
            "familyHistory": {
                "relatives": [
                    {"relation": "maternal_grandmother", "condition": "psoriasis", "answer": "yes"},
                    {"relation": "paternal_grandfather", "condition": "vitiligo", "answer": "yes"},
                ]
            }
        },
    )
    assert response.status_code == 200
    conditions = response.json()["result"]["conditions"]
    assert conditions["psoriasis"]["affectedRelatives"][0]["relation"] == "maternal_grandmother"
    assert conditions["vitiligo"]["affectedRelatives"][0]["relation"] == "paternal_grandfather"
    assert conditions["psoriasis"]["closeRelativeAffected"] is False


def test_related_family_conditions_are_context_not_direct_disease_history(client):
    response = client.post(
        "/v1/hereditary-risk",
        json={"familyHistory": {"asthma_or_hay_fever": "yes", "autoimmune_disease": "yes"}},
    )
    assert response.status_code == 200
    assessments = response.json()["assessments"]
    eczema = assessments["eczema"]
    vitiligo = assessments["vitiligo"]
    assert eczema["status"] == "insufficient_information"
    assert eczema["relatedFamilyHistory"][0]["field"] == "asthma_or_hay_fever"
    assert "not a report of eczema" in eczema["relatedFamilyHistory"][0]["relevance"]
    assert vitiligo["status"] == "insufficient_information"
    assert vitiligo["relatedFamilyHistory"][0]["field"] == "autoimmune_disease"
    assert vitiligo["riskPercentage"] is None and vitiligo["riskEstimateAvailable"] is False


def test_family_history_endpoint_rejects_invalid_condition(client):
    response = client.post(
        "/v1/hereditary-risk",
        json={
            "familyHistory": {
                "relatives": [
                    {
                        "relation": "mother",
                        "condition": "melanoma",
                        "answer": "yes",
                    }
                ]
            }
        },
    )

    assert response.status_code == 422

