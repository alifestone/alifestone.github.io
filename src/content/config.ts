import { defineCollection, z } from 'astro:content';

// 文章 collection：Markdown 內文 + frontmatter。
// tag 直接寫在 tags 陣列增刪；圖片可用 cover（frontmatter）或內文 ![](./xx.png)。
const posts = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.date(),
      category: z.enum(['機器人', '資安 CTF', '強化學習', '日本語']),
      tags: z.array(z.string()).default([]),
      excerpt: z.string(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      readMin: z.number().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { posts };
