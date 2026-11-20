import type { ParticipationType } from '../lib/apply';

// 첫 화면 문구. 와이어프레임(2026-11-14) + 안내 개편(2026-11-20, 대학 학제 비유).
// 설립 단계는 src/content/steps.yaml, 준비 소식은 src/content/news/ 에서 관리한다.

/** 진단 사이트(공동체IT 운영, 링크 허용 2026-11-20) */
export const diagnosisSite = {
  home: 'https://dctest.ictact.kr/',
  diagnosis: 'https://dctest.ictact.kr/diagnosis',
  miniTest: 'https://dctest.ictact.kr/mini-test',
};

export const pilot = { when: '2027년 상반기', cost: '미정' };

export const hero = {
  badge: '설립 준비 중 · 시민과 함께 만드는 새로운 배움',
  titleLines: ['기술을 배우는 것을 넘어,', '함께 만들어가는 IT학교'],
  lead: 'IT학교는 시민과 공익활동가를 위한 디지털 대학입니다. 누구나 익히는 교양필수, 내 활동에 맞춰 고르는 전공선택, 실제 문제를 푸는 프로젝트로 배움의 길을 만듭니다. 그 학교를 지금 함께 세우고 있습니다.',
  /** lead 안에서 굵게 보일 낱말 */
  emphasis: ['디지털 대학', '교양필수', '전공선택', '프로젝트'],
  primary: { href: '#join', label: '학교 설립에 함께하기' },
  about: { href: '/about', label: 'IT학교 한눈에 보기' },
  secondary: { href: '#curriculum', label: '어떻게 배우나요?' },
};

export const why = {
  title: '왜 IT학교가 필요할까요?',
  lead: '기술의 변화가 새로운 격차가 아닌, 함께 배우는 기회가 되도록',
  worriesTitle: '혹시 이런 고민, 혼자 하고 있나요?',
  /** 진단 사이트와 현장에서 모은 활동가들의 고민 */
  worries: [
    '캠페인을 더 잘 알리고 싶다',
    'AI를 어디서부터 써야 할지 모르겠다',
    '데이터는 있는데 활용을 못 한다',
    '반복되는 조직 업무를 줄이고 싶다',
    '활동과 조직을 안전하게 지키고 싶다',
    '기술을 사회문제 해결에 쓰고 싶다',
  ],
  items: [
    { title: '배움의 격차', body: '기술을 익힐 시간과 지원이 모두에게 똑같이 주어지지는 않습니다.' },
    { title: '스스로 판단하는 힘', body: '도구의 사용법과 함께 기술의 영향과 한계를 이해해야 합니다.' },
    { title: '함께하는 학습', body: '서로의 경험과 지식을 나누며 공동체의 문제를 풀어갑니다.' },
  ],
};

export interface Subject { title: string; body: string; tools: string[] }

/** 대학 학제에 빗댄 IT학교 배움 지도. 과목 구성은 설립 과정에서 함께 다듬는다. */
export const curriculum = {
  title: '대학처럼 배웁니다',
  lead: '입학 진단부터 교양필수, 전공선택, 졸업 프로젝트까지. 대학의 학제를 시민과 공익활동가의 디지털 배움에 맞게 다시 짰습니다.',
  toolNote: '도구는 예시입니다. 과목 구성은 설립 과정에서 함께 다듬습니다.',
  entrance: {
    univ: '입학 상담·배치',
    title: '나의 출발점 찾기',
    body: '디지털 역량진단과 16가지 디지털 활용 유형으로 지금의 나를 알고 시작합니다.',
    links: [
      { href: diagnosisSite.diagnosis, label: '역량진단 해보기' },
      { href: diagnosisSite.miniTest, label: '3분 유형 테스트' },
    ],
  },
  required: {
    univ: '교양필수',
    title: '모두가 익히는 디지털 기본기',
    subjects: [
      { title: '디지털 안전', body: '계정·비밀번호, 2단계 인증, 개인정보 지키기', tools: ['비밀번호 관리자', '2단계 인증'] },
      { title: 'AI 바르게 쓰기', body: '잘 묻고, 결과를 검증하고, 책임 있게 쓰기', tools: ['ChatGPT', 'Claude', 'Gemini'] },
      { title: '정보 찾기·판단', body: '검색, 출처 확인, 사실 검증', tools: ['검색 연산자', '공공데이터포털'] },
      { title: '협업 기본', body: '문서 함께 쓰기, 일정·회의 기록', tools: ['노션', '구글 드라이브·문서'] },
    ] satisfies Subject[],
  },
  major: {
    univ: '전공선택',
    title: '내 활동에 맞춰 고르는 트랙',
    subjects: [
      { title: 'AI × 활동', body: '자료 조사, 글쓰기, 회의 정리, 아이디어 발굴', tools: ['ChatGPT', 'Claude', 'NotebookLM'] },
      { title: '데이터 × 사회문제', body: '설문·공개데이터 정리, 분석, 시각화', tools: ['구글 설문지·시트', 'Datawrapper', 'Looker Studio'] },
      { title: '콘텐츠 × 캠페인', body: '이미지, 영상, SNS로 활동 알리기', tools: ['캔바', '캡컷', '인스타그램'] },
      { title: '협업 × 조직', body: '업무 설계와 반복 업무 자동화', tools: ['노션 데이터베이스', '슬랙', 'Zapier·Make'] },
      { title: '오픈소스 × 시민기술', body: '비개발자의 오픈소스 참여, 공익적 기술 활용', tools: ['GitHub', '위키', '오픈스트리트맵'] },
    ] satisfies Subject[],
  },
  /** 나머지 단계: 대학 → IT학교 */
  more: [
    { univ: '실습·졸업작품', title: '내 활동의 문제를 푸는 프로젝트', body: '예: 노션으로 회원·후원 관리 만들기, 공개데이터로 캠페인 지도 만들기' },
    { univ: '교수진·조교', title: '강사·멘토·동료 학습 모임', body: '강사 역량 체계로 시민사회의 디지털 교수진도 함께 키웁니다.' },
    { univ: '성적표', title: '다시 진단해 보는 성장 기록', body: '시험 점수 대신 처음과 지금의 역량 변화를 확인합니다.' },
    { univ: '동문', title: '배운 사람이 가르치는 사람으로', body: '졸업 후 강사·멘토로 다시 학교를 함께 만듭니다.' },
  ],
};

