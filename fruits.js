export const FRUITS = [
  { id: 'apple', name: 'Apple', skin: '#d93443', light: '#ff7c68', flesh: '#fff0d4', seed: '#6a3a21', points: 10, shape: 'apple', seeds: 4 },
  { id: 'orange', name: 'Orange', skin: '#f28a22', light: '#ffd05c', flesh: '#ffb43a', seed: '#fff0bb', points: 10, shape: 'round', seeds: 8 },
  { id: 'watermelon', name: 'Watermelon', skin: '#24874e', light: '#8acb61', flesh: '#ed4c67', seed: '#422a3d', points: 15, shape: 'round', seeds: 12 },
  { id: 'banana', name: 'Banana', skin: '#e9c744', light: '#fff09a', flesh: '#ffe68b', seed: '#704b2d', points: 12, shape: 'banana', seeds: 0 },
  { id: 'pineapple', name: 'Pineapple', skin: '#bd862e', light: '#f1c45b', flesh: '#ffe19a', seed: '#a67b34', points: 15, shape: 'pineapple', seeds: 0 },
  { id: 'strawberry', name: 'Strawberry', skin: '#e74354', light: '#ff8a86', flesh: '#ffb0a5', seed: '#ffdb77', points: 12, shape: 'strawberry', seeds: 18 },
  { id: 'coconut', name: 'Coconut', skin: '#8c5937', light: '#c48a5d', flesh: '#f7f0d9', seed: '#8b6140', points: 15, shape: 'coconut', seeds: 0 },
  { id: 'peach', name: 'Peach', skin: '#f58d67', light: '#ffd09b', flesh: '#ffd39c', seed: '#8a4634', points: 12, shape: 'peach', seeds: 1 },
  { id: 'kiwi', name: 'Kiwi', skin: '#8e643b', light: '#c39a67', flesh: '#a7c94c', seed: '#302c22', points: 12, shape: 'kiwi', seeds: 16 },
  { id: 'lemon', name: 'Lemon', skin: '#e9d23a', light: '#fff28b', flesh: '#ffed66', seed: '#fff8c5', points: 10, shape: 'lemon', seeds: 5 },
  { id: 'mango', name: 'Mango', skin: '#e77b36', light: '#ffd15c', flesh: '#ffb34f', seed: '#9a5731', points: 14, shape: 'mango', seeds: 1 },
  { id: 'grapes', name: 'Grapes', skin: '#7854b7', light: '#c4a0f0', flesh: '#d5b6ec', seed: '#59406f', points: 14, shape: 'grapes', seeds: 3 },
  { id: 'dragonfruit', name: 'Dragon Fruit', skin: '#d94383', light: '#ff9ac0', flesh: '#fff0f6', seed: '#302638', points: 18, shape: 'dragon', seeds: 25 },
  { id: 'pear', name: 'Pear', skin: '#94b94d', light: '#d1e67b', flesh: '#eff4b8', seed: '#71502c', points: 10, shape: 'pear', seeds: 5 },
  { id: 'pomegranate', name: 'Pomegranate', skin: '#b92d51', light: '#f26a77', flesh: '#d92f58', seed: '#ffe1a4', points: 18, shape: 'pomegranate', seeds: 14 },
  { id: 'blueberry', name: 'Blueberry', skin: '#3d5c9e', light: '#88a8ed', flesh: '#9cb3ed', seed: '#26375e', points: 12, shape: 'berry', seeds: 4 },
  { id: 'cherry', name: 'Cherry', skin: '#a91e45', light: '#f7687a', flesh: '#e94e68', seed: '#7a4a28', points: 12, shape: 'cherry', seeds: 1 },
  { id: 'melon', name: 'Melon', skin: '#78a966', light: '#c9d58a', flesh: '#f4d47a', seed: '#7b5337', points: 14, shape: 'melon', seeds: 8 },
  { id: 'papaya', name: 'Papaya', skin: '#e68a3e', light: '#ffd27a', flesh: '#f7a54d', seed: '#3e3033', points: 16, shape: 'papaya', seeds: 12 },
  { id: 'passionfruit', name: 'Passion Fruit', skin: '#7653a1', light: '#b18add', flesh: '#f7c85f', seed: '#392f34', points: 18, shape: 'passion', seeds: 10 }
];

export const SPECIAL_FRUITS = ['golden', 'rainbow', 'time', 'freeze', 'frenzy', 'double'];

