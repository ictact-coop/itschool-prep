// 사이트 공통 정보. 미확정 값은 null로 두고 화면에서 "확정 후 게시"로 표시한다.
export const site = {
  name: 'IT학교',
  org: 'IT학교 설립준비위원회',
  orgStatus: '현재 설립 준비 중',
  partner: '공동체IT사회적협동조합',
  url: 'https://itschool.ictact.kr',
  description:
    '시민과 공익활동가를 위한 디지털 대학, IT학교. 대학처럼 교양필수로 기본기를 익히고 전공선택으로 내 활동에 맞게 배웁니다. 그 학교를 지금 함께 세우고 있습니다.',
  contactEmail: 'itschool@ictact.kr' as string | null, // 공개 연락처(2026-11-14 확정)
  nav: [
    { href: '/about', label: '소개', about: true },
    { href: '/#curriculum', label: '배우는 방법' },
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
