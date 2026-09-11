import { W, H, TAU, PAL, hash, mod, poly, line, circle, halo, plate } from './shared.js';

// 繪製海面波紋與兩側艦島，營造第一關海上場景的縱向捲動。
export function sea(c, t) {
  const y = mod(t * 26, 124);
  c.strokeStyle = '#85cbd5';
  c.lineWidth = 1;
  for (let row = -1; row < 8; row++) {
    const py = row * 124 + y;
    for (let j = 0; j < 7; j++) {
      const x = hash(row * 17 + j) * W;
      c.globalAlpha = 0.055 + j * 0.008;
      line(
        c,
        [
          [x - 20, py + j * 11],
          [x + 3, py + j * 11 - 2],
          [x + 34, py + j * 11],
        ],
        '#8bdfe5'
      );
    }
  }
  c.globalAlpha = 1;
  for (let side = 0; side < 2; side++) {
    c.save();
    if (side) {
      c.translate(W, 0);
      c.scale(-1, 1);
    }
    for (let n = -1; n < 4; n++) {
      const yy = n * 310 + mod(t * 36, 310);
      poly(
        c,
        [
          [0, yy],
          [53, yy + 10],
          [53, yy + 38],
          [95, yy + 38],
          [95, yy + 61],
          [52, yy + 61],
          [52, yy + 181],
          [75, yy + 181],
          [75, yy + 208],
          [42, yy + 208],
          [42, yy + 260],
          [0, yy + 272],
        ],
        '#172c38',
        '#294956'
      );
      line(
        c,
        [
          [13, yy + 12],
          [13, yy + 251],
        ],
        '#47606a'
      );
      for (let q = 0; q < 5; q++) {
        plate(c, 22, yy + 73 + q * 19, 23, 12, q % 2 ? '#29404b' : '#34444a', '#435966', 2);
        c.fillStyle = '#83c3cc';
        c.fillRect(49, yy + 82 + q * 19, 2, 4);
      }
      line(
        c,
        [
          [54, yy + 42],
          [89, yy + 42],
          [89, yy + 56],
        ],
        '#b98a5f',
        2
      );
      circle(c, 89, yy + 55, 2, '#d6b66f');
    }
    c.restore();
  }
  c.globalAlpha = 0.15;
  line(
    c,
    [
      [240, 0],
      [240, H],
    ],
    '#4b9caf'
  );
  c.globalAlpha = 1;
}

// 繪製兩側峽谷岩壁與冰原變化，營造峽谷關卡的縱向捲動背景。

// 繪製兩側峽谷岩壁與冰原變化，營造峽谷關卡的縱向捲動背景。
export function canyon(c, t, ice = false) {
  const scroll = mod(t * 32, 260),
    rim = ice ? '#628296' : '#396953';
  const dark = ice ? '#182e43' : '#17302b',
    face = ice ? '#28475a' : '#1d4939';
  for (let side = 0; side < 2; side++) {
    c.save();
    if (side) {
      c.translate(W, 0);
      c.scale(-1, 1);
    }
    for (let n = -2; n < 4; n++) {
      const yy = n * 260 + scroll,
        seed = n + side * 51;
      const a = 70 + hash(seed) * 48,
        b = 34 + hash(seed + 3) * 50;
      poly(
        c,
        [
          [0, yy - 20],
          [a - 20, yy],
          [a + 8, yy + 48],
          [b, yy + 111],
          [a - 16, yy + 180],
          [a + 4, yy + 225],
          [0, yy + 282],
        ],
        dark,
        '#304e4e'
      );
      poly(
        c,
        [
          [0, yy],
          [a - 20, yy],
          [a + 8, yy + 48],
          [a - 27, yy + 76],
          [21, yy + 56],
        ],
        face,
        rim
      );
      poly(
        c,
        [
          [20, yy + 70],
          [a - 27, yy + 76],
          [b, yy + 111],
          [a - 16, yy + 180],
          [14, yy + 153],
        ],
        ice ? '#304b60' : '#28513c'
      );
      poly(
        c,
        [
          [0, yy + 164],
          [a - 16, yy + 180],
          [a + 4, yy + 225],
          [43, yy + 248],
          [0, yy + 223],
        ],
        face,
        rim
      );
      line(
        c,
        [
          [a - 20, yy],
          [a + 8, yy + 48],
          [b, yy + 111],
          [a - 16, yy + 180],
          [a + 4, yy + 225],
        ],
        rim,
        2
      );
      if (ice) {
        poly(
          c,
          [
            [22, yy + 7],
            [a - 20, yy],
            [a + 8, yy + 48],
            [a - 14, yy + 42],
            [a - 32, yy + 19],
          ],
          '#7699a8'
        );
        for (let j = 0; j < 3; j++)
          line(
            c,
            [
              [28 + j * 12, yy + 160],
              [32 + j * 15, yy + 209],
            ],
            '#47667c'
          );
      } else {
        for (let j = 0; j < 7; j++)
          circle(c, 8 + hash(seed * 22 + j) * 40, yy + 18 + j * 31, 5 + hash(j + seed) * 6, '#326446');
      }
    }
    c.restore();
  }
  if (ice) {
    for (let i = 0; i < 28; i++) {
      const x = hash(i + 70) * W,
        y = mod(hash(i + 30) * H + t * (8 + hash(i) * 12), H);
      c.globalAlpha = 0.12 + hash(i + 23) * 0.2;
      circle(c, x, y, hash(i + 4) * 1.2 + 0.5, '#bbdaeb');
    }
    c.globalAlpha = 1;
  } else {
    c.globalAlpha = 0.2;
    for (let i = 0; i < 10; i++) {
      const y = mod(i * 91 + t * 39, 880) - 40;
      line(
        c,
        [
          [145 + Math.sin(y * 0.008) * 20, y],
          [255 + Math.cos(y * 0.009) * 34, y + 8],
          [325, y + 3],
        ],
        '#4f9690'
      );
    }
    c.globalAlpha = 1;
  }
}

