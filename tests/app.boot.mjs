// 開機煙測：stub DOM 後匯入 app.js，走真實監聽器驗證接線。
function renderCtx() {
  const gradient = { addColorStop() {} };
  return new Proxy(
    {},
    {
      get(t, k) {
        if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => gradient;
        return () => undefined;
      },
      set() {
        return true;
      },
    }
  );
}

const byId = {};
function makeEl(id) {
  const handlers = {};
  const el = {
    id,
    textContent: '',
    innerHTML: '',
    hidden: true,
    disabled: false,
    open: false,
    value: id === 'difficulty' ? 'normal' : id === 'run-mode' ? 'campaign' : '',
    dataset: {},
    style: {},
    children: [],
    className: '',
    width: 0,
    height: 0,
    classList: { toggle() {}, add() {}, remove() {} },
    setAttribute() {},
    getAttribute: () => null,
    addEventListener: (t, fn) => {
      (handlers[t] ??= []).push(fn);
    },
    append() {},
    replaceChildren() {},
    querySelector: () => null,
    querySelectorAll: () => [],
    focus() {},
    closest: () => null,
    getBoundingClientRect: () => ({ width: 480, height: 800 }),
    setPointerCapture() {},
    showModal() {},
    close() {},
    getContext: () => renderCtx(),
    _handlers: handlers,
    fire(type, e = {}) {
      (handlers[type] || []).forEach((fn) => fn({ preventDefault() {}, target: el, ...e }));
    },
  };
  return el;
}

const windowHandlers = {};
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
};
globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });
globalThis.devicePixelRatio = 1;
globalThis.ResizeObserver = class {
  observe() {}
};
let rafCb = null;
globalThis.requestAnimationFrame = (fn) => {
  rafCb = fn;
  return 1;
};
globalThis.window = {
  addEventListener: (t, fn) => {
    (windowHandlers[t] ??= []).push(fn);
  },
  scrollTo() {},
};
globalThis.document = {
  getElementById: (id) => (byId[id] ??= makeEl(id)),
  createElement: () => makeEl('dynamic'),
  querySelectorAll: () => [],
  hidden: false,
  addEventListener() {},
  body: { classList: { toggle() {} } },
  activeElement: null,
};

const { S } = await import('../src/app.js');
const assert = (cond, msg) => {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
  console.log('ok:', msg);
};

assert(S.game.mode === 'hangar', '開機停在機庫');
assert(byId['hangar'].hidden === false, '機庫顯示中');

// 按開始遠征
byId['start-button'].fire('click');
assert(S.game.mode === 'playing', '點擊開始後進入戰鬥');
assert(byId['hud'].hidden === false, 'HUD 顯示');
assert(byId['hangar'].hidden === true, '機庫隱藏');

// 手動推進迴圈
let now = 1000;
for (let i = 0; i < 120; i++) {
  now += 16.7;
  rafCb(now);
}
assert(S.game.time > 1, `戰鬥時間推進中（${S.game.time.toFixed(1)}s）`);

// 暫停鈕 → 鍵盤 P 恢復
byId['pause-button'].fire('click');
assert(S.game.mode === 'paused', '暫停按鈕生效');
windowHandlers['keydown'].forEach((fn) =>
  fn({ key: 'p', preventDefault() {}, repeat: false, target: makeEl('kbd-target') })
);
assert(S.game.mode === 'playing', '按 P 恢復戰鬥');

// 炸彈鈕
const bombs = S.game.player.bombs;
byId['bomb-button'].fire('click');
assert(S.game.player.bombs === bombs - 1, '炸彈按鈕消耗 1 枚');
console.log('app boot smoke: ALL OK');
