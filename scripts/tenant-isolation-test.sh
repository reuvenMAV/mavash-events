#!/usr/bin/env bash
# Tenant isolation proof: two users, two events, cross-access must fail (403).
# Usage: BASE_URL=http://localhost:3000 ./scripts/tenant-isolation-test.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
TS="$(date +%s)"
EMAIL_A="tenant-a-${TS}@test.mavash.local"
EMAIL_B="tenant-b-${TS}@test.mavash.local"
PASS="TestPass123!"

COOKIE_A="$(mktemp)"
COOKIE_B="$(mktemp)"
trap 'rm -f "$COOKIE_A" "$COOKIE_B"' EXIT

fail() {
  echo "❌ FAIL: $*"
  exit 1
}

pass() {
  echo "✅ PASS: $*"
}

json_field() {
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d$1)" 2>/dev/null
}

register_user() {
  local email="$1" cookie="$2"
  local code
  code="$(curl -sS -o /tmp/reg.json -w "%{http_code}" -c "$cookie" -b "$cookie" \
    -X POST "${BASE_URL}/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${PASS}\"}")"
  if [[ "$code" != "200" ]]; then
    echo "Register ${email} response:"
    cat /tmp/reg.json
    fail "register ${email} returned HTTP ${code}"
  fi
  pass "registered ${email}"
}

create_event() {
  local name="$1" cookie="$2"
  local body code
  body="$(curl -sS -c "$cookie" -b "$cookie" \
    -X POST "${BASE_URL}/api/events" \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"ownerCreateEvent\",\"name\":\"${name}\",\"type\":\"bar_mitzvah\"}")"
  echo "$body" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('slug',''))" || true
}

owner_action_status() {
  local cookie="$1" slug="$2" action="$3"
  curl -sS -o /tmp/owner.json -w "%{http_code}" -b "$cookie" \
    -X POST "${BASE_URL}/api/events" \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"${action}\",\"slug\":\"${slug}\"}"
}

echo "=== MAVASH tenant isolation test ==="
echo "BASE_URL=${BASE_URL}"
echo ""

register_user "$EMAIL_A" "$COOKIE_A"
register_user "$EMAIL_B" "$COOKIE_B"

SLUG_A="$(create_event "Event A ${TS}" "$COOKIE_A")"
SLUG_B="$(create_event "Event B ${TS}" "$COOKIE_B")"

[[ -n "$SLUG_A" && -n "$SLUG_B" ]] || fail "could not create events (slug empty)"
pass "user A event slug=${SLUG_A}"
pass "user B event slug=${SLUG_B}"

CODE_AB="$(owner_action_status "$COOKIE_A" "$SLUG_B" "ownerGetStats")"
[[ "$CODE_AB" == "403" ]] || {
  cat /tmp/owner.json
  fail "user A read B stats — expected 403, got ${CODE_AB}"
}
pass "user A blocked from B stats (403)"

CODE_BA="$(owner_action_status "$COOKIE_B" "$SLUG_A" "ownerListGuests")"
[[ "$CODE_BA" == "403" ]] || {
  cat /tmp/owner.json
  fail "user B read A guests — expected 403, got ${CODE_BA}"
}
pass "user B blocked from A guests (403)"

CODE_AA="$(owner_action_status "$COOKIE_A" "$SLUG_A" "ownerGetStats")"
[[ "$CODE_AA" == "200" ]] || {
  cat /tmp/owner.json
  fail "user A own stats — expected 200, got ${CODE_AA}"
}
pass "user A can read own stats (200)"

CODE_BB="$(owner_action_status "$COOKIE_B" "$SLUG_B" "ownerListEvents")"
[[ "$CODE_BB" == "200" ]] || {
  cat /tmp/owner.json
  fail "user B list events — expected 200, got ${CODE_BB}"
}
pass "user B can list own events (200)"

CODE_BB="$(owner_action_status "$COOKIE_B" "$SLUG_A" "ownerListActivity")"
[[ "$CODE_BB" == "403" ]] || {
  cat /tmp/owner.json
  fail "user B read A activity — expected 403, got ${CODE_BB}"
}
pass "user B blocked from A activity (403)"

echo ""
echo "=== All tenant isolation checks passed ==="
