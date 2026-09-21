import { WIDTH, HEIGHT, SHIPS, STAGES, STAGE_SECONDS, BOSS_AT, DROP_TTL } from '../data.js';
import { clamp, compact, seededRandom } from './utils.js';
import { EventLog } from '../debug/logger.js';

// 建構遊戲實例並以種子初始化亂數狀態（參數 seed，回傳無）。
export function construct(seed = Date.now()) {
  this.seed = seed;
  this.rng = seededRandom(seed);
  this.frame = 0;
  this.diagnostics = new EventLog();
  this.reset();
}
// 重置整局狀態與玩家初始數值（無參數，回傳無）。
export function reset() {
  this.mode = 'hangar';
  this.time = 0;
  this.stageIndex = 0;
  this.stageTime = 0;
  this.bossDefeatedAt = null;
  this.score = 0;
  this.kills = 0;
  this.grazes = 0;
  this.combo = 0;
  this.comboTimer = 0;
  this.continues = 0;
  this.stageKills = 0;
  this.bossKills = 0;
  this.noDropKills = 0;
  this.upgrades = { damage: 0, fireRate: 0, hull: 0, shield: 0, magnet: 0, wingmen: 0, reactor: 0 };
  this.enemies = [];
  this.bullets = [];
  this.shots = [];
  this.beams = [];
  this.drops = [];
  this.effects = [];
  this.events = [];
  this.shake = 0;
  this.flash = 0;
  this.id = 0;
  this.frame = 0;
  this.practice = false;
  this.choices = [];
  this.player = {
    x: WIDTH / 2,
    y: HEIGHT - 135,
    shipId: 0,
    health: 5,
    maxHealth: 5,
    shield: 2,
    maxShield: 2,
    invulnerable: 0,
    weapon: 'pulse',
    weaponLevel: 1,
    bank: 0,
    overdrive: 20,
    overdriveTime: 0,
    bombs: 2,
    levels: { pulse: 1, laser: 0, arc: 0, nova: 0 },
  };
}
// 推入待前端消費的遊戲事件（參數 type、details，回傳無）。
export function emit(type, details = {}) {
  if (this.events.length < 160) this.events.push({ type, ...details });
  this.diagnostics.record({
    time: Number(this.time.toFixed(6)),
    frame: this.frame,
    level: type === 'error' ? 'error' : 'info',
    category: type === 'damage' || type === 'bomb' ? 'combat' : 'lifecycle',
    event: type,
    stage: this.stageIndex,
    mode: this.mode,
    data: details,
  });
}

