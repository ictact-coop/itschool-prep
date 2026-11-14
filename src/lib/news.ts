import { getCollection, type CollectionEntry } from 'astro:content';

export type NewsEntry = CollectionEntry<'news'>;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 공개 소식(초안 제외), 최신순. 같은 날짜면 파일 이름순. 파일 이름 규칙을 어기면 빌드를 멈추고 이유를 알린다. */
export async function getPublishedNews(): Promise<NewsEntry[]> {
  const all = await getCollection('news', ({ data }) => !data.draft);
  for (const n of all) {
    if (!SLUG_RE.test(n.id)) {
      throw new Error(
        `준비 소식 파일 이름 "${n.id}.md"를 쓸 수 없습니다. 영문 소문자·숫자·하이픈(-)만 써 주세요. 예: 2026-12-01-founding.md`,
      );
    }
  }
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id));
}

/** 본문이 있는 소식만 상세 페이지를 만든다. */
export const hasBody = (n: NewsEntry) => Boolean(n.body && n.body.trim());

export const formatDate = (d: Date) =>
  `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
