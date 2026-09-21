import test from 'node:test';
import assert from 'node:assert/strict';
import { EventLog } from '../src/debug/logger.js';
import { Game } from '../src/engine.js';

test('診斷事件超過上限時保留最新紀錄', () => {
  const log = new EventLog({ limit: 2 });
  log.record({ time: 1, event: 'old', data: {} });
  log.record({ time: 2, event: 'new', data: { stage: 0 } });
  log.record({ time: 3, event: 'latest', data: {} });
  assert.deepEqual(log.snapshot().map((entry) => entry.event), ['new', 'latest']);
});

test('診斷紀錄可匯出為 JSON 且不暴露可變資料', () => {
  const log = new EventLog();
  const data = { hp: 100 };
  log.record({ time: 1, event: 'boss_spawned', data });
  data.hp = 0;
  assert.deepEqual(JSON.parse(log.export())[0].data, { hp: 100 });
});

test('遊戲事件會帶固定步驟、關卡與狀態快照資訊', () => {
  const game = new Game(7);
  game.start();
  game.update(1 / 60);
  const entry = game.diagnostics.snapshot().find((item) => item.event === 'stage');
  assert.equal(entry.stage, 0);
  assert.equal(entry.mode, 'playing');
  assert.equal(entry.frame, 0);
  assert.equal(game.diagnosticsApi.snapshot().seed, 7);
});
