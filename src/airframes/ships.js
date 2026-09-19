import { M, material } from './math.js';
import {
  armor,
  canopy,
  cannon,
  engine,
  fin,
  fuselage,
  markings,
  mirrored,
  panel,
  rect,
  servicePanel,
} from './parts.js';

// 依機體編號組裝三款戰機網格，並回傳模型資料。
export function makeAirframe(id) {
  const model = { faces: [], engines: [], id };
  const paint = [M.gold, M.chrome, M.bronze][id];
  if (id === 0) {
    // 金色攔截機：後掠翼、長針形機頭與分離式引擎艙。
    mirrored(
      model,
      [
        [8, -24],
        [28, -17],
        [51, 8],
        [57, 25],
        [42, 28],
        [13, 12],
      ],
      -3,
      3,
      paint
    );
    mirrored(
      model,
      [
        [28, -10],
        [46, 9],
        [49, 19],
        [35, 13],
        [19, -6],
      ],
      3.05,
      4.6,
      paint
    );
    mirrored(
      model,
      [
        [42, 14],
        [52, 20],
        [55, 24],
        [45, 25],
        [39, 20],
      ],
      3.1,
      4.8,
      M.white
    );
    mirrored(
      model,
      [
        [10, 20],
        [22, 24],
        [28, 45],
        [21, 43],
        [9, 32],
      ],
      0,
      4,
      paint
    );
    for (const s of [-1, 1]) {
      engine(model, s * 18, 13, 8.6, paint);
      cannon(model, s * 43, 1, paint, 31);
      fin(model, s * 13, 20, 24, paint, s * 0.12);
      markings(model, s, 34, 0, 4.7, 0);
      panel(
        model,
        [
          [s * 14, -11, 4.7],
          [s * 22, -8, 4.7],
          [s * 28, 5, 4.7],
          [s * 18, 0, 4.7],
        ],
        M.white
      );
      servicePanel(
        model,
        [
          [s * 32, -1],
          [s * 39, 6],
          [s * 42, 13],
          [s * 36, 11],
          [s * 31, 6],
        ],
        4.75,
        paint
      );
      rect(model, s * 26 - 1, 13, 2, 5, 4.75, M.white);
    }
    fuselage(
      model,
      0,
      [
        [-72, 0.2, 0.4, 2],
        [-56, 3.8, 3, 3],
        [-37, 7, 6, 3],
        [-8, 10, 11, 1],
        [20, 7, 8, 0],
        [48, 1, 1, 1],
      ],
      paint
    );
    fuselage(
      model,
      0,
      [
        [-73, 0.15, 0.3, 2],
        [-64, 2.1, 2, 3],
        [-57, 3.5, 3, 3],
      ],
      M.white
    );
    panel(
      model,
      [
        [0, 1, 12.1],
        [2, 7, 10.5],
        [1, 38, 4],
        [-1, 38, 4],
        [-2, 7, 10.5],
      ],
      M.white
    );
    canopy(model);
  } else if (id === 1) {
    // 銀色突擊機：前掠翼與一對長加速軌。
    mirrored(
      model,
      [
        [8, -13],
        [39, -29],
        [53, -40],
        [50, -14],
        [30, 12],
        [13, 17],
      ],
      -2,
      3.8,
      paint
    );
    mirrored(
      model,
      [
        [32, -24],
        [50, -38],
        [46, -18],
        [31, 0],
        [19, 7],
      ],
      3.85,
      5.2,
      paint
    );
    mirrored(
      model,
      [
        [10, 24],
        [33, 15],
        [42, 41],
        [31, 35],
        [11, 40],
      ],
      -1,
      4,
      paint
    );
    for (const s of [-1, 1]) {
      engine(model, s * 20, 15, 7.7, paint);
      cannon(model, s * 45, -10, paint, 38);
      fin(model, s * 15, 21, 27, paint, s * 0.2);
      markings(model, s, 30, -12, 5.35, 1);
      servicePanel(
        model,
        [
          [s * 34, -23],
          [s * 44, -31],
          [s * 41, -18],
          [s * 34, -8],
        ],
        5.35,
        paint
      );
      armor(
        model,
        [
          [s * 11, -12],
          [s * 17, -18],
          [s * 17, 10],
          [s * 12, 15],
        ],
        6,
        9.5,
        M.dark
      );
      rect(model, s * 14 - 1, -9, 2, 17, 9.65, M.cyan);
    }
    fuselage(
      model,
      0,
      [
        [-78, 0.2, 0.5, 2],
        [-56, 3.6, 4, 3],
        [-28, 7, 8, 2],
        [0, 9, 10, 1],
        [28, 6, 5, 1],
        [45, 2, 1, 2],
      ],
      paint
    );
    fuselage(
      model,
      0,
      [
        [-68, 0.8, 1, 5],
        [-40, 3, 4, 8],
        [-6, 4, 4, 8],
        [30, 2.5, 2, 6],
      ],
      paint
    );
    canopy(model, true);
  } else {
    // 銅色裝甲砲艇：寬肩、四門砲管與加大引擎。
    mirrored(
      model,
      [
        [9, -30],
        [34, -28],
        [56, -7],
        [58, 19],
        [42, 27],
        [12, 17],
      ],
      -5,
      4.5,
      paint
    );
    mirrored(
      model,
      [
        [29, -23],
        [41, -16],
        [45, 14],
        [32, 17],
        [25, 3],
      ],
      4.6,
      7,
      paint
    );
    mirrored(
      model,
      [
        [12, 24],
        [35, 28],
        [40, 42],
        [11, 39],
      ],
      -2,
      4.5,
      paint
    );
    for (const s of [-1, 1]) {
      engine(model, s * 22, 13, 10.5, paint);
      for (const dx of [-2.1, 2.1]) cannon(model, s * 47 + dx, -4, M.steel, 29);
      fin(model, s * 18, 22, 22, paint, s * 0.16);
      markings(model, s, 40, -2, 7.1, 2);
      servicePanel(
        model,
        [
          [s * 31, -14],
          [s * 36, -13],
          [s * 39, 8],
          [s * 33, 11],
        ],
        7.15,
        paint
      );
      armor(
        model,
        [
          [s * 7, -11],
          [s * 12, -14],
          [s * 13, 11],
          [s * 8, 16],
        ],
        7,
        11,
        paint
      );
      for (let i = 0; i < 3; i++) rect(model, s * 10 - 1, -7 + i * 4, 2, 1.5, 11.1, M.black);
    }
    fuselage(
      model,
      0,
      [
        [-58, 2, 2, 3],
        [-46, 6.2, 6, 3],
        [-27, 11, 9, 2],
        [8, 12, 11, 0],
        [33, 9, 5, 0],
        [42, 5, 2, 1],
      ],
      paint
    );
    fuselage(
      model,
      0,
      [
        [-55, 1, 1, 5],
        [-42, 3.8, 4, 7],
        [-5, 5, 5, 9],
        [29, 4, 3, 5],
      ],
      paint
    );
    canopy(model);
  }
  for (const s of [-1, 1]) {
    const x = s * (id === 2 ? 54 : id === 1 ? 48 : 51),
      y = id === 1 ? -30 : 18;
    rect(model, x - 1, y, 2, 3, 5.4, s < 0 ? M.hot : M.cyan);
  }
  stainMetal(model, paint);
  return model;
}

// 把鋼、暗面、銀邊拉向該機主色，避免藍灰骨架蓋過金銀銅。
function stainMetal(model, paint) {
  const steel = mixMat(M.steel, paint, 0.45);
  const dark = mixMat(M.dark, paint, 0.28);
  const silver = mixMat(M.silver, paint, 0.35);
  for (const f of model.faces) {
    if (f.mat === M.steel) f.mat = steel;
    else if (f.mat === M.dark) f.mat = dark;
    else if (f.mat === M.silver) f.mat = silver;
  }
}

function mixMat(base, paint, t) {
  return material(
    base.rgb.map((v, i) => Math.round(v * (1 - t) + paint.rgb[i] * t)),
    base.shine
  );
}
export const AIRFRAMES = [0, 1, 2].map(makeAirframe);
