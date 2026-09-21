import { WIDTH, HEIGHT, STAGES } from '../data.js';
import { dist2, compact, segmentDistance, TAU } from './utils.js';

// 敵機體質表：提到模組常量，避免每次生成敵機重建字面量。
const ENEMY_SPECS = {
  scout: [28, 16, 43, 85],
  interceptor: [38, 18, 48, 150],
  gunship: [125, 29, 73, 43],
  laser: [165, 26, 70, 37],
  carrier: [240, 31, 86, 35],
  mine: [42, 15, 38, 65],
};

export function spawnEnemy(type, x, y = -35, extra = {}) {
  if (this.enemies.length >= 65) return null;
  const [hp, r, w, speed] = ENEMY_SPECS[type] || ENEMY_SPECS.scout,
    id = ++this.id;
  const e = {
    id,
    type,
    x,
    baseX: x,
    y,
    age: 0,
    hp: hp * (1 + this.stageIndex * 0.17),
    maxHp: hp * (1 + this.stageIndex * 0.17),
    r,
    w,
    h: w * 0.8,
    speed,
    fire: 0.9 + this.rng() * 0.7,
    flash: 0,
    angle: 0,
    stage: this.stageIndex,
    phase: 1,
    seed: this.rng() * TAU,
    // 暖色禁區隨機色相（紅橙黃），由 id 乘質數跳散、不動亂數序列，確保與冷綠背景對比。
    hue: ((id * 26) % 75) - 25,
    ...extra,
  };
  this.enemies.push(e);
  return e;
}
// 依關卡與波次編號生成一波雜兵隊形（無參數，回傳無）。

export function spawnWave() {
  const s = this.stageIndex,
    wave = this.waveIndex++,
    kind = wave % 8;
  if (this.bossDefeated) {
    for (let i = 0; i < 4; i++)
      this.spawnEnemy(wave % 3 === 1 ? 'interceptor' : 'scout', 75 + i * 105, -40 - i * 28, {
        side: i % 2 ? -1 : 1,
        path: 'sine',
      });
    if (wave % 3 === 0) this.spawnEnemy('carrier', 240, -100);
    return;
  }
  if (kind === 0 || kind === 3) {
    for (let i = 0; i < 5; i++) this.spawnEnemy('scout', 60 + i * 90, -35 - Math.abs(2 - i) * 30, { path: 'sine' });
  } else if (kind === 1 || kind === 5) {
    const side = Math.floor(wave / 4) % 2 ? -1 : 1;
    for (let i = 0; i < 3 + (s > 1 ? 1 : 0); i++)
      this.spawnEnemy('interceptor', side > 0 ? 60 : 420, -40 - i * 72, { side });
  } else if (kind === 2) {
    this.spawnEnemy('gunship', 120);
    this.spawnEnemy(s ? 'laser' : 'gunship', 360, -95);
  } else if (kind === 4) {
    this.spawnEnemy('carrier', WIDTH / 2);
    for (const x of [90, 390]) this.spawnEnemy('scout', x, -70);
  } else if (kind === 6) {
    this.spawnEnemy('laser', s % 2 ? 100 : 380);
    this.spawnEnemy('gunship', s % 2 ? 380 : 100, -85);
  } else {
    for (let i = 0; i < 4; i++) this.spawnEnemy(s >= 2 ? 'mine' : 'scout', 70 + i * 110, -40 - i * 40);
    if (s >= 3) this.spawnEnemy('carrier', 240, -180);
  }
}
// 生成本關首領並清空場上彈幕保留運輸機（無參數，回傳無）。

