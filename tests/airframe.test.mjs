// 三台可操作戰機主色為金、銀、銅，且主色須佔機體面足夠比例。
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AIRFRAMES } from '../src/airframes/ships.js';
import { M } from '../src/airframes/math.js';
import { camera, drawAirframe, paintMesh } from '../src/airframes/project.js';
import { SHIPS } from '../src/data.js';

function paintRatio(model, mat) {
  return model.faces.filter((f) => f.mat === mat).length / model.faces.length;
}

describe('戰機金銀銅塗裝', () => {
  it('提供正常與暗色六種可選戰機', () => {
    assert.equal(SHIPS.length, 6);
    assert.deepEqual(
      SHIPS.slice(3).map((ship) => ship.baseId),
      [0, 1, 2]
    );
    assert.ok(
      SHIPS[3].color !== SHIPS[0].color && SHIPS[4].color !== SHIPS[1].color && SHIPS[5].color !== SHIPS[2].color
    );
  });

  it('材質為高彩度金、鉻銀、銅', () => {
    const [g, s, b] = [M.gold, M.chrome, M.bronze];
    assert.ok(g.rgb[0] > 210 && g.rgb[1] > 150 && g.rgb[1] < g.rgb[0] - 20);
    assert.ok(Math.abs(s.rgb[0] - s.rgb[1]) < 20 && s.rgb[0] > 200);
    assert.ok(b.rgb[0] > 170 && b.rgb[1] < 120 && b.rgb[0] > b.rgb[1] + 40);
  });

  it('三機主色面佔比超過四成', () => {
    const livery = [M.gold, M.chrome, M.bronze, M.darkGold, M.darkChrome, M.darkBronze];
    for (const [i, model] of AIRFRAMES.entries()) {
      const ratio = paintRatio(model, livery[i]);
      assert.ok(ratio > 0.4, `ship ${i} 主色佔比 ${ratio}`);
    }
  });

  it('選機 UI 色與金銀銅一致', () => {
    assert.equal(SHIPS[0].color, '#ffc428');
    assert.equal(SHIPS[1].color, '#e8eef4');
    assert.equal(SHIPS[2].color, '#d45a1e');
  });

  it('機庫著色一眼可分金、銀、銅，銀機不偏藍', () => {
    const avgs = [0, 1, 2].map((id) => hangarAverage(AIRFRAMES[id]));
    const [gold, silver, bronze] = avgs;
    assert.ok(gold[0] > 160 && gold[1] > 110 && gold[2] < 110 && gold[0] - gold[2] > 60, `金 ${gold}`);
    assert.ok(
      Math.min(...silver) > 100 &&
        silver[2] - silver[0] < 12 &&
        Math.abs(silver[0] - silver[1]) < 24 &&
        Math.abs(silver[1] - silver[2]) < 24,
      `銀 ${silver}`
    );
    assert.ok(bronze[0] > 130 && bronze[1] < 115 && bronze[2] < 95 && bronze[0] - bronze[2] > 50, `銅 ${bronze}`);
    assert.ok(dist(gold, silver) > 40 && dist(gold, bronze) > 25 && dist(silver, bronze) > 40);
  });

  it('暗色塗裝比對應正常色更暗但仍保留辨識度', () => {
    const avgs = [3, 4, 5].map((id) => hangarAverage(AIRFRAMES[id]));
    const normal = [0, 1, 2].map((id) => hangarAverage(AIRFRAMES[id]));
    for (let i = 0; i < 3; i++) {
      assert.ok(luminance(avgs[i]) < luminance(normal[i]) - 18, `暗色 ${i} 未明顯變暗`);
      assert.ok(luminance(avgs[i]) > 45, `暗色 ${i} 細節過暗`);
      assert.ok(dist(avgs[i], normal[i]) > 20, `暗色 ${i} 與正常色差異不足`);
    }
  });

  it('暗色版加專屬識別件且帶亮色點綴', () => {
    const accents = [M.accentGold, M.accentCyan, M.accentCopper];
    for (let i = 0; i < 3; i++) {
      const normal = AIRFRAMES[i],
        dark = AIRFRAMES[i + 3];
      assert.ok(dark.faces.length > normal.faces.length, `暗色 ${i} 未加識別件`);
      assert.ok(
        dark.faces.some((f) => f.mat === accents[i]),
        `暗色 ${i} 缺亮色點綴`
      );
    }
  });
});

describe('機身電能', () => {
  it('展示模式會描電弧', () => {
    let strokes = 0;
    const gradient = { addColorStop() {} };
    const c = {
      lineJoin: '',
      lineCap: '',
      lineWidth: 0,
      globalAlpha: 1,
      save() {},
      restore() {},
      translate() {},
      scale() {},
      beginPath() {},
      moveTo() {},
      lineTo() {},
      closePath() {},
      ellipse() {},
      arc() {},
      fill() {},
      stroke() {
        strokes++;
      },
      createLinearGradient() {
        return gradient;
      },
      set fillStyle(v) {
        this._f = v;
      },
      get fillStyle() {
        return this._f;
      },
      set strokeStyle(v) {
        this._s = v;
      },
      get strokeStyle() {
        return this._s;
      },
    };
    drawAirframe(c, 240, 240, 0, 1, 1.4, 0, { showcase: true });
    assert.ok(strokes >= 2, `strokes ${strokes}`);
  });
});

function hangarAverage(model) {
  const fills = [];
  const gradient = { addColorStop() {} };
  const c = {
    lineJoin: '',
    lineWidth: 0,
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    stroke() {},
    createLinearGradient() {
      return gradient;
    },
    set fillStyle(v) {
      this._f = v;
    },
    get fillStyle() {
      return this._f;
    },
    fill() {
      fills.push(this._f);
    },
  };
  paintMesh(c, model, camera(0, true, 0));
  let r = 0,
    g = 0,
    b = 0,
    n = 0;
  for (const s of fills) {
    const m = String(s).match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!m) continue;
    r += +m[1];
    g += +m[2];
    b += +m[3];
    n++;
  }
  return n ? [Math.round(r / n), Math.round(g / n), Math.round(b / n)] : [0, 0, 0];
}

function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function luminance([r, g, b]) {
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
