// ============================================================
// debug.log — 全站客戶端腳本
// 主題切換（含 localStorage 持久化 + wipe 轉場）、Slimo 像素繪製、爬行動畫。
// 沿用 Claude Design .dc.html 的 SLIME/palette/drawMap/crawler 邏輯，
// 但改成掃描 DOM 上的 canvas[data-slime] 一次驅動所有 Slimo。
// ============================================================

// Slimo 調色盤：dark=藍色、light=珊瑚色
const PAL_BLUE  = { K:'#10101A', B:'#45C6F0', D:'#1E6BD6', E:'#0C2F8F', W:'#FFFFFF', C:'#CFF6FF' };
const PAL_CORAL = { K:'#10101A', B:'#FF8A70', D:'#E0503A', E:'#8C1F33', W:'#FFFFFF', C:'#FFD9CC' };
// 草皮調色盤：L=亮綠(高光)、G=中綠、D=深綠(底)。light/dark 各自略調明度以配合主題。
const GRASS_LIGHT = { L:'#8CE99A', G:'#3FBF57', D:'#1E7A33' };
const GRASS_DARK  = { L:'#5FD97A', G:'#2E9E48', D:'#155C28' };

// 精靈圖：以字元對應調色盤，'.' 為透明
const SPRITES = {
  // 18×12 標準 Slimo（logo / avatar / crawler）
  slime: [
    '......KKKKKK......',
    '....KKDDDDDDKK....',
    '...KDDBBBBBBDDK...',
    '..KDBBWBBBBBBBDK..',
    '.KDBWWWBBBBBBBBDK.',
    '.KBBBWBBCBBBBBBBK.',
    'KDBBBBBBBCBBBBBBDK',
    'KBBBBBBBBWEEBWEEBK',
    'KBBBBBBBBBEEBBEEBK',
    'KDBBBBBBBBEEBBEEDK',
    '.KDDBBBBBBBBBBDDK.',
    '.KKKKKKKKKKKKKKKK.'
  ],
  // 18×14 迷路 Slimo（404 專用：垂頭、半融、閉眼 + 汗滴）
  slimeLost: [
    '.......KKKKK......',
    '.....KKDDDDDKK....',
    '....KDDBBBBBDDK...',
    '...KDBWBBBBBBBDK..',
    '..KDBWWBBBBBBBBK..',
    '..KBBWBBCBBBBBBK.W',
    '.KDBBBBBBCBBBBBDKW',
    '.KBBBBBBEEBBEEBBK.',
    '.KBBBBBBBBBBBBBBK.',
    'KDBBBBBEBBBBBBEBDK',
    'KBBBBBBEEBBBBEEBBK',
    'KDBBBBBBBBBBBBBBDK',
    '.KDDBBBBBBBBBBDDK.',
    '.KKKKKKKKKKKKKKKK.'
  ],
  // 30×9 融化水漬
  puddle: [
    '.........KKKKKKKKKKKK.........',
    '......KKKDDBBBBBBBBDDKKKK.....',
    '....KKDBBBBBCCCCCCCBBBBBDKK...',
    '...KDBBCCCCCWWWCCCCCCCCCBBDK..',
    '.KKDBCCCCCCCCWWCCCCCCCCCCCBDKK',
    'KDDBCCCCCCCCCCCCCCCCCCCCCCCBDK',
    '.KDBBCCCCCCCCCCCCCCCCCCCCBBDK.',
    '..KKDDBBBBBBBBBBBBBBBBBBDDKK..',
    '....KKKKKKKKKKKKKKKKKKKKKK....'
  ],
  trail1: [
    '..KKK.',
    'KKBCBK',
    '.KKKK.'
  ],
  trail2: [
    '...KKKK..',
    '.KKBBCBKK',
    'KDBBBBBBK',
    '.KKKKKKK.'
  ],
  trail3: [
    '....KKKKK....',
    '..KKBBCCBKK..',
    '.KDBCCCCCBBDK',
    'KDBBBBBBBBBDK',
    '.KKKKKKKKKKK.'
  ],
  // 16×20 拖曳懸空 Slimo（倒水滴：圓頭在上、往下收窄成尖底滴水；下垂閉眼無奈）。
  // 基於 Claude Design handoff 的造型，依需求把水滴倒過來（頭圓底尖）。
  slimeDrag: [
    '.....KKKKKK.....',
    '...KKDDDDDDKK...',
    '..KDBBBBBBBBDK..',
    '.KDBWWBBBBBBBDK.',
    '.KBWWWBBBBBBBBK.',
    'KDBBWBBCBBBBBBDK',
    'KBBBBBBBCBBBBBBK',
    'KBBBEEBBBBEEBBBK',
    'KBBEEBBBBBBEEBBK',
    'KBBBBBBEBEBBBBBK',
    'KDBBBBBBEBBBBBDK',
    '.KBBBBBBBBBBBBK.',
    '.KDBBBBBBBBBBDK.',
    '..KDBBBBBBBBDK..',
    '..KKDBBBBBBDKK..',
    '...KKDBBBBDKK...',
    '....KKDBBDKK....',
    '.....KDBBDK.....',
    '......KBCK......',
    '.......KK.......'
  ],
  // 4×4 分離後的小水滴（滴落動畫用）
  drop: [
    '.KK.',
    'KBCK',
    'KBBK',
    '.KK.'
  ],
  // 24×10 可水平平鋪的草皮帶（首頁底部）。L=高光綠、G=中綠、D=底綠、'.'=透明。
  // 剪影模仿參考圖：不規則草叢，中段最高、右側一小叢，底部兩排實心。
  grass: [
    '..........LL............',
    '.....LL..LGGL....LL......',
    '....LGGL.LGGGL..LGGL.....',
    '...LGGGGLLGGGGL.LGGGGL...',
    '.LLGGGGGGGGGGGGLLGGGGGL..',
    'LGGGGGGGGGGGGGGGGGGGGGGGL',
    'GGGGGDDGGGGGDDGGGGGDDGGGG',
    'DDDGGDDDDDGGDDDDDGGDDDDDD',
    'DDDDDDDDDDDDDDDDDDDDDDDDD',
    'DDDDDDDDDDDDDDDDDDDDDDDDD'
  ]
};

