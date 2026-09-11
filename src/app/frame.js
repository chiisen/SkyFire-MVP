import { WIDTH, HEIGHT } from '../data.js';
import { $ } from './state.js';
import { processEvents, syncMode } from './screens.js';
import { updateHud } from './hud.js';
import { drawFrame } from '../render.js';

// 依顯示尺寸重設畫布解析度與座標變換，並快取觸控換算用的版面矩形。
export function resize(S) {
  const rect = S.canvas.getBoundingClientRect(),
    ratio = Math.min(devicePixelRatio || 1, 2);
  S.canvasRect = { width: rect.width, height: rect.height };
  S.canvas.width = Math.max(1, Math.round(rect.width * ratio));
  S.canvas.height = Math.max(1, Math.round(rect.height * ratio));
  S.ctx?.setTransform(S.canvas.width / WIDTH, 0, 0, S.canvas.height / HEIGHT, 0, 0);
}
// 執行主迴圈推進模擬介面繪製與音效（單步；排程由進入點負責）。
export function frame(S, now) {
  const dt = Math.min(0.12, (now - S.last) / 1000);
  S.last = now;
  S.idleTime += Math.min(0.05, dt);
  S.input.dx = Number(S.keys.has('d') || S.keys.has('arrowright')) - Number(S.keys.has('a') || S.keys.has('arrowleft'));
  S.input.dy = Number(S.keys.has('s') || S.keys.has('arrowdown')) - Number(S.keys.has('w') || S.keys.has('arrowup'));
  S.input.slow = S.focusMode || S.keys.has('shift');
  if (S.game.mode === 'playing' && !$('help-dialog').open) {
    S.accumulator += dt;
    while (S.accumulator >= 1 / 60 && S.game.mode === 'playing') {
      S.game.update(1 / 60, S.input);
      S.accumulator -= 1 / 60;
    }
  } else S.accumulator = 0;
  processEvents(S);
  syncMode(S);
  if (now - S.lastHud > 100) {
    updateHud(S);
    S.lastHud = now;
  }
  if (S.game.time >= S.announcementUntil) $('stage-announcement').hidden = true;
  if (now >= S.toastUntil) $('toast').hidden = true;
  if (S.ctx) drawFrame(S.ctx, S.game, { idleTime: S.idleTime, reducedMotion: S.reducedMotion });
  S.sound.tick(S.game.mode === 'playing', S.game.stageIndex);
}