// 繪製工廠牆面管線與機櫃，營造室內工廠關卡的循環背景。

// 繪製工廠牆面管線與機櫃，營造室內工廠關卡的循環背景。
export function factory(c, t) {
  const offset = mod(t * 38, 196);
  for (let y = -196; y < H; y += 196) {
    const yy = y + offset;
    line(
      c,
      [
        [0, yy],
        [W, yy],
      ],
      '#4b3b41'
    );
    for (const x of [26, 110, 368, 452]) {
      line(
        c,
        [
          [x, yy],
          [x, yy + 196],
        ],
        '#3d323b'
      );
      c.fillStyle = '#342e37';
      c.fillRect(x - 8, yy + 45, 16, 106);
      c.fillStyle = '#704233';
      c.fillRect(x - 3, yy + 52, 6, 91);
      c.fillStyle = '#be7545';
      c.fillRect(x - 1, yy + 52, 2, 91);
    }
    for (const x of [-20, 408]) {
      plate(c, x, yy + 12, 90, 146, '#292833', '#60515a', 11);
      plate(c, x + 14, yy + 27, 59, 67, '#131c28', '#8d674a', 7);
      for (let k = 0; k < 6; k++) {
        c.fillStyle = k % 2 ? '#6e4939' : '#ae673d';
        c.fillRect(x + 20, yy + 36 + k * 8, 47, 3);
      }
      circle(c, x + 45, yy + 126, 12, '#171e29', '#574956', 3);
      circle(c, x + 45, yy + 126, 3, '#e6a061');
    }
    c.globalAlpha = 0.25;
    line(
      c,
      [
        [180, yy + 20],
        [153, yy + 47],
        [153, yy + 137],
        [180, yy + 165],
      ],
      '#967361'
    );
    line(
      c,
      [
        [300, yy + 20],
        [327, yy + 47],
        [327, yy + 137],
        [300, yy + 165],
      ],
      '#967361'
    );
    c.globalAlpha = 1;
  }
}

// 繪製星空粒子與軌道環，營造軌道關卡的太空背景。

// 繪製星空粒子與軌道環，營造軌道關卡的太空背景。
export function orbit(c, t) {
  halo(c, 330, 200, 290, '#30255055');
  for (let i = 0; i < 82; i++) {
    const depth = hash(i + 88),
      x = hash(i + 13) * W,
      y = mod(hash(i) * H + t * (7 + depth * 25), H);
    c.globalAlpha = 0.15 + depth * 0.5;
    c.fillStyle = i % 7 === 0 ? '#c8b6f0' : '#9fbad9';
    c.fillRect(x, y, depth > 0.8 ? 1.6 : 0.8, depth > 0.8 ? 2.4 : 1.3);
  }
  c.globalAlpha = 1;
  const yy = mod(t * 20, 1160) - 260;
  c.save();
  c.translate(320, yy);
  c.rotate(-0.3);
  c.beginPath();
  c.ellipse(0, 0, 285, 85, 0, 0, TAU);
  c.strokeStyle = '#55577744';
  c.lineWidth = 18;
  c.stroke();
  c.beginPath();
  c.ellipse(0, 0, 285, 85, 0, 0, TAU);
  c.strokeStyle = '#8782a04d';
  c.lineWidth = 1;
  c.stroke();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    line(
      c,
      [
        [Math.cos(a) * 272, Math.sin(a) * 79],
        [Math.cos(a) * 296, Math.sin(a) * 91],
      ],
      '#9495b138',
      2
    );
  }
  c.restore();
}

