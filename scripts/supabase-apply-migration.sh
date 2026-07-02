#!/usr/bin/env bash
# Apply events migration when DATABASE_URL or Supabase linked project is ready.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL="$ROOT/supabase/migrations/001_events.sql"

if command -v supabase >/dev/null 2>&1 || [[ -f "$ROOT/node_modules/.bin/supabase" ]]; then
  SB="npx supabase"
else
  echo "Run: npm install"
  exit 1
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  psql "$DATABASE_URL" -f "$SQL"
  echo "✓ Migration applied via DATABASE_URL"
  exit 0
fi

echo "Option A: Supabase Dashboard → SQL Editor → paste $SQL"
echo "Option B: npx supabase login && npx supabase link && npx supabase db push"
