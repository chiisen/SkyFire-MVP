// 自動駕駛全戰役模擬：固定步長、真走位、真輸出、真炸彈，不開無敵不直接扣血。
// 目的為流程與平衡檢查（600 秒下限、五首領擊破、關卡推進），非真人難度證明。
// 標準模式＋銅 B-03（厚甲多彈），續戰上限遵守 3 次。
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/engine.js';
import { STAGES, STAGE_SECONDS } from '../src/data.js';

const FRAME = 1 / 60;
// 單關超過此秒數仍未過關，視為輸出或流程 bug，直接失敗避免空轉。
const STAGE_CAP = 1500;
// 整場模擬總步數上限（約 80 分鐘戰鬥）。
const TOTAL_CAP = 80 * 60 * 60;
// 卡片優先序：先火力，次生存，最後功能。
const CARD_PRIORITY = ['damage', 'fireRate', 'wingmen', 'shield', 'hull', 'magnet', 'reactor', 'bomb'];
const HOME = { x: 240, y: 690 };

// 依場上威脅計算移動方向（參數 game，回傳 {dx,dy,slow}；引擎會正規化方向）。
function autopilotInput(game) {
  const p = game.player;
  let fx = 0,
    fy = 0;
  // 回家：待在底部中央，爭取最大反應距離。
  fx += (HOME.x - p.x) * 0.004;
  fy += (HOME.y - p.y) * 0.004;
  let nearest = Infinity;
  // 敵彈排斥：玩家比彈快，徑向拉開即可躲掉多數瞄準彈。
  for (const b of game.bullets) {
    const dx = p.x - b.x,
      dy = p.y - b.y,
      d2 = dx * dx + dy * dy,
      R = 150;
    if (d2 < R * R && d2 > 1) {
      const d = Math.sqrt(d2);
      if (d < nearest) nearest = d;
      const w = ((1 - d / R) * 3.2) / d;
      fx += dx * w;
      fy += dy * w;
    }
  }
  // 雷射：偏離射線，生效中比預警期更用力。
  for (const beam of game.beams) {
    const dirX = Math.cos(beam.angle),
      dirY = Math.sin(beam.angle);
    const relX = p.x - beam.x,
      relY = p.y - beam.y;
    const along = Math.min(Math.max(relX * dirX + relY * dirY, 0), beam.length);
    const cx = beam.x + dirX * along,
      cy = beam.y + dirY * along;
    const dx = p.x - cx,
      dy = p.y - cy,
      d = Math.hypot(dx, dy) || 1;
    const active = beam.age >= beam.warn;
    const safe = beam.width / 2 + (active ? 42 : 26);
    if (d < safe) {
      const w = ((safe - d) / safe) * (active ? 6 : 2.5);
      fx += (dx / d) * w;
      fy += (dy / d) * w;
    }
  }
  // 敵機衝撞排斥。
  for (const e of game.enemies) {
    if (e.dead) continue;
    const dx = p.x - e.x,
      dy = p.y - e.y,
      d2 = dx * dx + dy * dy,
      R = e.r + 55;
    if (d2 < R * R && d2 > 1) {
      const d = Math.sqrt(d2),
        w = ((1 - d / R) * 2.4) / d;
      fx += dx * w;
      fy += dy * w;
    }
  }
  // 相對安全時撿最近的補給；獎勵窗口期更積極。
  if (nearest > 60) {
    let target = null,
      best = game.bossDefeated ? 320 * 320 : 220 * 220;
    for (const drop of game.drops) {
      if (drop.dead) continue;
      const d2 = (drop.x - p.x) ** 2 + (drop.y - p.y) ** 2;
      if (d2 < best) {
        best = d2;
        target = drop;
      }
    }
    if (target) {
      const d = Math.sqrt(best) || 1,
        w = game.bossDefeated ? 1.6 : 0.7;
      fx += ((target.x - p.x) / d) * w;
      fy += ((target.y - p.y) / d) * w;
    }
  }
  // 破對稱漫遊，避免在威脅對稱時原地抖動。
  fx += Math.sin(game.time * 1.7) * 0.18;
  fy += Math.cos(game.time * 1.3) * 0.12;
  const mag = Math.hypot(fx, fy);
  if (mag < 1e-6) return { dx: 0, dy: 0, slow: false };
  return { dx: fx / mag, dy: fy / mag, slow: mag < 0.6 };
}

// 危險時炸彈、滿充能時爆發（參數 game，回傳無；皆為合法遊戲機制）。
function autopilotSkills(game) {
  const p = game.player;
  if (p.overdrive >= 100 && (game.bossSpawned || game.bullets.length > 50)) game.overdrive();
  if (!p.bombs || p.invulnerable > 1.2) return;
  let dense = 0;
  for (const b of game.bullets) {
    const dx = p.x - b.x,
      dy = p.y - b.y;
    if (dx * dx + dy * dy < 85 * 85 && ++dense >= 10) break;
  }
  if (dense >= 10) {
    game.bomb();
    return;
  }
  for (const beam of game.beams) {
    if (beam.age < beam.warn) continue;
    const dirX = Math.cos(beam.angle),
      dirY = Math.sin(beam.angle);
    const along = (p.x - beam.x) * dirX + (p.y - beam.y) * dirY;
    if (along < 0 || along > beam.length) continue;
    const perp = Math.abs(-(p.x - beam.x) * dirY + (p.y - beam.y) * dirX);
    if (perp < beam.width / 2 + 6) {
      game.bomb();
      return;
    }
  }
}

describe('自動駕駛完整戰役模擬', () => {
  it('標準模式真打通關：五首領擊破、有效戰鬥至少 600 秒', () => {
    const game = new Game(20260911);
    game.start({ shipId: 2, difficulty: 'normal' });
    let steps = 0,
      stageGuard = 0,
      lastStage = 0;
    while (game.mode !== 'victory' && steps < TOTAL_CAP) {
      if (game.mode === 'playing') {
        if (game.stageIndex !== lastStage) {
          lastStage = game.stageIndex;
          stageGuard = 0;
        }
        autopilotSkills(game);
        game.update(FRAME, autopilotInput(game));
        if (++stageGuard > STAGE_CAP * 60) assert.fail(`第 ${game.stageIndex + 1} 關 ${STAGE_CAP} 秒未過關`);
      } else if (game.mode === 'upgrade') {
        const pick = CARD_PRIORITY.find((id) => game.choices.some((c) => c.id === id));
        assert.ok(pick, '升級三選一應有可選卡片');
        assert.equal(game.selectUpgrade(pick), true);
      } else if (game.mode === 'gameover') {
        assert.ok(game.continueRun(), '3 次續戰內應能打完');
      } else {
        assert.fail(`意外模式：${game.mode}`);
      }
      if (game.events.length > 400) game.drainEvents();
      steps++;
    }
    assert.equal(game.mode, 'victory', '自動駕駛應完整通關');
    assert.equal(game.bossKills, 5, '應擊破五首領');
    assert.ok(game.continues <= 3, '續戰遵守上限 3 次');
    assert.ok(game.time >= 600 - 1e-6, `有效戰鬥至少 600 秒，實際 ${game.time.toFixed(1)} 秒`);
    for (const [i, name] of ['晨曦海港', '翡翠峽谷', '冰川陣列', '熔核工廠', '天穹核心'].entries())
      assert.equal(STAGES[i].name, name);
    assert.ok(game.time >= STAGE_SECONDS * STAGES.length - 1e-6);
    console.log(
      `autopilot: 通關 ${game.time.toFixed(1)}s，分數 ${game.score}，續戰 ${game.continues}，擦彈 ${game.grazes}`
    );
  });
});
