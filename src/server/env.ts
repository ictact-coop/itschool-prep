/// <reference types="@cloudflare/workers-types" />

/** Worker 바인딩·환경변수. wrangler.toml 및 Cloudflare 대시보드와 일치해야 한다. */
export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  SITE_URL?: string;
  /** 발신 주소. 비어 있으면 메일을 보내지 않는다. */
  MAIL_FROM?: string;
  /** 담당자 알림 수신 주소(쉼표 구분). 개인 주소 포함 → Worker Secret으로 관리. */
  NOTIFY_TO?: string;
  /** 비밀값 */
  RESEND_API_KEY?: string;
  /** 테스트용 Resend API 주소 덮어쓰기. 운영에서는 비워 둔다. */
  RESEND_API_URL?: string;
  TURNSTILE_SECRET?: string;
  /** 테스트용 siteverify 주소 덮어쓰기. 운영에서는 비워 둔다. */
  TURNSTILE_VERIFY_URL?: string;
  RATE_SALT?: string;
}
