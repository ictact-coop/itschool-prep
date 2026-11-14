# Cloudflare 설정 안내

사이트는 **Cloudflare Workers**(정적 자산 + Worker)로 배포한다. Pages가 아니다.
신청 접수를 실제로 동작시키려면 Cloudflare 계정 소유자가 아래를 진행한다.
비밀값(🔒)은 대시보드에 직접 넣고, 채팅·저장소에 붙여 넣지 않는다.
개발 담당에게 전달할 값(📨)은 공개돼도 되는 값이다.

## 1. Worker 프로젝트 연결 (Git)

1. Workers & Pages → Create → **Import a repository** → `ictact-coop/itschool-prep`
2. 설정
   - Project name: **`itschool-prep`** (`wrangler.toml`의 `name`과 같아야 한다)
   - Build command: 비워 두거나 `npm run build` (`wrangler.toml`의 `[build]`가 배포 전에 빌드를 실행한다)
   - Deploy command: `npx wrangler deploy` (기본값)
   - Production branch: `main`
3. 배포가 끝나면 `https://itschool-prep.<계정>.workers.dev` 주소가 생긴다. 📨 이 주소를 알려준다.

> 프리셋·출력 폴더 입력란이 없는 것이 정상이다. 출력 폴더(`dist`)와 진입점(`src/worker.ts`)은 `wrangler.toml`에 있다.
> 이미 다른 이름으로 만들었다면 Worker → Settings에서 이름을 확인해 알려준다(개발 담당이 `wrangler.toml`을 맞춘다).

## 2. D1 데이터베이스 ✅

- `itschool-prep` 생성, ID는 `wrangler.toml`에 반영됨(2026-11-14).
- 테이블 만들기 (한 번만, 둘 중 하나)
  - 대시보드: D1 → `itschool-prep` → Console → `migrations/0001_applications.sql` 내용을 붙여 넣고 실행
  - CLI: `npx wrangler login` 후 `npm run db:migrate:remote`
- 확인: `SELECT name FROM sqlite_master WHERE type='table';` → `applications`, `rate_hits`

## 3. Turnstile (스팸 방지) — Site key 반영 ✅, Secret 등록 필요

1. Turnstile → **Add widget**
   - Hostnames: `itschool.ictact.kr`, `itschool-prep.data-fc8.workers.dev`
   - Widget mode: **Managed**
2. 📨 **Site key** → 개발 담당이 `.env.production`에 반영한다.
3. 🔒 **Secret key** → Worker `itschool-prep` → Settings → Variables and Secrets → **Add** → Type: Secret
   - 이름 `TURNSTILE_SECRET`
   - Secret이 없으면 서버 검증을 건너뛴다(위젯만 표시). **반드시 등록**한다.
   - 위젯 action은 `apply`로 고정되어 있고, 서버는 action이 다른 토큰을 거부한다.

## 4. 횟수 제한용 salt

🔒 같은 위치에 Secret 추가
- 이름 `RATE_SALT`
- 값: 임의의 긴 문자열(비밀번호 생성기로 만든 32자 이상)

IP 원문은 저장하지 않고 이 값과 섞은 해시만 10분간 보관한다.

## 5. 메일 발송 (Resend)

담당자 알림과 신청자 접수 확인에 쓴다. 설정하지 않으면 메일만 빠지고 신청 저장은 정상 동작한다.

1. resend.com 가입 → Domains → **Add domain**: `itschool.ictact.kr` (또는 `ictact.kr`)
2. 안내되는 DNS 레코드(SPF·DKIM)를 ictact.kr DNS에 추가 → Verify
3. 🔒 API Keys → Create(Sending access) → Worker에 Secret `RESEND_API_KEY`로 추가
4. 📨 다음 두 값을 알려준다 → `wrangler.toml`에 반영
   - `MAIL_FROM`: 예) `IT학교 설립추진위원회 <noreply@itschool.ictact.kr>`
   - `NOTIFY_TO`: 신청 알림을 받을 담당자 주소(여러 개면 쉼표)

> 대시보드에서 **일반 변수(Text)**를 추가하면 다음 배포 때 `wrangler.toml`의 `[vars]`로 덮어쓰인다. 일반 값은 개발 담당에게 전달하고, 대시보드에는 **Secret만** 넣는다.

## 6. 확인

Secret을 넣은 뒤 Deployments에서 최신 배포를 다시 실행하거나 `main`에 새 커밋이 올라가면 반영된다.
workers.dev 주소에서 신청을 한 번 넣어 보고 D1 Console에서 확인한다.

```sql
SELECT created_at, name, email, types, status FROM applications ORDER BY created_at DESC LIMIT 5;
```

## 이후 단계

- T6 관리 화면: Zero Trust → Access로 `/admin` 보호(허용 이메일 목록)
- T8 도메인: Worker → Settings → Domains & Routes → Custom domain `itschool.ictact.kr`
  (ictact.kr가 Cloudflare DNS에 있어야 한다. 아니면 DNS 관리 방식을 먼저 정한다)
- T8 분석: Web Analytics 활성화

## 전달 체크리스트

| 구분 | 항목 | 상태 |
|---|---|---|
| 📨 | D1 Database ID | ✅ 반영 |
| 📨 | workers.dev 주소 | ✅ itschool-prep.data-fc8.workers.dev |
| 📨 | Turnstile Site key | ✅ `.env.production` |
| 📨 | MAIL_FROM, NOTIFY_TO | |
| 🔒 | D1 테이블 생성(마이그레이션) | |
| 🔒 | TURNSTILE_SECRET | |
| 🔒 | RATE_SALT | |
| 🔒 | RESEND_API_KEY | |
