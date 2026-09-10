import { TAU, clamp, poly, line, circle, plate } from './shared.js';

// 繪製引擎尾焰漸層火焰，表現推進器閃爍的推進效果。
export function flame(c, x, y, width, height, color, time) {
  const flicker = 0.88 + Math.sin(time * 41 + x) * 0.08 + Math.sin(time * 63) * 0.04;
  const g = c.createLinearGradient(x, y, x, y + height);
  g.addColorStop(0, '#ecfdff');
  g.addColorStop(0.22, color);
  g.addColorStop(1, 'transparent');
  poly(
    c,
    [
      [x - width, y],
      [x + width, y],
      [x + width * 0.48, y + height * 0.52],
      [x, y + height * flicker],
      [x - width * 0.48, y + height * 0.52],
    ],
    g
  );
}

// 依種類繪製敵機外形與血條，頭目則轉交頭目繪製處理。

// 依種類繪製敵機外形與血條，頭目則轉交頭目繪製處理。
export function enemy(c, e, time) {
  if (e.dead) return;
  if (e.type === 'boss') {
    boss(c, e, time);
    return;
  }
  const w = e.w || e.r * 2 || 34,
    h = e.h || w * 1.15,
    s = w / 40;
  c.save();
  c.translate(e.x, e.y);
  c.scale(s, Math.min(1.8, h / 42));
  const lit = e.flash > 0,
    edge = lit ? '#fff9e3' : '#dd8c70',
    metal = lit ? '#e4bea3' : '#745c5d';
  if (e.type === 'mine') {
    c.rotate(time * 0.6 + (e.age || 0));
    for (let i = 0; i < 6; i++) {
      c.save();
      c.rotate((i / 6) * TAU);
      poly(
        c,
        [
          [-3, -7],
          [-3, -16],
          [0, -20],
          [3, -16],
          [3, -7],
        ],
        '#8f665d',
        '#e1a382'
      );
      c.restore();
    }
    circle(c, 0, 0, 10, '#25283a', edge, 1.5);
    circle(c, 0, 0, 4, '#ffbd82');
  } else if (e.type === 'carrier') {
    plate(c, -22, -22, 44, 43, '#303344', edge, 6);
    plate(c, -14, -17, 28, 33, metal, '#9b7670', 3);
    for (let s = -1; s <= 1; s += 2) {
      plate(c, s * 19 - 5, -12, 10, 24, '#171f31', '#b08b7a', 2);
      c.fillStyle = '#ffa779';
      c.fillRect(s * 19 - 2, 4, 4, 8);
    }
    poly(
      c,
      [
        [0, 24],
        [-8, 10],
        [-6, -6],
        [6, -6],
        [8, 10],
      ],
      '#bea298'
    );
    circle(c, 0, 0, 3, '#ffe4c1');
  } else if (e.type === 'gunship' || e.type === 'laser') {
    const laser = e.type === 'laser';
    poly(
      c,
      [
        [-5, 24],
        [-12, 8],
        [-23, 5],
        [-20, -16],
        [-8, -10],
        [0, -21],
        [8, -10],
        [20, -16],
        [23, 5],
        [12, 8],
        [5, 24],
      ],
      '#242d40',
      edge
    );
    poly(
      c,
      [
        [-18, -12],
        [-8, -6],
        [-6, 15],
        [-15, 4],
      ],
      metal
    );
    poly(
      c,
      [
        [18, -12],
        [8, -6],
        [6, 15],
        [15, 4],
      ],
      '#a08177'
    );
    plate(c, -5, -12, 10, 30, laser ? '#bb716b' : '#a89083', '#e5b798', 2);
    for (const s of [-1, 1]) {
      line(
        c,
        [
          [s * 17, 0],
          [s * 17, 16],
        ],
        '#c7afa1',
        3
      );
      circle(c, s * 17, 17, 2, laser ? '#ff796c' : '#ffc194');
    }
    circle(c, 0, 2, 3, laser ? '#ff7b82' : '#ffdbb2');
  } else {
    const interceptor = e.type === 'interceptor';
    poly(
      c,
      [
        [0, 24],
        [-8, 7],
        [-21, 4],
        [-17, -16],
        [-7, -6],
        [0, -15],
        [7, -6],
        [17, -16],
        [21, 4],
        [8, 7],
      ],
      '#283043',
      edge,
      0.8
    );
    poly(
      c,
      [
        [0, 21],
        [-5, 3],
        [-4, -12],
        [0, -17],
        [4, -12],
        [5, 3],
      ],
      metal
    );
    poly(
      c,
      [
        [-7, 2],
        [-17, -10],
        [-17, 2],
        [-6, 8],
      ],
      '#a58579'
    );
    poly(
      c,
      [
        [7, 2],
        [17, -10],
        [17, 2],
        [6, 8],
      ],
      '#826666'
    );
    poly(
      c,
      [
        [0, 10],
        [-2, 3],
        [0, -4],
        [2, 3],
      ],
      '#ffcf9e'
    );
    if (interceptor) {
      line(
        c,
        [
          [-13, 5],
          [-15, 16],
        ],
        '#ffad81',
        2
      );
      line(
        c,
        [
          [13, 5],
          [15, 16],
        ],
        '#ffad81',
        2
      );
    }
    flame(c, -6, -10, 2, -14, '#fd8d5b', time);
    flame(c, 6, -10, 2, -14, '#fd8d5b', time + 0.2);
  }
  c.restore();
  if ((e.hp || 0) < (e.maxHp || 1) && e.type !== 'scout' && e.type !== 'mine') {
    c.fillStyle = '#091321cc';
    c.fillRect(e.x - w / 2, e.y - h / 2 - 8, w, 3);
    c.fillStyle = '#efbd8b';
    c.fillRect(e.x - w / 2, e.y - h / 2 - 8, w * clamp(e.hp / e.maxHp), 3);
  }
}

