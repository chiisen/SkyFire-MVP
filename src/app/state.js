import { Game } from '../engine.js';
import { Sound } from '../audio.js';

// 依編號取得對應的 DOM 元素。
export const $ = (id) => document.getElementById(id);
export const storage = {
  // 從本地儲存讀取設定值，讀取失敗時回傳預設值。
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(`skyfire:${key}`)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  // 將設定值寫入本地儲存，寫入失敗時仍保持可遊玩。
  set(key, value) {
    try {
      localStorage.setItem(`skyfire:${key}`, JSON.stringify(value));
    } catch {
      /* 儲存被阻擋時遊戲仍可遊玩。 */
    }
  },
};
// 將分數格式化為七位數前補零字串。
export const formatScore = (n) => Math.max(0, Math.floor(n)).toLocaleString('en-US').padStart(7, '0');
// 將秒數格式化為分冒號秒字串。
export const formatTime = (t) =>
  `${Math.floor(t / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(t % 60)
    .toString()
    .padStart(2, '0')}`;
export const arrow = '<svg aria-hidden="true"><use href="#i-arrow"/></svg>';

// 建立整局共用的可變狀態容器（取代原本的模組頂層變數）。
export function createState() {
  const game = new Game();
  const sound = new Sound(storage.get('sound', true) === true);
  const canvas = $('game-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  return {
    game,
    sound,
    canvas,
    ctx,
    keys: new Set(),
    input: { dx: 0, dy: 0, pointer: false, targetX: 240, targetY: 665, slow: false },
    canvasRect: null,
    reducedQuery,
    reducedMotion: storage.get('reducedMotion', reducedQuery.matches),
    selectedShip: 0,
    focusMode: false,
    pointer: null,
    best: Number(storage.get('best', 0)) || 0,
    lastMode: '',
    lastStage: -1,
    lastWeapon: '',
    lastVitals: '',
    lastHud: 0,
    announcementUntil: 0,
    toastUntil: 0,
    idleTime: 0,
    last: performance.now(),
    accumulator: 0,
    pauseReason: '航線已凍結，補給與戰鬥計時也一起暫停。',
  };
}
