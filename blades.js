export const BLADES = [
  { id:'classic', name:'Classic Blade', cost:0, color:'#d9f7ff', glow:'#79dfff', style:'silver', unlock:'Available' },
  { id:'fire', name:'Fire Blade', cost:180, color:'#ff9a47', glow:'#ff4a32', style:'fire', unlock:'180 coins' },
  { id:'ice', name:'Ice Blade', cost:220, color:'#c9f5ff', glow:'#48caff', style:'ice', unlock:'220 coins' },
  { id:'lightning', name:'Lightning Blade', cost:300, color:'#fff36e', glow:'#79b8ff', style:'electric', unlock:'300 coins' },
  { id:'golden', name:'Golden Blade', cost:450, color:'#fff0a0', glow:'#e8aa32', style:'gold', unlock:'450 coins' },
  { id:'neon', name:'Neon Blade', cost:500, color:'#80fff2', glow:'#16d9ca', style:'neon', unlock:'500 coins' },
  { id:'shadow', name:'Shadow Blade', cost:650, color:'#bd9aff', glow:'#7045bf', style:'shadow', unlock:'650 coins' },
  { id:'rainbow', name:'Rainbow Blade', cost:800, color:'#fff', glow:'#e77eff', style:'rainbow', unlock:'800 coins' },
  { id:'diamond', name:'Diamond Blade', cost:1000, color:'#e2ffff', glow:'#5ee4ff', style:'diamond', unlock:'1,000 coins' },
  { id:'legendary', name:'Legendary Blade', cost:1500, color:'#fff2c4', glow:'#ffcf56', style:'legendary', unlock:'1,500 coins' }
];

export function drawBladeTrail(ctx, points, bladeId = 'classic', alpha = 1) {
  if (points.length < 2) return;
  const blade = BLADES.find(b => b.id === bladeId) || BLADES[0];
  const tail = points[points.length - 1];
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.shadowColor = blade.glow; ctx.shadowBlur = blade.id === 'classic' ? 13 : 22;
  ctx.strokeStyle = blade.color; ctx.lineWidth = 3.2; ctx.beginPath();
  points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x,p.y)); ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.15; ctx.stroke();
  if (blade.style === 'electric' || blade.style === 'fire' || blade.style === 'rainbow') {
    ctx.fillStyle = blade.glow; ctx.beginPath(); ctx.arc(tail.x, tail.y, 4.5, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

export function bladeById(id) { return BLADES.find(b => b.id === id) || BLADES[0]; }
