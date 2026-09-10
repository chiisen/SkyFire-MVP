// 網格建模的戰機，投影至 Canvas 2D。無下載模型或貼圖。
// x：翼展，y：機頭至機尾，z：機翼上方高度。模擬座標維持不變。
export const TAU = Math.PI * 2;
// 夾取數值於上下界，避免姿態與著色參數越界。
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// 正規化向量以求面法線，支撐光照與投影計算。
export const unit = (v) => {
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
};
// 外積求面法線方向，判斷多邊形朝向與可見性。
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// 向量相減取得邊向量，作為法線與平面計算基礎。
export const sub = (a, b) => a.map((v, i) => v - b[i]);
// 內積計算光照夾角，驅動漫反射與鏡面反射強度。
export const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
// 建立材質參數，統一顏色、亮光與發光屬性。
export const material = (rgb, shine = 0.25, glow = false) => ({ rgb, shine, glow });
export const M = {
  silver: material([211, 218, 225], 0.8),
  white: material([239, 234, 218], 0.48),
  steel: material([103, 126, 150], 0.85),
  dark: material([24, 33, 47], 0.28),
  black: material([8, 14, 24], 0.08),
  red: material([181, 30, 43], 0.53),
  blue: material([33, 100, 204], 0.65),
  gold: material([209, 153, 52], 0.65),
  amber: material([178, 121, 37], 1),
  glass: material([19, 69, 104], 1),
  cyan: material([109, 236, 255], 0.5, true),
  hot: material([255, 87, 64], 0.4, true),
};
