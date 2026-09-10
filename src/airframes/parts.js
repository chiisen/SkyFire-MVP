import { unit, cross, sub, material, M } from './math.js';

// 新增多邊形面片並計算法線，構成機體網格單元。
export function face(model, points, mat, edge = true) {
  const normal = unit(cross(sub(points[1], points[0]), sub(points[2], points[0])));
  model.faces.push({ points, normal, mat, edge });
}

// 以倒角輪廓擠出頂面斜邊與側壁，塑造厚重裝甲結構。
// 倒角裝甲：獨立頂面、斜邊框與較暗的垂直側壁。
export function armor(model, contour, bottom, top, mat, bevel = 0.1, map = (p) => p) {
  let points = contour.map((p) => [...p]);
  const area = points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length];
    return sum + p[0] * q[1] - q[0] * p[1];
  }, 0);
  if (area < 0) points.reverse();
  const center = points.reduce((a, p) => [a[0] + p[0] / points.length, a[1] + p[1] / points.length], [0, 0]);
  const low = points.map(([x, y]) => map([x, y, bottom]));
  const rim = points.map(([x, y]) => map([x, y, top - Math.min(1.5, (top - bottom) * 0.4)]));
  const high = points.map(([x, y]) => map([x + (center[0] - x) * bevel, y + (center[1] - y) * bevel, top]));
  face(model, high, mat);
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    face(model, [low[i], low[j], rim[j], rim[i]], mat);
    face(model, [rim[i], rim[j], high[j], high[i]], mat);
  }
}

// 以七邊形截面串接機身縱軸，塑造弧形肩線與體積。
// 七邊形縱向截面賦予機身弧形肩線與真實體積。
export function fuselage(model, x, sections, mat) {
  const rings = sections.map(([y, w, h, z]) =>
    [
      [0, z + h],
      [-w * 0.72, z + h * 0.7],
      [-w, z],
      [-w * 0.65, z - 2],
      [w * 0.65, z - 2],
      [w, z],
      [w * 0.72, z + h * 0.7],
    ].map(([xx, zz]) => [x + xx, y, zz])
  );
  for (let k = 0; k < rings.length - 1; k++)
    for (let i = 0; i < 7; i++) {
      const j = (i + 1) % 7;
      face(model, [rings[k][i], rings[k + 1][i], rings[k + 1][j], rings[k][j]], mat);
    }
  face(model, rings[0], mat);
  face(model, [...rings.at(-1)].reverse(), mat);
}

