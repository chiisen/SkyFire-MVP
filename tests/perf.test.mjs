// 效能優化回歸測試：粗排/免開根號必須與精確版行為一致，體質數值不變。
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const { Game } = await import('../src/engine.js');
const utils = await import('../src/engine/utils.js');

describe('距離函式', () => {
  it('segmentDistance 與 hypot 參照一致，平方版為其平方', () => {
    const cases = [
      [0, 0, 3, 0, 3, 4],
      [240, 665, 100, 100, 120, 130],
      [5, 5, 5, 5, 5, 5],
      [-10, 40, 0, 0, 480, 800],
    ];
    for (const [px, py, x1, y1, x2, y2] of cases) {
      const d = utils.segmentDistance(px, py, x1, y1, x2, y2);
      const d2 = utils.segmentDistance2(px, py, x1, y1, x2, y2);
      assert.ok(Math.abs(Math.sqrt(d2) - d) < 1e-9, `平方一致 ${d} ${d2}`);
    }
    assert.equal(utils.segmentDistance(0, 0, 3, 0, 3, 4), 3);
  });
});

describe('敵機體質', () => {
  it('規格表提到常量後數值不變，未知種類退回斥候', () => {
    const game = new Game(1);
    game.start({ shipId: 0 });
    const scout = game.spawnEnemy('scout', 100);
    assert.equal(scout.r, 16);
    assert.equal(scout.w, 43);
    assert.equal(scout.speed, 85);
    const unknown = game.spawnEnemy('nope', 200);
    assert.equal(unknown.r, 16);
    assert.equal(unknown.speed, 85);
  });
});

function freshGame() {
  const game = new Game(7);
  game.start({ shipId: 0 });
  game.enemies = [];
  game.shots = [];
  game.bullets = [];
  game.drops = [];
  game.effects = [];
  game.player.invulnerable = 0;
  return game;
}

describe('玩家子彈粗排', () => {
  it('路徑上的敵機仍被命中，遠處敵機不受傷', () => {
    const game = freshGame();
    const near = {
      id: 901,
      type: 'scout',
      x: 240,
      y: 300,
      r: 16,
      w: 43,
      h: 34,
      hp: 10,
      maxHp: 10,
      dead: false,
      age: 0,
      flash: 0,
      stage: 0,
    };
    const far = {
      id: 902,
      type: 'scout',
      x: 50,
      y: 100,
      r: 16,
      w: 43,
      h: 34,
      hp: 10,
      maxHp: 10,
      dead: false,
      age: 0,
      flash: 0,
      stage: 0,
    };
    game.enemies.push(near, far);
    game.shots.push({
      x: 240,
      y: 310,
      prevX: 240,
      prevY: 312,
      vx: 0,
      vy: -660,
      r: 4,
      age: 0,
      type: 'pulse',
      color: '#fff',
      damage: 50,
      hit: new Set(),
    });
    game.updateShots(1 / 60);
    assert.ok(near.dead || near.hp < 10, '近處敵機應受傷');
    assert.equal(far.hp, 10, '遠處敵機不應受傷');
  });
});

describe('敵彈粗排', () => {
  it('近身彈觸發受擊，遠彈不觸發', () => {
    const game = freshGame();
    const shield = game.player.shield;
    game.bullets.push({
      x: 240,
      y: 658,
      prevX: 240,
      prevY: 656,
      angle: Math.PI / 2,
      speed: 100,
      vx: 0,
      vy: 100,
      r: 4.5,
      age: 0,
      type: 'aim',
      color: '#ffbd7c',
      turn: 0,
      life: 8,
    });
    game.bullets.push({
      x: 50,
      y: 100,
      prevX: 50,
      prevY: 98,
      angle: Math.PI / 2,
      speed: 100,
      vx: 0,
      vy: 100,
      r: 4.5,
      age: 0,
      type: 'aim',
      color: '#ffbd7c',
      turn: 0,
      life: 8,
    });
    game.updateBullets(1 / 60);
    assert.equal(game.player.shield, shield - 1, '近身彈應扣護盾');
  });

  it('擦彈圈內仍計擦彈', () => {
    const game = freshGame();
    game.player.invulnerable = 0;
    game.bullets.push({
      x: 240,
      y: 650,
      prevX: 240,
      prevY: 648,
      angle: Math.PI / 2,
      speed: 20,
      vx: 0,
      vy: 20,
      r: 4.5,
      age: 0,
      type: 'aim',
      color: '#ffbd7c',
      turn: 0,
      life: 8,
    });
    game.updateBullets(1 / 60);
    assert.ok(game.grazes >= 1, '應計擦彈');
    assert.equal(game.player.shield, 2, '擦彈不應扣血');
  });

  it('遠處分裂彈仍照常分裂', () => {
    const game = freshGame();
    game.bullets.push({
      x: 60,
      y: 120,
      prevX: 60,
      prevY: 118,
      angle: Math.PI / 2,
      speed: 80,
      vx: 0,
      vy: 80,
      r: 8,
      age: 2.1,
      type: 'mine',
      color: '#ff9eaf',
      turn: 0,
      life: 2.1,
      split: true,
    });
    game.updateBullets(1 / 60);
    assert.ok(
      game.bullets.some((b) => b.type === 'drift'),
      '分裂應產生漂移彈'
    );
  });
});

describe('掉落磁吸', () => {
  it('圈內掉落靠近玩家，圈外掉落照常漂移', () => {
    const game = freshGame();
    const px = game.player.x,
      py = game.player.y;
    game.drops.push({
      x: px + 35,
      y: py,
      vx: 0,
      vy: 40,
      age: 0,
      ttl: 10,
      kind: 'shield',
      phase: 0,
    });
    const before = 35;
    game.updateDrops(1 / 60);
    const after = Math.hypot(game.drops[0].x - px, game.drops[0].y - py);
    assert.ok(after < before, '圈內掉落應被吸附靠近');
    game.drops = [];
    game.drops.push({
      x: 50,
      y: 200,
      vx: 0,
      vy: 40,
      age: 0,
      ttl: 10,
      kind: 'shield',
      phase: 0,
    });
    game.updateDrops(1 / 60);
    assert.ok(game.drops[0].y > 200, '圈外掉落應照 vy 漂移');
  });
});

describe('觸控矩形快取', () => {
  it('resize 寫入 canvasRect 供 pointermove 使用', async () => {
    const { resize } = await import('../src/app/frame.js');
    const keep = globalThis.devicePixelRatio;
    globalThis.devicePixelRatio = 1;
    try {
      const S = {
        canvas: {
          width: 0,
          height: 0,
          getBoundingClientRect: () => ({ width: 480, height: 800 }),
        },
        ctx: undefined,
        canvasRect: null,
      };
      resize(S);
      assert.deepEqual(S.canvasRect, { width: 480, height: 800 });
    } finally {
      globalThis.devicePixelRatio = keep;
    }
  });
});