export function spawnBoss() {
  this.bossSpawned = true;
  this.bullets.length = 0;
  this.beams.length = 0;
  this.enemies = this.enemies.filter((e) => e.type === 'carrier');
  const stage = STAGES[this.stageIndex],
    hp = stage.bossHp * (this.difficulty === 'arcade' ? 1.15 : 1);
  this.enemies.push({
    id: ++this.id,
    type: 'boss',
    x: WIDTH / 2,
    y: -140,
    baseX: WIDTH / 2,
    w: 172,
    h: 125,
    r: 64,
    age: 0,
    hp,
    maxHp: hp,
    fire: 2.2,
    laserTimer: 4,
    pattern: 0,
    phase: 1,
    transition: 0,
    stage: this.stageIndex,
    flash: 0,
    angle: 0,
  });
  this.emit('boss', { name: stage.bossName });
}
// 發射一顆敵方子彈並套用難度加速（參數座標、角度、速度、種類，回傳無）。

export function bullet(x, y, angle, speed = 145, type = 'aim', extra = {}) {
  if (this.bullets.length >= 720) return;
  this.bullets.push({
    x,
    y,
    prevX: x,
    prevY: y,
    angle,
    speed: speed * this.danger,
    vx: Math.cos(angle) * speed * this.danger,
    vy: Math.sin(angle) * speed * this.danger,
    r: type === 'mine' ? 8 : 4.5,
    age: 0,
    type,
    color: type === 'drift' || type === 'spiral' ? '#ff9eaf' : '#ffbd7c',
    turn: 0,
    life: 8,
    ...extra,
  });
}
// 以扇形一次發射多顆敵方子彈（參數座標、基準角、數量、散角、速度，回傳無）。

export function fan(x, y, angle, count, spread, speed, type = 'aim', extra = {}) {
  for (let i = 0; i < count; i++) this.bullet(x, y, angle + (i - (count - 1) / 2) * spread, speed, type, extra);
}
// 生成一道帶預警時間的敵方雷射（參數 x、y、angle，回傳無）。

export function laser(x, y, angle, extra = {}) {
  if (this.beams.length >= 14) return;
  this.beams.push({
    x,
    y,
    angle,
    length: 1000,
    width: 14,
    age: 0,
    warn: 1.05,
    duration: 0.7,
    color: '#ff676f',
    owner: 'enemy',
    ...extra,
  });
}
// 更新敵機移動、開火並檢查衝撞玩家（參數 dt，回傳無）。

export function updateEnemies(dt) {
  for (const e of this.enemies) {
    if (e.dead) continue;
    e.age += dt;
    e.flash = Math.max(0, e.flash - dt);
    e.fire -= dt;
    if (e.type === 'boss') {
      e.y += (155 - e.y) * Math.min(1, dt * 1.6);
      e.x = WIDTH / 2 + Math.sin(e.age * (0.65 + e.stage * 0.07)) * (e.stage === 4 ? 65 : 100);
      e.transition = Math.max(0, e.transition - dt);
      if (e.age > 2 && e.transition <= 0 && e.fire <= 0) {
        this.bossPattern(e);
        e.fire = (1.3 - e.phase * 0.13) / this.danger;
      }
      e.laserTimer -= dt;
      if (e.age > 2 && e.transition <= 0 && e.laserTimer <= 0) {
        this.bossLasers(e);
        e.laserTimer = Math.max(3.5, 6.8 - e.phase * 0.65 - e.stage * 0.25);
      }
    } else {
      e.y += e.speed * dt;
      if (e.type === 'scout' && e.path === 'sine') e.x = e.baseX + Math.sin(e.age * 1.8 + e.seed) * 26;
      if (e.type === 'interceptor') {
        e.x += (e.side || 1) * 65 * dt;
        e.angle = -(e.side || 1) * 0.22;
      }
      if (e.type === 'carrier') e.x = e.baseX + Math.sin(e.age) * 65;
      if (e.fire <= 0 && e.y > 25 && e.y < HEIGHT - 170) {
        const a = Math.atan2(this.player.y - e.y, this.player.x - e.x);
        if (e.type === 'laser') {
          this.laser(e.x, e.y + 20, a, { width: 11, warn: 1.1, duration: 0.55 });
          e.fire = 3.8;
        } else if (e.type === 'gunship') {
          this.fan(e.x, e.y + 22, a, 3 + 2 * (e.stage > 1), 0.19, 125 + e.stage * 10, e.stage ? 'drift' : 'aim', {
            turn: e.stage ? Math.sin(e.seed) * 0.22 : 0,
          });
          e.fire = 1.65;
        } else if (e.type === 'carrier') {
          this.fan(e.x, e.y + 28, Math.PI / 2, 6, 0.32, 115, 'drift', { turn: Math.sin(e.age) * 0.28 });
          e.fire = 2;
        } else if (e.type === 'mine') {
          this.fan(e.x, e.y, Math.PI / 2, 8, TAU / 8, 100, 'spiral', { turn: 0.32 });
          e.fire = 6;
        } else {
          this.fan(e.x, e.y + 15, a, e.stage > 2 ? 2 : 1, 0.15, 130 + e.stage * 12);
          e.fire = e.type === 'interceptor' ? 1.8 : 2.7;
        }
      }
    }
    if (this.mode === 'playing' && dist2(e, this.player) < (e.r * 0.65 + 5) ** 2) this.hitPlayer();
  }
}
// 依關卡與階段施放首領彈幕套路（參數 e，回傳無）。

