import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 설립 단계(src/content/steps.yaml). 확인된 사실만 'done'으로 둔다.
const steps = defineCollection({
  loader: file('src/content/steps.yaml'),
  schema: z.object({
    order: z.number({ message: 'order는 숫자로 적어 주세요. 예: order: 3' }).int(),
    title: z.string({ message: 'title(단계 이름)을 적어 주세요.' }).min(1).max(30, 'title은 30자 이내로 적어 주세요.'),
    summary: z.string({ message: 'summary(한 줄 설명)를 적어 주세요.' }).max(40, 'summary는 40자 이내로 적어 주세요.'),
    status: z.enum(['done', 'doing', 'planned'], {
      message: "status는 done(완료), doing(준비 중), planned(예정) 중 하나로 적어 주세요.",
    }),
  }),
});

// 준비 소식(src/content/news/*.md). 파일 하나가 소식 한 건이다.
// 파일 이름이 주소가 된다: 2026-12-01-founding.md → /news/2026-12-01-founding
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string({ message: 'title(제목)을 적어 주세요.' }).min(1).max(60, 'title은 60자 이내로 적어 주세요.'),
    date: z.coerce.date({ message: 'date는 2026-12-01 형식으로 적어 주세요.' }),
    label: z.string({ message: "label(오른쪽 작은 글씨)을 적어 주세요. 예: label: 공지" }).max(12, 'label은 12자 이내로 적어 주세요.'),
    draft: z.boolean({ message: 'draft는 true 또는 false로 적어 주세요.' }).default(false),
  }),
});

export const collections = { steps, news };
