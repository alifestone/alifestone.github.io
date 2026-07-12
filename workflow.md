階段0：
1. "https://alifestone.github.io" / "https://github.com/alifestone/alifestone.github.io"
2. 純靜態 HTML/CSS/JS

階段1：
1. 網站需具備的頁面：首頁、文章列表、單篇文章頁、關於我、專案/作品集頁。
2. 內容分類：機器人研究、資安、RL、日文
3. 風格：可愛但技術感、可切換 dark 或 light、像素/手繪風角色點綴。[圖片參考](https://www.deviantart.com/yellowfrye/art/Pixel-Hatsune-Miku-916473873)

階段2：（設計系統與原型確立）
1. 角色為"首頁-selection_dark_mode" 和 "首頁-selection"。
2. 吉祥物定名為 **Slimo**（史萊姆）。
   - 淺色主題：珊瑚色（PAL_CORAL），深色主題：藍色（PAL_BLUE）。
   - 造型：18×12 像素精靈（首頁.html 的 SLIME 陣列），CSS image-rendering:pixelated 放大。
   - 兩張 selection 圖（首頁-selection.png / 首頁-selection_dark_mode.png）= Slimo 的正式視覺定稿，
     經比對與 SLIME 陣列、PAL_CORAL/PAL_BLUE 完全吻合。
   - Slimo 於首頁三處出現：導覽列 logo、關於我頭像、沿邊框爬行的裝飾動畫（#crawler）。

設計系統摘要（階段2 定稿）：
- 字體：DotGothic16（像素標題/UI）、Noto Sans TC（內文）、JetBrains Mono（程式碼/標籤）。
- 分類色票：機器人 #7EE8C7、資安CTF #FF8A8A、強化學習 #FFC145、日本語 #C4B5FD。
- 主題：light/dark 以 .site 上的 class 切換 CSS 變數，主題切換帶像素格 wipe 轉場。
- 邊框風格：3px 實線 + 6px 硬陰影（.card），hover 位移的 neo-brutalist 觸感。

3. Claude Design 四頁模板出稿完成（專案「技術部落格首頁設計」，用 DesignSync 拉下）：
   - 文章頁.dc.html（.prose 完整 Markdown 樣式 + sticky 目錄 + 上/下篇）
   - 文章列表.dc.html（分類/tag 篩選 chip + 空狀態 + 分頁）
   - 關於我.dc.html（個人區塊 + 我在做什麼四卡 + 技能標籤 + 時間線）
   - 404.dc.html（迷路 Slimo 彩蛋：SLIME_LOST 精靈 + 融化水漬 + 戳一下彈跳）
   - 原始 .dc.html 已存進 design-reference/ 作為交接參照。

階段3：（匯出與交接 — 已用 Astro 落地）
1. 技術選型：**Astro**（靜態網站產生器；Markdown/MDX + content collections，原生支援 tag 與圖片最佳化）。
   決策見「五、待確認關鍵決策」第 1、3 題：導入產生器、由 Claude Code 接手。
2. 已把五個頁面（首頁 + 四模板）落地成 Astro 專案：
   - src/styles/global.css：抽出的共用設計系統（tokens + 各頁樣式）。
   - src/scripts/site.js：主題切換（含 localStorage 持久化 + 防閃爍）、Slimo 繪製、爬行動畫，
     改成掃描 canvas[data-slime] 一次驅動所有 Slimo。
   - src/components/：Slimo / Nav / Footer / Decorations / PostCard。
   - src/layouts/BaseLayout.astro：<html> 骨架、字體、防閃爍主題 script、Nav/Footer/裝飾。
   - src/content/config.ts + posts/hello-world.md：Markdown 內容系統（frontmatter：
     title/date/category/tags/excerpt/cover），tag 直接改 frontmatter 陣列。
   - src/pages/：index / posts/index（列表 + 篩選）/ posts/[...slug]（單篇 + 目錄）/ about / 404 / projects。
3. 本地驗證通過：npm run build 產出 6 頁；light/dark 切換、wipe、爬行 Slimo、Markdown 渲染、
   404 彩蛋、列表篩選皆正常。首頁.html 與 design-reference/ 不進 build（設計參照）。

尚待進行：
- 階段5/6：GitHub Actions 部署 workflow（withastro/action + deploy-pages），
  並到 repo Settings → Pages 把 Source 設為 GitHub Actions。（本輪未做）
- 把首頁舊的 inline demo 文章逐步改寫成正式 Markdown 文章。