// 依階段繪製頭目本體裝甲，並顯示入場與相位護盾提示。

// 依階段繪製頭目本體裝甲，並顯示入場與相位護盾提示。
export function boss(c, e, t) {
  const stage = clamp(e.stage ?? 0, 0, 4),
    s = (e.w || 220) / 220;
  const hull = e.flash > 0 ? '#e5c0ae' : ['#586376', '#536d67', '#65788e', '#7e6265', '#696488'][stage];
  const trim = ['#d9a27b', '#b2cb92', '#bde3f0', '#f1a269', '#d3b9f4'][stage];
  c.save();
  c.translate(e.x, e.y);
  c.scale(s, s);
  // 主要剪影各異，密集彈幕中仍可辨識。
  if (stage === 0)
    poly(
      c,
      [
        [-108, -21],
        [-92, -54],
        [-55, -45],
        [-34, -65],
        [34, -65],
        [55, -45],
        [92, -54],
        [108, -21],
        [96, 41],
        [57, 35],
        [35, 64],
        [-35, 64],
        [-57, 35],
        [-96, 41],
      ],
      '#263347',
      trim,
      1.2
    );
  if (stage === 1)
    poly(
      c,
      [
        [-111, -48],
        [-80, -62],
        [-65, -29],
        [-29, -53],
        [29, -53],
        [65, -29],
        [80, -62],
        [111, -48],
        [105, 39],
        [78, 60],
        [62, 14],
        [32, 50],
        [-32, 50],
        [-62, 14],
        [-78, 60],
        [-105, 39],
      ],
      '#293b3e',
      trim,
      1.2
    );
  if (stage === 2)
    poly(
      c,
      [
        [-103, -13],
        [-80, -53],
        [-52, -22],
        [-23, -59],
        [23, -59],
        [52, -22],
        [80, -53],
        [103, -13],
        [94, 54],
        [72, 64],
        [57, 14],
        [22, 39],
        [0, 76],
        [-22, 39],
        [-57, 14],
        [-72, 64],
        [-94, 54],
      ],
      '#243649',
      trim,
      1.2
    );
  if (stage === 3) {
    circle(c, 0, 0, 88, '#322c39', trim, 2);
    circle(c, 0, 0, 68, '#1d2535', '#6e4c47', 15);
  }
  if (stage === 4) {
    poly(
      c,
      [
        [-114, -48],
        [-87, -67],
        [-78, -27],
        [-31, -39],
        [0, -68],
        [31, -39],
        [78, -27],
        [87, -67],
        [114, -48],
        [108, 51],
        [87, 70],
        [73, 28],
        [35, 44],
        [0, 70],
        [-35, 44],
        [-73, 28],
        [-87, 70],
        [-108, 51],
      ],
      '#242c46',
      trim,
      1.3
    );
    circle(c, 0, 0, 78, null, '#b7a4eb66', 1.5);
  }
  for (const side of [-1, 1]) {
    c.save();
    c.scale(side, 1);
    poly(
      c,
      [
        [36, -35],
        [79, -46],
        [98, -17],
        [85, 31],
        [58, 18],
        [40, 36],
      ],
      hull,
      '#93a4b0',
      0.7
    );
    poly(
      c,
      [
        [47, -29],
        [78, -40],
        [87, -16],
        [67, -5],
        [45, 0],
      ],
      '#a6a3a3'
    );
    poly(
      c,
      [
        [50, 8],
        [76, -2],
        [83, 20],
        [61, 13],
        [43, 29],
      ],
      '#414856'
    );
    plate(c, 64, -11, 21, 43, '#283143', trim, 4);
    plate(c, 69, 12, 11, 35, '#546170', trim, 2);
    circle(c, 74, 45, 5, '#ffac86', '#ffddd0', 1.5);
    for (let j = 0; j < 4; j++)
      line(
        c,
        [
          [42 + j * 6, -20],
          [43 + j * 6, -10],
        ],
        '#3e4956',
        2
      );
    c.fillStyle = trim;
    c.fillRect(91, -8, 3, 10);
    c.restore();
  }
  poly(
    c,
    [
      [0, -59],
      [27, -32],
      [32, 25],
      [19, 53],
      [0, 65],
      [-19, 53],
      [-32, 25],
      [-27, -32],
    ],
    hull,
    trim
  );
  poly(
    c,
    [
      [0, -51],
      [0, 56],
      [-19, 44],
      [-24, 22],
      [-21, -29],
    ],
    '#354353'
  );
  poly(
    c,
    [
      [0, -46],
      [18, -28],
      [18, -2],
      [0, 12],
      [-18, -2],
      [-18, -28],
    ],
    '#172537',
    '#8f9bab',
    1
  );
  circle(c, 0, -9, 11, '#f7ad8f33', trim, 2);
  circle(c, 0, -9, 5, '#fff0db');
  for (let i = 0; i < 3; i++) {
    line(
      c,
      [
        [-13, 21 + i * 7],
        [13, 21 + i * 7],
      ],
      '#131e32',
      3
    );
    line(
      c,
      [
        [-9, 20 + i * 7],
        [9, 20 + i * 7],
      ],
      trim,
      1
    );
  }
  if ((e.age ?? 2) < 2 || e.transition > 0) {
    // 短暫描邊力場傳達格擋傷害，不遮擋危險訊息。
    const entering = (e.age ?? 2) < 2,
      progress = entering ? clamp(e.age / 2) : clamp(1 - e.transition / 1.15);
    poly(
      c,
      [
        [-84, -79],
        [84, -79],
        [121, -42],
        [121, 41],
        [80, 81],
        [-80, 81],
        [-121, 41],
        [-121, -42],
      ],
      '#a6c8ff0a',
      '#afceff90',
      1.5
    );
    c.save();
    c.setLineDash([11, 9]);
    c.lineDashOffset = -t * 13;
    c.beginPath();
    c.ellipse(0, 0, 126, 88, 0, 0, TAU);
    c.strokeStyle = '#cfddff70';
    c.lineWidth = 1.3;
    c.stroke();
    c.restore();
    for (const side of [-1, 1]) {
      line(
        c,
        [
          [side * 96, -61],
          [side * 113, -41],
          [side * 113, -19],
        ],
        '#e2eaff',
        2
      );
      line(
        c,
        [
          [side * 96, 63],
          [side * 113, 43],
          [side * 113, 21],
        ],
        '#e2eaff',
        2
      );
    }
    c.fillStyle = '#0d1931e6';
    c.fillRect(-65, 92, 130, 22);
    c.fillStyle = '#dce8ff';
    c.font = '600 13px system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(entering ? '入場護盾 · 暫時免傷' : '相位護盾 · 暫時免傷', 0, 103);
    c.fillStyle = '#93c3ff';
    c.fillRect(-60, 117, 120 * progress, 2);
  }
  c.restore();
}

// 繪製雷射預警虛線與高亮主光束，呈現蓄力到發射的過程。
