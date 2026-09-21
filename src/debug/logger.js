// 結構化診斷紀錄：只保存可 JSON 序列化的資料，方便 AI Agent 匯出分析。
export class EventLog {
  constructor({ limit = 2000, level = 'info' } = {}) {
    this.limit = limit;
    this.level = level;
    this.entries = [];
  }

  record(entry) {
    const value = { ...entry, data: entry.data ? { ...entry.data } : {} };
    this.entries.push(value);
    if (this.entries.length > this.limit) this.entries.shift();
    return value;
  }

  clear() {
    this.entries.length = 0;
  }

  snapshot() {
    return this.entries.map((entry) => ({ ...entry, data: { ...entry.data } }));
  }

  export() {
    return JSON.stringify(this.snapshot(), null, 2);
  }
}

export function createDiagnosticApi(game) {
  return {
    getLog: () => game.diagnostics.snapshot(),
    clearLog: () => game.diagnostics.clear(),
    exportLog: () => game.diagnostics.export(),
    snapshot: () => game.debugSnapshot(),
    setLevel: (level) => {
      if (['debug', 'info', 'warn', 'error'].includes(level)) game.diagnostics.level = level;
    },
  };
}
