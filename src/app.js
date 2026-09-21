// SkyFire-MVP 進入點：建立狀態、接線、開迴圈（邏輯見 app/ 子模組）。
import { createState, $ } from './app/state.js';
import { chooseShip, syncMode } from './app/screens.js';
import { updateHud } from './app/hud.js';
import { wireInput, updateSound, updateReduced } from './app/input.js';
import { frame, resize } from './app/frame.js';

export const S = createState();
if (typeof window !== 'undefined') window.__SKYFIRE_DEBUG__ = S.game.diagnosticsApi;
wireInput(S);

if (!S.ctx) {
  $('start-button').disabled = true;
  $('start-button').textContent = '此瀏覽器不支援 Canvas 2D';
}
chooseShip(S, 0);
updateSound(S);
updateReduced(S);
syncMode(S);
resize(S);
new ResizeObserver(() => resize(S)).observe(S.canvas);
const loop = (now) => {
  frame(S, now);
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);
