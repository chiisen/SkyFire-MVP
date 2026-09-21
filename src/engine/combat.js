import { WIDTH, HEIGHT, SHIPS, WEAPONS } from '../data.js';
import { clamp, compact, dist2, segmentDistance, TAU } from './utils.js';

// 累積超載能量條並吃反應爐加成（參數 n，回傳無）。
export function addCharge(n) {
  this.player.overdrive = Math.min(100, this.player.overdrive + n * (1 + this.upgrades.reactor * 0.3));
}
// 引爆震盪炸彈清彈並重創全場敵機（無參數，回傳是否成功）。
export function bomb() {
  const p = this.player;
  if (this.mode !== 'playing' || !p.bombs) return false;
  p.bombs--;
  p.invulnerable = Math.max(p.invulnerable, 2.2);
  this.bullets.length = 0;
  this.beams.length = 0;
  for (const enemy of [...this.enemies]) this.damageEnemy(enemy, enemy.type === 'boss' ? 480 : 800);
  this.fx('ring', p.x, p.y, '#bbf5ff', 680);
  this.shake = 10;
  this.flash = 0.6;
  this.emit('bomb');
  return true;
}
// 開啟超載模式清空彈幕並強化火力（無參數，回傳是否成功）。
export function overdrive() {
  const p = this.player;
  if (this.mode !== 'playing' || p.overdrive < 100 || p.overdriveTime > 0) return false;
  p.overdrive = 0;
  p.overdriveTime = 8;
  p.invulnerable = Math.max(p.invulnerable, 1);
  this.bullets.length = 0;
  this.beams.length = 0;
  this.fx('ring', p.x, p.y, '#f8ca6a', 280);
  this.emit('overdrive');
  return true;
}
// 發射一顆玩家子彈並套用傷害加成（參數座標、角度、種類、傷害、速度、半徑，回傳無）。
export function addShot(x, y, angle, type, damage, speed = 660, r = 4, extra = {}) {
  if (this.shots.length >= 320) return;
  const p = this.player;
  this.shots.push({
    x,
    y,
    prevX: x,
    prevY: y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r,
    age: 0,
    type,
    color: WEAPONS[type]?.color || '#e2edff',
    damage: damage * SHIPS[p.shipId].damage * (1 + this.upgrades.damage * 0.15) * (p.overdriveTime ? 1.65 : 1),
    // 命中集只裝穿透彈的少數 id（穿透上限 4），小陣列比 Set 省配置。
    hit: [],
    ...extra,
  });
}
// 依當前武器與等級產生玩家彈幕並節流音效（無參數，回傳無）。
export function firePlayer() {
  const p = this.player,
    lv = p.weaponLevel;
  this.fireTimer +=
    0.145 / (SHIPS[p.shipId].fireRate * (1 + this.upgrades.fireRate * 0.12) * (p.overdriveTime ? 1.4 : 1));
  // 6 級後散射續增但設上限 9，避免 10 級彈幕過寬。
  const n = Math.min(9, 3 + 2 * Math.floor((lv - 1) / 2));
  if (p.weapon === 'pulse') {
    for (let i = 0; i < n; i++)
      this.addShot(p.x, p.y - 25, -Math.PI / 2 + (i - (n - 1) / 2) * 0.095, 'pulse', 9 + lv * 1.5);
  } else if (p.weapon === 'laser') {
    const count = lv >= 3 ? 2 : 1;
    for (let i = 0; i < count; i++)
      this.addShot(p.x + (count === 2 ? (i ? 7 : -7) : 0), p.y - 24, -Math.PI / 2, 'laser', 26 + lv * 3, 1000, 5, {
        pierce: 4,
      });
  } else if (p.weapon === 'arc') {
    for (const sign of [-1, 1])
      this.addShot(p.x + sign * 14, p.y - 18, -Math.PI / 2 + sign * 0.24, 'arc', 13 + lv * 2, 510, 5, {
        homing: 4.8,
      });
    if (lv >= 3) this.addShot(p.x, p.y - 25, -Math.PI / 2, 'arc', 13 + lv * 2, 560, 5, { homing: 4 });
  } else {
    this.addShot(p.x, p.y - 24, -Math.PI / 2, 'nova', 38 + lv * 5, 600, 8, { blast: 48 + lv * 4 });
    for (const sign of [-1, 1]) this.addShot(p.x, p.y - 22, -Math.PI / 2 + sign * 0.15, 'pulse', 10 + lv * 2);
  }
  if (Math.floor(this.time * 5) !== this.lastShotSound) {
    this.lastShotSound = Math.floor(this.time * 5);
    this.emit('shot', { weapon: p.weapon });
  }
}
// 更新玩家子彈含追蹤、爆炸與穿透判定（參數 dt，回傳無）。
export function updateShots(dt) {
  for (const shot of this.shots) {
    shot.age += dt;
    shot.prevX = shot.x;
    shot.prevY = shot.y;
    if (shot.homing) {
      let target = null,
        nearest = Infinity;
      for (const e of this.enemies) {
        const d = dist2(shot, e);
        if (!e.dead && e.y > 0 && d < nearest) {
          nearest = d;
          target = e;
        }
      }
      if (target) {
        const speed = Math.hypot(shot.vx, shot.vy),
          angle = Math.atan2(shot.vy, shot.vx),
          desired = Math.atan2(target.y - shot.y, target.x - shot.x);
        const delta = Math.atan2(Math.sin(desired - angle), Math.cos(desired - angle));
        const next = angle + clamp(delta, -shot.homing * dt, shot.homing * dt);
        shot.vx = Math.cos(next) * speed;
        shot.vy = Math.sin(next) * speed;
      }
    }
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    // 粗排：子彈本幀位移有限，離現點超過（半徑和＋步長）就不可能碰到線段，直接跳過精確計算。
    const step = Math.hypot(shot.vx, shot.vy) * dt;
    for (const enemy of this.enemies) {
      if (enemy.dead || shot.dead || shot.hit.includes(enemy.id)) continue;
      const rr = enemy.r + shot.r,
        coarse = rr + step,
        dx = enemy.x - shot.x,
        dy = enemy.y - shot.y;
      if (dx * dx + dy * dy > coarse * coarse) continue;
      if (segmentDistance(enemy.x, enemy.y, shot.prevX, shot.prevY, shot.x, shot.y) < rr) {
        shot.hit.push(enemy.id);
        this.damageEnemy(enemy, shot.damage);
        if (shot.blast) {
          this.fx('ring', shot.x, shot.y, '#ffd478', shot.blast);
          for (const other of this.enemies)
            if (other !== enemy && !other.dead && dist2(shot, other) < (shot.blast + other.r) ** 2)
              this.damageEnemy(other, shot.damage * 0.5);
        }
        if (!shot.pierce || shot.hit.length >= shot.pierce) shot.dead = true;
      }
    }
  }
  compact(this.shots, (s) => !s.dead && s.age < 4 && s.y > -50 && s.y < HEIGHT + 50 && s.x > -60 && s.x < WIDTH + 60);
}
// 結算玩家受擊扣盾扣血或觸發自動炸彈與終局（無參數，回傳無）。
export function hitPlayer() {
  const p = this.player;
  if (p.invulnerable > 0 || this.mode !== 'playing') return;
  if (this.difficulty === 'normal' && p.shield === 0 && p.health <= 1 && p.bombs > 0) {
    this.bomb();
    this.emit('autobomb');
    return;
  }
  if (p.shield > 0) p.shield--;
  else p.health--;
  p.invulnerable = 2.1;
  this.sinceHit = 0;
  this.combo = 0;
  this.shake = 6;
  this.fx('ring', p.x, p.y, '#ffb09c', 65);
  this.emit('hit');
  if (p.health <= 0) {
    this.mode = 'gameover';
    this.emit('gameover');
  }
}
// 更新敵彈含擦彈加分與分裂子彈排程（參數 dt，回傳無）。
export function updateBullets(dt) {
  const pending = [];
  for (const b of this.bullets) {
    b.prevX = b.x;
    b.prevY = b.y;
    b.age += dt;
    b.angle += b.turn * dt;
    b.speed += (b.accel || 0) * dt;
    b.vx = Math.cos(b.angle) * b.speed;
    b.vy = Math.sin(b.angle) * b.speed;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // 粗排：多數敵彈遠離玩家，先用距離平方排除，再對近距離者算線段精確值（受擊 5、擦彈 23）。
    // 分裂排程不受影響，仍每次檢查。
    const pdx = this.player.x - b.x,
      pdy = this.player.y - b.y,
      grazeR = 23 + b.r + Math.hypot(b.vx, b.vy) * dt;
    if (pdx * pdx + pdy * pdy <= grazeR * grazeR) {
      const d = segmentDistance(this.player.x, this.player.y, b.prevX, b.prevY, b.x, b.y);
      if (d < 5 + b.r) {
        this.hitPlayer();
        b.dead = true;
      } else if (d < 23 + b.r && !b.grazed && this.player.invulnerable <= 0) {
        b.grazed = true;
        this.grazes++;
        this.score += 25;
        this.addCharge(1.4);
        if (this.grazes % 4 === 0) this.fx('text', this.player.x, this.player.y - 25, '#a6ffdf', 12, 'GRAZE +25');
      }
    }
    if (b.split && b.age >= b.life) {
      b.dead = true;
      pending.push(b);
    }
  }
  compact(
    this.bullets,
    (b) => !b.dead && b.age < b.life && b.x > -100 && b.x < WIDTH + 100 && b.y > -120 && b.y < HEIGHT + 80
  );
  for (const b of pending) this.fan(b.x, b.y, b.age, 8, TAU / 8, 140, 'drift', { turn: 0.2 });
}
