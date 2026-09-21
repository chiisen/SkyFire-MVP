import { drawAirframe as drawShip } from './airframes.js';
export { drawShip };
import { SHIPS } from './data.js';
import { W, H, TAU, clamp, line, circle } from './render/shared.js';
import { background } from './render/background.js';
import { enemy } from './render/units.js';
import { beam, projectile, drop, effect } from './render/combat.js';

// 組裝整幀畫面：背景彈幕敵我掉落與特效，含機庫展示模式。
/** 只負責繪製，不持有模擬、畫布尺寸、DOM 或計時器。 */
export function drawFrame(c, game, { idleTime = 0, reducedMotion = false } = {}) {
  const t = game.time || 0,
    stage = clamp(game.stageIndex | 0, 0, 4),
    idle = game.mode === 'hangar';
  c.save();
  c.beginPath();
  c.rect(0, 0, W, H);
  c.clip();
  background(c, stage, reducedMotion ? 0 : idle ? idleTime : t);
  if (idle) {
    const livery = SHIPS[clamp(game.player?.shipId | 0, 0, SHIPS.length - 1)].color;
    c.save();
    c.translate(240, 230);
    c.fillStyle = `${livery}55`;
    c.beginPath();
    c.arc(0, 0, 128, 0, TAU);
    c.fill();
    c.strokeStyle = `${livery}aa`;
    c.lineWidth = 2;
    for (const r of [73, 116, 146]) {
      c.beginPath();
      c.arc(0, 0, r, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      line(
        c,
        [
          [Math.cos(a) * 139, Math.sin(a) * 139],
          [Math.cos(a) * 146, Math.sin(a) * 146],
        ],
        `${livery}66`
      );
    }
    line(
      c,
      [
        [-184, 0],
        [-157, 0],
      ],
      `${livery}88`
    );
    line(
      c,
      [
        [157, 0],
        [184, 0],
      ],
      `${livery}88`
    );
    c.restore();
    drawShip(
      c,
      243,
      239 + (reducedMotion ? 0 : Math.sin(idleTime) * 3),
      game.player?.shipId || 0,
      2.65,
      reducedMotion ? 0 : idleTime,
      0,
      { showcase: true, reducedMotion }
    );
    c.restore();
    return;
  }
  c.save();
  const shake = reducedMotion ? 0 : Math.min(9, game.shake || 0);
  if (shake) c.translate(Math.sin(t * 93) * shake, Math.cos(t * 107) * shake * 0.6);
  for (const b of game.beams || []) beam(c, b, t, reducedMotion);
  for (const s of game.shots || []) projectile(c, s, true);
  for (const e of game.enemies || []) enemy(c, e, reducedMotion ? 0 : t);
  const player = game.player;
  if (player && player.health > 0) {
    if (player.shield > 0) {
      c.globalAlpha = 0.16 + 0.19 * clamp(player.shield / (player.maxShield || 100));
      c.beginPath();
      c.ellipse(player.x, player.y, 42, 43, 0, 0, TAU);
      c.fillStyle = '#58b6e722';
      c.fill();
      c.strokeStyle = '#9beaff';
      c.lineWidth = 1.5;
      c.stroke();
      c.globalAlpha = 1;
    }
    if (player.overdriveTime > 0) {
      circle(c, player.x, player.y, 40, null, '#ffda8499', 1.5);
      circle(c, player.x, player.y, 45, null, '#ffe3a333');
    }
    c.globalAlpha = player.invulnerable > 0 ? (reducedMotion ? 0.62 : 0.48 + 0.52 * Math.abs(Math.sin(t * 20))) : 1;
    for (let i = 0; i < (game.upgrades?.wingmen || 0); i++)
      drawShip(
        c,
        player.x + (i ? 1 : -1) * 43,
        player.y + 16,
        player.shipId,
        0.35,
        reducedMotion ? 0 : t,
        player.bank || 0,
        { reducedMotion }
      );
    drawShip(c, player.x, player.y, player.shipId, 1, reducedMotion ? 0 : t, player.bank || 0, {
      boost: player.overdriveTime > 0,
      reducedMotion,
    });
    c.globalAlpha = 1;
    // 可見中心是小受擊判定，而非機翼剪影。
    circle(c, player.x, player.y, 4.4, '#061121', '#cefcff', 1.1);
    circle(c, player.x, player.y, 1.8, '#e5ffff');
  }
  for (const b of game.bullets || []) projectile(c, b);
  for (const d of game.drops || []) drop(c, d, t, reducedMotion);
  for (const e of game.effects || []) effect(c, e, reducedMotion);
  c.restore();
  if (game.flash > 0 && !reducedMotion) {
    c.globalAlpha = Math.min(0.18, game.flash * 0.18);
    c.fillStyle = '#d5f0ff';
    c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;
  }
  c.restore();
}
