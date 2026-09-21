// 本機紀錄純邏輯：遷移、正規化、提交與刷新判定。
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecords, migrateLegacyBest, recordOf, submitRun } from '../src/app/records.js';

const run = (over = {}) => ({
  mode: 'campaign',
  difficulty: 'normal',
  score: 1000,
  time: 300,
  kills: 40,
  grazes: 12,
  shipId: 0,
  won: false,
  at: 111,
  ...over,
});

describe('本機紀錄', () => {
  it('舊版單一最高分遷移為 campaign/normal', () => {
    assert.deepEqual(recordOf(migrateLegacyBest(5000), 'campaign', 'normal').score, 5000);
    assert.deepEqual(migrateLegacyBest(0), {});
    assert.deepEqual(migrateLegacyBest(undefined), {});
  });

  it('正規化剔除無效項並補齊欄位', () => {
    const out = normalizeRecords({
      campaign: { normal: { score: 123 }, arcade: { bad: true }, broken: 7 },
      junk: 'nope',
    });
    assert.equal(out.campaign.normal.score, 123);
    assert.equal(out.campaign.normal.clearTime, null);
    assert.equal(out.campaign.arcade, undefined);
    assert.equal(out.junk, undefined);
  });

  it('正規化剔除 NaN/Infinity 分數與時間', () => {
    assert.deepEqual(normalizeRecords({ campaign: { normal: { score: NaN } } }), {});
    assert.deepEqual(normalizeRecords({ campaign: { normal: { score: Infinity } } }), {});
    const out = normalizeRecords({ campaign: { normal: { score: 5, clearTime: NaN } } });
    assert.equal(out.campaign.normal.clearTime, null);
  });

  it('首次提交即為最高分', () => {
    const { records, isBest, isFastest } = submitRun({}, run());
    assert.equal(isBest, true);
    assert.equal(isFastest, false);
    assert.equal(recordOf(records, 'campaign', 'normal').score, 1000);
  });

  it('較高分才刷新，較低分不動且回傳原參照', () => {
    const first = submitRun({}, run({ score: 1000 })).records;
    const higher = submitRun(first, run({ score: 1500, kills: 55 }));
    assert.equal(higher.isBest, true);
    assert.equal(recordOf(higher.records, 'campaign', 'normal').kills, 55);
    const lower = submitRun(higher.records, run({ score: 800 }));
    assert.equal(lower.isBest, false);
    assert.equal(lower.records, higher.records, '無變化應回傳原參照');
  });

  it('通關才記最快時間，且不覆蓋最高分場次', () => {
    const best = submitRun({}, run({ score: 2000, time: 400 })).records;
    const faster = submitRun(best, run({ score: 900, time: 250, won: true }));
    const rec = recordOf(faster.records, 'campaign', 'normal');
    assert.equal(faster.isFastest, true);
    assert.equal(faster.isBest, false);
    assert.equal(rec.score, 2000, '最高分不變');
    assert.equal(rec.clearTime, 250, '最快通關更新');
    const slowerWin = submitRun(faster.records, run({ score: 500, time: 900, won: true }));
    assert.equal(slowerWin.isFastest, false);
    assert.equal(recordOf(slowerWin.records, 'campaign', 'normal').clearTime, 250);
  });

  it('缺少模式或難度時不寫入', () => {
    const { records, isBest } = submitRun({}, run({ mode: null }));
    assert.equal(isBest, false);
    assert.deepEqual(records, {});
  });
});
