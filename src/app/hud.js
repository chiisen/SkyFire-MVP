import { WEAPONS, STAGES, STAGE_SECONDS, DROP_TTL } from '../data.js';
import { $, formatScore, formatTime } from './state.js';

// 更新分數血量武器與關卡等介面資訊。
export function updateHud(S, force = false) {
  const p = S.game.player,
    playing = S.game.mode === 'playing';
  $('score').textContent = formatScore(S.game.score);
  $('elapsed').textContent = formatTime(S.game.time);
  $('hud-stage').textContent = `${S.game.practice ? '演練' : '0' + (S.game.stageIndex + 1) + ' / 05'}`;
  $('multiplier').textContent = `×${Math.min(5, 1 + Math.floor(S.game.combo / 8))}`;
  const vitals = `${p.health}/${p.maxHealth}/${p.shield}/${p.maxShield}`;
  if (force || S.lastVitals !== vitals) {
    S.lastVitals = vitals;
    $('hull').innerHTML = Array.from(
      { length: p.maxHealth },
      (_, i) => `<i class="${i >= p.health ? 'empty' : ''}"></i>`
    ).join('');
    $('shield').innerHTML = Array.from(
      { length: p.maxShield },
      (_, i) => `<i class="${i >= p.shield ? 'empty' : ''}"></i>`
    ).join('');
    $('hull').setAttribute('aria-label', `機體 ${p.health}/${p.maxHealth}`);
    $('shield').setAttribute('aria-label', `護盾 ${p.shield}/${p.maxShield}`);
  }
  const boss = S.game.enemies.find((e) => e.type === 'boss' && !e.dead);
  $('boss-hud').hidden = !boss;
  if (boss) {
    $('boss-name').textContent = STAGES[S.game.stageIndex].bossName;
    $('boss-phase').textContent = `PHASE ${boss.phase}/3`;
    $('boss-fill').style.width = `${Math.max(0, boss.hp / boss.maxHp) * 100}%`;
  }
  $('bomb-count').textContent = p.bombs;
  $('bomb-button').disabled = !playing || p.bombs <= 0;
  $('overdrive-button').disabled = !playing;
  $('overdrive-button').classList.toggle('ready', p.overdrive >= 100 || p.overdriveTime > 0);
  $('overdrive-button').setAttribute(
    'aria-label',
    p.overdriveTime > 0
      ? `雷霆爆發中，剩餘${Math.ceil(p.overdriveTime)}秒`
      : `雷霆爆發，充能${Math.floor(p.overdrive)}%，100%可用`
  );
  $('charge-label').textContent =
    p.overdriveTime > 0 ? `爆發中 · ${p.overdriveTime.toFixed(1)}s` : `E · ${Math.floor(p.overdrive)}%`;
  $('charge-fill').style.width = `${p.overdriveTime > 0 ? (p.overdriveTime / 8) * 100 : p.overdrive}%`;
  $('focus-button').disabled = !playing;
  $('pause-button').disabled = !playing;
  $('stage-progress-fill').style.width = `${Math.min(1, S.game.stageTime / STAGE_SECONDS) * 100}%`;
  const weapon = WEAPONS[p.weapon],
    key = `${p.weapon}:${p.weaponLevel}`;
  if (S.lastWeapon !== key || force) {
    S.lastWeapon = key;
    $('weapon-name').textContent = weapon.name;
    $('weapon-description').textContent = weapon.description;
    $('weapon-emblem').textContent = weapon.label;
    $('weapon-emblem').style.color = weapon.color;
    $('weapon-emblem').style.borderColor = weapon.color;
    $('weapon-tier').textContent =
      `${{ pulse: 'BLUE', laser: 'GREEN', arc: 'PURPLE', nova: 'GOLD' }[p.weapon]} / ${weapon.rarity}`;
    $('weapon-tier').style.color = weapon.color;
    $('weapon-level').innerHTML = Array.from(
      { length: 5 },
      (_, i) =>
        `<i class="${i < p.weaponLevel ? 'active' : ''}" style="${i < p.weaponLevel ? `background:${weapon.color}` : ''}"></i>`
    ).join('');
    $('weapon-mini').textContent = `${weapon.label} / ${weapon.name} LV.${p.weaponLevel}`;
    $('weapon-mini').style.color = weapon.color;
  }
  if (S.lastStage !== S.game.stageIndex || force) {
    S.lastStage = S.game.stageIndex;
    for (const [i, row] of [...$('mission-route').children].entries()) {
      row.classList.toggle('active', i === S.game.stageIndex);
      row.classList.toggle('complete', i < S.game.stageIndex && !S.game.practice);
    }
  }
  $('flight-state').textContent =
    S.game.mode === 'hangar' ? 'HANGAR 01' : `${S.game.practice ? 'TRAINING' : 'SECTOR'} 0${S.game.stageIndex + 1}`;
  const salvageSeconds = Math.max(
    0,
    Math.ceil(Math.max(STAGE_SECONDS, (S.game.bossDefeatedAt ?? 0) + DROP_TTL) - S.game.stageTime)
  );
  $('bottom-tip').textContent =
    S.game.mode === 'hangar'
      ? 'AUTO FIRE / DRAG TO FLY'
      : S.game.bossDefeated
        ? `獎勵清場 · 拾取補給 / ${salvageSeconds}s`
        : S.game.bossSpawned
          ? 'BOSS ENGAGED'
          : 'GRAZE +25 / MAX COMBO ×5';
}
