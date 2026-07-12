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
   - 原始 .dc.html 保存在 Claude Design 專案，需要時用 DesignSync 拉下。

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
   404 彩蛋、列表篩選皆正常。首頁.html 不進 build（設計參照）。

階段5：（部署到 GitHub Pages — 完成）
1. 網域：用 github.io 子網域 https://alifestone.github.io（未建 CNAME）。
   astro.config.mjs 的 site 已設為此網址（user site，無 base）。
2. 已建立 .github/workflows/deploy.yml：withastro/action@v3 build → actions/deploy-pages@v4 部署，
   觸發於 push 到 main（也可在 Actions 頁面手動 workflow_dispatch）。
3. commit 4f424b9 push 到 main 後，Actions run 綠燈（build ✓ / deploy ✓）。
   線上驗證：https://alifestone.github.io/ 回 200 並為新 Astro 站；
   /posts/hello-world/ 亦回 200。
   （唯一提示為 Node 20 deprecation 的無害通知。）
4. 之後更新流程：git push 到 main 即自動 build + 部署；新增文章 = 在 src/content/posts/ 加 .md 後 push。

階段7：（首頁互動與吉祥物強化 — 完成）
1. 首頁底部草皮（永遠可見）：
   - 新增 grass 精靈（24×10 可水平平鋪）與獨立綠色調色盤 GRASS_LIGHT/GRASS_DARK（隨主題變色），
     加進 site.js 的 SPRITES 與 palFor()。
   - 新元件 src/components/Grass.astro：多個 tile flex 平鋪、position:fixed 貼視窗底。
     BaseLayout 加 grass prop（僅 index.astro 開啟），.has-grass 給 footer 預留 --grassH 底距，
     避免蓋住頁尾兩行字（草高定為 tile 56px + 餘裕 16px = 72px）。
   - 另附一段可貼進 Claude Design 的草皮 prompt（三階綠、可無縫平鋪、含深色版）。
2. 爬行 Slimo 可拖曳：
   - 重寫 site.js 的 startCrawler 為狀態機 crawl / drag / return，並開啟 .crawler 的 pointer-events。
   - 拖曳用 pointer events（桌機/觸控通用），移動未超過 5px 視為點擊（觸發對話）。
   - 放手後以 easeOutCubic 補間回「最近的邊框」再接回巡行（perimeterPos / nearestD 幾何，已用 Node 驗證）。
3. 點擊 Slimo 對話系統（軟萌療癒人設）：
   - 像素對話泡泡（neo-brutalist + 打字機效果，尖角指向 Slimo 並跟隨定位）。
   - 三分支：來點音樂（迷你播放清單）/ 陪我玩 / 隨便聊聊。
   - 音樂：public/music/ 佔位檔名 + 該資料夾 README 教學；改 site.js 的 MUSIC 陣列即可換真檔，
     檔案不存在時靜默失敗不壞頁。
   - 小遊戲：餵食/戳戳樂（canvas 內 Slimo 變形、無勝負療癒）＋ 像素接接看（30 秒接星星閃臭蟲計分）。
   - 對話開啟時 Slimo 暫停巡行（paused）停在原地方便點按鈕，關閉後從原位接回爬行。
4. 拖曳懸空動畫（Claude Design handoff → 落地 + 依需求調整）：
   - 從 Claude Design 專案「技術部落格首頁設計」取得 slimeDrag/drop 精靈 handoff（zip：README + 預覽圖）。
   - 加進 SPRITES：slimeDrag（拖曳懸空的水滴身形、下垂閉眼無奈臉、白色高光）＋ drop（小水滴）。
   - 拖曳時換成 slimeDrag、頂部中心錨點、不踏步不彈跳（只做極輕微鐘擺 sway/bob），
     底部尖端每 1.4–2.4s 生成獨立 drop 重力下墜、落地移除；放手清滴水並切回爬行精靈。
   - 依使用者需求把水滴倒過來成「圓頭在上、尖底在下」的倒水滴（slimeDrag 改為 16×20），
     setSprite 改用 DIMS 表按精靈各自寬高設定 canvas。
5. 驗證：node --check + npm run build（6 頁）皆通過；精靈陣列尺寸/字元、拖曳回歸幾何、滴水生命週期
   以 Node 驗過。**尚未做**瀏覽器內實測（本機無 Playwright/Puppeteer）——建議 npm run dev 親自確認
   草皮不蓋頁尾、對話/遊戲/音樂、拖曳造型與滴水方向、light/dark 各一次。

尚待進行（可選）：
- 階段6（CI/CD 進階）：核心「push 自動部署」已由階段5 workflow 達成；
  若要加強可在 build 前跑 astro check 型別檢查。
- 把首頁舊的 inline demo 文章逐步改寫成正式 Markdown 文章。
- projects.astro 目前為佔位頁，之後補內容。
- 把 public/music/ 的佔位曲目換成真音檔並更新 site.js 的 MUSIC 清單。
- 階段7 各互動的瀏覽器內實測（拖曳手感、滴水節奏、對話/遊戲）。