let theme = 'light';

function pal() { return theme === 'dark' ? PAL_BLUE : PAL_CORAL; }
// 依精靈名選調色盤：草皮用綠色盤，其餘用 Slimo 藍/珊瑚盤。
function palFor(sprite) {
  if (sprite === 'grass') return theme === 'dark' ? GRASS_DARK : GRASS_LIGHT;
  return pal();
}

function drawMap(canvas, rows, p) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  p = p || pal();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = p[row[x]];
      if (c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }
    }
  });
}

// 重繪頁面上所有 Slimo canvas（依 data-slime 指定的精靈）
function redrawAll() {
  document.querySelectorAll('canvas[data-slime]').forEach((el) => {
    const sprite = el.getAttribute('data-slime');
    const rows = SPRITES[sprite] || SPRITES.slime;
    drawMap(el, rows, palFor(sprite));
  });
}

// --- 主題 ---
function applyTheme(next, { animate = false } = {}) {
  const root = document.getElementById('site');
  if (!root) return;
  const swap = () => {
    theme = next;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch (e) {}
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = theme === 'light' ? '◼ DARK' : '◻ LIGHT';
    redrawAll();
  };
  if (!animate) { swap(); return; }
  const wipe = document.getElementById('wipe');
  if (!wipe) { swap(); return; }
  wipe.classList.remove('in');
  setTimeout(() => wipe.classList.add('in'), 20);
  setTimeout(swap, 380);
  setTimeout(() => wipe.classList.remove('in'), 800);
}

let wiping = false;
function toggleTheme() {
  if (wiping) return;
  wiping = true;
  applyTheme(theme === 'light' ? 'dark' : 'light', { animate: true });
  setTimeout(() => { wiping = false; }, 820);
}

// --- 建立 wipe 格子 ---
function buildWipe() {
  const wipe = document.getElementById('wipe');
  if (!wipe || wipe.childElementCount) return;
  for (let i = 0; i < 84; i++) {
    const x = i % 12, y = Math.floor(i / 12);
    const cell = document.createElement('div');
    cell.className = 'wcell';
    cell.style.transitionDelay = (((x * 3 + y * 5) % 7) * 45) + 'ms';
    wipe.appendChild(cell);
  }
}

// --- 爬行 Slimo（可拖曳 + 可點擊對話）---
// crawler 有三種狀態：
//   'crawl' 沿視窗邊框巡行（依周長參數 d 決定位置）
//   'drag'  被滑鼠/觸控抓著，跟著指標走
//   'return' 放手後補間回最近的邊框，再交還給 crawl
const S = 54, SH = 36;         // Slimo 顯示尺寸（寬/高）
const SPEED = 55;              // 巡行速度 px/s
let crawler = null;           // 控制器（供對話系統查詢位置）

