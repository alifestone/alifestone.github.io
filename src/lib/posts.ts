import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

// 分類 → chip class
export const CAT_CLASS: Record<string, string> = {
  '機器人': 'c-robo',
  '資安 CTF': 'c-ctf',
  '強化學習': 'c-rl',
  '日本語': 'c-jp',
};

export function catClass(cat: string): string {
  return CAT_CLASS[cat] ?? '';
}

export function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 取得已發佈文章，依日期新→舊排序
export async function getSortedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

// 聚合所有 tag（去重、依出現次數）
export function collectTags(posts: Post[]): string[] {
  const count = new Map<string, number>();
  for (const p of posts) for (const t of p.data.tags) count.set(t, (count.get(t) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

// 聚合分類計數
export function collectCategories(posts: Post[]): { name: string; cls: string; n: number }[] {
  const order = ['機器人', '資安 CTF', '強化學習', '日本語'];
  const count = new Map<string, number>();
  for (const p of posts) count.set(p.data.category, (count.get(p.data.category) ?? 0) + 1);
  return order
    .filter((c) => count.has(c))
    .map((c) => ({ name: c, cls: catClass(c), n: count.get(c)! }));
}
