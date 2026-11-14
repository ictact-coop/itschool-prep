# itschool-prep

IT학교 설립추진위원회(가칭) 임시 웹사이트 — https://itschool.ictact.kr (공개 전)

- 개발계획: [docs/DEV_PLAN.md](docs/DEV_PLAN.md)
- 스택: Astro(정적) · Cloudflare Pages · Pages Functions + D1
- Cloudflare 설정: [docs/CLOUDFLARE_SETUP.md](docs/CLOUDFLARE_SETUP.md)

## 로컬 실행

Node 22 이상.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/ 생성
npm run check    # 타입 검사(Astro + Functions)
npm run test:api # 로컬 D1 + wrangler pages dev로 신청 API 통합 테스트
```

신청 API까지 로컬에서 띄우려면:

```bash
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run build && npm run pages:dev   # http://localhost:8788
```

## 구조

- `src/lib/apply.ts` 신청 데이터 계약·검증(브라우저와 서버 공용)
- `src/server/` Pages Functions 로직, `functions/api/apply.ts` 라우트
- `migrations/` D1 스키마
- `src/content/` 설립 단계·준비 소식

시범 공개 전까지 `public/robots.txt`로 검색 노출을 막는다(T9에서 해제).
