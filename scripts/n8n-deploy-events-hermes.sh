#!/usr/bin/env bash
# Deploy MAVASH Events HERMES webhook workflow to n8n.
# Requires: N8N_BASE_URL, N8N_API_KEY (e.g. from portfolio-dashboard or proposal-site .env.local)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WF_JSON="$ROOT/docs/n8n-workflow-events-hermes.json"

if [[ -f "$ROOT/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env.local"
  set +a
fi
if [[ -z "${N8N_BASE_URL:-}" && -f "$ROOT/../portfolio-dashboard/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/../portfolio-dashboard/.env.local"
  set +a
fi

: "${N8N_BASE_URL:?Set N8N_BASE_URL}"
: "${N8N_API_KEY:?Set N8N_API_KEY}"

BASE="${N8N_BASE_URL%/}"
API="$BASE/api/v1"
NAME="MAVASH Events — HERMES webhook"

EXISTING=$(curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" "$API/workflows?limit=250")
WF_ID=$(python3 -c "
import json,sys
name=sys.argv[1]
data=json.load(sys.stdin)
for w in data.get('data', data if isinstance(data,list) else []):
    if w.get('name')==name:
        print(w['id']); break
" "$NAME" <<< "$EXISTING")

PAYLOAD=$(python3 -c "
import json
with open('$WF_JSON') as f:
    wf=json.load(f)
wf.pop('id', None)
wf.pop('active', None)
print(json.dumps(wf))
")

if [[ -n "$WF_ID" ]]; then
  echo "Updating workflow $WF_ID"
  curl -s -X PUT -H "X-N8N-API-KEY: $N8N_API_KEY" -H "Content-Type: application/json" \
    -d "$PAYLOAD" "$API/workflows/$WF_ID" > /dev/null
else
  echo "Creating workflow"
  RESP=$(curl -s -X POST -H "X-N8N-API-KEY: $N8N_API_KEY" -H "Content-Type: application/json" \
    -d "$PAYLOAD" "$API/workflows")
  WF_ID=$(python3 -c "import json,sys; print(json.load(sys.stdin)['id'])" <<< "$RESP")
fi

curl -s -X POST -H "X-N8N-API-KEY: $N8N_API_KEY" "$API/workflows/$WF_ID/activate" > /dev/null
echo "Activated: $WF_ID"
echo "Set N8N_EVENTS_WEBHOOK_URL to the production webhook URL shown in n8n UI for path mavash-events-hermes"