// 新增單面貼花並修正鏡像繞序，保持面向鏡頭。
export function panel(model, points, mat) {
  // 鏡像頂部貼花會反轉繞序；保持雙翼朝向鏡頭。
  if (cross(sub(points[1], points[0]), sub(points[2], points[0]))[2] < 0) points = [...points].reverse();
  face(model, points, mat, false);
}
// 將平面輪廓提升至指定高度，生成水平貼片。
export function flat(model, points, z, mat) {
  panel(
    model,
    points.map(([x, y]) => [x, y, z]),
    mat
  );
}
// 以矩形輪廓快速生成水平面板，用於細節裝飾。
export function rect(model, x, y, w, h, z, mat) {
  flat(
    model,
    [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    z,
    mat
  );
}
// 左右鏡像生成裝甲，對稱建構雙翼與雙側結構。
export function mirrored(model, points, bottom, top, mat, bevel = 0.08) {
  for (const s of [-1, 1])
    armor(
      model,
      points.map(([x, y]) => [x * s, y]),
      bottom,
      top,
      mat,
      bevel
    );
}
// 以斜切裝甲建構垂直尾翼，支撐側傾偏航造型。
export function fin(model, x, y, height, mat, cant = 0) {
  armor(
    model,
    [
      [y - 12, 5],
      [y + 7, height],
      [y + 27, 8],
      [y + 23, 4],
    ],
    x - 1.15,
    x + 1.15,
    mat,
    0.12,
    (p) => [p[2] + p[1] * cant, p[0], p[1]]
  );
}
// 組裝引擎艙、進氣道與排氣環，並登記尾焰位置。
export function engine(model, x, y, width, mat) {
  fuselage(
    model,
    x,
    [
      [y - 27, width * 0.7, 3, 1],
      [y - 20, width, 9, 0],
      [y + 14, width, 9, 0],
      [y + 24, width * 0.86, 5, -1],
    ],
    mat
  );
  // 進氣道喉部、進氣唇與獨立鈦合金排氣環。
  armor(
    model,
    [
      [x - width * 0.6, y - 25],
      [x + width * 0.6, y - 25],
      [x + width * 0.75, y - 16],
      [x - width * 0.75, y - 16],
    ],
    8,
    10,
    M.steel
  );
  rect(model, x - width * 0.46, y - 23, width * 0.92, 6, 10.15, M.black);
  fuselage(
    model,
    x,
    [
      [y + 16, width * 0.9, 6, -1],
      [y + 20, width * 0.93, 6, -1],
      [y + 24, width * 0.82, 5, -1],
    ],
    M.steel
  );
  fuselage(
    model,
    x,
    [
      [y + 24, width * 0.82, 5, -1],
      [y + 31, width * 0.7, 4, -1],
    ],
    M.dark
  );
  for (let i = 0; i < 4; i++) {
    rect(model, x - width * 0.55, y - 5 + i * 3, width * 1.1, 1.35, 9.05, M.black);
    rect(model, x - width * 0.52, y - 4.8 + i * 3, width, 0.42, 9.1, M.silver);
  }
  model.engines.push([x, y + 31, 1, width * 0.62]);
}
// 組裝細長砲管與基座，延伸機頭火力造型。
export function cannon(model, x, y, mat, length = 31) {
  fuselage(
    model,
    x,
    [
      [y - length, 1.4, 1, 3],
      [y - length + 3, 2.2, 2, 3],
      [y + 6, 2.6, 3, 2],
    ],
    M.dark
  );
  fuselage(
    model,
    x,
    [
      [y - 5, 3.4, 4, 1],
      [y + 12, 3.2, 3, 1],
    ],
    mat
  );
  for (let i = 0; i < 3; i++) rect(model, x - 1.8, y - length + 6 + i * 3, 3.6, 1, 5.1, M.steel);
}
// 堆疊深色座艙與亮面罩體，塑造反光座艙罩。
export function canopy(model, long = false) {
  const nose = long ? -46 : -40;
  fuselage(
    model,
    0,
    [
      [nose, 1, 1, 10],
      [nose + 8, 5.3, 3, 11],
      [-18, 6, 3, 12],
      [-9, 4, 1, 10],
    ],
    M.dark
  );
  fuselage(
    model,
    0,
    [
      [nose + 2, 0.5, 1, 11],
      [nose + 9, 4.5, 4, 12],
      [-20, 5, 4, 13],
      [-11, 3.2, 1, 11],
    ],
    M.amber
  );
  // 曲面座艙罩的反射與橫向框架，皆附著於其表面。
  panel(
    model,
    [
      [-2.4, nose + 11, 15.6],
      [-1, nose + 8, 15.5],
      [-0.5, -22, 17.2],
      [-1.7, -20, 16.8],
    ],
    M.white
  );
  panel(
    model,
    [
      [-4.2, -24, 15.4],
      [-4.1, -22.8, 15.4],
      [4.1, -22.8, 15.4],
      [4.2, -24, 15.4],
    ],
    M.dark
  );
}
// 繪製機翼條紋、編號與扣件，標示機體身份。
export function markings(model, s, x, y, z, id) {
  const X = (v) => s * (x + v);
  flat(
    model,
    [
      [X(-6), y],
      [X(5), y + 5],
      [X(4), y + 8],
      [X(-7), y + 3],
    ],
    z,
    M.white
  );
  for (let i = 0; i < id + 1; i++) rect(model, X(-3 + i * 2.1), y + 10, 1.05, 4, z + 0.02, M.silver);
  // 小型維修扣件在機庫中可見，無需描繪每個面。
  for (const yy of [y - 5, y + 19])
    for (const xx of [-7, 6]) {
      const px = X(xx);
      flat(
        model,
        [
          [px - 0.45, yy],
          [px, yy - 0.45],
          [px + 0.45, yy],
          [px, yy + 0.45],
        ],
        z + 0.05,
        M.steel
      );
    }
}
// 疊加深色底框與暗色漆面，模擬維修艙蓋。
export function servicePanel(model, points, z, paint) {
  const center = points.reduce((a, p) => [a[0] + p[0] / points.length, a[1] + p[1] / points.length], [0, 0]);
  flat(model, points, z, M.dark);
  flat(
    model,
    points.map(([x, y]) => [x + (center[0] - x) * 0.1, y + (center[1] - y) * 0.1]),
    z + 0.025,
    material(
      paint.rgb.map((v) => v * 0.76),
      0.38
    )
  );
}

// 依推力與閃爍繪製漸層尾焰，呈現引擎噴流。
export function exhaust(c, model, transform, time, boost, showcase) {
  for (const [x, y, z, w] of model.engines) {
    const length = (showcase ? 26 : 35) * (boost ? 1.6 : 1),
      flicker = 1 + Math.sin(time * 43 + x) * 0.075;
    const origin = transform([x, y, z]),
      tip = transform([x, y + length * flicker, z]);
    const gradient = c.createLinearGradient(origin[0], origin[1], tip[0], tip[1]);
    gradient.addColorStop(0, '#f0ffff');
    gradient.addColorStop(0.18, '#a3f7ff');
    gradient.addColorStop(0.48, boost ? '#aa95ff' : '#2bb6ff');
    gradient.addColorStop(1, '#2288ff00');
    const pts = [
      [x - w, y, z],
      [x + w, y, z],
      [x + w * 0.58, y + length * 0.44, z],
      [x, y + length * flicker, z],
      [x - w * 0.58, y + length * 0.44, z],
    ].map(transform);
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts.slice(1)) c.lineTo(p[0], p[1]);
    c.closePath();
    c.fillStyle = gradient;
    c.fill();
    for (let i = 0; i < 3; i++) {
      const yy = y + 5 + i * 6,
        ww = w * (0.5 - i * 0.11),
        p = [
          [x, yy - 2, z],
          [x + ww, yy, z],
          [x, yy + 2.5, z],
          [x - ww, yy, z],
        ].map(transform);
      c.beginPath();
      c.moveTo(p[0][0], p[0][1]);
      for (const q of p.slice(1)) c.lineTo(q[0], q[1]);
      c.closePath();
      c.fillStyle = `rgba(220,252,255,${0.74 - i * 0.17})`;
      c.fill();
    }
  }
}
