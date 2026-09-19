// 建置回歸測試：跑真实建置，驗證產物存在、更小、可執行且與源碼行為一致。
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { statSync, readFileSync, existsSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);

function snap(game) {
  return JSON.stringify({
    t: game.time.toFixed(4),
    s: game.score,
    k: game.kills,
    st: game.stageIndex,
    x: game.player.x.toFixed(3),
    y: game.player.y.toFixed(3),
    h: game.player.health,
    b: game.bullets.length,
    e: game.enemies.length,
  });
}

describe('建置產物', () => {
  before(() => {
    execFileSync(process.execPath, ['build.mjs'], { cwd: fileURLToPath(ROOT), stdio: 'pipe' });
  });

  it('產物存在且佈局鏡像', () => {
    for (const file of [
      'dist/index.html',
      'dist/icon.svg',
      'dist/src/engine.js',
      'dist/src/style.css',
      'dist/src/data/ships.json',
      'dist/src/data/weapons.json',
      'dist/src/data/stages.json',
      'dist/src/data/upgrades.json',
      'dist/src/data/constants.json',
    ]) {
      assert.ok(existsSync(new URL(file, ROOT)), `${file} 應存在`);
    }
    const dataJs = readFileSync(new URL('dist/src/data.js', ROOT), 'utf8');
    assert.match(dataJs, /ships\.json\?v=[0-9a-f]+/);
    assert.match(dataJs, /weapons\.json\?v=[0-9a-f]+/);
    assert.match(dataJs, /stages\.json\?v=[0-9a-f]+/);
    assert.match(dataJs, /upgrades\.json\?v=[0-9a-f]+/);
    assert.match(dataJs, /constants\.json\?v=[0-9a-f]+/);
  });

  it('minify 後更小（建置內已過 node --check）', () => {
    const raw = statSync(new URL('src/engine.js', ROOT)).size,
      min = statSync(new URL('dist/src/engine.js', ROOT)).size;
    assert.ok(min < raw, `dist 應更小：${min} < ${raw}`);
    const css = readFileSync(new URL('dist/src/style.css', ROOT), 'utf8');
    assert.ok(!css.includes('/*'), 'CSS 註解應剝除');
  });

  it('產物與源碼行為一致', async () => {
    const { Game: Src } = await import('../src/engine.js');
    const { Game: Dist } = await import('../dist/src/engine.js');
    const run = (G) => {
      const game = new G(99);
      game.start({ shipId: 2 });
      for (let i = 0; i < 1200; i++) game.update(1 / 60, { dx: Math.sin(i / 37), dy: Math.cos(i / 53) });
      return snap(game);
    };
    assert.equal(run(Dist), run(Src), '相同種子與輸入應得相同快照');
  });
});