// 邊框周長參數 d → 螢幕座標 {x,y,r}
function perimeterPos(d) {
  const W = window.innerWidth, H = window.innerHeight;
  const L1 = W - S, L2 = H - SH;
  const per = 2 * (L1 + L2);
  d = ((d % per) + per) % per;
  if (d < L1) return { x: d, y: H - SH, r: 0 };
  if (d < L1 + L2) return { x: W - S + 3, y: H - SH - (d - L1), r: -90 };
  if (d < 2 * L1 + L2) return { x: W - S - (d - L1 - L2), y: -3, r: 180 };
  return { x: -3, y: d - 2 * L1 - L2, r: 90 };
}
// 螢幕上任一點 → 最近邊框的周長參數 d（放手後回歸用）
function nearestD(px, py) {
  const W = window.innerWidth, H = window.innerHeight;
  const L1 = W - S, L2 = H - SH;
  const cx = Math.max(0, Math.min(px, W - S));
  const cy = Math.max(0, Math.min(py, H - SH));
  const dBottom = H - SH - cy, dTop = cy, dLeft = cx, dRight = W - S - cx;
  const m = Math.min(dBottom, dTop, dLeft, dRight);
  if (m === dBottom) return cx;                       // 下邊
  if (m === dRight) return L1 + (H - SH - cy);         // 右邊
  if (m === dTop) return L1 + L2 + (W - S - cx);       // 上邊
  return 2 * L1 + L2 + cy;                             // 左邊
}

