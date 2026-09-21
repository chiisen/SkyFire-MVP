// 原創程序美術。座標皆用遊戲 480×800 舞台。
const W = 480,
  H = 800,
  TAU = Math.PI * 2;
const LOOT = { pulse: ['#60baff', 'P'], laser: ['#6eecb7', 'L'], arc: ['#c59aff', 'A'], nova: ['#ffd576', 'N'] };
const PAL = [
  ['#071422', '#15354a', '#31697b'],
  ['#071b22', '#143835', '#468772'],
  ['#0b1b30', '#284251', '#799baf'],
  ['#1c1521', '#3f2b31', '#bd653d'],
  ['#090d23', '#212143', '#7076b1'],
];
// 將數值箝制於上下限之間，避免繪製參數越界。
const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
// 依整數種子產生確定性偽隨機小數，供散佈景物位置使用。
const hash = (n) => {
  const f = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return f - Math.floor(f);
};
// 取正餘數讓背景捲動與循環動畫無縫銜接。
const mod = (n, d) => ((n % d) + d) % d;

// 串連多邊形路徑並填色描邊，供機體與地形繪製共用。

// 串連多邊形路徑並填色描邊，供機體與地形繪製共用。
export function poly(c, points, fill, stroke, width = 1) {
  c.beginPath();
  c.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) c.lineTo(points[i][0], points[i][1]);
  c.closePath();
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
// 串連折線路徑並描邊，供地景線條與特效線段使用。

// 串連折線路徑並描邊，供地景線條與特效線段使用。
export function line(c, points, color, width = 1) {
  c.beginPath();
  c.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) c.lineTo(points[i][0], points[i][1]);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
// 繪製圓形並可選填色描邊，供子彈圓點與裝飾細節使用。

// 繪製圓形並可選填色描邊，供子彈圓點與裝飾細節使用。
export function circle(c, x, y, r, fill, stroke, width = 1) {
  c.beginPath();
  c.arc(x, y, Math.max(0, r), 0, TAU);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
// 以放射漸層繪製光暈，供星空與發光體襯底使用。

// 以放射漸層繪製光暈，供星空與發光體襯底使用。
export function halo(c, x, y, r, color) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'transparent');
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}
// 繪製切角矩形裝甲板，供建築面板與機體結構使用。

// 繪製切角矩形裝甲板，供建築面板與機體結構使用。
export function plate(c, x, y, w, h, fill, edge, cut = 5) {
  poly(
    c,
    [
      [x + cut, y],
      [x + w - cut, y],
      [x + w, y + cut],
      [x + w, y + h - cut],
      [x + w - cut, y + h],
      [x + cut, y + h],
      [x, y + h - cut],
      [x, y + cut],
    ],
    fill,
    edge
  );
}

// 將十六進位色旋轉指定色相角度並可放大飽和度，供敵人隨機配色；結果依參數快取。
const hueCache = new Map();
export function shiftHue(hex, deg, satScale = 1) {
  const key = `${hex}|${Math.round(deg)}|${satScale}`;
  const hit = hueCache.get(key);
  if (hit) return hit;
  const r = parseInt(hex.slice(1, 3), 16) / 255,
    g = parseInt(hex.slice(3, 5), 16) / 255,
    b = parseInt(hex.slice(5, 7), 16) / 255,
    max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    l = (max + min) / 2,
    d = max - min;
  let h = 0,
    sat = 0;
  if (d) {
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6 : max === g ? ((b - r) / d + 2) / 6 : ((r - g) / d + 4) / 6;
  }
  sat = Math.min(1, sat * satScale);
  h = (h + deg / 360) % 1;
  if (h < 0) h += 1;
  const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat,
    p = 2 * l - q,
    to = (t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    },
    rgb = [to(h + 1 / 3), to(h), to(h - 1 / 3)].map((v) => Math.round(v * 255)),
    out = `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  hueCache.set(key, out);
  return out;
}

// 繪製海面波紋與兩側艦島，營造第一關海上場景的縱向捲動。

export { W, H, TAU, LOOT, PAL, clamp, hash, mod };
