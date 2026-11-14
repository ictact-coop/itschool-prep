// 참여 신청 데이터 계약. 브라우저(T4)와 서버 API(T5)가 같은 규칙을 쓴다.
// 프레임워크 의존 없음: Pages Functions에서도 그대로 import 한다.

export const PARTICIPATION_TYPES = ['committee', 'education', 'tech', 'partner', 'sponsor', 'interest'] as const;
export type ParticipationType = (typeof PARTICIPATION_TYPES)[number];

export const LIMITS = { name: 50, email: 254, affiliation: 100, message: 2000 } as const;

export interface ApplyInput {
  name: string;
  email: string;
  affiliation: string;
  types: ParticipationType[];
  message: string;
  privacyConsent: boolean;
  newsOptIn: boolean;
  /** 스팸 방지용 숨김 필드. 사람이 채우면 안 된다. */
  website: string;
}

export type ApplyField = 'name' | 'email' | 'affiliation' | 'types' | 'message' | 'privacyConsent';
export type ApplyErrors = Partial<Record<ApplyField, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** FormData 또는 URLSearchParams에서 입력값을 읽는다(공백 정리, 알 수 없는 유형 제거). */
export function readApplyInput(form: { get(k: string): unknown; getAll(k: string): unknown[] }): ApplyInput {
  const str = (k: string) => (typeof form.get(k) === 'string' ? (form.get(k) as string).trim() : '');
  const types = form
    .getAll('types')
    .filter((v): v is ParticipationType => typeof v === 'string' && (PARTICIPATION_TYPES as readonly string[]).includes(v));
  return {
    name: str('name'),
    email: str('email').toLowerCase(),
    affiliation: str('affiliation'),
    types: [...new Set(types)],
    message: str('message'),
    privacyConsent: form.get('privacyConsent') === 'on',
    newsOptIn: form.get('newsOptIn') === 'on',
    website: str('website'),
  };
}

export function validateApply(input: ApplyInput): ApplyErrors {
  const e: ApplyErrors = {};
  if (!input.name) e.name = '이름 또는 활동명을 입력해 주세요.';
  else if (input.name.length > LIMITS.name) e.name = `${LIMITS.name}자 이내로 입력해 주세요.`;

  if (!input.email) e.email = '이메일을 입력해 주세요.';
  else if (input.email.length > LIMITS.email || !EMAIL_RE.test(input.email))
    e.email = '이메일 형식을 확인해 주세요. 예: name@example.com';

  if (input.affiliation.length > LIMITS.affiliation) e.affiliation = `${LIMITS.affiliation}자 이내로 입력해 주세요.`;
  if (input.types.length === 0) e.types = '참여 방식을 하나 이상 선택해 주세요.';
  if (input.message.length > LIMITS.message) e.message = `${LIMITS.message}자 이내로 입력해 주세요.`;
  if (!input.privacyConsent) e.privacyConsent = '개인정보 수집·이용에 동의해야 신청할 수 있습니다.';
  return e;
}

/** 서버 응답 형태(T5 계약) */
export type ApplyResponse =
  | { ok: true }
  | { ok: false; errors?: ApplyErrors; message?: string };
