"""Calls the RUNNING Node API, saves real request/response pairs to docs/examples/ and rebuilds the Postman collection.
Usage: python scripts/generate_examples.py [BASE_URL]   (default http://localhost:5000). Standard library only."""
import json, sys, urllib.request, urllib.error
from pathlib import Path

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000").rstrip("/")
ROOT = Path(__file__).resolve().parents[1]
PSORIASIS = {"age": 34, "redness": "moderate", "scaling": "severe", "clear_edges": "severe", "itching": "mild",
             "new_patches_after_injury": "mild", "knees_elbows": "severe", "scalp": "moderate", "family_history": "yes"}
LICHEN = {"age": 45, "redness": "moderate", "scaling": "none", "clear_edges": "moderate", "itching": "severe",
          "flat_purple_bumps": "severe", "mouth_lesions": "severe", "knees_elbows": "none", "scalp": "none", "family_history": "no"}
SEBORRHEIC = {"age": 52, "redness": "mild", "scaling": "moderate", "itching": "moderate", "scalp": "severe",
              "clear_edges": "none", "knees_elbows": "none", "family_history": "not sure"}
EXAMPLES = [
    ("health", "GET", "/api/v1/health", None),
    ("questionnaire", "GET", "/api/v1/questionnaire", None),
    ("assess_psoriasis-like-answers", "POST", "/api/v1/assess", {"answers": PSORIASIS}),
    ("assess_mouth-and-purple-bumps", "POST", "/api/v1/assess", {"answers": LICHEN}),
    ("assess_scalp-and-flaking-some-not-sure", "POST", "/api/v1/assess", {"answers": SEBORRHEIC}),
    ("assess_casual-typing-is-ok", "POST", "/api/v1/assess", {"answers": {"Scaling": "SEVERE ", "redness": "Mild", "itching": "not sure", "age": "40", "scalp": "No", "family_history": "Yes"}}),
    ("assess_error_bad-choice", "POST", "/api/v1/assess", {"answers": {**PSORIASIS, "scaling": "huge"}}),
    ("assess_error_unknown-question", "POST", "/api/v1/assess", {"answers": {"colour": "red"}}),
    ("assess_error_too-few-answers", "POST", "/api/v1/assess", {"answers": {"scaling": "mild"}}),
    ("assess_red-flag-urgent", "POST", "/api/v1/assess", {"answers": PSORIASIS, "redFlags": {"fever_or_very_unwell": True, "blisters": False}}),
    ("assess_family-history-relatives", "POST", "/api/v1/assess", {"answers": PSORIASIS, "consentToStore": False, "familyHistory": {
        "psoriasis": "not sure", "eczema": False, "asthma_or_hay_fever": "yes",
        "relatives": [{"relation": "mother", "condition": "eczema", "answer": "yes"}, {"relation": "sibling", "condition": "psoriasis", "answer": "not sure"}]}}),
    ("capabilities", "GET", "/api/v1/capabilities", None),
    ("model-info", "GET", "/api/v1/model-info", None),
    ("model-comparison", "GET", "/api/v1/model-comparison", None),
]


def call(method, path, body):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


out = ROOT / "docs" / "examples"
out.mkdir(parents=True, exist_ok=True)
for name, method, path, body in EXAMPLES:
    status, resp = call(method, path, body)
    (out / f"{name}.json").write_text(json.dumps({"request": {"method": method, "path": path, "body": body},
                                                   "response": {"status": status, "body": resp}}, indent=2))
    print(status, method, path, "->", name)
items = []
for name, method, path, body in EXAMPLES:
    req = {"method": method, "header": [{"key": "Content-Type", "value": "application/json"}],
           "url": {"raw": "{{baseUrl}}" + path, "host": ["{{baseUrl}}"], "path": path.strip("/").split("/")}}
    if body is not None:
        req["body"] = {"mode": "raw", "raw": json.dumps(body, indent=2), "options": {"raw": {"language": "json"}}}
    items.append({"name": name, "request": req})
(ROOT / "postman" / "skingen.postman_collection.json").write_text(json.dumps(
    {"info": {"name": "SkinGen backend v3.1", "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"},
     "variable": [{"key": "baseUrl", "value": "http://localhost:5000"}], "item": items}, indent=2))