export function bossPattern(e) {
  const a = Math.atan2(this.player.y - e.y, this.player.x - e.x),
    turn = e.pattern++ % 2 ? -1 : 1;
  const phase = e.phase,
    s = e.stage;
  if (s === 0) {
    for (const side of [-1, 1])
      this.fan(e.x + side * 48, e.y + 34, a + side * 0.08, 3 + phase * 2, 0.13, 120 + phase * 16);
  } else if (s === 1) {
    this.fan(e.x, e.y + 30, Math.PI / 2 + Math.sin(e.age) * 0.4, 8 + phase * 2, 0.23, 130, 'drift', {
      turn: turn * 0.36,
    });
    if (phase > 1) this.fan(e.x, e.y + 25, a, 3, 0.14, 205, 'fast');
  } else if (s === 2) {
    const count = 18 + phase * 2,
      gap = Math.atan2(this.player.y - e.y, this.player.x - e.x) + turn * 0.2;
    for (let i = 0; i < count; i++) {
      const angle = (i * TAU) / count + e.age * 0.12;
      if (Math.abs(Math.atan2(Math.sin(angle - gap), Math.cos(angle - gap))) > 0.23)
        this.bullet(e.x, e.y, angle, 110 + phase * 12, 'spiral', { turn: turn * 0.14 });
    }
  } else if (s === 3) {
    this.fan(e.x, e.y + 35, a, 9 + phase * 2, 0.17, 92, 'drift', { turn: turn * 0.23, accel: 23 });
    if (phase > 1)
      for (const side of [-1, 1])
        this.bullet(e.x + side * 56, e.y + 15, Math.PI / 2 + side * 0.3, 80, 'mine', { life: 2.1, split: true });
  } else {
    const count = 16 + phase * 4;
    for (let i = 0; i < count; i++)
      this.bullet(e.x, e.y, e.age * 0.5 + (i * TAU) / count, 115 + phase * 10, 'spiral', { turn: turn * 0.27 });
    if (e.pattern % 2 === 0) this.fan(e.x, e.y + 30, a, 5, 0.11, 210, 'fast');
  }
}
// 依關卡施放首領雷射攻擊組合（參數 e，回傳無）。

export function bossLasers(e) {
  const a = Math.atan2(this.player.y - e.y, this.player.x - e.x);
  if (e.stage === 0) this.laser(e.x, e.y + 35, a, { width: 18, warn: 1.2, duration: 0.8 });
  else if (e.stage === 1)
    for (const side of [-1, 1]) this.laser(e.x + side * 55, e.y + 15, a + side * 0.28, { width: 13, warn: 1.2 });
  else if (e.stage === 2)
    for (const x of [65, 240, 415]) this.laser(x, 0, Math.PI / 2, { width: 20, warn: 1.4, duration: 1 });
  else if (e.stage === 3)
    for (const side of [-1, 1])
      this.laser(e.x + side * 60, e.y + 30, Math.PI / 2 + side * 0.42, {
        width: 16,
        warn: 1.3,
        duration: 1.1,
        sweep: -side * 0.18,
      });
  else
    for (const side of [-1, 0, 1])
      this.laser(e.x + side * 55, e.y + 30, a + side * 0.42, { width: 17, warn: 1.35, duration: 0.85 });
}
// 扣敵機血量並處理首領轉階段與擊殺結算（參數 e、damage，回傳無）。

