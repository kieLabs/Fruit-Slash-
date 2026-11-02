export function createBomb(width, height, difficulty = 1, type = 'normal') {
  const x = width * (0.2 + Math.random() * 0.6);
  const r = type === 'mega' ? 29 : type === 'double' ? 21 : 24;
  return {
    x, y: height + r + 8, vx: (Math.random() - .5) * 180,
    vy: -(height * (.82 + Math.random() * .32)) * difficulty / 1.12,
    r, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 3.8,
    type, warning: type === 'time' ? 1.8 : 0, fused: 0, hit: false
  };
}

export function drawBomb(ctx, bomb, time = 0) {
  ctx.save(); ctx.translate(bomb.x, bomb.y); ctx.rotate(bomb.rot);
  const glow = 0.45 + Math.sin(time * 7) * .15;
  ctx.shadowColor = bomb.type === 'mega' ? '#ff4d6d' : '#ff963c'; ctx.shadowBlur = 12 + glow * 12;
  const g = ctx.createRadialGradient(-bomb.r*.25, -bomb.r*.35, 2, 0, 0, bomb.r);
  g.addColorStop(0, '#687080'); g.addColorStop(.5, '#252d3d'); g.addColorStop(1, '#0b101b');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, bomb.r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.strokeStyle = '#8792a8'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#ffb04b'; ctx.beginPath(); ctx.moveTo(-5, -bomb.r+2); ctx.quadraticCurveTo(0, -bomb.r-10, 7, -bomb.r+2); ctx.fill();
  ctx.strokeStyle = '#ffd887'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(2, -bomb.r-2); ctx.quadraticCurveTo(9, -bomb.r-13, 15, -bomb.r-8); ctx.stroke();
  ctx.fillStyle = '#ffcc70'; ctx.font = `bold ${bomb.r*.9}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 0, 3);
  if (bomb.warning > 0) {
    ctx.rotate(-bomb.rot); ctx.strokeStyle = `rgba(255,70,90,${.45+glow})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0,0,bomb.r+8+Math.sin(time*14)*3,0,Math.PI*2); ctx.stroke();
  }
  ctx.restore();
}

export function bombPenalty(type) {
  return type === 'mega' ? 2 : 1;
}
