/// <reference types="@cloudflare/workers-types" />

/** Pages Functions 바인딩·환경변수. wrangler.toml 및 Cloudflare 대시보드와 일치해야 한다. */
export interface Env {
  DB: D1Database;
  SITE_URL?: string;
  /** 발신 주소. 비어 있으면 메일을 보내지 않는다. */
  MAIL_FROM?: string;
  /** 담당자 알림 수신 주소(쉼표 구분). */
  NOTIFY_TO?: string;
  /** 비밀값 */
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET?: string;
  RATE_SALT?: string;
}