export function damageEnemy(e, damage) {
  if (e.dead) return;
  if (e.type === 'boss' && (e.age < 2 || e.transition > 0)) return;
  e.hp -= damage;
  e.flash = 0.065;
  // 階段屏障阻止單次爆發跳過旗艦機制。
  if (e.type === 'boss' && e.phase < 3) {
    const threshold = e.maxHp * (e.phase === 1 ? 0.65 : 0.3);
    if (e.hp <= threshold) {
      e.hp = threshold;
      e.phase++;
      e.transition = 1.15;
      e.fire = 0.25;
      e.laserTimer = 0.7;
      this.bullets.length = 0;
      this.beams.length = 0;
      this.fx('ring', e.x, e.y, '#c5b5ff', 130);
      this.emit('bossPhase', { phase: e.phase });
    }
  }
  if (e.hp > 0) return;
  e.dead = true;
  this.kills++;
  this.stageKills++;
  this.combo++;
  this.comboTimer = 3.6;
  const multiplier = Math.min(5, 1 + Math.floor(this.combo / 8));
  const value = (e.type === 'boss' ? 12000 : e.type === 'carrier' ? 600 : e.type === 'scout' ? 100 : 250) * multiplier;
  this.score += value;
  this.addCharge(e.type === 'boss' ? 35 : e.type === 'scout' ? 1.8 : 4);
  this.fx('explosion', e.x, e.y, e.type === 'boss' ? '#ffe0a5' : '#ffb679', e.type === 'boss' ? 140 : e.r * 1.6);
  if (e.type !== 'scout' || this.combo % 5 === 0) this.fx('text', e.x, e.y, '#e4efff', 14, `+${value}`);
  if (e.type === 'boss') {
    this.bossDefeated = true;
    this.bossDefeatedAt = this.stageTime;
    this.bossKills++;
    this.bullets.length = 0;
    this.beams.length = 0;
    this.shake = 14;
    this.flash = 0.7;
    this.spawnDrop(e.x - 45, e.y, 'weapon', this.stageIndex >= 2 ? 'nova' : 'arc');
    this.spawnDrop(e.x + 45, e.y, 'repair');
    this.spawnDrop(e.x, e.y + 50, 'bomb');
    this.emit('bossDefeated');
  } else {
    this.noDropKills++;
    if (e.type === 'carrier' || this.rng() < 0.19 || this.noDropKills >= 13) {
      this.spawnDrop(e.x, e.y, 'weapon');
      this.noDropKills = 0;
    } else if (this.rng() < 0.04) this.spawnDrop(e.x, e.y, this.rng() < 0.6 ? 'shield' : 'repair');
    this.emit('kill');
  }
}
// 更新玩家子彈含追蹤、爆炸與穿透判定（參數 dt，回傳無）。

export function updateBeams(dt) {
  for (const beam of this.beams) {
    beam.age += dt;
    if (beam.age >= beam.warn && beam.age < beam.warn + beam.duration) {
      beam.angle += (beam.sweep || 0) * dt;
      const d = segmentDistance(
        this.player.x,
        this.player.y,
        beam.x,
        beam.y,
        beam.x + Math.cos(beam.angle) * beam.length,
        beam.y + Math.sin(beam.angle) * beam.length
      );
      if (d < beam.width * 0.5 + 4) this.hitPlayer();
    }
  }
  compact(this.beams, (b) => b.age < b.warn + b.duration);
}
// 在場內生成武器或補給掉落物（參數 x、y、kind、weapon，回傳無）。
