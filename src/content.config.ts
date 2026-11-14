import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 설립 단계: 확인된 사실만 'done'으로 둔다.
const steps = defineCollection({
  loader: file('src/content/steps.json'),
  schema: z.object({
    order: z.number().int(),
    title: z.string(),
    summary: z.string(),
    status: z.enum(['done', 'doing', 'planned']),
  }),
});

// 준비 소식: src/content/news/*.md 한 파일이 한 건. 최신 3건만 첫 화면에 표시.
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    label: z.string(), // 예: 확인된 단계, 예정 게시물, 추후 게시
    draft: z.boolean().default(false),
  }),
});

export const collections = { steps, news };
