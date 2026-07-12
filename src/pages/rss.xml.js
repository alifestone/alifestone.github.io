import rss from '@astrojs/rss';
import { getSortedPosts } from '../lib/posts';

export async function GET(context) {
  const posts = await getSortedPosts();
  return rss({
    title: 'debug.log — 普通人類的觀察日記',
    description: '機器人研究筆記、資安 CTF writeup、強化學習實作，以及偶爾出現的日文學習心得。',
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.excerpt,
      categories: [p.data.category, ...p.data.tags],
      link: `/posts/${p.slug}/`,
    })),
    customData: '<language>zh-TW</language>',
  });
}
