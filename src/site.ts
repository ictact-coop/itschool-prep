// 사이트 공통 정보. 미확정 값은 null로 두고 화면에서 "확정 후 게시"로 표시한다.
export const site = {
  name: 'IT학교',
  org: 'IT학교 설립추진위원회(가칭)',
  orgStatus: '현재 설립 준비 중',
  partner: '공동체IT사회적협동조합',
  url: 'https://itschool.ictact.kr',
  description:
    '누구나 디지털 기술을 이해하고 자신의 삶과 공익활동에 활용할 수 있도록, 시민과 교육자, 기술자가 함께 배우고 실험하는 학교를 준비합니다.',
  contactEmail: null as string | null, // D3 확정 후 입력
  nav: [
    { href: '/#why', label: '소개' },
    { href: '/#progress', label: '진행상황' },
  ],
  joinHref: '/#join',
  // 개인정보 처리 기준(D3). 확정 전에는 null → "확정 후 게시"로 표시.
  privacy: {
    version: 'draft-2026-11-14', // 신청 시 함께 저장되는 처리방침 버전
    controller: null as string | null, // 처리 책임자
    retention: null as string | null, // 보유기간
  },
} as const;
