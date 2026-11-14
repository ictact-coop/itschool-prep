import type { ParticipationType } from '../lib/apply';

// 첫 화면 문구. 와이어프레임(2026-11-14) 기준.
// 설립 단계는 src/content/steps.json, 준비 소식은 src/content/news/ 에서 관리한다.

export const hero = {
  badge: '설립 준비 중 · 시민과 함께 만드는 새로운 배움',
  titleLines: ['기술을 배우는 것을 넘어,', '함께 만들어가는 IT학교'],
  lead: '누구나 디지털 기술을 이해하고 자신의 삶과 공익활동에 활용할 수 있도록, 시민과 교육자, 기술자가 함께 배우고 실험하는 학교를 준비합니다.',
  primary: { href: '#join', label: '학교 설립에 함께하기' },
  secondary: { href: '#why', label: 'IT학교 알아보기' },
};

export const why = {
  title: '왜 IT학교가 필요할까요?',
  lead: '기술의 변화가 새로운 격차가 아닌, 함께 배우는 기회가 되도록',
  items: [
    { title: '배움의 격차', body: '기술을 익힐 시간과 지원이 모두에게 똑같이 주어지지는 않습니다.' },
    { title: '스스로 판단하는 힘', body: '도구의 사용법과 함께 기술의 영향과 한계를 이해해야 합니다.' },
    { title: '함께하는 학습', body: '서로의 경험과 지식을 나누며 공동체의 문제를 풀어갑니다.' },
  ],
};

export const school = {
  title: '우리가 만들고 싶은 학교',
  lead: '실용적인 배움에서 시작해, 공동의 지식과 기술을 만드는 곳으로',
  items: [
    { icon: 'path', title: '나에게 맞는 배움', body: '역량진단과 성장 경로' },
    { icon: 'tool', title: '삶에 쓰이는 기술', body: '일상과 공익활동의 문제 해결' },
    { icon: 'compass', title: '주체적인 선택', body: '비판적 이해와 책임 있는 활용' },
    { icon: 'share', title: '함께 만드는 지식', body: '교육자료와 기술의 공유' },
  ],
};

export const progress = {
  title: 'IT학교 설립, 어디까지 왔을까요?',
  lead: '확인된 사실만 표시하고, 바뀔 때마다 갱신합니다.',
  statusLabel: { done: '완료', doing: '준비 중', planned: '예정' },
} as const;

// 참여유형 저장값(D4 A안: 6종)은 src/lib/apply.ts. 화면 카드 4개는 이 값들의 묶음이다.
export const participationTypes: { value: ParticipationType; label: string }[] = [
  { value: 'committee', label: '추진위원' },
  { value: 'education', label: '교육 협력' },
  { value: 'tech', label: '기술 협력' },
  { value: 'partner', label: '기관 협력' },
  { value: 'sponsor', label: '후원' },
  { value: 'interest', label: '일반 관심' },
];

export const join = {
  title: '함께 만들어갈 사람들을 찾습니다',
  lead: '완성된 학교를 돕는 일이 아니라, 어떤 학교가 필요한지 함께 결정하는 참여입니다.',
  cards: [
    { title: '설립추진위원', body: '비전·운영 방향의 공동 결정', types: ['committee'] },
    { title: '교육·기술 협력', body: '콘텐츠·강의·개발·멘토링', types: ['education', 'tech'] },
    { title: '기관·후원 협력', body: '공동사업·공간·재정 협력', types: ['partner', 'sponsor'] },
    { title: '관심 등록', body: '설립 소식과 향후 교육 정보', types: ['interest'] },
  ] satisfies { title: string; body: string; types: ParticipationType[] }[],
  formTitle: '참여 의향 남기기',
  committeeNotice: '추진위원 참여 의향은 선임 확정이 아닙니다. 위원 구성은 이후 설립 절차에 따라 정하고 개별로 안내합니다.',
};

export const experiments = {
  title: '지금까지의 실험',
  lead: '공동체IT의 활동 경험에서 출발해, 더 많은 사람의 학교로 발전시키려 합니다.',
  items: [
    { icon: 'diamond', title: '디지털 역량진단', body: '학습자의 현재 역량을 이해하기' },
    { icon: 'grid', title: '디지털 활용 16유형', body: '나에게 맞는 성장 경로 찾기' },
    { icon: 'spark', title: '현장 교육·행사', body: '시민·공익활동가와 함께한 실험' },
  ],
};

export const news = {
  title: '준비 소식',
  lead: '창립 준비 과정과 주요 결정사항을 투명하게 나누겠습니다.',
  limit: 3,
};