export function debugSnapshot() {
  const p = this.player;
  return {
    seed: this.seed,
    frame: this.frame,
    mode: this.mode,
    stageIndex: this.stageIndex,
    stageTime: this.stageTime,
    time: this.time,
    score: this.score,
    player: { x: p.x, y: p.y, health: p.health, shield: p.shield, weapon: p.weapon, weaponLevel: p.weaponLevel, bombs: p.bombs },
    counts: { enemies: this.enemies.length, bullets: this.bullets.length, drops: this.drops.length, effects: this.effects.length },
  };
}
// 取出並清空事件佇列（無參數，回傳事件陣列）。
export function drainEvents() {
  return this.events.splice(0);
}
// 依機體與難度開局並進入指定關卡（參數 shipId、difficulty、practiceStage，回傳無）。
export function start({ shipId = 0, difficulty = 'normal', practiceStage = null } = {}) {
  this.reset();
  this.rng = seededRandom(this.seed);
  const ship = SHIPS[shipId] || SHIPS[0];
  this.difficulty = difficulty === 'arcade' ? 'arcade' : 'normal';
  this.danger = this.difficulty === 'arcade' ? 1.23 : 1;
  this.player = {
    ...this.player,
    shipId: ship.id,
    health: ship.health,
    maxHealth: ship.health,
    shield: ship.shield,
    maxShield: ship.shield,
    bombs: ship.bombStock,
  };
  if (ship.id === 1) {
    this.player.weapon = 'laser';
    this.player.levels.laser = 1;
  }
  this.practice = Number.isInteger(practiceStage) && practiceStage >= 0 && practiceStage < STAGES.length;
  this.mode = 'playing';
  this.enterStage(this.practice ? practiceStage : 0);
}
// 載入指定關卡並重置波次與玩家位置（參數 index，回傳無）。
export function enterStage(index) {
  this.stageIndex = index;
  this.stageTime = 0;
  this.nextWave = 1.8;
  this.waveIndex = 0;
  this.bossSpawned = false;
  this.bossDefeated = false;
  this.bossDefeatedAt = null;
  this.stageKills = 0;
  this.enemies = [];
  this.bullets = [];
  this.shots = [];
  this.beams = [];
  this.drops = [];
  this.effects = [];
  this.player.x = WIDTH / 2;
  this.player.y = HEIGHT - 135;
  this.player.invulnerable = 2;
  this.player.overdriveTime = 0;
  this.fireTimer = 0;
  this.missileTimer = 0;
  this.sinceHit = 0;
  this.player.shield = this.player.maxShield;
  this.emit('stage', { index });
}
// 暫停進行中的遊戲（無參數，回傳無）。
export function pause() {
  if (this.mode === 'playing') {
    this.mode = 'paused';
    this.emit('pause');
  }
}
// 從暫停恢復為遊玩中（無參數，回傳無）。
export function resume() {
  if (this.mode === 'paused') {
    this.mode = 'playing';
    this.emit('resume');
  }
}
// 以子步進推進遊戲時間並維持碰撞穩定（參數 dt、input，回傳無）。
export function update(dt, input = {}) {
  if (this.mode !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
  // 子步進在慢速／手機幀下保持掃掠碰撞與穩定彈道。
  let remaining = Math.min(dt, 0.12);
  while (remaining > 1e-8 && this.mode === 'playing') {
    const h = Math.min(remaining, 1 / 60);
    this.step(h, input);
    remaining -= h;
  }
}
// 推進固定步長的移動、開火、波次與清理（參數 dt、input，回傳無）。
export function step(dt, input) {
  this.frame++;
  this.time += dt;
  this.stageTime += dt;
  this.sinceHit += dt;
  this.comboTimer -= dt;
  if (this.comboTimer <= 0) this.combo = 0;
  this.shake = Math.max(0, this.shake - dt * 24);
  this.flash = Math.max(0, this.flash - dt * 2);
  const p = this.player,
    ship = SHIPS[p.shipId];
  p.invulnerable = Math.max(0, p.invulnerable - dt);
  p.overdriveTime = Math.max(0, p.overdriveTime - dt);
  if (this.sinceHit >= 13 && p.shield < p.maxShield) {
    p.shield++;
    this.sinceHit = 6;
    this.fx('ring', p.x, p.y, '#80ddff', 40);
  }
  let dx = Number(input.dx) || 0,
    dy = Number(input.dy) || 0;
  if (input.pointer && Number.isFinite(input.targetX) && Number.isFinite(input.targetY)) {
    dx = input.targetX - p.x;
    dy = input.targetY - p.y;
  }
  const length = Math.hypot(dx, dy),
    maxMove = ship.speed * (input.slow ? 0.48 : 1) * dt;
  const move = input.pointer ? Math.min(length, maxMove * 1.45) : length > 0 ? maxMove : 0;
  const deltaX = length ? (dx / length) * move : 0;
  p.x = clamp(p.x + deltaX, 18, WIDTH - 18);
  p.y = clamp(p.y + (length ? (dy / length) * move : 0), 88, HEIGHT - 35);
  p.bank += (clamp(deltaX / (dt * 350), -1, 1) - p.bank) * Math.min(1, dt * 12);
  this.fireTimer -= dt;
  this.missileTimer -= dt;
  if (this.fireTimer <= 0) this.firePlayer();
  if (this.missileTimer <= 0 && this.upgrades.wingmen) {
    this.missileTimer = 0.42;
    for (let i = 0; i < this.upgrades.wingmen; i++)
      this.addShot(p.x + (i ? 1 : -1) * 26, p.y, -Math.PI / 2, 'missile', 18, 380, 5, { homing: 5 });
  }
  if (!this.bossSpawned && this.stageTime >= BOSS_AT) this.spawnBoss();
  if (this.stageTime >= this.nextWave && (!this.bossSpawned || this.bossDefeated)) {
    this.spawnWave();
    this.nextWave = this.stageTime + (this.bossDefeated ? 3.4 : 3.8 - this.stageIndex * 0.24);
  }
  this.updateEnemies(dt);
  this.updateShots(dt);
  this.updateBullets(dt);
  this.updateBeams(dt);
  this.updateDrops(dt);
  this.effects.forEach((e) => {
    e.age += dt;
    if (e.type === 'text') e.y -= dt * 20;
  });
  compact(this.effects, (e) => e.age < e.ttl);
  compact(this.enemies, (e) => !e.dead && e.y < HEIGHT + 90 && e.x > -160 && e.x < WIDTH + 160);
  // 晚擊殺首領仍給完整有效時間拾取掉落。
  if (
    this.mode === 'playing' &&
    this.bossDefeated &&
    this.stageTime >= Math.max(STAGE_SECONDS, this.bossDefeatedAt + DROP_TTL)
  )
    this.completeStage();
}