export const school = {
  title: '배우는 방식도 활동가답게',
  lead: '강의를 듣고 끝나는 배움이 아니라, 내 활동으로 돌아가 쓰는 배움',
  items: [
    { icon: 'path', title: '활동에서 출발', body: '지금 하고 있는 활동과 고민에서 시작합니다' },
    { icon: 'tool', title: '직접 해보기', body: '설명을 듣기보다 먼저 도구를 써 봅니다' },
    { icon: 'share', title: '동료와 배우기', body: '같은 고민을 가진 동료와 함께 배웁니다' },
    { icon: 'compass', title: '반복 실험', body: '작게 시도하고 다시 내 활동에 적용합니다' },
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
    { title: '설립추진위원', role: '학교를 세우는 사람', body: '비전·운영 방향의 공동 결정', types: ['committee'] },
    { title: '교육·기술 협력', role: '교수진·튜터', body: '콘텐츠·강의·개발·멘토링', types: ['education', 'tech'] },
    { title: '기관·후원 협력', role: '캠퍼스와 장학금을 만드는 사람', body: '공동사업·공간·재정 협력', types: ['partner', 'sponsor'] },
    { title: '관심 등록', role: '예비 입학생', body: `설립 소식과 ${pilot.when} 시범교육 안내`, types: ['interest'] },
  ] satisfies { title: string; role: string; body: string; types: ParticipationType[] }[],
  formTitle: '참여 의향 남기기',
  committeeNotice: '추진위원 참여 의향은 선임 확정이 아닙니다. 위원 구성은 이후 설립 절차에 따라 정하고 개별로 안내합니다.',
};

export const experiments = {
  title: '지금까지의 실험',
  lead: '공동체IT의 활동 경험에서 출발해, 더 많은 사람의 학교로 발전시키려 합니다.',
  items: [
    { icon: 'diamond', title: '디지털 역량진단', body: '학습자의 현재 역량을 이해하기', href: diagnosisSite.diagnosis },
    { icon: 'grid', title: '디지털 활용 16유형', body: '나에게 맞는 성장 경로 찾기', href: diagnosisSite.miniTest },
    { icon: 'spark', title: '현장 교육·행사', body: '시민·공익활동가와 함께한 실험' },
  ] as { icon: string; title: string; body: string; href?: string }[],
};

export const news = {
  title: '준비 소식',
  lead: '창립 준비 과정과 주요 결정사항을 투명하게 나누겠습니다.',
  limit: 3,
};

/** 'IT학교 한눈에 보기'(팝업과 /about 공용) */
export const about = {
  title: 'IT학교 한눈에 보기',
  description: '시민과 공익활동가를 위한 디지털 대학, IT학교. 교양필수·전공선택·프로젝트로 배우는 학교를 함께 세우고 있습니다.',
  faq: [
    {
      q: 'IT학교는 어떤 곳인가요?',
      a: `시민과 공익활동가가 디지털 기술을 이해하고 자기 활동에 직접 쓰도록 돕는 학교입니다. 대학처럼 체계적인 배움의 길(학제)을 만들되, 강의실이 아니라 각자의 활동 현장에서 출발합니다. 공동체IT의 교육·진단 실험에서 시작해 독립된 학교로 설립을 준비하고 있습니다.`,
    },
    { q: '대학과 무엇이 닮았나요?', table: true },
    {
      q: '누가 배우나요?',
      a: '시민단체·비영리 조직의 활동가와 실무자, 지역에서 활동하는 시민, 디지털을 배워 공익에 쓰고 싶은 누구나. 디지털이 익숙하지 않아도 진단으로 나의 출발점을 찾고 시작할 수 있습니다.',
    },
    { q: '어떻게 배우나요?', steps: true },
    {
      q: '언제 시작하나요?',
      a: `${pilot.when} 시범교육을 목표로 준비하고 있습니다. 지금은 추진위원을 모으고 창립총회를 준비하는 단계입니다.`,
    },
    {
      q: '비용은 얼마인가요?',
      a: `아직 정해지지 않았습니다(${pilot.cost}). 시범교육을 안내할 때 함께 알려 드립니다. 관심 등록을 남기면 소식을 받아볼 수 있습니다.`,
    },
  ],
};
