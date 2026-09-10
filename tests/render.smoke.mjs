// 無頭煙測：用假 ctx 跑 drawFrame，驗證 render/ 拆分後接線正常。
function ctxStub() {
  const gradient = { addColorStop() {} };
  return new Proxy(
    {},
    {
      get(t, k) {
        if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => gradient;
        if (k === 'measureText') return () => ({ width: 0 });
        if (k === 'getImageData') return () => ({ data: [] });
        return typeof k === 'string' ? (...a) => undefined : undefined;
      },
      set() {
        return true;
      },
    }
  );
}

const { Game } = await import('../src/engine.js');
const { drawFrame } = await import('../src/render.js');

const game = new Game(42);
game.start({ shipId: 0 });
for (let i = 0; i < 120; i++) game.update(1 / 60, {});
drawFrame(ctxStub(), game, { idleTime: 1 });
console.log('render smoke: playing frame ok, enemies:', game.enemies.length);

// 機庫模式也跑一幀
const hangar = new Game(7);
drawFrame(ctxStub(), hangar, { idleTime: 1 });
console.log('render smoke: hangar frame ok');
