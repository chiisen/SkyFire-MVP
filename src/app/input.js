import { clamp } from '../engine.js';
import { WIDTH, HEIGHT } from '../data.js';
import { $, storage } from './state.js';
import { updateHud } from './hud.js';
import {
  chooseShip,
  start,
  pause,
  resume,
  toHangar,
  syncMode,
  toast,
  resetInput,
  focusCanvas,
  renderStatic,
} from './screens.js';

// 結束觸控拖曳並清除對應的指標狀態。
export function endPointer(S, e) {
  if (S.pointer?.id === e.pointerId) {
    S.pointer = null;
    S.input.pointer = false;
  }
}

// 註冊全部輸入與按鈕監聽器。
export function wireInput(S) {
  S.canvas.addEventListener('pointerdown', (e) => {
    if (S.game.mode !== 'playing' || S.pointer !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    focusCanvas(S);
    S.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, shipX: S.game.player.x, shipY: S.game.player.y };
    S.input.pointer = true;
    S.input.targetX = S.game.player.x;
    S.input.targetY = S.game.player.y;
    S.canvas.setPointerCapture(e.pointerId);
  });
  S.canvas.addEventListener('pointermove', (e) => {
    if (!S.pointer || S.pointer.id !== e.pointerId || S.game.mode !== 'playing') return;
    e.preventDefault();
    const rect = S.canvas.getBoundingClientRect();
    S.input.targetX = clamp(S.pointer.shipX + ((e.clientX - S.pointer.x) / rect.width) * WIDTH * 1.15, 18, WIDTH - 18);
    S.input.targetY = clamp(
      S.pointer.shipY + ((e.clientY - S.pointer.y) / rect.height) * HEIGHT * 1.15,
      88,
      HEIGHT - 35
    );
  });
  const end = (e) => endPointer(S, e);
  S.canvas.addEventListener('pointerup', end);
  S.canvas.addEventListener('pointercancel', end);
  S.canvas.addEventListener('lostpointercapture', end);
  window.addEventListener('keydown', (e) => {
    if (
      $('help-dialog').open ||
      e.target.closest('select,input,textarea') ||
      !['playing', 'paused'].includes(S.game.mode)
    )
      return;
    const key = e.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd', 'shift'].includes(key)) {
      e.preventDefault();
      S.keys.add(key);
    }
    if (e.repeat) return;
    if (key === 'p' || key === 'escape') {
      e.preventDefault();
      S.game.mode === 'playing' ? pause(S) : resume(S);
    }
    if (key === ' ' && !e.target.closest('button')) {
      e.preventDefault();
      S.game.bomb();
    }
    if (key === 'e') {
      e.preventDefault();
      S.game.overdrive();
    }
  });
  window.addEventListener('keyup', (e) => S.keys.delete(e.key.toLowerCase()));
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || $('overlay').hidden || $('help-dialog').open) return;
    const buttons = [...$('overlay').querySelectorAll('button:not(:disabled)')];
    const first = buttons[0],
      last = buttons.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pause(S, '你剛離開了戰場。所有計時已暫停，準備好再繼續。');
      resetInput(S);
    }
  });
  window.addEventListener('blur', () => {
    pause(S, '視窗已失去焦點，戰鬥自動暫停。');
    resetInput(S);
  });
  $('ship-picker').addEventListener('click', (e) => {
    const button = e.target.closest('[data-ship]');
    if (button) chooseShip(S, Number(button.dataset.ship));
  });
  $('start-button').addEventListener('click', () => start(S));
  $('pause-button').addEventListener('click', () => pause(S));
  $('bomb-button').addEventListener('click', () => {
    S.game.bomb();
    updateHud(S, true);
  });
  $('overdrive-button').addEventListener('click', () => {
    if (!S.game.overdrive() && S.game.mode === 'playing') toast(S, '擦彈、擊殺和拾取武器可獲得充能');
    updateHud(S, true);
  });
  $('focus-button').addEventListener('click', () => {
    S.focusMode = !S.focusMode;
    $('focus-button').setAttribute('aria-pressed', S.focusMode);
  });
  $('sound-button').addEventListener('click', () => {
    S.sound.setEnabled(!S.sound.enabled);
    storage.set('sound', S.sound.enabled);
    S.sound.unlock();
    updateSound(S);
  });
  $('reduced-button').addEventListener('click', () => {
    S.reducedMotion = !S.reducedMotion;
    storage.set('reducedMotion', S.reducedMotion);
    updateReduced(S);
  });
  S.reducedQuery.addEventListener?.('change', (e) => {
    S.reducedMotion = e.matches;
    updateReduced(S);
  });
  $('help-button').addEventListener('click', () => {
    pause(S, '玩法說明已打開。關閉說明後，可繼續戰鬥。');
    $('help-dialog').showModal();
  });
  document
    .querySelectorAll('.dialog-close')
    .forEach((b) => b.addEventListener('click', () => $('help-dialog').close()));
  renderStatic(S);
}

// 同步聲音開關按鈕的顯示狀態。
export function updateSound(S) {
  $('sound-button').setAttribute('aria-pressed', S.sound.enabled);
  $('sound-button').setAttribute('aria-label', S.sound.enabled ? '關閉聲音' : '開啟聲音');
  $('sound-label').textContent = S.sound.enabled ? '聲音' : '靜音';
}
// 同步減少動態選項按鈕的顯示狀態。
export function updateReduced(S) {
  $('reduced-button').setAttribute('aria-pressed', S.reducedMotion);
  $('reduced-button').textContent = `減少裝飾動態：${S.reducedMotion ? '開啟' : '關閉'}`;
}
