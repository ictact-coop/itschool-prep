/// <reference types="@cloudflare/workers-types" />
// Worker 진입점. 정적 파일은 [assets]가 먼저 처리하고, 파일이 없는 요청만 여기로 온다.
import type { Env } from './server/env';
import { handleApply } from './server/apply-handler';

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/apply') {
      if (request.method === 'POST') return handleApply(request, env, ctx);
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
