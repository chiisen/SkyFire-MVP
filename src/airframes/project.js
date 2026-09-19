import { TAU, clamp, unit, dot } from './math.js';
import { AIRFRAMES } from './ships.js';
import { exhaust } from './parts.js';
import { energy } from './energy.js';

export const LIGHT = unit([-0.55, -0.65, 1]),
  HALF = unit([LIGHT[0], LIGHT[1], LIGHT[2] + 1]);

// 依側傾與展示模式建構滾轉俯仰偏航投影變換。
export function camera(bank, showcase, time) {
  const roll = showcase ? -0.3 + Math.sin(time * 0.45) * 0.14 : bank * 0.48;
  const pitch = showcase ? 0.53 : 0.18,
    yaw = showcase ? -0.37 + Math.sin(time * 0.28) * 0.09 : bank * 0.065;
  const cr = Math.cos(roll),
    sr = Math.sin(roll),
    cp = Math.cos(pitch),
    sp = Math.sin(pitch),
    cy = Math.cos(yaw),
    sy = Math.sin(yaw);
  return ([x, y, z]) => {
    const xx = x * cr + z * sr,
      zz = z * cr - x * sr,
      yy = y * cp - zz * sp;
    return [xx * cy - yy * sy, xx * sy + yy * cy, y * sp + zz * cp];
  };
}
// 依面法線計算漫反射與鏡面光，輸出填色字串。
export function shade(mat, normal, tint = 0) {
  if (mat.glow) return `rgb(${mat.rgb.join(',')})`;
  if (mat.flat) {
    const lift = 0.78 + Math.max(0, dot(normal, LIGHT)) * 0.28;
    return `rgb(${mat.rgb.map((v) => Math.round(clamp(v * lift + tint, 0, 255))).join(',')})`;
  }
  const diffuse = 0.42 + Math.max(0, dot(normal, LIGHT)) * 0.64;
  const spec = Math.pow(Math.max(0, dot(normal, HALF)), 22) * mat.shine * 90;
  return `rgb(${mat.rgb.map((v) => Math.round(clamp(v * diffuse + spec + tint, 0, 255))).join(',')})`;
}
// 背面剔除並依深度排序填色，將網格投影至畫布。
export function paintMesh(c, model, transform) {
  const visible = [];
  for (const f of model.faces) {
    const n = transform(f.normal);
    if (n[2] <= 0.015) continue;
    const pts = f.points.map(transform);
    visible.push({ f, n, pts, depth: pts.reduce((a, p) => a + p[2], 0) / pts.length });
  }
  visible.sort((a, b) => a.depth - b.depth);
  c.lineJoin = 'round';
  c.lineWidth = 0.32;
  for (const { f, n, pts } of visible) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
    c.fillStyle = shade(f.mat, n);
    if (f.mat.shine > 0.45 && !f.mat.glow) {
      const xs = pts.map((p) => p[0]),
        ys = pts.map((p) => p[1]),
        left = Math.min(...xs),
        right = Math.max(...xs),
        top = Math.min(...ys),
        bottom = Math.max(...ys);
      if (right - left + bottom - top > 12) {
        const gloss = c.createLinearGradient(left, top, right, bottom);
        gloss.addColorStop(0, shade(f.mat, n, 18));
        gloss.addColorStop(0.42, shade(f.mat, n, 3));
        gloss.addColorStop(1, shade(f.mat, n, -23));
        c.fillStyle = gloss;
      }
    }
    c.fill();
    if (f.edge) {
      c.strokeStyle = 'rgba(6,14,26,.48)';
      c.stroke();
    }
  }
}

// 每具機體快取九種側傾姿態：記憶體有界，戰鬥中只需一次貼圖。
const spriteCache = new Map();
// 快取九種側傾姿態點陣圖，加速戰鬥中繪製。
export function sprite(model, bank) {
  if (typeof OffscreenCanvas === 'undefined') return null;
  const pose = Math.round(clamp(bank, -1, 1) * 4),
    key = `${model.id}:${pose}`;
  if (spriteCache.has(key)) return spriteCache.get(key);
  const canvas = new OffscreenCanvas(288, 352),
    ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.translate(144, 192);
  ctx.scale(2, 2);
  paintMesh(ctx, model, camera(pose / 4, false, 0));
  spriteCache.set(key, canvas);
  return canvas;
}

// 平移縮放並疊加陰影尾焰機身，輸出完整戰機畫面。
/** Faceted 3D hulls; scale=1 preserves the existing gameplay hit core and positioning. */
export function drawAirframe(
  c,
  x,
  y,
  shipId = 0,
  scale = 1,
  time = 0,
  bank = 0,
  { showcase = false, boost = false, reducedMotion = false } = {}
) {
  const model = AIRFRAMES[clamp(shipId | 0, 0, 2)],
    transform = camera(bank, showcase, time);
  c.save();
  c.translate(x, y);
  c.scale(scale * 0.66, scale * 0.66);
  // 柔和投影陰影分離機身與地形或機庫平台。
  c.save();
  c.translate(8, 12);
  c.scale(1, 0.78);
  c.fillStyle = '#02081340';
  c.beginPath();
  c.ellipse(0, 0, showcase ? 46 : 41, 58, 0, 0, TAU);
  c.fill();
  c.restore();
  exhaust(c, model, transform, time, boost, showcase);
  const cached = showcase ? null : sprite(model, bank);
  if (cached) c.drawImage(cached, -72, -96, 144, 176);
  else paintMesh(c, model, transform);
  energy(c, transform, time, clamp(shipId | 0, 0, 2), { boost, reducedMotion });
  c.restore();
}
