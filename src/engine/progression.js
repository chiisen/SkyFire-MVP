import { WIDTH, HEIGHT, WEAPONS, STAGES, UPGRADES, DROP_TTL } from '../data.js';
import { clamp, dist2, chooseWeapon, TAU } from './utils.js';

export function continueRun() {
  if (this.mode !== 'gameover' || this.continues >= 3) return false;
  this.continues++;
  this.score = Math.floor(this.score * 0.65);
  this.combo = 0;
  this.player.health = this.player.maxHealth;
  this.player.bombs = Math.max(2, this.player.bombs);
  this.player.overdrive = 50;
  this.mode = 'playing';
  this.enterStage(this.stageIndex);
  return true;
}
// 套用過關三選一升級並前進下一關（參數 id，回傳是否成功）。

export function selectUpgrade(id) {
  if (this.mode !== 'upgrade' || !this.choices.some((c) => c.id === id)) return false;
  const p = this.player;
  if (id === 'bomb') p.bombs = Math.min(5, p.bombs + 2);
  else this.upgrades[id]++;
  if (id === 'hull') {
    p.maxHealth++;
    p.health = Math.min(p.maxHealth, p.health + 2);
  }
  if (id === 'shield') {
    p.maxShield++;
    p.shield = p.maxShield;
  }
  p.health = Math.min(p.maxHealth, p.health + 2);
  p.bombs = Math.min(5, p.bombs + 1);
  this.mode = 'playing';
  this.enterStage(this.stageIndex + 1);
  return true;
}
// 洗牌並抽出三張升級候選（無參數，回傳無）。

export function makeChoices() {
  const options = UPGRADES.filter((u) => u.id !== 'wingmen' || this.upgrades.wingmen < 2);
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(this.rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  this.choices = options.slice(0, 3);
}
// 新增爆炸、光環或浮字等視覺特效（參數 type、x、y、color、size、text，回傳無）。

export function fx(type, x, y, color = '#ffe0a0', size = 20, text = '') {
  if (this.effects.length >= 180) this.effects.shift();
  this.effects.push({
    type,
    x,
    y,
    age: 0,
    ttl: type === 'text' ? 1.25 : type === 'explosion' ? 0.7 : 0.4,
    color,
    size,
    text,
  });
}
// 累積超載能量條並吃反應爐加成（參數 n，回傳無）。

export function spawnDrop(x, y, kind = 'weapon', weapon = null) {
  if (this.drops.length > 24) this.drops.shift();
  this.drops.push({
    x: clamp(x, 26, WIDTH - 26),
    y: clamp(y, 105, HEIGHT - 65),
    vx: (this.rng() < 0.5 ? -1 : 1) * (32 + this.rng() * 28),
    vy: 37 + this.rng() * 30,
    age: 0,
    ttl: DROP_TTL,
    kind,
    weapon: weapon || chooseWeapon(this.rng),
    phase: this.rng() * TAU,
  });
}
// 更新掉落物漂移、磁吸、反彈與拾取（參數 dt，回傳無）。

export function updateDrops(dt) {
  const p = this.player;
  for (const drop of this.drops) {
    drop.age += dt;
    if (drop.age >= drop.ttl) {
      drop.dead = true;
      continue;
    }
    const d2 = dist2(drop, p),
      magnet = 50 + this.upgrades.magnet * 32;
    // 先用距離平方比較：只有進入吸附圈才開根號算方向，場上多數掉落走漂移分支。
    if (d2 < magnet * magnet && d2 > 1) {
      const distance = Math.sqrt(d2);
      drop.x += ((p.x - drop.x) / distance) * 210 * dt;
      drop.y += ((p.y - drop.y) / distance) * 210 * dt;
    } else {
      drop.x += (drop.vx + Math.sin(drop.age * 2 + drop.phase) * 17) * dt;
      drop.y += drop.vy * dt;
    }
    if (drop.x < 24 || drop.x > WIDTH - 24) {
      drop.vx *= -1;
      drop.x = clamp(drop.x, 24, WIDTH - 24);
    }
    if (drop.y < 100 || drop.y > HEIGHT - 60) {
      drop.vy *= -1;
      drop.y = clamp(drop.y, 100, HEIGHT - 60);
    }
    if (dist2(drop, p) < 29 ** 2) this.collectDrop(drop);
  }
  this.drops = this.drops.filter((d) => !d.dead);
}
// 拾取掉落並套用武器升級或補給效果（參數 drop，回傳無）。

export function collectDrop(drop) {
  const p = this.player;
  drop.dead = true;
  let label;
  if (drop.kind === 'weapon') {
    p.weapon = drop.weapon;
    p.levels[drop.weapon] = Math.min(5, p.levels[drop.weapon] + 1);
    p.weaponLevel = p.levels[drop.weapon];
    label = `${WEAPONS[drop.weapon].name} Lv.${p.weaponLevel}`;
    this.addCharge(5);
  } else if (drop.kind === 'repair') {
    p.health = Math.min(p.maxHealth, p.health + 2);
    label = '機體修復 +2';
  } else if (drop.kind === 'shield') {
    p.shield = Math.min(p.maxShield, p.shield + 1);
    label = '護盾恢復';
  } else {
    p.bombs = Math.min(5, p.bombs + 1);
    label = '震盪炸彈 +1';
  }
  this.score += 150;
  this.fx('text', p.x, p.y - 40, WEAPONS[drop.weapon]?.color || '#bcffe7', 17, label);
  this.emit('pickup', { label });
}
// 結算過關獎分並轉勝利或升級選牌（無參數，回傳無）。

export function completeStage() {
  this.score += 3000 + this.player.health * 300;
  this.bullets.length = 0;
  this.beams.length = 0;
  if (this.practice || this.stageIndex === STAGES.length - 1) {
    this.mode = 'victory';
    this.emit('victory', { practice: this.practice });
  } else {
    this.mode = 'upgrade';
    this.makeChoices();
    this.emit('clear', { index: this.stageIndex });
  }
}
