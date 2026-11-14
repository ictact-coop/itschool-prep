# itschool-prep

IT학교 설립추진위원회(가칭) 임시 웹사이트 — https://itschool.ictact.kr (공개 전)

- 개발계획: [docs/DEV_PLAN.md](docs/DEV_PLAN.md)
- 스택: Astro(정적) · Cloudflare Pages · (예정) Pages Functions + D1

## 로컬 실행

Node 22 이상.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/ 생성
npm run check    # 타입 검사
```

## Cloudflare Pages 연결 (계정 소유자)

1. Workers & Pages → Create → Pages → Git 연결 → `ictact-coop/itschool-prep`
2. Framework preset: Astro / Build command: `npm run build` / Output: `dist`
3. 환경변수 `NODE_VERSION=22`

시범 공개 전까지 `public/robots.txt`로 검색 노출을 막는다(T9에서 해제).
