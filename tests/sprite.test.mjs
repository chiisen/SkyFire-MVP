// 敵彈 sprite 回歸測試：快取命中只建一次，失敗時退回向量繪製且不報錯。
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const mod = await import('../src/render/combat.js');
const units = await import('../src/render/units.js');

// 記錄呼叫的主畫布 stub。
function mainStub(counters) {
  const gradient = { addColorStop() {} };
  return new Proxy(
    {},
    {
      get(t, k) {
        if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => gradient;
        if (k === 'drawImage')
          return () => {
            counters.draws++;
            return undefined;
          };
        if (k === 'arc')
          return () => {
            counters.arcs++;
            return undefined;
          };
        return (...a) => undefined;
      },
      set() {
        return true;
      },
    }
  );
}

// 假離屏圖層：記錄建層次數。
function installFakeDocument(counters) {
  const gradient = { addColorStop() {} };
  globalThis.document = {
    createElement(tag) {
      assert.equal(tag, 'canvas');
      counters.layers++;
      const layerCtx = new Proxy(
        {},
        {
          get(t, k) {
            if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => gradient;
            return (...a) => undefined;
          },
          set() {
            return true;
          },
        }
      );
      return { __tag: `sprite-${counters.layers}`, getContext: () => layerCtx };
    },
  };
}

const BULLET = {
  x: 240,
  y: 400,
  prevX: 240,
  prevY: 398,
  vx: 0,
  vy: 100,
  r: 4.5,
  age: 0.5,
  type: 'drift',
  color: '#ff9eaf',
  turn: 0.2,
};

describe('敵彈 sprite', () => {
  beforeEach(() => {
    mod.__clearSpriteCache();
  });
  afterEach(() => {
    mod.__clearSpriteCache();
    delete globalThis.document;
  });

  it('無 DOM 時退回向量繪製，不報錯且不建快取', () => {
    delete globalThis.document;
    const counters = { draws: 0, arcs: 0, layers: 0 };
    mod.projectile(mainStub(counters), { ...BULLET });
    assert.ok(counters.arcs >= 3, '向量路徑應畫三圈弧線');
    assert.equal(counters.draws, 0);
    assert.deepEqual(mod.__spriteCacheStats(), { sprites: 0 });
  });

  it('同色同徑只建一次，之後每次貼圖', () => {
    const counters = { draws: 0, arcs: 0, layers: 0 };
    installFakeDocument(counters);
    const c = mainStub(counters);
    mod.projectile(c, { ...BULLET });
    mod.projectile(c, { ...BULLET, x: 100, y: 200 });
    mod.projectile(c, { ...BULLET, x: 300, y: 600 });
    assert.equal(counters.layers, 1, '同色同徑只烘焙一次');
    assert.equal(counters.draws, 3, '每顆貼圖一次');
    assert.deepEqual(mod.__spriteCacheStats(), { sprites: 1 });
  });

  it('換色換徑各建一張', () => {
    const counters = { draws: 0, arcs: 0, layers: 0 };
    installFakeDocument(counters);
    const c = mainStub(counters);
    mod.projectile(c, { ...BULLET });
    mod.projectile(c, { ...BULLET, color: '#ffbd7c' });
    mod.projectile(c, { ...BULLET, r: 8 });
    assert.equal(counters.layers, 3);
    assert.deepEqual(mod.__spriteCacheStats(), { sprites: 3 });
  });

  it('詭雷保持自轉向量繪製，不走快取', () => {
    const counters = { draws: 0, arcs: 0, layers: 0 };
    installFakeDocument(counters);
    mod.projectile(mainStub(counters), { ...BULLET, type: 'mine', r: 8 });
    assert.equal(counters.draws, 0, '詭雷不貼圖');
    assert.deepEqual(mod.__spriteCacheStats(), { sprites: 0 });
  });

  it('玩家彈維持向量線條，不走快取', () => {
    const counters = { draws: 0, arcs: 0, layers: 0 };
    installFakeDocument(counters);
    mod.projectile(mainStub(counters), { ...BULLET }, true);
    assert.equal(counters.draws, 0);
    assert.deepEqual(mod.__spriteCacheStats(), { sprites: 0 });
  });
});

describe('尾焰 sprite', () => {
  const FLAME = { x: 0, y: 0, width: 2, height: -14, color: '#fd8d5b' };

  beforeEach(() => {
    units.__clearFlameCache();
  });
  afterEach(() => {
    units.__clearFlameCache();
    delete globalThis.document;
  });

  it('無 DOM 時退回向量繪製，不報錯且不建快取', () => {
    delete globalThis.document;
    const counters = { draws: 0, arcs: 0, layers: 0 };
    units.flame(mainStub(counters), FLAME.x, FLAME.y, FLAME.width, FLAME.height, FLAME.color, 1.0);
    assert.equal(counters.draws, 0);
    assert.deepEqual(units.__flameCacheStats(), { flames: 0 });
  });

  it('多次呼叫只烘焙一次，每次貼圖', () => {
    const counters = { draws: 0, arcs: 0, layers: 0 };
    installFakeDocument(counters);
    const c = mainStub(counters);
    units.flame(c, 0, 0, 2, -14, '#fd8d5b', 1.0);
    units.flame(c, 5, 5, 2, -14, '#fd8d5b', 2.0);
    units.flame(c, -3, 7, 2, -14, '#fd8d5b', 3.0);
    assert.equal(counters.layers, 1, '同色只烘焙一次');
    assert.equal(counters.draws, 3, '每次貼圖一次');
    assert.deepEqual(units.__flameCacheStats(), { flames: 1 });
  });

  it('非常規格退回向量繪製', () => {
    const counters = { draws: 0, arcs: 0, layers: 0 };
    installFakeDocument(counters);
    units.flame(mainStub(counters), 0, 0, 3, -20, '#fd8d5b', 1.0);
    assert.equal(counters.draws, 0, '非常規格不貼圖');
  });
});
