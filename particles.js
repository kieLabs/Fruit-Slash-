const PALETTE = ['#ff5f70', '#ffb64c', '#f8e66b', '#77d77b', '#61c7ff', '#c48aff', '#fff4db'];

export function burstParticles(store, x, y, color, count = 18, scale = 1, type = 'juice') {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (type === 'spark' ? 100 : 45) + Math.random() * (type === 'spark' ? 260 : 180);
    store.push({
      x, y, vx: Math.cos(angle) * speed * scale, vy: Math.sin(angle) * speed * scale,
      life: 0.45 + Math.random() * 0.65, maxLife: 1.1, size: (2 + Math.random() * 5) * scale,
      color: color || PALETTE[Math.floor(Math.random() * PALETTE.length)],
      rotation: Math.random() * Math.PI, spin: (Math.random() - .5) * 12,
      gravity: type === 'spark' ? 210 : 390, shape: type === 'seed' ? 'seed' : (Math.random() > .5 ? 'drop' : 'dot')
    });
  }
}

export function updateParticles(store, dt) {
  for (let i = store.length - 1; i >= 0; i--) {
    const p = store[i];
    p.life -= dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vy += p.gravity * dt; p.vx *= Math.pow(.985, dt * 60);
    p.rotation += p.spin * dt;
    if (p.life <= 0) store.splice(i, 1);
  }
}

export function renderParticles(ctx, store) {
  for (const p of store) {
    const alpha = Math.max(0, Math.min(1, p.life / .55));
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(p.x, p.y); ctx.rotate(p.rotation); ctx.fillStyle = p.color;
    if (p.shape === 'seed') {
      ctx.beginPath(); ctx.ellipse(0, 0, p.size * .48, p.size, 0, 0, Math.PI * 2); ctx.fill();
    } else if (p.shape === 'drop') {
      ctx.beginPath(); ctx.moveTo(0, -p.size); ctx.quadraticCurveTo(p.size, 0, 0, p.size); ctx.quadraticCurveTo(-p.size, 0, 0, -p.size); ctx.fill();
    } else { ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
}
