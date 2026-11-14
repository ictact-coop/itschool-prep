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

- 발신 주소 `MAIL_FROM`: `IT학교 설립준비위원회 <itschool@ictact.kr>` ✅ `wrangler.toml` 반영
- 신청자 메일의 회신 주소도 `itschool@ictact.kr`(담당자 개인 주소는 노출하지 않음)

1. resend.com 가입 → Domains → **Add domain**: **`ictact.kr`** (발신 주소가 `@ictact.kr`이므로)
2. 안내되는 DNS 레코드(SPF·DKIM, 필요 시 MX)를 ictact.kr DNS에 추가 → Verify
   - ictact.kr에 이미 SPF 레코드가 있으면 새로 만들지 말고 기존 레코드에 `include:`를 합친다(SPF는 하나만 허용).
3. 🔒 API Keys → Create(Sending access) → Worker에 Secret `RESEND_API_KEY`
4. 🔒 Worker에 Secret **`NOTIFY_TO`** 추가: 담당자 알림 수신 주소(쉼표 구분)
   - 개인 주소가 들어가므로 공개 저장소가 아닌 Secret으로 관리한다.

> 대시보드에서 **일반 변수(Text)**를 추가하면 다음 배포 때 `wrangler.toml`의 `[vars]`로 덮어쓰인다. 일반 값은 개발 담당에게 전달하고, 대시보드에는 **Secret만** 넣는다.

## 6. 확인

Secret을 넣은 뒤 Deployments에서 최신 배포를 다시 실행하거나 `main`에 새 커밋이 올라가면 반영된다.
workers.dev 주소에서 신청을 한 번 넣어 보고 D1 Console에서 확인한다.

```sql
SELECT created_at, name, email, types, status FROM applications ORDER BY created_at DESC LIMIT 5;
```

## 7. 관리 화면(/admin) — Cloudflare Access

관리 화면은 Access 로그인을 통과한 사람만 쓸 수 있다. Worker도 Access 토큰을 다시 검증하므로,
아래 두 값이 `wrangler.toml`에 들어가기 전까지 `/admin`은 503으로 잠겨 있다.

1. **D1에 컬럼 추가(한 번만)**: D1 → `itschool-prep` → Console에서 `migrations/0002_admin_audit.sql` 실행
   ```sql
   ALTER TABLE applications ADD COLUMN admin_updated_at TEXT;
   ALTER TABLE applications ADD COLUMN admin_updated_by TEXT;
   ```
2. Zero Trust(처음이면 팀 이름을 정하고 Free 플랜 선택) → Access → Applications → **Add an application → Self-hosted**
   - Application name: `IT학교 신청 관리`
   - Session duration: 24 hours
   - Public hostname: `itschool-prep.data-fc8.workers.dev`, Path: `admin`
   - Public hostname 추가: 같은 호스트, Path: `admin/*`
   - (도메인 연결 후 T8에서 `itschool.ictact.kr`의 같은 두 경로도 추가)
3. Policy: Action **Allow**, Include → **Emails** → 관리 담당자 이메일들 (예: `itschool@ictact.kr`와 담당자 개인 주소)
   - 로그인 방식은 기본 **One-time PIN**(이메일로 받은 코드 입력)이면 충분하다.
4. 📨 개발 담당에게 전달 → `wrangler.toml`에 반영
   - **Team domain**: Zero Trust → Settings → Custom Pages 등에 보이는 `https://<팀이름>.cloudflareaccess.com`
   - **Application Audience (AUD) Tag**: 만든 애플리케이션 → Overview(또는 Basic information)에 있는 64자 값
   - 두 값은 비밀이 아니다(토큰 검증용 공개 식별자).
5. 반영·배포 후 `https://itschool-prep.data-fc8.workers.dev/admin` 접속 → Access 로그인 → 신청 목록 확인

관리 화면 기능: 목록·검색·참여 방식/상태 필터, 상태(신규·담당 지정·연락 완료·종료)·담당자·메모 저장(변경자·시각 기록),
신청 삭제(철회 요청 처리), CSV 내보내기(엑셀에서 한글이 깨지지 않도록 BOM 포함).

## 이후 단계

- T8 도메인: Worker → Settings → Domains & Routes → Custom domain `itschool.ictact.kr`
  (ictact.kr가 Cloudflare DNS에 있어야 한다. 아니면 DNS 관리 방식을 먼저 정한다)
- T8 분석: Web Analytics 활성화

## 전달 체크리스트

| 구분 | 항목 | 상태 |
|---|---|---|
| 📨 | D1 Database ID | ✅ 반영 |
| 📨 | workers.dev 주소 | ✅ itschool-prep.data-fc8.workers.dev |
| 📨 | Turnstile Site key | ✅ `.env.production` |
| 📨 | MAIL_FROM | ✅ `wrangler.toml` |
| 🔒 | NOTIFY_TO | ✅ |
| 🔒 | D1 테이블 생성(마이그레이션) | ✅ |
| 🔒 | TURNSTILE_SECRET | ✅ |
| 🔒 | RATE_SALT | ✅ |
| 🔒 | RESEND_API_KEY | ✅ |
| 🔒 | D1 `0002_admin_audit.sql` 실행 | |
| 📨 | Access Team domain, AUD Tag | |
