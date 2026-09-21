// 敵人隨機配色回歸：色相轉換正確、每隻敵機帶暖色禁區色相、繪製確實用到該色相。
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shiftHue } from '../src/render/shared.js';
import { enemy } from '../src/render/units.js';
import { Game } from '../src/engine.js';

// 記錄所有被指派的 fillStyle，用來比較不同色相畫出的填色。
function ctxRecorder() {
  const fills = [];
  const gradient = { addColorStop() {} };
  const c = new Proxy(
    {},
    {
      get(t, k) {
        if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => gradient;
        return () => undefined;
      },
      set(t, k, v) {
        if (k === 'fillStyle') fills.push(v);
        return true;
      },
    }
  );
  return { c, fills };
}

function scout(hue) {
  return { type: 'scout', x: 0, y: 0, r: 14, w: 28, h: 22, hp: 1, maxHp: 1, flash: 0, age: 0, hue };
}

describe('敵人隨機配色', () => {
  it('色相轉換：灰階與零度不變、旋轉後改變', () => {
    assert.equal(shiftHue('#808080', 60), '#808080');
    assert.equal(shiftHue('#dd8c70', 0), '#dd8c70');
    assert.notEqual(shiftHue('#dd8c70', 40), '#dd8c70');
  });

  it('放大飽和度讓低飽和底色更鮮明', () => {
    assert.notEqual(shiftHue('#283043', 0, 1.8), '#283043');
    assert.equal(shiftHue('#283043', 0, 1), '#283043');
  });

  it('每隻敵機帶暖色禁區色相且彼此有變化', () => {
    const game = new Game(1);
    game.start({});
    const hues = [];
    for (let i = 0; i < 12; i++) {
      const e = game.spawnEnemy('scout', 100 + i * 10);
      hues.push(e.hue);
      assert.ok(e.hue >= -25 && e.hue <= 50, `色相 ${e.hue} 超出暖色禁區`);
    }
    assert.ok(new Set(hues).size > 6, `色相變化不足：${hues.join(',')}`);
  });

  it('不同色相畫出不同填色', () => {
    const a = ctxRecorder(),
      b = ctxRecorder();
    enemy(a.c, scout(-20), 0);
    enemy(b.c, scout(45), 0);
    assert.ok(a.fills.length > 0, '應有填色動作');
    assert.notDeepEqual(a.fills, b.fills, '不同色相應畫出不同顏色');
  });
});
