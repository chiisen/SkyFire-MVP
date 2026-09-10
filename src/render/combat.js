import { W, H, TAU, LOOT, PAL, clamp, hash, mod, poly, line, circle, halo, plate } from './shared.js';

// 繪製雷射預警虛線與高亮主光束，呈現蓄力到發射的過程。
export function beam(c, b, time, reduced) {
  const age = b.age || 0,
    warn = b.warn ?? 1,
    duration = b.duration ?? 1;
  if (age > warn + duration) return;
  c.save();
  c.translate(b.x, b.y);
  c.rotate((b.angle ?? Math.PI / 2) - Math.PI / 2);
  const len = b.length || 900,
    width = b.width || 18,
    color = b.color || '#ff735f';
  if (age < warn) {
    c.globalAlpha = 0.35 + 0.35 * clamp(age / warn);
    c.setLineDash([9, 8]);
    c.lineDashOffset = reduced ? 0 : -time * 26;
    line(
      c,
      [
        [0, 0],
        [0, len],
      ],
      '#ffbba0',
      2
    );
    c.setLineDash([]);
    c.globalAlpha = 0.06 + 0.09 * clamp(age / warn);
    c.fillStyle = color;
    c.fillRect(-width / 2, 0, width, len);
    c.globalAlpha = 1;
    circle(c, 0, 0, 5, null, '#ffe0b5', 1.5);
  } else {
    const fade = clamp((warn + duration - age) * 9),
      pulse = reduced ? 1 : 0.9 + Math.sin(time * 35) * 0.1;
    c.globalAlpha = 0.11 * fade;
    c.fillStyle = color;
    c.fillRect(-width * 1.2, 0, width * 2.4, len);
    c.globalAlpha = 0.86 * fade;
    c.fillRect(-width * 0.5 * pulse, 0, width * pulse, len);
    c.globalAlpha = fade;
    c.fillStyle = '#fff4e7';
    c.fillRect(-width * 0.16, 0, width * 0.32, len);
    circle(c, 0, 0, width * 0.72, '#fff3e3');
  }
  c.restore();
}

// 繪製玩家與敵方子彈，區分彈種顏色、拖尾與外形。

// 繪製玩家與敵方子彈，區分彈種顏色、拖尾與外形。
export function projectile(c, b, player = false) {
  const x = b.x,
    y = b.y,
    r = Math.max(1.2, b.r || 3),
    type = b.type || 'aim';
  const color = b.color || (player ? '#80e8ff' : '#ff8b70');
  if (player) {
    c.strokeStyle = color;
    c.lineWidth = type === 'laser' ? r * 1.8 : r * 1.25;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(b.prevX ?? x, (b.prevY ?? y) + Math.min(19, Math.abs(b.vy || 500) * 0.018));
    c.stroke();
    c.strokeStyle = '#e9fbff';
    c.lineWidth = Math.max(1, r * 0.5);
    c.stroke();
    if (type === 'nova') circle(c, x, y, r, '#fff3ba', color, 1.5);
    c.lineCap = 'butt';
    return;
  }
  if (type === 'drift' || type === 'spiral' || type === 'fast') {
    const vx = b.vx || 0,
      vy = b.vy || 0,
      norm = Math.hypot(vx, vy) || 1;
    line(
      c,
      [
        [x - (vx / norm) * 14, y - (vy / norm) * 14],
        [x, y],
      ],
      color + '66',
      r * 0.95
    );
  }
  if (type === 'mine') {
    c.save();
    c.translate(x, y);
    c.rotate((b.age || 0) * 2);
    poly(
      c,
      [
        [0, -r * 1.6],
        [r * 1.5, 0],
        [0, r * 1.6],
        [-r * 1.5, 0],
      ],
      '#71374e',
      '#ffbd8e',
      1.5
    );
    circle(c, 0, 0, r * 0.55, '#fff0c8');
    c.restore();
  } else {
    circle(c, x, y, r + 1.1, '#432839', '#ff9b7d', 0.9);
    circle(c, x, y, r * 0.75, color);
    circle(c, x - r * 0.13, y - r * 0.2, r * 0.4, '#fff0cf');
  }
}

