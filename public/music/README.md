# Slimo 的音樂資料夾

點擊首頁爬行的 Slimo →「來點音樂」會讀取這裡的音檔。

## 怎麼換成你的歌

1. 把音檔（建議 `.mp3` 或 `.ogg`）放進這個 `public/music/` 資料夾。
2. 打開 `src/scripts/site.js`，找到 `const MUSIC = [ ... ]` 這個清單。
3. 每首歌一列，改成你的檔名與顯示標題，例如：

   ```js
   const MUSIC = [
     { title: '雨天的 debug', src: '/music/rainy-debug.mp3' },
     { title: '梯度下降到天亮', src: '/music/gradient.ogg' },
   ];
   ```

4. `src` 一律用 `/music/檔名`（開頭的 `/` 代表網站根目錄，GitHub Pages 上也適用）。

目前清單裡是**佔位檔名**（檔案還不存在），播放會靜靜失敗、不會壞掉頁面。
把上面兩步做完、換成真的檔案後就能播了。
