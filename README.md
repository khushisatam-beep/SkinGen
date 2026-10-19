# SkinGen AI - backend v3.1 (real data only, safety-routed, consent-based)

Node.js/Express gateway -> Python/FastAPI ML service -> trained model, plus optional MongoDB history, all in Docker Compose. **Backend only - no frontend.**

> **Not a medical device and not a diagnosis.** The model is trained on one small public dataset (366 patients) and has never been validated on answers typed by laypeople.

## New in 3.1 (merged best-of-both)
* **Red-flag safety routing** - 5 separate yes/no questions (rapid worsening, fever, pus, hot painful swelling, blisters). Any "yes" returns `safety.level = "urgent_review"` and puts an urgent step first in `nextSteps`. The model score can never cancel it. Unanswered is reported as `not_assessed`, never as "no".
* **Relatives-level family history** - `familyHistory` with per-relative answers (parents, siblings, and separate maternal/paternal grandparents), flags close relatives, treats "not sure" as unknown. Related conditions such as asthma/hay fever can be shown as context for eczema without being mislabelled as a report of eczema. Descriptive only: no percentages, and it does **not** change the model score.
* **Consent-based storage** - nothing is saved unless the request has `"consentToStore": true`.
* **History is protected** - `GET /api/v1/history` needs `X-API-Key` (= `ADMIN_API_KEY`); without a key configured it is disabled.
* **Hardening** - `helmet` security headers and a per-IP rate limit on `/assess`.
* Auth now lives in `node-backend/src/middleware/auth.js` so real user accounts / roles can replace the API key later without touching routes.

## What changed vs. the first version
* **All simulated data and the old synthetic models are gone.** The model is trained only on the real UCI Dermatology dataset - see **[DATA_SOURCES.md](DATA_SOURCES.md)** for the exact source, link, commit, checksum, and what was *not* used.
* **Inputs are for normal people:** 12 plain-language questions ("How red is the affected skin? none / mild / moderate / severe / not sure"). No codes, no biopsy values, every question optional, forgiving of typing style. `GET /api/v1/questionnaire` returns the questions and choices so a future frontend can build the form automatically.

## Honest status of the 8 capabilities
| # | Capability | Status |
|---|---|---|
| 1 | Hereditary risk | **Validated risk prediction blocked** - no real family-history cohort. A separate **qualitative-only family-history assessment is implemented**; no percentages or genetic risk scores are produced. |
| 2 | Disease prediction | **Implemented & tested** (`POST /assess`): 4 groups - psoriasis, seborrheic dermatitis, chronic dermatitis (eczema-type), other scaly rash. **Not validated on lay-typed answers.** Vitiligo is not covered. |
| 3 | Subtypes | **Partial**: seborrheic dermatitis and chronic dermatitis exist as dataset labels only. Atopic/contact/dyshidrotic eczema, all psoriasis and vitiligo subtypes: **blocked** (no data). |
| 4 | Genetic / genomic | **Blocked** - no individual genotypes or verified GWAS data obtained. |
| 5 | Family-history analysis | **Implemented (descriptive)**: your relatives' answers summarised + real dataset counts. Not a risk score; not used by the model. |
| 6 | Explainability | **Implemented & tested**: exact per-answer contributions (logistic regression), plus a machine-checked additivity proof in every response. |
| 7 | Model comparison | **Implemented & tested** on real data: majority baseline, logistic regression, random forest, XGBoost; 5-fold x 3 repeated CV + untouched hold-out. |
| 9 | Safety routing | **Implemented & tested** (new): red-flag questions, urgent notice independent of the model. |
| 8 | Test interface / contracts | **Implemented & tested**: Swagger `/docs`, Postman collection, 12 real example pairs, smoke script, friendly errors. |

## Real results (from `ml-service/models/comparison_report.json`)
Selected by lowest cross-validated log loss on the 80% training split (rule fixed before looking at the test set).
| Model | CV accuracy (292 pts) | Hold-out accuracy (74 pts) | Macro-F1 | Macro ROC-AUC | Log loss |
|---|---|---|---|---|---|
| Majority baseline | 0.387 | 0.378 | 0.137 | 0.500 | 1.310 |
| **Logistic regression (selected)** | **0.874** | 0.838 | 0.806 | 0.964 | 0.456 |
| Random forest | 0.870 | 0.865 | 0.834 | 0.954 | 0.477 |
| XGBoost | 0.847 | 0.824 | 0.774 | 0.956 | 0.471 |
The three real models are statistically close (n=74 test patients is tiny, CV sd about 0.05). Weakest group: seborrheic dermatitis (precision 0.56, recall 0.75).
**Missing answers hurt a lot** (hold-out accuracy when random answers are hidden): 0% hidden 0.84, 25% 0.75, 50% 0.61, 75% 0.44 - the API warns when fewer than 8 questions are answered.
Scores can be extreme (near 0 or 1) for typical patterns; they are not calibrated probabilities.