// 靜層快取：底色漸層只與關卡有關，遮罩＋掃描線與關卡無關。
// 每幀新建漸層＋200 次掃描線描邊是背景最大開銷，改為離屏各畫一次、每幀兩次 drawImage 貼回。
// 捲動地景（sea/canyon/factory/orbit）仍逐幀繪製，視覺順序與舊路徑一致：底色 → 地景 → 遮罩 → 掃描線。
const baseCache = new Map();
let overlayCache = null;

// 建立與邏輯舞台同尺寸的離屏畫布；無 DOM 環境（如單元測試）回傳空。
function makeLayer() {
  try {
    if (typeof document !== 'undefined' && document.createElement) {
      const el = document.createElement('canvas');
      el.width = W;
      el.height = H;
      const ctx = el.getContext('2d');
      if (ctx) return [el, ctx];
    } else if (typeof OffscreenCanvas !== 'undefined') {
      const el = new OffscreenCanvas(W, H);
      const ctx = el.getContext('2d');
      if (ctx) return [el, ctx];
    }
  } catch {
    /* 無畫布環境時退回逐幀繪製。 */
  }
  return null;
}

// 取指定關卡的底色靜層；建一次後重複貼用。
function getBase(stage) {
  const key = stage | 0;
  if (baseCache.has(key)) return baseCache.get(key);
  const layer = makeLayer();
  if (!layer) return null;
  const [el, ctx] = layer;
  const p = PAL[key] || PAL[0];
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, p[1]);
  gradient.addColorStop(0.46, p[0]);
  gradient.addColorStop(1, p[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  baseCache.set(key, el);
  return el;
}

// 取共用的遮罩＋掃描線靜層；五關同一張。
function getOverlay() {
  if (overlayCache) return overlayCache;
  const layer = makeLayer();
  if (!layer) return null;
  const [el, ctx] = layer;
  const shade = ctx.createLinearGradient(0, 0, W, 0);
  shade.addColorStop(0, '#03091366');
  shade.addColorStop(0.2, 'transparent');
  shade.addColorStop(0.8, 'transparent');
  shade.addColorStop(1, '#03091366');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#b4d7e10b';
  ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }
  overlayCache = el;
  return el;
}

// 依關卡鋪漸層底色並調度對應場景，再疊加陰影與掃描線。
export function background(c, stage, time) {
  const s = stage | 0;
  const base = getBase(s);
  const overlay = getOverlay();
  if (base && overlay && typeof c.drawImage === 'function') {
    c.drawImage(base, 0, 0, W, H);
    if (s === 0) sea(c, time);
    else if (s === 1 || s === 2) canyon(c, time, s === 2);
    else if (s === 3) factory(c, time);
    else orbit(c, time);
    // 寬陰影讓彈道沉穩，同時保留可見地形。
    c.drawImage(overlay, 0, 0, W, H);
    return;
  }
  const p = PAL[s],
    gradient = c.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, p[1]);
  gradient.addColorStop(0.46, p[0]);
  gradient.addColorStop(1, p[1]);
  c.fillStyle = gradient;
  c.fillRect(0, 0, W, H);
  if (s === 0) sea(c, time);
  else if (s === 1 || s === 2) canyon(c, time, s === 2);
  else if (s === 3) factory(c, time);
  else orbit(c, time);
  // 寬陰影讓彈道沉穩，同時保留可見地形。
  const shade = c.createLinearGradient(0, 0, W, 0);
  shade.addColorStop(0, '#03091366');
  shade.addColorStop(0.2, 'transparent');
  shade.addColorStop(0.8, 'transparent');
  shade.addColorStop(1, '#03091366');
  c.fillStyle = shade;
  c.fillRect(0, 0, W, H);
  c.strokeStyle = '#b4d7e10b';
  c.lineWidth = 1;
  for (let y = 0; y < H; y += 4) {
    c.beginPath();
    c.moveTo(0, y + 0.5);
    c.lineTo(W, y + 0.5);
    c.stroke();
  }
}

// 測試鉤子：查詢快取狀態與清空快取（不影響遊戲邏輯）。
export function __backgroundCacheStats() {
  return { bases: baseCache.size, hasOverlay: !!overlayCache };
}
export function __clearBackgroundCache() {
  baseCache.clear();
  overlayCache = null;
}

// 繪製引擎尾焰漸層火焰，表現推進器閃爍的推進效果。
