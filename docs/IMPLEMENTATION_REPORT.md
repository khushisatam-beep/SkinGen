# SkinGen backend verification and implementation report

## Changes in this package

- Updated red-flag routing so `none_reported` is returned only when all five questions were explicitly answered `false`. A partial set of answers now remains `not_assessed`; any positive answer still takes precedence as `urgent_review`.
- Added direct unit tests for missing, partial, all-negative, and each individually triggered red-flag question.
- Added explicit `maternal_grandmother`, `maternal_grandfather`, `paternal_grandmother`, and `paternal_grandfather` family-history relations while keeping the older generic `grandparent` option.
- Added separate `unknownAnswers` and `missingInformation` summary lists without interpreting unknown or absent answers as negative.
- Added condition-specific contextual family-history details for asthma/hay fever and other autoimmune disease. These details do not change the direct eczema/vitiligo family-history status and do not produce numerical risk estimates.
- Extended the Postman collection to cover model health, family-history analysis, qualitative hereditary assessment, partially answered safety questions, consent-granted storage, and protected history retrieval.
- Added a dedicated `node-tests` Docker Compose profile and `node-backend/Dockerfile.test`. Jest/Supertest remain outside the production image. The profile automatically points integration tests at the real FastAPI service.
- Added separate npm scripts for gateway unit tests and real-service integration tests; refreshed the API and run/test documentation.
- Excluded the uploaded local `.env`, virtual environments, `node_modules`, caches and obsolete `.bak` backups from this clean package. The `.env.example` remains included.

## Feature status

| Feature | Status | Notes |
|---|---|---|
| Family-history analysis | Implemented | Structured statuses, relative-level reports, unknown answers, explicit missing-information list, separate maternal/paternal grandparents. |
| Hereditary assessment | Implemented qualitatively | Direct reported history is separated from contextual conditions. No percentages or genetic-risk score. |
| Disease screening | Partial by design | Retains the existing four-class UCI Dermatology model. It is not validated on lay-typed answers. Vitiligo and atopic-eczema predictions remain unavailable. |
| Explainability | Deferred | Existing implementation left untouched as requested. |
| Developer testing | Improved | Postman collection, FastAPI OpenAPI docs, Jest unit/integration suites, opt-in Compose test profile. |
| MongoDB consent and history | Existing implementation retained | Previously manually verified by the user in the running Docker stack; this environment could not repeat live Docker/MongoDB tests. |
| Safety routing | Improved | A partially answered safety questionnaire can no longer be represented as all-clear. |

## Verification performed for this package

- `python -m compileall -q ml-service/app ml-service/tests`: passed.
- `pytest -q ml-service/tests/test_safety.py`: **9 passed**.
- Targeted family-history endpoint tests: **7 passed, 36 deselected**.
- Node JavaScript syntax checks (`node --check` across `src` and `tests`): passed.
- JSON, Postman URL structure, and Compose YAML parse checks: passed.
- A full Python test run was attempted in this environment: **39 passed, 16 failed, 8 warnings**. The failing model-inference tests hit `AttributeError: 'SimpleImputer' object has no attribute '_fill_dtype'` because this sandbox has Python 3.13 / scikit-learn 1.8, while `model.joblib` was created with the project's pinned scikit-learn 1.5.1. The pinned Docker runtime uses Python 3.11 and the pinned requirements; the full test suite must be rerun there before treating the complete suite as green.
- The Node Jest suite and Docker build were not run in this environment: Docker is unavailable and npm package installation could not reach `registry.npmjs.org` (`EAI_AGAIN`). Node source/test syntax was checked, but the new Compose test profile still needs a real Docker run.

## Recommended verification on Windows PowerShell

From the project root, with Docker Desktop running and `.env` configured:

```powershell
# Start or rebuild the normal services
docker compose up -d --build

# Run Node unit tests plus all live FastAPI integration tests
docker compose --profile test run --build --rm node-tests

# Run Python tests using the pinned ML-service image/dependencies
docker compose run --rm --no-deps `
    -v "${PWD}\ml-service:/app" `
    ml-service sh -c "pip install -r requirements-dev.txt && pytest -q"

# Verify service health
Invoke-RestMethod http://localhost:5000/api/v1/health | ConvertTo-Json -Depth 6
Invoke-RestMethod http://localhost:8001/health | ConvertTo-Json -Depth 6
```

The default test fixtures are fictional. Live MongoDB persistence and admin-key checks are integration/manual checks; preserve the MongoDB volume and do not use `docker compose down -v` unless you intentionally want to delete the data volume.

## Clinical and privacy limits

This project is a research prototype, not a medical device or diagnostic tool. Family history is descriptive, not a validated hereditary prediction. The supported classifier has not been validated on questionnaire answers supplied by ordinary users. Keep `STORE_INPUTS=false` unless collecting questionnaire/red-flag/family-history input is necessary and users have explicitly consented.