function startCrawler() {
  const el = document.getElementById('crawler');
  const canvas = el && el.querySelector('canvas');
  if (!el || !canvas) return;

  // 每像素的 CSS 尺寸（爬行精靈 18px 寬顯示成 S=54px → 3px/像素）。拖曳精靈沿用同一 PX 保持比例一致。
  const PX = S / 18;
  // 各精靈原生像素尺寸：爬行 slime 18×12、拖曳 slimeDrag 倒水滴 16×20。
  const DIMS = { slime: [18, 12], slimeDrag: [16, 20] };
  const DRAG_W = DIMS.slimeDrag[0], DRAG_H = DIMS.slimeDrag[1];

  const state = {
    el, canvas,
    mode: 'crawl',
    paused: false,           // 對話開啟時暫停巡行（停在原地）
    d: 0,                    // 目前巡行參數
    x: 0, y: 0,              // 目前螢幕座標（drag/return 用）
    grabDX: 0, grabDY: 0,    // 抓取時指標與精靈左上角的偏移
    retFrom: null, retTo: 0, retT: 0,  // 回歸補間
    last: performance.now(),
    onArrive: null,          // 對話系統可掛：拖曳結束回報
    drops: [],               // 拖曳時滴落中的水滴 {x,y,vy,el}
    dripT: 0,                // 下次滴水倒數
  };
  crawler = state;

  // 切換 crawler 主體精靈（爬行 slime 18×12 ↔ 拖曳 slimeDrag 倒水滴 16×20）
  function setSprite(name) {
    if (canvas.dataset.slime === name) return;
    canvas.dataset.slime = name;
    const [w, h] = DIMS[name] || DIMS.slime;
    canvas.width = w; canvas.height = h;
    canvas.style.width = (w * PX) + 'px';
    canvas.style.height = (h * PX) + 'px';
    drawMap(canvas, SPRITES[name], palFor(name));
  }

  // 一般（爬行/暫停/回歸）繪製：底部錨點 + 踏步擠壓
  function paint(x, y, r, squash) {
    const ph = squash;
    const hop = -ph * 7;
    const sy = 0.82 + 0.26 * ph, sx = 1 / sy;
    el.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + r + 'deg) translateY(' + hop + 'px)';
    canvas.style.transformOrigin = '50% 100%';
    canvas.style.transform = 'scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
    state.x = x; state.y = y;
  }

  // 拖曳繪製：不踏步、不彈跳。抓取點對齊頂部中心，只做極輕微的鐘擺晃動。
  function paintDrag(now) {
    const sway = Math.sin(now / 380) * 1.6;      // 微幅左右晃（度）
    const bob = Math.sin(now / 520) * 1.2;       // 微幅上下浮動（px）
    el.style.transform = 'translate(' + state.x + 'px,' + (state.y + bob) + 'px) rotate(' + sway.toFixed(2) + 'deg)';
    canvas.style.transformOrigin = '50% 0%';     // 頂部中心＝被抓的頸部
    canvas.style.transform = 'none';
  }

  function step(now) {
    requestAnimationFrame(step);
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    const t = now / 1000;

    if (state.mode === 'drag') {
      paintDrag(now);
      updateDrips(now, dt);
      return;
    }
    if (state.mode === 'return') {
      state.retT = Math.min(1, state.retT + dt * 3.2);
      const e = 1 - Math.pow(1 - state.retT, 3); // easeOutCubic
      const to = perimeterPos(state.retTo);
      const x = state.retFrom.x + (to.x - state.retFrom.x) * e;
      const y = state.retFrom.y + (to.y - state.retFrom.y) * e;
      paint(x, y, to.r, Math.sin(state.retT * Math.PI) * 0.6);
      if (state.retT >= 1) { state.d = state.retTo; state.mode = 'crawl'; }
      return;
    }
    // crawl：沿邊框前進（暫停時停在原地、只做輕微呼吸，不推進 d）
    if (!state.paused) state.d += SPEED * dt;
    const p = perimeterPos(state.d);
    const squash = state.paused ? Math.abs(Math.sin(t * 2)) * 0.35 : Math.abs(Math.sin(t * 6));
    paint(p.x, p.y, p.r, squash);
  }

  // --- 拖曳時的滴水 ---
  // 從拖曳精靈底部中心生成獨立小水滴，於螢幕座標往下加速掉落、落地淡出。
  function spawnDrop() {
    const d = document.createElement('canvas');
    d.width = 4; d.height = 4;
    d.className = 'pxc slimo-drop';
    d.style.cssText = 'position:fixed;left:0;top:0;z-index:59;pointer-events:none;'
      + 'width:' + (4 * PX) + 'px;height:' + (4 * PX) + 'px;will-change:transform,opacity';
    drawMap(d, SPRITES.drop, palFor('slimeDrag'));
    document.body.appendChild(d);
    // 底部中心座標：精靈頂部錨在 (state.x, state.y)，寬 DRAG_W*PX、高 DRAG_H*PX
    const bx = state.x + (DRAG_W * PX) / 2 - (4 * PX) / 2;
    const by = state.y + DRAG_H * PX - 6;
    state.drops.push({ x: bx, y: by, vy: 40, el: d });
  }
  function updateDrips(now, dt) {
    // 節流生成：每 1.4–2.4s 一滴
    state.dripT -= dt;
    if (state.dripT <= 0) { state.dripT = 1.4 + Math.random() * 1.0; spawnDrop(); }
    const H = window.innerHeight;
    state.drops = state.drops.filter((dp) => {
      dp.vy += 520 * dt;                 // 重力加速
      dp.y += dp.vy * dt;
      const gone = dp.y > H - 8;
      dp.el.style.transform = 'translate(' + dp.x + 'px,' + dp.y + 'px)';
      if (gone) { dp.el.style.opacity = '0'; dp.el.remove(); }
      return !gone;
    });
  }
  function clearDrips() {
    state.drops.forEach((dp) => dp.el.remove());
    state.drops = [];
    state.dripT = 0.5;                    // 抓起後略延遲第一滴
  }

  requestAnimationFrame(step);

  // --- 拖曳 ---
  let downX = 0, downY = 0, moved = false, dragging = false;
  const DRAG_THRESH = 5; // 移動超過此距離才算拖曳，否則視為點擊

  function onDown(e) {
    const pt = e.touches ? e.touches[0] : e;
    downX = pt.clientX; downY = pt.clientY; moved = false; dragging = false;
    const rect = el.getBoundingClientRect();
    state.grabDX = pt.clientX - rect.left;
    state.grabDY = pt.clientY - rect.top;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }
  function onMove(e) {
    const pt = e;
    if (!moved && Math.hypot(pt.clientX - downX, pt.clientY - downY) > DRAG_THRESH) {
      moved = true; dragging = true;
      state.mode = 'drag';
      el.classList.add('dragging');
      setSprite('slimeDrag');           // 換成拖曳懸空精靈（18×17）
      state.dripT = 0.5;                 // 抓起後半秒才開始滴
      // 抓取偏移改以「頂部中心」為錨（配合拖曳精靈的頂部錨點）
      state.grabDX = (DRAG_W * PX) / 2;
      state.grabDY = 6;
      if (state.onGrab) state.onGrab(); // 通知對話系統關閉泡泡
    }
    if (dragging) {
      e.preventDefault();
      state.x = pt.clientX - state.grabDX;
      state.y = pt.clientY - state.grabDY;
    }
  }
  function onUp(e) {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    el.classList.remove('dragging');
    if (dragging) {
      // 放手：清掉滴水、換回爬行精靈、補間回最近邊框
      clearDrips();
      setSprite('slime');
      state.retFrom = { x: state.x, y: state.y };
      state.retTo = nearestD(state.x, state.y);
      state.retT = 0;
      state.mode = 'return';
    } else {
      // 沒拖動 = 點擊 → 開啟對話
      if (state.onClick) state.onClick();
    }
  }
  el.addEventListener('pointerdown', onDown);

  return state;
}

