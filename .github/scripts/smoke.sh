#!/usr/bin/env bash
# Smoke test for the running Docker stack: goes through nginx the way a browser
# does, so it covers the proxy routes, both services and the database.
set -euo pipefail

BASE="${BASE_URL:-http://localhost}"
EMAIL="smoke-$(date +%s)@example.com"
PASSWORD="Smoke-$(date +%s)-pass"

fail() { echo "FAIL: $*" >&2; exit 1; }

echo "Waiting for $BASE/health ..."
for i in $(seq 1 40); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/health" || true)" = "200" ] && break
  [ "$i" = "40" ] && fail "backend did not become healthy within 2 minutes"
  sleep 3
done
echo "ok  backend health"

# The ML service starts after the backend and may still be loading.
for i in $(seq 1 40); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/meta" || true)" = "200" ] && break
  [ "$i" = "40" ] && fail "ML service /meta did not answer within 2 minutes"
  sleep 3
done
echo "ok  ML /meta"

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"full_name\":\"Smoke Test\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
[ "$code" = "201" ] || fail "register returned $code"
echo "ok  register"

token=$(curl -s -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | sed -nE 's/.*"access_token":"([^"]+)".*/\1/p')
[ -n "$token" ] || fail "login returned no access token"
echo "ok  login"

code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/auth/me" -H "Authorization: Bearer $token")
[ "$code" = "200" ] || fail "/auth/me returned $code"
echo "ok  /auth/me"

code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/")
[ "$code" = "200" ] || fail "frontend returned $code"
echo "ok  frontend"

echo "Smoke test passed."
