import { defineConfig } from 'astro/config';

// GitHub Pages user site (alifestone.github.io) — served at the domain root, no base path.
export default defineConfig({
  site: 'https://alifestone.github.io',
  // 首頁.html 與 design-reference/ 是設計參照，不進 build。
});