// ============================================================
// Slimo 對話系統：點擊 Slimo → 像素對話泡泡（軟萌人設）
// 面板可切到：來點音樂（迷你播放清單）/ 陪我玩（餵食+接接看）/ 隨便聊
// ============================================================

// --- 音樂清單（佔位檔名；把真的音檔丟進 public/music/ 後改這裡即可，見該資料夾 README） ---
const MUSIC = [
  { title: '雨天的 debug', src: '/music/rainy-debug.mp3' },
  { title: '梯度下降到天亮', src: '/music/gradient-lullaby.mp3' },
  { title: '像素海邊', src: '/music/pixel-beach.mp3' },
  { title: 'segfault 也沒關係', src: '/music/segfault-ok.mp3' },
];

// 軟萌台詞庫
const LINES = {
  greet: [
    '呀～被你抓到了！嘿嘿，要一起玩嗎？',
    '你好你好！我是 Slimo，黏黏的但很乖唷～',
    '啵啵…（把自己戳成一坨）欸嘿，你來啦！',
    '偵測到一位人類。友善度…100%！要做點什麼嗎？',
  ],
  music: ['要放什麼歌呢～我幫你切♪', '音樂音樂！我最喜歡有節奏地晃來晃去了～'],
  play: ['嘿嘿要玩什麼？我都可以喔！', '陪我玩嘛陪我玩嘛～'],
  chat: [
    '今天也有好好休息嗎？別一直盯著螢幕啦。',
    '梯度會下降，心情也會慢慢好起來的，真的。',
    '如果卡關了，就先喝口水，我在這裡等你回來。',
    '你已經很努力了唷，我看得到的。啵——',
    '要不要摸摸我？據說摸史萊姆可以降低 bug 產生率（我瞎掰的）。',
  ],
  feed: [
    '唔姆…好吃！再一個再一個～',
    '啊嗯～謝謝你！我又變 Q 了一點！',
    '幸福…這就是被餵食的感覺嗎（融化）',
  ],
  poke: [
    '啵嘿！（彈回原狀）',
    '呀！癢癢的啦～',
    '再戳我就要黏住你的手指囉…開玩笑的嘿嘿',
  ],
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// 打字機效果
function typeInto(node, text, done) {
  node.textContent = '';
  const caret = document.createElement('span');
  caret.className = 'caret';
  node.appendChild(caret);
  let i = 0;
  clearInterval(node._typer);
  node._typer = setInterval(() => {
    i++;
    caret.remove();
    node.textContent = text.slice(0, i);
    node.appendChild(caret);
    if (i >= text.length) { clearInterval(node._typer); if (done) done(); }
  }, 28);
}

function initDialogue() {
  const cr = crawler;
  if (!cr) return;

  // 建立對話泡泡 DOM（一次）
  const box = document.createElement('div');
  box.className = 'slimo-dialog';
  box.innerHTML = `
    <div class="dtop">
      <span class="dname">◆ Slimo</span>
      <button class="dclose" aria-label="關閉">✕</button>
    </div>
    <div class="dbody"></div>`;
  document.body.appendChild(box);
  const body = box.querySelector('.dbody');

  let open = false;
  let followRAF = 0;
  let audio = null;      // 目前的 <audio>
  let curTrack = -1;

  // 讓泡泡跟著 Slimo（Slimo 在巡行/回歸時會移動）
  function follow() {
    if (!open) return;
    const W = window.innerWidth, H = window.innerHeight;
    const bw = box.offsetWidth, bh = box.offsetHeight;
    // Slimo 中心
    const sx = cr.x + S / 2, sy = cr.y + SH / 2;
    // 預設放在 Slimo 上方；空間不足則放下方
    let up = false;
    let top = cr.y - bh - 14;
    if (top < 8) { top = cr.y + SH + 14; up = true; }
    let left = sx - bw / 2;
    left = Math.max(8, Math.min(left, W - bw - 8));
    box.style.left = left + 'px';
    box.style.top = Math.max(8, Math.min(top, H - bh - 8)) + 'px';
    box.classList.toggle('up', up);
    // 尖角對齊 Slimo
    box.style.setProperty('--tailX', Math.max(12, Math.min(sx - left - 8, bw - 24)) + 'px');
    followRAF = requestAnimationFrame(follow);
  }

  function show() {
    open = true;
    cr.paused = true;        // 對話期間 Slimo 停在原地，方便點按鈕
    box.classList.add('open');
    cancelAnimationFrame(followRAF);
    follow();
  }
  function close() {
    open = false;
    cr.paused = false;       // 關閉後從原位繼續沿邊框爬
    box.classList.remove('open');
    cancelAnimationFrame(followRAF);
    if (box._cleanup) { box._cleanup(); box._cleanup = null; } // 停掉正在跑的遊戲迴圈
    if (audio) { audio.pause(); }
  }

  // 掛進 crawler：點擊開啟、抓取時關閉
  cr.onClick = () => { open ? close() : (renderMenu(), show()); };
  cr.onGrab = () => close();
  box.querySelector('.dclose').addEventListener('click', close);

  // 切換面板前，先停掉上一個面板可能還在跑的遊戲迴圈
  function resetBody(html) {
    if (box._cleanup) { box._cleanup(); box._cleanup = null; }
    body.innerHTML = html;
  }

  // 用一個 helper 組出「Slimo 說一句 + 幾個動作按鈕」
  function renderTalk(line, acts, backLabel, onBack) {
    resetBody('<p class="slimo-say"></p><div class="slimo-acts"></div>');
    const say = body.querySelector('.slimo-say');
    const actsBox = body.querySelector('.slimo-acts');
    typeInto(say, line, () => {
      acts.forEach((a, i) => {
        const b = document.createElement('button');
        b.className = 'slimo-act';
        b.innerHTML = `<span class="k">${i + 1}</span><span>${a.label}</span>`;
        b.addEventListener('click', a.onClick);
        actsBox.appendChild(b);
      });
      if (backLabel) {
        const bk = document.createElement('button');
        bk.className = 'slimo-back';
        bk.textContent = backLabel;
        bk.addEventListener('click', onBack);
        body.appendChild(bk);
      }
    });
  }

  // 主選單
  function renderMenu() {
    renderTalk(pick(LINES.greet), [
      { label: '♪ 來點音樂', onClick: renderMusic },
      { label: '⚑ 陪我玩', onClick: renderPlayMenu },
      { label: '✎ 隨便聊聊', onClick: renderChat },
    ]);
  }

  function renderChat() {
    renderTalk(pick(LINES.chat), [
      { label: '↺ 再說一句', onClick: renderChat },
    ], '‹ 回上一頁', renderMenu);
  }

  // --- 音樂播放器 ---
  function ensureAudio() {
    if (!audio) {
      audio = new Audio();
      audio.addEventListener('ended', () => playTrack((curTrack + 1) % MUSIC.length));
      audio.addEventListener('error', () => { /* 佔位檔不存在時靜默 */ });
    }
    return audio;
  }
  function playTrack(i) {
    curTrack = i;
    const a = ensureAudio();
    a.src = MUSIC[i].src;
    a.play().catch(() => {});
    updatePlayerUI();
  }
  function updatePlayerUI() {
    const cur = body.querySelector('.pcur');
    const playing = audio && !audio.paused;
    if (cur) cur.textContent = (curTrack < 0)
      ? '♪ ── 還沒選歌 ──'
      : (playing ? '▶ ' : '⏸ ') + MUSIC[curTrack].title;
    body.querySelectorAll('.slimo-track').forEach((t, i) =>
      t.classList.toggle('on', i === curTrack));
    const pp = body.querySelector('.btnPlay');
    if (pp) pp.textContent = playing ? '⏸' : '▶';
  }
  function renderMusic() {
    resetBody(`
      <p class="slimo-say" style="min-height:0;margin-bottom:8px"></p>
      <div class="slimo-player">
        <div class="pcur">♪ ── 還沒選歌 ──</div>
        <div class="pctrls">
          <button class="btnPrev" aria-label="上一首">⏮</button>
          <button class="btnPlay" aria-label="播放/暫停">▶</button>
          <button class="btnNext" aria-label="下一首">⏭</button>
        </div>
        <div class="plist"></div>
      </div>
      <button class="slimo-back">‹ 回上一頁</button>`);
    typeInto(body.querySelector('.slimo-say'), pick(LINES.music));
    const list = body.querySelector('.plist');
    MUSIC.forEach((m, i) => {
      const row = document.createElement('div');
      row.className = 'slimo-track';
      row.innerHTML = `<span class="tnum">${String(i + 1).padStart(2, '0')}</span><span>${m.title}</span>`;
      row.addEventListener('click', () => playTrack(i));
      list.appendChild(row);
    });
    body.querySelector('.btnPrev').addEventListener('click', () =>
      playTrack(curTrack <= 0 ? MUSIC.length - 1 : curTrack - 1));
    body.querySelector('.btnNext').addEventListener('click', () =>
      playTrack(curTrack < 0 ? 0 : (curTrack + 1) % MUSIC.length));
    body.querySelector('.btnPlay').addEventListener('click', () => {
      const a = ensureAudio();
      if (curTrack < 0) { playTrack(0); return; }
      if (a.paused) a.play().catch(() => {}); else a.pause();
      updatePlayerUI();
    });
    body.querySelector('.slimo-back').addEventListener('click', renderMenu);
    updatePlayerUI();
  }

  // --- 小遊戲選單 ---
  function renderPlayMenu() {
    renderTalk(pick(LINES.play), [
      { label: '✿ 餵食 / 戳戳樂', onClick: renderPet },
      { label: '◒ 像素接接看', onClick: renderCatch },
    ], '‹ 回上一頁', renderMenu);
  }

  // 餵食 / 戳戳樂：無勝負、純療癒。點 Slimo 頭像 → 變形 + 累計次數
  function renderPet() {
    resetBody(`
      <p class="slimo-say" style="min-height:0;margin-bottom:8px"></p>
      <div class="slimo-game">
        <div class="gstat"><span>互動 <b class="petN">0</b></span><span class="petMood">心情：普通</span></div>
        <canvas class="slimo-gcanvas petcv" width="120" height="80"></canvas>
        <div class="fx gap8">
          <button class="slimo-act" style="justify-content:center"><span>✿ 餵食</span></button>
          <button class="slimo-act" style="justify-content:center"><span>☞ 戳一下</span></button>
        </div>
        <p class="slimo-hint">餵食會讓 Slimo 變 Q，戳一下它會彈回來。沒有輸贏，就是陪陪它。</p>
      </div>
      <button class="slimo-back">‹ 回上一頁</button>`);
    typeInto(body.querySelector('.slimo-say'), '嘿嘿，摸摸我或餵我嘛～');
    const cv = body.querySelector('.petcv');
    const ctx = cv.getContext('2d');
    let n = 0, squish = 0, fed = 0;
    const [btnFeed, btnPoke] = body.querySelectorAll('.slimo-game .slimo-act');
    const petN = body.querySelector('.petN');
    const petMood = body.querySelector('.petMood');
    let alive = true;

    function moodText() {
      if (fed > 8) return '心情：幸福到融化';
      if (n > 10) return '心情：超開心';
      if (n > 4) return '心情：開心';
      return '心情：普通';
    }
    function drawPet(now) {
      if (!alive) return;
      requestAnimationFrame(drawPet);
      const t = now / 1000;
      squish *= 0.88; // 回彈
      const breathe = Math.sin(t * 3) * 0.03;
      const sy = 1 + squish + breathe;
      const sx = 1 / sy;
      const p = theme === 'dark' ? PAL_BLUE : PAL_CORAL;
      ctx.clearRect(0, 0, cv.width, cv.height);
      // 置中畫 18×12 Slimo，放大約 4.4x，套用擠壓
      const scale = 4.4;
      const w = 18 * scale, h = 12 * scale;
      ctx.save();
      ctx.translate(cv.width / 2, cv.height - 6);
      ctx.scale(sx, sy);
      ctx.translate(-w / 2, -h);
      ctx.imageSmoothingEnabled = false;
      SPRITES.slime.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const c = p[row[x]];
          if (c) { ctx.fillStyle = c; ctx.fillRect(x * scale, y * scale, scale, scale); }
        }
      });
      ctx.restore();
    }
    requestAnimationFrame(drawPet);

    function react(kind) {
      n++; petN.textContent = n;
      if (kind === 'feed') { fed++; squish = Math.min(0.5, squish + 0.28); }
      else { squish = -0.22; } // 戳 → 先壓扁再彈
      petMood.textContent = moodText();
      typeInto(body.querySelector('.slimo-say'), pick(kind === 'feed' ? LINES.feed : LINES.poke));
    }
    btnFeed.addEventListener('click', () => react('feed'));
    btnPoke.addEventListener('click', () => react('poke'));
    cv.addEventListener('pointerdown', () => react('poke'));
    // 離開此頁時停止動畫
    body.querySelector('.slimo-back').addEventListener('click', () => { alive = false; renderPlayMenu(); });
    box._cleanup = () => { alive = false; };
  }

  // 像素接接看：Slimo 在底部左右移動，接住落下的像素方塊，30 秒計分
  function renderCatch() {
    resetBody(`
      <p class="slimo-say" style="min-height:0;margin-bottom:8px"></p>
      <div class="slimo-game">
        <div class="gstat"><span>分數 <b class="scoreN">0</b></span><span>時間 <b class="timeN">30</b>s</span></div>
        <canvas class="slimo-gcanvas catchcv" width="140" height="100"></canvas>
        <p class="slimo-hint">滑鼠移動（或觸控）左右移動 Slimo，接住掉下來的星星★。碰到會扣分的臭蟲要閃開！</p>
      </div>
      <button class="slimo-back">‹ 回上一頁</button>`);
    typeInto(body.querySelector('.slimo-say'), '接住星星！臭蟲不要接喔～');
    const cv = body.querySelector('.catchcv');
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    let px = W / 2;          // Slimo x（中心）
    const pw = 22, ph = 14;
    let score = 0, timeLeft = 30, running = true;
    let items = [];         // {x,y,vy,bug}
    let spawnT = 0, last = performance.now();
    const scoreN = body.querySelector('.scoreN');
    const timeN = body.querySelector('.timeN');

    function movePointer(e) {
      const r = cv.getBoundingClientRect();
      const pt = e.touches ? e.touches[0] : e;
      px = Math.max(pw / 2, Math.min(W - pw / 2, (pt.clientX - r.left) * (W / r.width)));
    }
    cv.addEventListener('pointermove', movePointer);
    cv.addEventListener('pointerdown', movePointer);

    const timer = setInterval(() => {
      if (!running) return;
      timeLeft--; timeN.textContent = timeLeft;
      if (timeLeft <= 0) endGame();
    }, 1000);

    function endGame() {
      running = false;
      clearInterval(timer);
      typeInto(body.querySelector('.slimo-say'),
        score >= 8 ? `${score} 分！你超強的啦～再一場？` : `${score} 分～沒關係，陪我再玩一次嘛！`);
    }

    function loop(now) {
      if (!running) return;
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      // 生成
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnT = 0.7 + Math.random() * 0.5;
        items.push({ x: 8 + Math.random() * (W - 16), y: -6, vy: 45 + Math.random() * 35, bug: Math.random() < 0.28 });
      }
      // 更新 + 碰撞
      const catchY = H - ph - 4;
      items.forEach((it) => { it.y += it.vy * dt; });
      items = items.filter((it) => {
        if (it.y >= catchY && it.y <= catchY + ph && Math.abs(it.x - px) < pw / 2 + 5) {
          score += it.bug ? -3 : 1;
          if (score < 0) score = 0;
          scoreN.textContent = score;
          return false;
        }
        return it.y < H + 8;
      });
      // 繪製
      const p = theme === 'dark' ? PAL_BLUE : PAL_CORAL;
      ctx.clearRect(0, 0, W, H);
      // 掉落物
      items.forEach((it) => {
        if (it.bug) { ctx.fillStyle = '#FF6B6B'; ctx.fillRect(it.x - 4, it.y - 4, 8, 8); ctx.fillStyle = '#16161E'; ctx.fillRect(it.x - 4, it.y - 1, 8, 2); }
        else { ctx.fillStyle = '#FFC145'; ctx.fillRect(it.x - 2, it.y - 5, 4, 10); ctx.fillRect(it.x - 5, it.y - 2, 10, 4); }
      });
      // Slimo 接盤（縮小版精靈）
      const scale = 1.4; const sw = 18 * scale;
      ctx.save();
      ctx.translate(px - sw / 2, catchY - 12 * scale + ph);
      ctx.imageSmoothingEnabled = false;
      SPRITES.slime.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const c = p[row[x]];
          if (c) { ctx.fillStyle = c; ctx.fillRect(x * scale, y * scale, scale, scale); }
        }
      });
      ctx.restore();
    }
    requestAnimationFrame(loop);
    body.querySelector('.slimo-back').addEventListener('click', () => { running = false; clearInterval(timer); renderPlayMenu(); });
    box._cleanup = () => { running = false; clearInterval(timer); };
  }
}

// --- 404 戳一下彈跳 ---
function initBoing() {
  const box = document.querySelector('[data-boing]');
  const big = box && box.querySelector('.bigslime');
  if (!box || !big) return;
  const boing = () => {
    if (big.classList.contains('boing')) return;
    big.classList.add('boing');
  };
  big.addEventListener('animationend', () => big.classList.remove('boing'));
  box.addEventListener('mouseenter', boing);
  box.addEventListener('click', boing);
}

// --- 初始化 ---
export function initSite() {
  const root = document.getElementById('site');
  // 讀取已套用的主題（防閃爍 inline script 已在 <head> 設好 class）
  theme = root && root.classList.contains('dark') ? 'dark' : 'light';
  const btn = document.getElementById('themeBtn');
  if (btn) {
    btn.textContent = theme === 'light' ? '◼ DARK' : '◻ LIGHT';
    btn.addEventListener('click', toggleTheme);
  }
  buildWipe();
  redrawAll();
  startCrawler();
  initDialogue();
  initBoing();
}
