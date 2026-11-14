# Cloudflare 설정 안내

신청 접수(T5)를 실제로 동작시키려면 Cloudflare 계정 소유자가 아래를 순서대로 진행한다.
비밀값(🔒)은 대시보드에 직접 넣고, 채팅·저장소에 붙여 넣지 않는다.
개발 담당에게 전달할 값(📨)은 공개돼도 되는 값이다.

## 1. Pages 프로젝트 연결

1. Workers & Pages → Create → Pages → **Connect to Git** → `ictact-coop/itschool-prep`
2. Production branch: `main`
3. Build settings
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. 첫 배포가 끝나면 `https://<프로젝트>.pages.dev` 미리보기 주소가 생긴다. 📨 이 주소를 알려준다.

> D1 Database ID는 `wrangler.toml`에 반영됨(2026-11-14).
>
> 저장소의 `wrangler.toml`이 바인딩·환경변수의 기준이 된다. 대시보드에서 바인딩이 읽기 전용으로 보이는 것은 정상이다.

## 2. D1 데이터베이스

1. Storage & Databases → D1 → **Create database**
   - 이름: `itschool-prep`
   - Location: **Asia-Pacific (APAC)** 권장
2. 📨 생성된 **Database ID**를 알려준다 → 개발 담당이 `wrangler.toml`에 반영한다.
3. 테이블 만들기 (둘 중 하나)
   - 대시보드: 해당 DB → Console → `migrations/0001_applications.sql` 내용을 붙여 넣고 실행
   - CLI: `npx wrangler login` 후 `npm run db:migrate:remote`

## 3. Turnstile (스팸 방지)

1. Turnstile → **Add widget**
   - Hostnames: `itschool.ictact.kr`, 1단계의 `<프로젝트>.pages.dev`
   - Widget mode: **Managed**
2. 📨 **Site key** → 개발 담당이 `.env.production`에 반영한다.
3. 🔒 **Secret key** → Pages 프로젝트 → Settings → Variables and Secrets → **Add secret**
   - 이름 `TURNSTILE_SECRET`, Production에 추가

## 4. 횟수 제한용 salt

🔒 Pages → Settings → Variables and Secrets → Add secret
- 이름 `RATE_SALT`
- 값: 임의의 긴 문자열 (예: 비밀번호 생성기로 만든 32자 이상)

IP 원문은 저장하지 않고 이 값과 섞은 해시만 10분간 보관한다.

## 5. 메일 발송 (Resend)

담당자 알림 메일과 신청자 접수 확인 메일에 사용한다. 설정하지 않으면 메일만 빠지고 신청 저장은 정상 동작한다.

1. resend.com 가입 → Domains → **Add domain**: `itschool.ictact.kr` (또는 `ictact.kr`)
2. 안내되는 DNS 레코드(SPF·DKIM)를 ictact.kr DNS에 추가 → Verify
3. 🔒 API Keys → Create (권한: Sending access) → Pages에 secret `RESEND_API_KEY`로 추가
4. 📨 다음 두 값을 알려준다 → `wrangler.toml`에 반영
   - `MAIL_FROM`: 발신 주소 예) `IT학교 설립추진위원회 <noreply@itschool.ictact.kr>`
   - `NOTIFY_TO`: 신청 알림을 받을 담당자 주소(여러 개면 쉼표)

## 6. 재배포와 확인

비밀값을 추가한 뒤에는 Deployments → 최신 배포 → **Retry deployment**로 다시 배포한다.
미리보기 주소에서 신청을 한 번 넣어 보고 D1 Console에서 확인한다.

```sql
SELECT created_at, name, email, types, status FROM applications ORDER BY created_at DESC LIMIT 5;
```

## 이후 단계에서 할 일

- T6 관리 화면: Zero Trust → Access로 `/admin` 보호(허용 이메일 목록)
- T8 도메인: Pages → Custom domains → `itschool.ictact.kr` 추가, ictact.kr DNS에 CNAME
- T8 분석: Web Analytics 활성화

## 전달 체크리스트

| 구분 | 항목 | 누가 어디에 |
|---|---|---|
| 📨 | pages.dev 미리보기 주소 | 개발 담당에게 |
| 📨 | D1 Database ID | 개발 담당 → `wrangler.toml` |
| 📨 | Turnstile Site key | 개발 담당 → `.env.production` |
| 📨 | MAIL_FROM, NOTIFY_TO | 개발 담당 → `wrangler.toml` |
| 🔒 | TURNSTILE_SECRET | 계정 소유자 → Pages secret |
| 🔒 | RATE_SALT | 계정 소유자 → Pages secret |
| 🔒 | RESEND_API_KEY | 계정 소유자 → Pages secret |
