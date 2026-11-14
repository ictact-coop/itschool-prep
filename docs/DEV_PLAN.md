# IT학교 설립추진위원회 임시 사이트 — 개발계획 v0.2

- 기준 문서: 임시 웹사이트 구축 기획서 v1.1 (2026-11-14), 데스크톱·모바일 와이어프레임
- 주소: https://itschool.ictact.kr
- 작업 분류: 다단계 (정적 페이지 + 폼 백엔드 + 관리 기능 + 배포)

## 1. 확정된 범위

| 구분 | 포함 (P0/P1) | 제외 (P2) |
|---|---|---|
| 화면 | 반응형 단일 랜딩 9개 섹션, 개인정보 처리방침 페이지 | 회원가입, 커뮤니티 |
| 신청 | 단일 폼, 참여유형 복수선택, 최소 수집, 별도 소식수신 동의 | 결제 |
| 콘텐츠 | 설립 단계·준비 소식을 비개발자가 수정 | 학습관리, 진단 도구 통합 |
| 운영 | 신청 확인·담당 지정·내보내기·삭제, 기본 로그·백업 | 복잡한 운영자 시스템 |
| 분석 | 방문 수와 신청 전환만 측정 (쿠키 없음) | 개인 추적 |

완료 기준: P0 = 모바일(360px)·데스크톱에서 읽기·제출·확인 가능 / P1 = 비개발자 1명이 소식 갱신 가능.

## 2. 와이어프레임 분석

### 섹션 대응 (기획서 4장 ↔ 와이어프레임)

| # | 섹션 | 와이어프레임 요소 | 구현 메모 |
|---|---|---|---|
| 01 | 헤더 | 텍스트 로고 "IT학교 / 설립추진위원회(가칭)", 메뉴 3개, `함께하기` 버튼 | 메뉴명 불일치: 와이어 "소개·준비 과정" vs 기획서 "소개·진행상황" → 하나로 통일 |
| 02 | 히어로 | 상태 배지, H1 2줄, 설명, CTA 2개 | `학교 설립에 함께하기`→#join, `IT학교 알아보기`→#why |
| 03 | 왜 필요한가 | 번호 카드 3개 | 데스크톱 3열, 모바일 2+1 → 1열 권장 (360px 가독성) |
| 04 | 만들고 싶은 학교 | 아이콘 카드 4개 | 아이콘은 장식용 `aria-hidden` |
| 05 | 진행상황 | 4단계 타임라인, 상태 라벨(완료/완료/준비 중/예정) | 데이터 파일로 분리. 상태 텍스트 필수(색만으로 구분 금지) |
| 06 | 함께하기 | 참여 카드 4개 + 폼 | 카드 클릭 시 폼의 해당 유형 미리 체크 |
| 07 | 기존 실험 | 카드 3개(역량진단, 16유형, 현장 교육·행사) | 외부 링크 여부 미정 |
| 08 | 준비 소식 | 목록 3건 + 상태 라벨 | 최신 3건 자동, Markdown 원천 |
| 09 | 푸터 | 운영주체(가칭), 창립 협력기관, 예정 주소, 개인정보 안내 | 공식 연락처 미정 |

### 기획서와 와이어프레임 차이 (구현 전 정리 필요)

1. **소속·활동분야 필드 누락** — 기획서엔 선택 필드로 있음. → 폼에 추가.
2. **참여유형 분류 불일치** — 기획서 6종(추진위원/교육/기술/기관/후원/관심), 와이어 체크박스 5종(기관·후원 합침), 카드 4종(교육·기술 합침). → 저장은 6종 enum, 화면 카드는 4개 유지 권장.
3. **동의 문구 부족** — 와이어는 한 줄 체크박스. 기획서는 목적·보유기간·담당자·철회방법 표시 요구. → 체크박스 위에 펼침 요약 + 처방방침 링크.
4. **상단 시연 배너** — "설계 검토용…신청 정보는 전송되지 않습니다"는 배포 시 제거, 필요하면 "임시 사이트" 안내로 교체.
5. **설립 상태 사실 확인** — "이사회 승인: 완료"는 의결문 원문 확인 후 공개(체크리스트).

## 3. 기술 구성 (권장)