export function createFruit(width, height, difficulty = 1, options = {}) {
  const pool = FRUITS.slice(0, Math.max(5, Math.min(FRUITS.length, options.poolSize || FRUITS.length)));
  const base = pool[Math.floor(Math.random() * pool.length)];
  const size = 22 + Math.random() * 8;
  const fromLeft = Math.random() < 0.5;
  const x = width * (fromLeft ? 0.18 + Math.random() * 0.25 : 0.57 + Math.random() * 0.25);
  const levelBoost = Math.min(1.8, Number(difficulty) || 1);
  const special = options.allowSpecial && Math.random() > 0.88 ? SPECIAL_FRUITS[Math.floor(Math.random() * SPECIAL_FRUITS.length)] : null;
  return {
    ...base,
    x, y: height + size + 8,
    vx: (fromLeft ? 1 : -1) * (45 + Math.random() * 115) * levelBoost + (width * 0.5 - x) * 0.07,
    vy: -(height * (0.92 + Math.random() * 0.28)) * levelBoost,
    r: size, rot: (Math.random() - 0.5) * 0.4,
    vr: (Math.random() - 0.5) * 4.3,
    special, sliced: false, missed: false, born: performance.now(),
    cutAngle: 0, value: base.points + (special ? 15 : 0), wobble: Math.random() * 6.28
  };
}

function fruitPath(ctx, shape, r) {
  ctx.beginPath();
  switch (shape) {
    case 'apple':
      ctx.moveTo(0, -r * 0.77); ctx.bezierCurveTo(-r * 0.22, -r * 1.06, -r * 0.9, -r * 0.92, -r * 0.92, -r * 0.22);
      ctx.bezierCurveTo(-r * 1.08, r * 0.48, -r * 0.48, r * 0.96, 0, r * 0.93);
      ctx.bezierCurveTo(r * 0.58, r * 1.02, r * 1.04, r * 0.38, r * 0.9, -r * 0.25);
      ctx.bezierCurveTo(r * 0.88, -r * 0.86, r * 0.28, -r * 1.03, 0, -r * 0.77); break;
    case 'banana':
      ctx.moveTo(-r * 0.93, -r * 0.35); ctx.quadraticCurveTo(-r * 0.2, -r * 0.1, r * 0.8, -r * 0.73);
      ctx.quadraticCurveTo(r * 1.02, -r * 0.72, r * 0.95, -r * 0.45);
      ctx.quadraticCurveTo(r * 0.1, r * 0.47, -r * 0.78, r * 0.42); ctx.quadraticCurveTo(-r * 1.04, r * 0.38, -r * 0.93, -r * 0.35); break;
    case 'strawberry':
      ctx.moveTo(0, -r * 0.78); ctx.bezierCurveTo(r * 1.07, -r * 1.04, r * 1.03, r * 0.04, 0, r);
      ctx.bezierCurveTo(-r * 0.94, r * 0.2, -r * 1.02, -r * 0.9, 0, -r * 0.78); break;
    case 'pineapple':
      ctx.ellipse(0, r * 0.05, r * 0.73, r * 0.92, 0, 0, Math.PI * 2); break;
    case 'pear':
      ctx.moveTo(0, -r * 0.9); ctx.bezierCurveTo(-r * 0.15, -r * 0.45, -r * 0.8, -r * 0.18, -r * 0.84, r * 0.42);
      ctx.bezierCurveTo(-r * 0.85, r * 1.05, r * 0.82, r * 1.05, r * 0.84, r * 0.42);
      ctx.bezierCurveTo(r * 0.8, -r * 0.18, r * 0.15, -r * 0.45, 0, -r * 0.9); break;
    case 'lemon':
      ctx.moveTo(-r, 0); ctx.quadraticCurveTo(-r * 0.55, -r * 0.9, 0, -r * 0.74); ctx.quadraticCurveTo(r * 0.55, -r * 0.9, r, 0);
      ctx.quadraticCurveTo(r * 0.55, r * 0.9, 0, r * 0.74); ctx.quadraticCurveTo(-r * 0.55, r * 0.9, -r, 0); break;
    case 'grapes': case 'berry': case 'cherry': case 'round': case 'coconut': case 'passion':
      ctx.ellipse(0, 0, r * (shape === 'coconut' ? 0.92 : 0.9), r * (shape === 'berry' ? 0.84 : 0.92), 0, 0, Math.PI * 2); break;
    case 'mango': case 'peach': case 'dragon': case 'melon': case 'pomegranate': case 'papaya':
      ctx.ellipse(0, 0, r * 0.84, r * 0.98, shape === 'mango' ? -0.28 : 0, 0, Math.PI * 2); break;
    default:
      ctx.ellipse(0, 0, r * 0.86, r, 0, 0, Math.PI * 2);
  }
  ctx.closePath();
}

