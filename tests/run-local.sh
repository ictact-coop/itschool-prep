#!/usr/bin/env bash
# 로컬 D1 마이그레이션 → wrangler dev(빌드 포함) → API 테스트 → 종료
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf .wrangler/state
npx wrangler d1 migrations apply itschool-prep --local >/dev/null
[ -f .dev.vars ] || cp .dev.vars.example .dev.vars
if curl -s -o /dev/null http://127.0.0.1:8788/; then echo "포트 8788이 이미 사용 중입니다." >&2; exit 1; fi
# Turnstile·Resend는 가짜 서비스(8799)로 대체한다
node tests/mock-services.mjs 8799 &
MOCK=$!
setsid npx wrangler dev --port 8788 \
  --var TURNSTILE_SECRET:test-secret --var TURNSTILE_VERIFY_URL:http://127.0.0.1:8799/siteverify \
  --var RESEND_API_KEY:test-key --var RESEND_API_URL:http://127.0.0.1:8799/emails \
  --var 'NOTIFY_TO:staff1@example.org, staff2@example.org' \
  >/tmp/itschool-worker-dev.log 2>&1 &
PID=$!
trap 'kill -- -$PID 2>/dev/null || true; kill $MOCK 2>/dev/null || true' EXIT
for i in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:8788/ && break; sleep 1; done
node --test --test-concurrency=1 tests/*.test.mjs
