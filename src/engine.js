import { clamp, segmentDistance, seededRandom, chooseWeapon } from './engine/utils.js';
import * as lifecycle from './engine/lifecycle.js';
import * as combat from './engine/combat.js';
import * as enemies from './engine/enemies.js';
import * as progression from './engine/progression.js';

// 遊戲主類別：構造走混入，行為由各子模組方法組成（對外 API 不變）。
export class Game {
  constructor(seed) {
    lifecycle.construct.call(this, seed);
  }
}
const { construct, ...lifecycleMethods } = lifecycle;
Object.assign(Game.prototype, lifecycleMethods, combat, enemies, progression);

export { clamp, segmentDistance, seededRandom, chooseWeapon };