| 영역 | 선택 | 이유 |
|---|---|---|
| 프런트 | Astro (정적 출력) + 순수 CSS, JS 최소 | 기획서 권장, Markdown 콘텐츠 컬렉션으로 소식·상태 관리 |
| 호스팅 | Cloudflare Pages | 강사 진단 프로토타입과 같은 플랫폼, 무료 HTTPS, 커스텀 도메인 |
| 폼 API | Pages Functions `POST /api/apply` | 별도 서버 없음 |
| 저장소 | Cloudflare D1 (SQLite) | 내보내기·삭제를 직접 통제, 외부 폼 서비스 위탁 문제 회피 |
| 스팸 방지 | Turnstile + honeypot + IP 해시 기반 횟수 제한(KV, TTL) | IP 원문 저장 안 함 |
| 알림 | 신청 시 담당자 메일 (Email Routing 송신 또는 Resend) | 신청자 자동 안내문 포함 |
| 관리 | `/admin` + Cloudflare Access(허용 이메일만) | 계정 시스템 없이 접근 최소화 |
| 소식 편집 | Markdown 파일 + GitHub 웹 편집 (필요 시 Decap CMS) | 비개발자 갱신, push 시 자동 배포 |
| 분석 | Cloudflare Web Analytics | 쿠키 없음. 전환 = D1 신청 수 ÷ 방문 수 |

저장 방식은 D1 직접 저장으로 확정됨(외부 폼 서비스 사용 안 함).

### 데이터 계약 (후속 작업이 의존)

```sql
CREATE TABLE applications (
  id            TEXT PRIMARY KEY,          -- uuid
  created_at    TEXT NOT NULL,             -- ISO8601
  name          TEXT NOT NULL,             -- 이름 또는 활동명, ≤50
  email         TEXT NOT NULL,             -- ≤254
  affiliation   TEXT,                      -- 소속·활동분야, ≤100
  types         TEXT NOT NULL,             -- JSON 배열, ≥1
  message       TEXT,                      -- ≤2000
  privacy_consent_at TEXT NOT NULL,
  privacy_version    TEXT NOT NULL,        -- 동의 당시 처리방침 버전
  news_opt_in   INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'new',  -- new|assigned|contacted|closed
  assignee      TEXT,
  admin_note    TEXT
);
```

- `types` enum: `committee | education | tech | partner | sponsor | interest`
- API 응답: `201 {ok:true}` / `400 {ok:false, errors:{field:msg}}` / `429` / `403`(Turnstile 실패)
- 중복: 같은 이메일 24시간 내 재제출 → 새 행 대신 기존 행 갱신

## 4. 작업 목록 (각 작업 종료 시 동작 가능한 상태)

### T1. 프로젝트 기반과 미리보기 배포 — P0
- 파일: `package.json`, `astro.config.mjs`, `src/styles/tokens.css`, `src/layouts/Base.astro`
- 산출: 디자인 토큰(녹색 계열 주색, 회녹 배경, 카드 반경), 기본 레이아웃, Pages 미리보기 URL
- 검증: `npm run build` 성공, 미리보기 URL 200

### T2. 랜딩 9개 섹션(정적) — P0, T1 의존
- 파일: `src/pages/index.astro`, `src/components/*.astro`, `src/content/steps.json`, `src/content/news/*.md`, `src/content/experiments.json`
- 산출: 와이어프레임 기준 전체 섹션, 앵커 메뉴, 모바일 메뉴
- 검증: Playwright 360/768/1280 스크린샷 비교, axe 위반 0건(serious 이상), 가로 스크롤 없음

### T3. 개인정보 처리방침 페이지와 동의 요약 — P0, T1 의존
- 파일: `src/pages/privacy.astro`, `src/components/ConsentSummary.astro`
- 산출: 목적·항목·보유기간·처리자·철회방법, 버전 표기(`privacy_version`)
- 검증: 동의 요약과 처리방침 문구 일치 검토 (담당자 확정 문구 필요)

