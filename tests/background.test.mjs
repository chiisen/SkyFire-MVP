// 背景靜層快取回歸測試：驗證預渲染不改變繪製順序且可退回舊路徑。
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

const mod = await import('../src/render/background.js');

// 可接受任意呼叫的假主畫布，記錄關鍵呼叫次數。
function mainStub(counters) {
  const gradient = { addColorStop() {} };
  return new Proxy(
    {},
    {
      get(t, k) {
        if (k === 'createLinearGradient' || k === 'createRadialGradient')
          return () => {
            counters.gradients++;
            return gradient;
          };
        if (k === 'drawImage')
          return (...a) => {
            counters.draws.push(a[0]?.__tag || 'layer');
            return undefined;
          };
        if (k === 'measureText') return () => ({ width: 0 });
        return (...a) => undefined;
      },
      set() {
        return true;
      },
    }
  );
}

// 假離屏圖層畫布：記錄建層次數，圖層內呼叫全部吞掉。
function installFakeDocument(counters) {
  globalThis.document = {
    createElement(tag) {
      assert.equal(tag, 'canvas');
      counters.layers++;
      const gradient = { addColorStop() {} };
      const layerCtx = new Proxy(
        {},
        {
          get(t, k) {
            if (k === 'createLinearGradient') return () => gradient;
            return (...a) => undefined;
          },
          set() {
            return true;
          },
        }
      );
      const el = { __tag: `base-${counters.layers}`, getContext: () => layerCtx };
      return el;
    },
  };
}

describe('背景靜層快取', () => {
  beforeEach(() => {
    mod.__clearBackgroundCache();
  });
  afterEach(() => {
    mod.__clearBackgroundCache();
    delete globalThis.document;
  });

  it('無 DOM 時退回逐幀繪製，不報錯且不建快取', () => {
    delete globalThis.document;
    const counters = { gradients: 0, draws: [], layers: 0 };
    mod.background(mainStub(counters), 0, 1.5);
    // 舊路徑每幀新建底色＋遮罩兩個漸層。
    assert.equal(counters.gradients, 2);
    assert.equal(counters.draws.length, 0);
    assert.deepEqual(mod.__backgroundCacheStats(), { bases: 0, hasOverlay: false });
  });

  it('有 DOM 時底色按關快取、遮罩共用，每幀貼兩次且順序正確', () => {
    const counters = { gradients: 0, draws: [], layers: 0 };
    installFakeDocument(counters);
    const c = mainStub(counters);
    mod.background(c, 0, 1.0);
    mod.background(c, 0, 2.0);
    mod.background(c, 1, 3.0);
    // 建層：關 0 底色＋遮罩＋關 1 底色＝3 次，主畫布不再新建漸層。
    assert.equal(counters.layers, 3);
    assert.equal(counters.gradients, 0);
    assert.deepEqual(mod.__backgroundCacheStats(), { bases: 2, hasOverlay: true });
    // 每幀兩次 drawImage：先底色、後遮罩（地景夾在中間）。
    assert.equal(counters.draws.length, 6);
  });

  it('五關切換皆可走快取路徑', () => {
    const counters = { gradients: 0, draws: [], layers: 0 };
    installFakeDocument(counters);
    const c = mainStub(counters);
    for (let s = 0; s < 5; s++) mod.background(c, s, s * 0.7);
    assert.deepEqual(mod.__backgroundCacheStats(), { bases: 5, hasOverlay: true });
    assert.equal(counters.draws.length, 10);
  });
});
