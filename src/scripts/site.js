// ============================================================
// debug.log — 全站客戶端腳本
// 主題切換（含 localStorage 持久化 + wipe 轉場）、Slimo 像素繪製、爬行動畫。
// 沿用 Claude Design .dc.html 的 SLIME/palette/drawMap/crawler 邏輯，
// 但改成掃描 DOM 上的 canvas[data-slime] 一次驅動所有 Slimo。
// ============================================================

// Slimo 調色盤：dark=藍色、light=珊瑚色
const PAL_BLUE  = { K:'#10101A', B:'#45C6F0', D:'#1E6BD6', E:'#0C2F8F', W:'#FFFFFF', C:'#CFF6FF' };
const PAL_CORAL = { K:'#10101A', B:'#FF8A70', D:'#E0503A', E:'#8C1F33', W:'#FFFFFF', C:'#FFD9CC' };

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
  ]
};

let theme = 'light';

function pal() { return theme === 'dark' ? PAL_BLUE : PAL_CORAL; }

function drawMap(canvas, rows) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const p = pal();
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
    const rows = SPRITES[el.getAttribute('data-slime')] || SPRITES.slime;
    drawMap(el, rows);
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

// --- 爬行 Slimo ---
function startCrawler() {
  const el = document.getElementById('crawler');
  const canvas = el && el.querySelector('canvas');
  if (!el || !canvas) return;
  const t0 = performance.now();
  const SPEED = 55, S = 54, SH = 36;
  function step(now) {
    requestAnimationFrame(step);
    const W = window.innerWidth, H = window.innerHeight;
    const L1 = W - S, L2 = H - SH, per = 2 * (L1 + L2);
    const t = (now - t0) / 1000;
    let d = (t * SPEED) % per, x, y, r;
    if (d < L1) { x = d; y = H - SH; r = 0; }
    else if (d < L1 + L2) { x = W - S + 3; y = H - SH - (d - L1); r = -90; }
    else if (d < 2 * L1 + L2) { x = W - S - (d - L1 - L2); y = -3; r = 180; }
    else { x = -3; y = d - 2 * L1 - L2; r = 90; }
    const ph = Math.abs(Math.sin(t * 6));
    const hop = -ph * 7;
    const sy = 0.82 + 0.26 * ph, sx = 1 / sy;
    el.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + r + 'deg) translateY(' + hop + 'px)';
    canvas.style.transformOrigin = '50% 100%';
    canvas.style.transform = 'scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
  }
  requestAnimationFrame(step);
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
  initBoing();
}