### T4. 신청 폼 화면 — P0, T2·T3 의존
- 파일: `src/components/ApplyForm.astro`, `src/scripts/apply.ts`
- 산출: 필드 7종, 클라이언트 검증, 필드별 오류(`aria-describedby`, 첫 오류로 포커스), 제출 중/완료/실패 상태, "추진위원 신청은 선임 확정이 아님" 안내, 참여 카드 → 유형 체크 연동
- 검증: 키보드만으로 제출 가능, 필수 누락 시 오류 낭독 확인, mock API로 3가지 상태 표시

### T5. 신청 API와 저장 — P0, T4 의존
- 파일: `functions/api/apply.ts`, `migrations/0001_applications.sql`, `wrangler.toml`
- 산출: 서버 검증(위 계약), Turnstile 검증, honeypot, 횟수 제한, D1 저장, 담당자 알림 메일, 신청자 접수 확인 메일
- 검증: `wrangler pages dev` + 테스트 스크립트(정상/필수 누락/유형 0개/잘못된 이메일/honeypot/연속 제출) 기대 코드 일치, D1 행 확인

### T6. 관리 화면 — P0, T5 의존
- 파일: `functions/admin/*`, `src/pages/admin/index.astro`
- 산출: Cloudflare Access 보호, 목록·유형 필터, 상태·담당자 변경, CSV 내보내기, 개별 삭제, 보유기간 경과 표시
- 검증: Access 미인증 요청 차단, CSV 열 구성 확인, 삭제 후 행 없음

### T7. 소식·설립 상태 편집 흐름 — P1, T2 의존
- 파일: `src/content/news/`, `src/content/steps.json`, `docs/EDITING.md` (필요 시 `public/admin-cms/` Decap)
- 산출: 비개발자용 편집 안내(GitHub 웹에서 파일 추가 → 자동 배포)
- 검증: 비개발자 1명이 안내서만 보고 소식 1건 게시 성공

### T8. 도메인·분석·운영 — P0, T1 이후 언제든
- 산출: `itschool` CNAME → Pages, HTTPS 확인, Web Analytics, D1 정기 백업(내보내기) 절차
- 검증: `curl -I https://itschool.ictact.kr` 200 + 유효 인증서

### T9. 출시 점검 — T2~T8 완료 후
기획서 9장 체크리스트 수행: DNS/TLS, 명칭·연락처·처리자 확정, 설립 사실 확인, 폼 동작·스팸·자동 안내문, 키보드·360px·대비·대체텍스트·오류 안내, 응답 담당자·보유/삭제 절차. 시연 배너 제거 확인.

## 5. 일정 (기획서 예상 흐름 대응, 담당 확정 후 재산정)

| 단계 | 작업 | 기간 |
|---|---|---|
| 콘텐츠 확정 | 아래 결정사항, 문구 | 2~3일 |
| 디자인·개발 | T1~T4 | 3~5일 |
| 폼·관리 연결 | T5, T6, T8 | 2~3일 |
| 점검 | 접근성·모바일·개인정보 | 2일 |
| 시범 공개·수정 | T7, T9 | 2일 |

## 6. 착수 전 결정 필요

| # | 항목 | 권장안 | 막히는 작업 |
|---|---|---|---|
| D1 | 폼 저장 방식 | **확정: Cloudflare D1 직접 저장** (2026-11-14) | T5, T6 |
| D2 | ictact.kr DNS 관리 주체·접근 권한 | Cloudflare로 CNAME 추가 | T8 |
| D3 | 공식 연락 이메일, 개인정보 처리 책임자, 보유기간 | 처리 완료 후 1년 또는 철회 시 즉시 삭제 | T3, T5 |
| D4 | 참여유형 분류 | 저장 6종 / 화면 카드 4종 | T4, T5 |
| D5 | 헤더 메뉴 명칭 | "소개 · 진행상황 · 함께하기" | T2 |
| D6 | 기존 실험 카드 외부 링크 | 공개 가능한 것만 링크 | T2 |
| D7 | 코드 저장소 | **확정: `ictact-coop/itschool-prep`** | T1, T7 |

## 7. 공개 콘텐츠 원칙 (구현 중 지킬 것)
- 개인정보·비공개 회의내용·미검증 지원 사실 게시 금지
- 빈고 재정 협력은 "협의 전/논의 중"으로만 표기
- 창립 전 운영주체는 "설립추진위원회(가칭)·설립 준비 중"으로 표기
