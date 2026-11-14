import type { Env } from './env';
import type { ApplyInput } from '../lib/apply';
import { participationTypes } from '../data/home';

const typeLabel = (v: string) => participationTypes.find((t) => t.value === v)?.label ?? v;

interface Mail { to: string[]; subject: string; text: string; replyTo?: string }

/** Resend API로 발송. 설정이 없으면 건너뛴다. 실패해도 신청 접수는 유지한다. */
export async function sendMail(env: Env, mail: Mail): Promise<'sent' | 'skipped' | 'failed'> {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || mail.to.length === 0) return 'skipped';
  try {
    const res = await fetch(env.RESEND_API_URL || 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error('mail failed', res.status, await res.text().catch(() => ''));
      return 'failed';
    }
    return 'sent';
  } catch (err) {
    console.error('mail error', err);
    return 'failed';
  }
}

export function notifyMail(env: Env, input: ApplyInput, id: string, updated: boolean): Mail {
  const to = (env.NOTIFY_TO ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const types = input.types.map(typeLabel).join(', ');
  return {
    to,
    replyTo: input.email,
    subject: `[IT학교 참여 신청${updated ? ' 수정' : ''}] ${types} - ${input.name}`,
    text: [
      `참여 신청이 ${updated ? '수정' : '접수'}되었습니다.`,
      '',
      `이름/활동명: ${input.name}`,
      `이메일: ${input.email}`,
      `소속·활동분야: ${input.affiliation || '-'}`,
      `참여 방식: ${types}`,
      `소식 수신: ${input.newsOptIn ? '동의' : '미동의'}`,
      '',
      '남긴 이야기:',
      input.message || '-',
      '',
      `신청 ID: ${id}`,
      `관리 화면: ${(env.SITE_URL ?? '').replace(/\/$/, '')}/admin`,
    ].join('\n'),
  };
}

export function receiptMail(env: Env, input: ApplyInput): Mail {
  return {
    to: [input.email],
    // 담당자 개인 주소가 신청자에게 노출되지 않도록 공용 발신 주소로 회신받는다
    replyTo: addressOf(env.MAIL_FROM),
    subject: 'IT학교 참여 의향이 접수되었습니다',
    text: [
      `${input.name} 님, 안녕하세요.`,
      '',
      'IT학교 설립추진위원회(가칭)에 참여 의향을 남겨 주셔서 고맙습니다.',
      `선택하신 참여 방식: ${input.types.map(typeLabel).join(', ')}`,
      '',
      '담당자가 내용을 확인한 뒤 개별로 연락드리겠습니다.',
      '추진위원 참여 의향은 선임 확정이 아니며, 위원 구성은 이후 설립 절차에 따라 정합니다.',
      '',
      '신청 정보 삭제를 원하시면 이 메일에 회신해 주세요.',
      `개인정보 처리방침: ${(env.SITE_URL ?? '').replace(/\/$/, '')}/privacy`,
    ].join('\n'),
  };
}

/** "이름 <a@b.c>" 또는 "a@b.c"에서 주소만 꺼낸다. */
export function addressOf(from?: string): string | undefined {
  if (!from) return undefined;
  const m = /<([^>]+)>/.exec(from);
  return (m ? m[1] : from).trim() || undefined;
}
