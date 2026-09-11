import { WEAPONS } from '../data.js';

// 將數值限制在上下界之間（參數 v、lo、hi，回傳夾取後數值）。
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const TAU = Math.PI * 2;
// 計算兩點間距離平方（用於碰撞與追蹤比大小，免開根號）。
export const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
// 計算點到線段的最短距離（參數點座標與線段端點，回傳距離）。
// 熱路徑每幀呼叫上千次：只用 Math.sqrt 而不用 Math.hypot（少可變參數開銷），結果一致。
export function segmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1,
    dy = y2 - y1;
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  const ex = px - x1 - t * dx,
    ey = py - y1 - t * dy;
  return Math.sqrt(ex * ex + ey * ey);
}
// 點到線段距離平方：粗排階段免開根號使用，通過後再用 segmentDistance 取精確值。
export function segmentDistance2(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1,
    dy = y2 - y1;
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  const ex = px - x1 - t * dx,
    ey = py - y1 - t * dy;
  return ex * ex + ey * ey;
}
// 建立可重現的隨機數產生器（參數 seed，回傳取亂數的函式）。
export function seededRandom(seed) {
  let state = seed >>> 0;
  // 依整數混雜演算法產生下一個隨機數（無參數，回傳 0 至 1）。
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// 依權重隨機挑選武器掉落種類（參數 random，回傳武器代號）。
export function chooseWeapon(random) {
  let value = random();
  for (const [id, weapon] of Object.entries(WEAPONS)) {
    value -= weapon.weight;
    if (value < 0) return id;
  }
  return 'nova';
}
