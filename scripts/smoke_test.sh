#!/usr/bin/env bash
# Quick check of a RUNNING stack. Usage: scripts/smoke_test.sh [BASE_URL]
BASE=${1:-http://localhost:5000}
A='{"answers":{"age":34,"redness":"moderate","scaling":"severe","clear_edges":"severe","itching":"mild","knees_elbows":"severe","scalp":"moderate","family_history":"yes"}}'
check() { printf '%-42s' "$1"; code=$(curl -s -o /tmp/smoke.out -w '%{http_code}' "${@:3}"); [ "$code" = "$2" ] && echo "OK ($code)" || { echo "FAIL (got $code, want $2)"; cat /tmp/smoke.out; FAILED=1; }; }
FAILED=0
check "GET  /api/v1/health"                 200 "$BASE/api/v1/health"
check "GET  /api/v1/questionnaire"          200 "$BASE/api/v1/questionnaire"
check "POST /api/v1/assess"                 200 -H 'Content-Type: application/json' -d "$A" "$BASE/api/v1/assess"
check "POST /api/v1/assess (bad answer)"    422 -H 'Content-Type: application/json' -d '{"answers":{"scaling":"huge"}}' "$BASE/api/v1/assess"
check "POST /api/v1/assess (too few)"       422 -H 'Content-Type: application/json' -d '{"answers":{"scaling":"mild"}}' "$BASE/api/v1/assess"
check "POST /api/v1/assess (red flag)"      200 -H 'Content-Type: application/json' -d '{"answers":{"age":34,"scaling":"severe","redness":"mild","itching":"mild"},"redFlags":{"blisters":true}}' "$BASE/api/v1/assess"
grep -q '"urgent_review"' /tmp/smoke.out && echo "  red flag -> urgent_review                OK" || { echo "  red flag NOT routed to urgent_review FAIL"; FAILED=1; }
check "GET  /api/v1/history (no key -> 401/503)" "${HISTORY_EXPECT:-401}" "$BASE/api/v1/history"
check "GET  /api/v1/model-info"             200 "$BASE/api/v1/model-info"
check "GET  /api/v1/model-comparison"       200 "$BASE/api/v1/model-comparison"
check "GET  /api/v1/capabilities"           200 "$BASE/api/v1/capabilities"
exit $FAILED
