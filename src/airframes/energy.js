import SHIPS from '../data/ships.json' with { type: 'json' };

// 沿機身與機翼畫閃爍電弧，展示與戰鬥皆疊在機體之上。
const ENERGY_PATHS = [
  [
    [0, -40, 8],
    [0, 16, 5],
  ],
];
const BOOST_PATHS = [
  [
    [-8, -12, 6],
    [-36, 4, 3],
  ],
  [
    [8, -12, 6],
    [36, 4, 3],
  ],
];

function frac(n) {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

export function energy(c, transform, time, shipId, { boost = false, reducedMotion = false } = {}) {
  const tint = (SHIPS[shipId] || SHIPS[0]).energyColor;
  const pulse = reducedMotion ? 0.55 : 0.42 + 0.38 * Math.abs(Math.sin(time * 9));
  const jitter = reducedMotion ? 0 : boost ? 7.5 : 5.2;
  const segs = reducedMotion ? 3 : 5;
  const paths = boost ? ENERGY_PATHS.concat(BOOST_PATHS) : ENERGY_PATHS;
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  for (let b = 0; b < paths.length; b++) {
    const [a, z] = paths[b];
    if (b > 0 && !reducedMotion && frac(Math.floor(time * 6) + b * 3.1) < 0.45) continue;
    c.beginPath();
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const edge = i === 0 || i === segs ? 0 : 1;
      const jx = (frac(time * 19 + b * 8 + i) - 0.5) * jitter * edge;
      const jz = (frac(time * 14 + b * 5 + i + 4) - 0.5) * jitter * 0.55 * edge;
      const p = transform([a[0] + (z[0] - a[0]) * t + jx, a[1] + (z[1] - a[1]) * t, a[2] + (z[2] - a[2]) * t + jz]);
      if (i === 0) c.moveTo(p[0], p[1]);
      else c.lineTo(p[0], p[1]);
    }
    c.globalAlpha = pulse * (boost ? 1 : 0.85);
    c.strokeStyle = tint;
    c.lineWidth = boost ? 3.4 : 2.6;
    c.stroke();
    c.globalAlpha = Math.min(1, pulse + 0.25);
    c.strokeStyle = '#f7ffff';
    c.lineWidth = 0.85;
    c.stroke();
  }
  const spark = transform([0, -8, 10]);
  c.globalAlpha = pulse * 0.7;
  c.fillStyle = '#e8ffff';
  c.beginPath();
  c.arc(spark[0], spark[1], boost ? 2.4 : 1.7, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
