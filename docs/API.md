# API (Node gateway, base `http://localhost:5000/api/v1`)

| Method | Path | What it does |
|---|---|---|
| GET | `/health` | Node + ML + DB status (200 ok/degraded, 503 if the ML service or its model is down) |
| GET | `/health/live` | Node liveness only |
| GET | `/questionnaire` | The 12 plain-language questions with answer choices - build your form from this |
| POST | `/assess` | Send answers, get condition scores, safety routing, family-history facts, limitations |
| POST | `/family-history-analysis` | Summarise family history answers and affected/unknown relatives; descriptive only |
| POST | `/hereditary-risk` | Qualitative family-history assessment; no numerical/genetic risk score |
| GET | `/capabilities` | What is implemented / partial / blocked, with reasons |
| GET | `/model-info` | Dataset, split, params, metrics, robustness, hashes |
| GET | `/model-comparison` | LogReg vs RandomForest vs XGBoost vs baseline (real data, CV + hold-out) |
| GET | `/history` | Stored scores of consenting users. **Requires `X-API-Key`** (or `Authorization: Bearer`); 401 wrong key, 503 if no key configured / DB down |

The ML service also exposes everything at `http://localhost:8001/v1/...` and Swagger UI at **http://localhost:8001/docs**.
Real captured request/response pairs: `docs/examples/*.json`. Postman: `postman/skingen.postman_collection.json`.

## POST /assess - input (made for normal users)
```json
{ "answers": { "age": 34, "scaling": "severe", "redness": "moderate", "itching": "mild",
               "knees_elbows": "severe", "scalp": "moderate", "family_history": "yes" } }
```
* Every question is **optional**. Leave it out, use `null`, or say `"not sure"` - it is treated as *missing*, never as "no".
* At least **4** answers are needed (design choice) or the API returns 422 `too_few_answers`.
* Graded questions: `none | mild | moderate | severe | not sure`. Everyday words work: no, slight, low, medium, strong, high...
* Yes/no question (`family_history`): `yes | no | not sure` (also y / n / true / false).
* Not case-sensitive; extra spaces are fine; keys like `"Family History"` work; `"age": "40"` works. Age 0-110.
* Mistakes give a readable message, e.g. `{"field":"scaling","message":"Please choose one of: none, mild, moderate, severe, not_sure."}` (HTTP 422).

## Optional extra request fields (v3.1)
```json
{ "answers": { "...": "..." },
  "redFlags": { "rapidly_worsening": false, "fever_or_very_unwell": true, "pus_or_fluid": null, "painful_hot_swelling": false, "blisters": false },
  "familyHistory": { "psoriasis": "not sure", "eczema": false, "vitiligo": null, "asthma_or_hay_fever": "yes", "autoimmune_disease": null,
                     "relatives": [ { "relation": "mother", "condition": "eczema", "answer": "yes" } ] },
  "consentToStore": false }
```
* `redFlags`: each `true | false | null` (null = not answered, never "no"). Any `true` returns `urgent_review`; any unanswered flag without a `true` keeps the status at `not_assessed`; only all five explicitly false answers return `none_reported`. Questions come from `GET /questionnaire` -> `redFlagQuestions`.
* `familyHistory`: answers `yes | no | not_sure` (true/false/null also work). Relations include mother, father, sibling, child, generic `grandparent`, `maternal_grandmother`, `maternal_grandfather`, `paternal_grandmother`, `paternal_grandfather`, aunt/uncle, cousin, and other. Conditions: psoriasis, eczema, vitiligo. Form options come from `/questionnaire` -> `familyHistoryForm`. The qualitative hereditary response may include related family-condition context (e.g. asthma/hay fever for atopic tendency); this context does not change the direct disease-history status or produce a risk percentage.
* `consentToStore`: boolean, default false. Handled by the gateway; **nothing is saved unless it is `true`**.
* Extra: `429 rate_limited` after too many `/assess` calls per minute per IP.

## Response (main parts)
`safety` (`level`: `urgent_review | none_reported | not_assessed`, `triggeredBy[]`, `message`), `familyHistoryAnalysis` (per condition: status, affected relatives, `closeRelativeAffected`; `null` if not sent),
`predictions[]` (the four groups when a disease ranking is available; empty when every symptom question is explicitly `none`), `topCondition`, `explanation.reasons[]` (each answer: raises/lowers + strength + sentence),
`explanation.additivityCheck` (exactness proof), `familyHistory.datasetFacts` (real counts), `notSure[]`, `accuracyWarning`, `limitations[]`, `nextSteps[]`, `disclaimer`.

## Errors
Always `{"error": {"code", "message", "details"}}`: 422 `invalid_answers` / `too_few_answers`; 400 invalid JSON; 415 wrong content type; 502/504 ML service unreachable/timeout; 503 model unavailable.

## Family-history endpoints

Both endpoints accept `{ "familyHistory": { "psoriasis": "yes", "eczema": "not_sure", "vitiligo": "no", "relatives": [{ "relation": "mother", "condition": "psoriasis", "answer": "yes" }] } }`. Supported relatives are exposed by `GET /questionnaire` -> `familyHistoryForm`. Missing and `not_sure` answers remain unknown, not negative. The family summary separates `unknownAnswers` from `missingInformation`. `/family-history-analysis` is descriptive; `/hereditary-risk` returns qualitative statuses and `riskPercentage: null`, `riskEstimateAvailable: false`. Related conditions (such as asthma/hay fever for atopic tendency) are context only and never silently become a direct eczema/vitiligo report. Neither endpoint diagnoses disease or estimates genetic probability.