export function drawFruit(ctx, fruit, half = 0) {
  const r = fruit.r;
  ctx.save();
  ctx.translate(fruit.x, fruit.y);
  ctx.rotate(fruit.rot);
  if (fruit.shape === 'banana') ctx.rotate(-0.4);
  if (half) {
    ctx.beginPath();
    if (half < 0) ctx.rect(-r * 1.6, -r * 1.6, r * 1.6, r * 3.2);
    else ctx.rect(0, -r * 1.6, r * 1.6, r * 3.2);
    ctx.clip();
  }
  const gradient = ctx.createLinearGradient(-r, -r, r, r);
  gradient.addColorStop(0, fruit.light);
  gradient.addColorStop(0.46, fruit.skin);
  gradient.addColorStop(1, shade(fruit.skin, -30));
  fruitPath(ctx, fruit.shape, r);
  ctx.fillStyle = gradient; ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.075); ctx.strokeStyle = shade(fruit.skin, -42); ctx.stroke();

  if (fruit.special === 'golden') {
    ctx.strokeStyle = '#fff3a1'; ctx.lineWidth = 3; ctx.stroke();
  }
  if (fruit.shape === 'watermelon' || fruit.shape === 'melon') {
    ctx.save(); ctx.globalAlpha = 0.48; ctx.strokeStyle = fruit.shape === 'watermelon' ? '#b3e17d' : '#e5e6b0'; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(i * r * 0.22, 0, r * 0.23, r * 0.88, 0, -1.2, 1.2); ctx.stroke(); }
    ctx.restore();
  }
  if (fruit.shape === 'pineapple') {
    ctx.strokeStyle = '#f8d76a'; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * r * 0.23 - r * 0.4, -r * 0.68); ctx.lineTo(i * r * 0.23 + r * 0.4, r * 0.68); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  if (fruit.shape === 'dragon') {
    ctx.strokeStyle = '#ffb9d6'; ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * r * 0.32, -r * 0.6); ctx.quadraticCurveTo(i * r * 0.5, 0, i * r * 0.3, r * 0.55); ctx.stroke(); }
  }
  if (fruit.shape === 'grapes') {
    ctx.fillStyle = fruit.skin; for (const [x, y] of [[-0.35,-0.35],[0.24,-0.42],[-0.42,0.2],[0.28,0.22],[0,0.55]]) { ctx.beginPath(); ctx.arc(x*r,y*r,r*.39,0,Math.PI*2); ctx.fill(); }
  }
  if (fruit.shape === 'kiwi') {
    ctx.strokeStyle = '#f1f4b7'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r * .65, 0, Math.PI * 2); ctx.stroke();
  }
  const inside = half !== 0;
  if (inside) {
    ctx.save(); ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.72, r * 0.82, 0, 0, Math.PI * 2); ctx.fillStyle = fruit.flesh; ctx.fill();
    ctx.lineWidth = Math.max(1, r * .05); ctx.strokeStyle = 'rgba(255,255,255,.62)'; ctx.stroke();
    if (fruit.seeds) {
      const seedCount = Math.min(fruit.seeds, 18);
      for (let i = 0; i < seedCount; i++) {
        const a = i * 2.39996;
        const distance = r * (0.18 + (i % 4) * 0.105);
        const sx = Math.cos(a) * distance, sy = Math.sin(a) * distance;
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(a);
        ctx.fillStyle = fruit.seed; ctx.beginPath(); ctx.ellipse(0, 0, r * .045, r * .09, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }
    ctx.restore();
  }
  if (!half) {
    ctx.fillStyle = 'rgba(255,255,255,.42)'; ctx.beginPath(); ctx.ellipse(-r * .3, -r * .38, r * .2, r * .1, -.55, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5e8f45'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -r * .76); ctx.quadraticCurveTo(r * .08, -r * 1.03, r * .32, -r * 1.06); ctx.stroke();
    if (fruit.special) {
      ctx.save(); ctx.rotate(-fruit.rot); ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.max(10, r*.45)}px system-ui`; ctx.textAlign = 'center';
      ctx.fillText(({golden:'✦',rainbow:'✧',time:'◷',freeze:'❄',frenzy:'⚡',double:'×2'})[fruit.special], 0, -r*1.03); ctx.restore();
    }
  }
  ctx.restore();
}

export function drawFruitPiece(ctx, piece) {
  ctx.save();
  ctx.translate(piece.x, piece.y);
  ctx.rotate(piece.rot);
  const f = piece.fruit;
  const r = f.r;
  ctx.beginPath();
  ctx.rect(piece.side < 0 ? -r * 1.6 : 0, -r * 1.5, r * 1.6, r * 3);
  ctx.clip();
  drawFruit(ctx, { ...f, x: 0, y: 0, rot: 0 }, piece.side);
  ctx.restore();
}

function shade(hex, amount) {
  const value = hex.replace('#', '');
  const num = parseInt(value.length === 3 ? value.split('').map(c=>c+c).join('') : value, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (num & 255) + amount));
  return `rgb(${r},${g},${b})`;
}
