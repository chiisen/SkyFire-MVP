// 本機紀錄：以「模式 × 難度」為鍵保存最佳表現；純函式，無 DOM 與儲存相依。
export function normalizeRecords(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [mode, byDifficulty] of Object.entries(raw)) {
    if (!byDifficulty || typeof byDifficulty !== 'object') continue;
    for (const [difficulty, rec] of Object.entries(byDifficulty)) {
      if (!rec || typeof rec.score !== 'number') continue;
      (out[mode] ??= {})[difficulty] = {
        score: rec.score,
        time: Number(rec.time) || 0,
        kills: Number(rec.kills) || 0,
        grazes: Number(rec.grazes) || 0,
        shipId: Number(rec.shipId) || 0,
        at: Number(rec.at) || 0,
        clearTime: typeof rec.clearTime === 'number' ? rec.clearTime : null,
      };
    }
  }
  return out;
}
// 由舊版單一最高分（campaign / normal）遷移為紀錄表。
export function migrateLegacyBest(best) {
  const score = Number(best) || 0;
  return score > 0
    ? { campaign: { normal: { score, time: 0, kills: 0, grazes: 0, shipId: 0, at: 0, clearTime: null } } }
    : {};
}
// 取得指定模式與難度的紀錄，無則回傳 null。
export function recordOf(records, mode, difficulty) {
  return records?.[mode]?.[difficulty] ?? null;
}
// 提交一場結果，回傳更新後紀錄與是否刷新最高分／最快通關；無變化時回傳原參照。
export function submitRun(records, run) {
  const { mode, difficulty } = run;
  if (!mode || !difficulty) return { records, isBest: false, isFastest: false };
  const cur = recordOf(records, mode, difficulty);
  const isBest = !cur || run.score > cur.score;
  const isFastest = !!run.won && (cur?.clearTime == null || run.time < cur.clearTime);
  if (!isBest && !isFastest) return { records, isBest: false, isFastest: false };
  const next = {
    ...records,
    [mode]: {
      ...(records[mode] || {}),
      [difficulty]: {
        score: isBest ? run.score : cur.score,
        time: isBest ? run.time : cur.time,
        kills: isBest ? run.kills : cur.kills,
        grazes: isBest ? run.grazes : cur.grazes,
        shipId: isBest ? run.shipId : cur.shipId,
        at: Number(run.at) || 0,
        clearTime: isFastest ? run.time : (cur?.clearTime ?? null),
      },
    },
  };
  return { records: next, isBest, isFastest };
}
