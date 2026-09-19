import { SHIPS, STAGES } from '../data.js';
import { $, storage, arrow, formatScore, formatTime } from './state.js';
import { updateHud } from './hud.js';

// 清空鍵盤與觸控輸入狀態。
export function resetInput(S) {
  S.keys.clear();
  S.input.pointer = false;
  S.input.dx = 0;
  S.input.dy = 0;
  S.pointer = null;
}
// 將焦點移回遊戲畫布並避免捲動。
export function focusCanvas(S) {
  S.canvas.focus({ preventScroll: true });
}
// 選擇機體並同步機庫顯示與初始武器。
export function chooseShip(S, id) {
  if (S.game.mode !== 'hangar') return;
  S.selectedShip = id;
  S.game.player.shipId = id;
  const ship = SHIPS[id];
  for (const button of $('ship-picker').children)
    button.setAttribute('aria-pressed', Number(button.dataset.ship) === id);
  $('ship-code').textContent = `${ship.code} / ${['黃金', '白銀', '赤銅'][id]}`;
  $('ship-description').textContent = ship.description;
  $('ship-stats').innerHTML =
    `<span>機體 <b>${ship.health}</b></span><span>護盾 <b>${ship.shield}</b></span><span>速度 <b>${ship.speed}</b></span><span>炸彈 <b>${ship.bombStock}</b></span>`;
  S.game.player.weapon = id === 1 ? 'laser' : 'pulse';
  S.game.player.weaponLevel = 1;
  S.lastWeapon = '';
  updateHud(S, true);
}
// 依所選模式開新局並同步介面狀態。
export function start(S) {
  const value = $('run-mode').value;
  resetInput(S);
  S.focusMode = false;
  S.input.slow = false;
  $('focus-button').setAttribute('aria-pressed', 'false');
  S.game.start({
    shipId: S.selectedShip,
    difficulty: $('difficulty').value,
    practiceStage: value === 'campaign' ? null : Number(value),
  });
  S.accumulator = 0;
  S.last = performance.now();
  S.lastMode = '';
  S.lastStage = -1;
  S.sound.unlock();
  syncMode(S);
  updateHud(S, true);
  focusCanvas(S);
  window.scrollTo(0, 0);
}
// 暫停戰鬥並記錄顯示用的暫停原因。
export function pause(S, reason) {
  if (S.game.mode !== 'playing') return;
  S.pauseReason = reason || '航線已凍結，補給與戰鬥計時也一起暫停。';
  resetInput(S);
  S.game.pause();
  syncMode(S);
}
// 從暫停恢復戰鬥並重置計時累積器。
export function resume(S) {
  resetInput(S);
  S.game.resume();
  S.accumulator = 0;
  S.last = performance.now();
  syncMode(S);
  focusCanvas(S);
  S.sound.unlock();
}
// 結束本局並返回機庫待命畫面。
export function toHangar(S) {
  resetInput(S);
  S.game.reset();
  S.game.drainEvents();
  S.lastMode = '';
  S.lastStage = -1;
  S.lastWeapon = '';
  S.announcementUntil = 0;
  $('stage-announcement').hidden = true;
  $('toast').hidden = true;
  chooseShip(S, S.selectedShip);
  syncMode(S);
  updateHud(S, true);
  $('start-button').focus({ preventScroll: true });
}
// 建立帶標籤樣式與點擊行為的按鈕元素。
export function button(label, className, action) {
  const element = document.createElement('button');
  element.className = className;
  element.innerHTML = label;
  element.addEventListener('click', action);
  return element;
}
// 依遊戲模式切換場景遮罩與覆蓋層內容。
export function syncMode(S) {
  if (S.lastMode === S.game.mode) return;
  S.lastMode = S.game.mode;
  document.body.classList.toggle('in-flight', S.game.mode !== 'hangar');
  $('hangar').hidden = S.game.mode !== 'hangar';
  $('hud').hidden = S.game.mode === 'hangar';
  const show = ['paused', 'upgrade', 'gameover', 'victory'].includes(S.game.mode);
  $('overlay').hidden = !show;
  if (!show) return;
  resetInput(S);
  $('stage-announcement').hidden = true;
  $('overlay-content').replaceChildren();
  $('overlay-actions').replaceChildren();
  const title = $('overlay-title'),
    kicker = $('overlay-kicker'),
    desc = $('overlay-description'),
    actions = $('overlay-actions');
  if (S.game.mode === 'paused') {
    kicker.textContent = 'FLIGHT ON HOLD';
    title.textContent = '呼吸一下，再出發。';
    desc.textContent = S.pauseReason;
    actions.append(
      button(`繼續戰鬥 ${arrow}`, 'primary-button', () => resume(S)),
      button('結束本次戰役，返回機庫', 'secondary-button', () => toHangar(S))
    );
  } else if (S.game.mode === 'upgrade') {
    kicker.textContent = `SECTOR 0${S.game.stageIndex + 1} / CLEAR`;
    title.textContent = '航路已打開。';
    desc.textContent = '選擇一項本局強化。另附過關補給：機體 +2、護盾補滿、炸彈 +1。';
    const choices = document.createElement('div');
    choices.className = 'upgrade-choices';
    for (const [i, choice] of S.game.choices.entries())
      choices.append(
        button(
          `<span>0${i + 1}</span><span><strong>${choice.name}<small>${choice.description}</small></strong></span><span>↗</span>`,
          'upgrade-choice',
          () => {
            S.game.selectUpgrade(choice.id);
            S.lastStage = -1;
            syncMode(S);
            updateHud(S, true);
            focusCanvas(S);
          }
        )
      );
    $('overlay-content').append(choices);
  } else {
    const won = S.game.mode === 'victory';
    kicker.textContent = S.game.practice ? 'TRAINING REPORT' : won ? 'MISSION ACCOMPLISHED' : 'SIGNAL LOST';
    title.textContent = won ? (S.game.practice ? '演練完成。' : '天穹，重歸黎明。') : '這不是最後一次出擊。';
    desc.textContent = won
      ? S.game.practice
        ? '單關練習已結束。準備好後，嘗試完整五關戰役。'
        : `五大空域已全部解放。${S.game.continues ? `本次續戰 ${S.game.continues} 次。` : '一命航程，一路到底。'}`
      : `抵達第 ${S.game.stageIndex + 1} 空域 · ${STAGES[S.game.stageIndex].name}。${S.game.continues < 3 ? '可續戰重開當前關，保留強化，分數扣除 35%。' : '本局續戰次數已用完，返回機庫再挑戰。'}`;
    $('overlay-content').innerHTML =
      `<div class="result-grid"><div><small>作戰得分</small><strong>${formatScore(S.game.score)}</strong></div><div><small>有效戰鬥時間</small><strong>${formatTime(S.game.time)}</strong></div><div><small>擊落敵機</small><strong>${S.game.kills}</strong></div><div><small>擦彈次數</small><strong>${S.game.grazes}</strong></div></div>`;
    if (!S.game.practice && S.game.score > S.best) {
      S.best = S.game.score;
      storage.set('best', S.best);
      $('best-score').textContent = formatScore(S.best);
    }
    if (!won && S.game.continues < 3)
      actions.append(
        button(`繼續作戰 <small>${3 - S.game.continues} 次機會</small>${arrow}`, 'primary-button', () => {
          S.game.continueRun();
          S.lastStage = -1;
          syncMode(S);
          updateHud(S, true);
          focusCanvas(S);
        })
      );
    actions.append(
      button(`返回機庫 ${arrow}`, won || S.game.continues >= 3 ? 'primary-button' : 'secondary-button', () =>
        toHangar(S)
      )
    );
  }
  const first = $('overlay').querySelector('button');
  first?.focus({ preventScroll: true });
}
// 顯示關卡與首領的大型中央公告。
export function announce(S, kicker, title, detail, seconds = 2.7) {
  $('announcement-kicker').textContent = kicker;
  $('announcement-title').textContent = title;
  $('announcement-detail').textContent = detail;
  $('stage-announcement').hidden = false;
  S.announcementUntil = S.game.time + seconds;
}
// 顯示短暫的小型提示訊息。
export function toast(S, text) {
  $('toast').textContent = text;
  $('toast').hidden = false;
  S.toastUntil = performance.now() + 2500;
}
// 消化引擎事件並觸發音效與公告提示。
export function processEvents(S) {
  for (const event of S.game.drainEvents()) {
    S.sound.event(event.type);
    if (event.type === 'stage')
      announce(
        S,
        `SECTOR 0${event.index + 1} / ${STAGES[event.index].enName}`,
        STAGES[event.index].name,
        STAGES[event.index].tip,
        3.3
      );
    if (event.type === 'boss') announce(S, 'WARNING / HOSTILE FLAGSHIP', event.name, '多階段火力 · 注意雷射預警', 2.2);
    if (event.type === 'bossDefeated') announce(S, 'FLAGSHIP DESTROYED', '空域已壓制', '繼續清場，搶收首領補給', 2);
    if (event.type === 'bossPhase') toast(S, `首領第 ${event.phase} 階段 · 短暫護盾後切換火力`);
    if (event.type === 'autobomb') toast(S, '致命一擊保護 · 自動消耗 1 枚炸彈');
    if (event.type === 'overdrive') toast(S, '雷霆爆發 / 8 秒強化火力 · 仍需躲彈');
    if (event.type === 'pickup') toast(S, event.label);
  }
}
// 繪製機庫靜態資訊（航線、戰機選單、最高分）。
export function renderStatic(S) {
  $('mission-route').innerHTML = STAGES.map(
    (s, i) =>
      `<li class="${i === 0 ? 'active' : ''}"><span class="route-number">0${i + 1}</span><div><strong>${s.name}</strong><small>${s.enName}</small></div><span class="route-time">02:00</span></li>`
  ).join('');
  $('ship-picker').innerHTML = SHIPS.map(
    (s) =>
      `<button class="ship-choice" data-ship="${s.id}" aria-pressed="${s.id === 0}" style="--ship-color:${s.color}"><small>${s.code}</small><strong>${s.name}</strong><span>${s.role}</span></button>`
  ).join('');
  $('best-score').textContent = formatScore(S.best);
}