## Run with Docker
```bash
cp .env.example .env              # then edit MONGO_ROOT_PASSWORD and set ADMIN_API_KEY (openssl rand -hex 32)
docker compose build              # build images
docker compose up -d              # start mongo + ml-service + node-backend
docker compose logs -f            # view logs
curl http://localhost:5000/api/v1/health
# history (needs the key from .env):  curl -H "X-API-Key: $ADMIN_API_KEY" http://localhost:5000/api/v1/history
./scripts/smoke_test.sh           # quick checks against the running API

docker compose down               # stop services; preserve the MongoDB volume
# Rebuild changed services after code updates:
docker compose up -d --build
```
### Windows PowerShell quick start

```powershell
# Create .env only if you do not already have one. This preserves existing credentials.
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env # configure MONGO_ROOT_PASSWORD and ADMIN_API_KEY; do not share this file
docker compose up -d --build
docker compose ps
Invoke-RestMethod http://localhost:5000/api/v1/health | ConvertTo-Json -Depth 6
Invoke-RestMethod http://localhost:8001/health | ConvertTo-Json -Depth 6
```

Swagger UI: http://localhost:8001/docs. Set `ENABLE_HISTORY=false` to run without storing anything (MongoDB is then unused).

## Automated tests

The production Node image intentionally installs production dependencies only, so Jest is not expected to be available through `docker compose exec node-backend npm test`. Use the opt-in test profile instead. It builds a separate image with dev dependencies and runs the unit tests plus the integration tests against the actual FastAPI service:

```powershell
# Run the full Node gateway suite, including live ML-service integration tests:
docker compose --profile test run --build --rm node-tests

# Run the Python/FastAPI tests against the current local source:
docker compose run --rm --no-deps `
  -v "${PWD}\ml-service:/app" `
  ml-service sh -c "pip install -r requirements-dev.txt && pytest -q"
```

The test profile is opt-in and does not add test dependencies to the production image. No test command requires real patient data. The Node integration tests are enabled by `ML_INTEGRATION_URL`; the Compose test service sets it to `http://ml-service:8001` automatically.

### Run tests without Docker

```powershell
# Terminal 1: install and start FastAPI
cd ml-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
uvicorn app.main:app --host 127.0.0.1 --port 8001

# Terminal 2: from the repository root
cd node-backend
npm ci
npm test
$env:ML_INTEGRATION_URL = "http://127.0.0.1:8001"
npm run test:integration
Remove-Item Env:ML_INTEGRATION_URL
```

Use `npm run test:unit` to run only gateway tests. The standard `npm test` command also runs `tests/integration.test.js`, but skips its real-service tests when `ML_INTEGRATION_URL` is unset.

## Verification notes

* The Python service pins the scikit-learn version used to create `models/model.joblib`. Run tests with `requirements.txt` / the provided Docker image rather than an unrelated system-wide scikit-learn version; loading a serialized estimator with a different scikit-learn release can fail at prediction time.
* The Node production image installs only production dependencies by design. Use the `node-tests` Compose profile for the complete Jest suite, including the real FastAPI integration tests.
* Unit and integration tests use fictional data. Live MongoDB save/retrieve and consent checks are separate from the Python/Node unit-test suites.
* The five red-flag questions are conservative screening prompts, not clinical criteria, and should be reviewed by a clinician before real-world use.

## Privacy
* **Nothing is stored without `"consentToStore": true`** in the request (and `ENABLE_HISTORY=true`, MongoDB up).
* What is stored: model scores, top condition, number of answers, safety level, consent flag, timestamp (auto-deleted after `HISTORY_TTL_DAYS`, default 30). Your answers, red flags and family history are stored only if `STORE_INPUTS=true` (default false).
* `GET /api/v1/history` requires `X-API-Key`. This is a single shared admin key, **not** user accounts - per-user login/roles are the next step. Keep the service behind HTTPS in production.

## Folder structure
```
skingen-backend/
├── README.md  DATA_SOURCES.md  docker-compose.yml  .env.example  .gitignore
├── docs/ API.md  examples/*.json (real captured responses)      postman/  scripts/
├── ml-service/   (Python / FastAPI)
│   ├── app/        main.py questionnaire.py schemas.py explain.py registry.py errors.py conditions.py safety.py family.py
│   ├── data/       download_data.py  raw/skin_disorder.csv (verified real data)
│   ├── training/   train_and_compare.py  metrics.py
│   ├── models/     model.joblib  metadata.json  comparison_report.json
│   └── tests/  Dockerfile  requirements*.txt
└── node-backend/ (Express) src/{app,server,config}.js middleware/auth.js services/ models/  tests/  Dockerfile
```

## What is needed to finish the blocked parts
Real data that I could not obtain: a family-history cohort (hereditary risk); a vitiligo dataset; subtype-labelled data for eczema/psoriasis/vitiligo; individual genotypes + verified GWAS statistics (genetic risk); and lay-reported answers with confirmed diagnoses to validate the questionnaire. Prefer data that is licensed for this use.