// 繪製掉落物圖示與存活倒數，供武器補給拾取辨識。

// 繪製掉落物圖示與存活倒數，供武器補給拾取辨識。
export function drop(c, d, t, reduced) {
  const [color, label] =
    d.kind === 'weapon'
      ? LOOT[d.weapon] || LOOT.pulse
      : d.kind === 'repair'
        ? ['#b6f2cd', '+']
        : d.kind === 'shield'
          ? ['#8fd8ff', 'S']
          : ['#f4b599', 'B'];
  const age = d.age || 0,
    ttl = d.ttl || 10,
    fade = age > ttl - 2 ? 0.64 + 0.36 * (reduced ? 1 : Math.sin(t * 8) ** 2) : 1;
  c.save();
  c.translate(d.x, d.y);
  c.globalAlpha = fade;
  circle(c, 0, 0, 20, '#071320dd', color + '45', 1);
  c.beginPath();
  c.arc(0, 0, 21, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(1 - age / ttl));
  c.lineWidth = 2;
  c.strokeStyle = color;
  c.stroke();
  const turn = reduced ? 0 : Math.sin(age * 2) * 0.12;
  c.save();
  c.rotate(turn);
  plate(c, -13, -13, 26, 26, '#182941', color, 5);
  c.restore();
  c.fillStyle = color;
  c.font = 'bold 18px ui-monospace, Menlo, monospace';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(label, 0, 1);
  c.fillStyle = '#e8f3fc';
  c.font = '9px ui-monospace, Menlo, monospace';
  c.fillText(Math.max(0, Math.ceil(ttl - age)) + 's', 0, 32);
  c.restore();
}

// 繪製飄字爆炸閃電等短暫特效，並隨壽命淡出消失。

// 繪製飄字爆炸閃電等短暫特效，並隨壽命淡出消失。
export function effect(c, e, reduced) {
  const p = clamp((e.age || 0) / (e.ttl || 0.5)),
    remain = 1 - p,
    size = e.size || 22,
    color = e.color || '#ffc088';
  if (!remain) return;
  c.save();
  c.globalAlpha = remain;
  if (e.type === 'text') {
    c.font = 'bold 13px ui-monospace, Menlo, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.strokeStyle = '#0b1324';
    c.lineWidth = 3;
    c.strokeText(e.text || '', e.x, e.y - p * 24);
    c.fillStyle = color;
    c.fillText(e.text || '', e.x, e.y - p * 24);
  } else if (e.type === 'lightning' && e.points?.length) {
    const pts = e.points.map((v) => (Array.isArray(v) ? v : [v.x, v.y]));
    line(c, pts, color, 5);
    line(c, pts, '#f8f4ff', 1.5);
  } else if (e.type === 'explosion') {
    circle(c, e.x, e.y, size * (0.3 + p * 0.8), null, color, 2 * remain + 0.3);
    if (p < 0.5) {
      circle(c, e.x, e.y, size * (0.45 - p * 0.4), '#fff0ca');
      circle(c, e.x, e.y, size * (0.7 - p * 0.4), null, '#ffd7a5', 3);
    }
    if (!reduced)
      for (let j = 0; j < 7; j++) {
        const a = (j / 7) * TAU + hash(j + size) * 0.5,
          len = size * (0.5 + p),
          r = size * (0.15 + p * 0.85);
        line(
          c,
          [
            [e.x + Math.cos(a) * r, e.y + Math.sin(a) * r],
            [e.x + Math.cos(a) * len, e.y + Math.sin(a) * len],
          ],
          color,
          2 * remain
        );
      }
  } else if (e.type === 'ring') circle(c, e.x, e.y, size * (0.15 + p), null, color, 3 * remain + 1);
  else {
    circle(c, e.x, e.y, Math.max(1, size * remain * 0.18), color);
  }
  c.restore();
}

// 組裝整幀畫面：背景彈幕敵我掉落與特效，含機庫展示模式。
/** 只負責繪製，不持有模擬、畫布尺寸、DOM 或計時器。 */
