// 戰役固定表由 JSON 經 data.js 再匯出；本檔走真實入口，不重抄數值。
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SHIPS, WEAPONS, STAGES, UPGRADES, WIDTH, HEIGHT, STAGE_SECONDS, BOSS_AT, DROP_TTL } from '../src/data.js';
import ships from '../src/data/ships.json' with { type: 'json' };
import weapons from '../src/data/weapons.json' with { type: 'json' };
import stages from '../src/data/stages.json' with { type: 'json' };
import upgrades from '../src/data/upgrades.json' with { type: 'json' };
import constants from '../src/data/constants.json' with { type: 'json' };

describe('戰役 JSON 資料入口', () => {
  it('data.js 匯出與 JSON 為同一份表', () => {
    assert.equal(SHIPS, ships);
    assert.equal(WEAPONS, weapons);
    assert.equal(STAGES, stages);
    assert.equal(UPGRADES, upgrades);
    assert.equal(WIDTH, constants.WIDTH);
    assert.equal(HEIGHT, constants.HEIGHT);
    assert.equal(STAGE_SECONDS, constants.STAGE_SECONDS);
    assert.equal(BOSS_AT, constants.BOSS_AT);
    assert.equal(DROP_TTL, constants.DROP_TTL);
  });

  it('四種武器有權重、五關有首領血量與關卡秒數、升級卡有既有 id、三機可讀', () => {
    const weaponKeys = Object.keys(WEAPONS);
    assert.equal(weaponKeys.length, 4);
    for (const key of weaponKeys) {
      assert.equal(typeof WEAPONS[key].weight, 'number');
      assert.ok(WEAPONS[key].weight > 0);
    }
    assert.equal(STAGES.length, 5);
    assert.equal(STAGE_SECONDS * STAGES.length, 600);
    for (const stage of STAGES) {
      assert.equal(typeof stage.bossHp, 'number');
      assert.ok(stage.bossHp > 0);
    }
    const ids = UPGRADES.map((u) => u.id);
    for (const id of ['damage', 'fireRate', 'hull', 'shield', 'magnet', 'wingmen', 'bomb', 'reactor']) {
      assert.ok(ids.includes(id), `缺少升級 ${id}`);
    }
    assert.equal(SHIPS.length, 6);
    assert.ok(SHIPS.every((s) => typeof s.health === 'number' && typeof s.speed === 'number'));
  });
});
