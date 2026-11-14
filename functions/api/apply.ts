import type { Env } from '../../src/server/env';
import { handleApply } from '../../src/server/apply-handler';

export const onRequestPost: PagesFunction<Env> = (ctx) => handleApply(ctx.request, ctx.env, ctx);

export const onRequest: PagesFunction<Env> = () =>
  new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
