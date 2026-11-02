import { createFruit, drawFruit, drawFruitPiece } from './fruits.js';
import { createBomb, drawBomb, bombPenalty } from './bombs.js';
import { burstParticles, updateParticles, renderParticles } from './particles.js';
import { drawBladeTrail, bladeById } from './blades.js';
import { segmentCircle, splitImpulse } from './slicing.js';
import { getDifficulty } from './difficulty.js';
import { generateLevel } from './levels.js';
import { getMode } from './modes.js';
import { createPowerupState, updatePowerups } from './powerups.js';
import { BACKGROUNDS } from './shop.js';

export class GameEngine {
  constructor(canvas, onEvent = () => {}, save, audio) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false });
    this.onEvent = onEvent; this.save = save; this.audio = audio;
    this.w = 360; this.h = 640; this.dpr = 1;
    this.fruits = []; this.bombs = []; this.pieces = []; this.particles = [];
    this.trails = new Map(); this.pointers = new Map();
    this.running = false; this.paused = false; this.screenShake = 0;
    this.lastFrame = 0; this.spawnClock = 0; this.elapsed = 0; this.tickClock = 0;
    this.powerups = createPowerupState(); this.mode = getMode('classic'); this.level = generateLevel(1);
    this.stats = this.newStats(); this.comboClock = 0; this.comboCount = 0; this.waveIndex = 0;
    this.effectClock = 0; this.backgroundParticles = Array.from({length:32},()=>({x:Math.random(),y:Math.random(),size:Math.random()*2+0.4,speed:.015+Math.random()*.035,phase:Math.random()*6.28}));
    this.boundLoop = t => this.loop(t); this.raf = requestAnimationFrame(this.boundLoop);
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(canvas.parentElement || canvas);
    this.resize(); this.bindInput();
  }

  newStats() {
    return { score:0, best:this.save?.bestScore || 0, lives:3, timer:60, fruitsSliced:0, bestCombo:0, combo:0, perfectSlices:0, bombHits:0, bombsAvoided:0, swipes:0, hits:0, level:1, target:450, elapsed:0, coinsEarned:0, goldenFruits:0, specialCount:0 };
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.w = Math.max(280, rect.width || 360); this.h = Math.max(420, rect.height || 640);
    this.dpr = Math.min(2.5, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  bindInput() {
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('pointerdown', e => {
      if (!this.running || this.paused) return;
      e.preventDefault(); this.audio?.init();
      const p = this.localPoint(e); p.t = performance.now(); this.pointers.set(e.pointerId, p);
      this.canvas.setPointerCapture?.(e.pointerId);
      for (let i=this.bombs.length-1;i>=0;i--) { const bomb=this.bombs[i]; if (Math.hypot(p.x-bomb.x,p.y-bomb.y) <= bomb.r) { this.hitBomb(i); break; } }
      this.trails.set(e.pointerId, [{...p, t:performance.now()}]);
    }, {passive:false});
    this.canvas.addEventListener('pointermove', e => {
      if (!this.pointers.has(e.pointerId) || !this.running || this.paused) return;
      e.preventDefault(); const prev = this.pointers.get(e.pointerId); const point = this.localPoint(e); point.t = performance.now();
      this.pointers.set(e.pointerId, point); this.handleSwipe(prev, point);
      const trail = this.trails.get(e.pointerId) || []; trail.push({...point,t:performance.now()});
      while (trail.length > 13) trail.shift(); this.trails.set(e.pointerId, trail);
      if (this.running && this.mode.id==='classic' && this.stats.score >= this.level.targetScore) this.completeLevel();
    }, {passive:false});
    const end = e => { this.pointers.delete(e.pointerId); this.trails.delete(e.pointerId); };
    this.canvas.addEventListener('pointerup', end); this.canvas.addEventListener('pointercancel', end); this.canvas.addEventListener('lostpointercapture', end);
    window.addEventListener('blur', () => { if (this.running && !this.paused) this.pause(); });
  }

  localPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x:(e.clientX-rect.left)*(this.w/rect.width), y:(e.clientY-rect.top)*(this.h/rect.height) };
  }

  start(modeId = 'classic', levelNumber = this.save?.level || 1) {
    this.mode = getMode(modeId); this.level = generateLevel(levelNumber);
    this.stats = this.newStats(); this.stats.level = this.level.number; this.stats.target = this.level.targetScore;
    this.stats.lives = this.mode.lives; this.stats.timer = this.mode.duration || 0;
    this.fruits.length = 0; this.bombs.length = 0; this.pieces.length = 0; this.particles.length = 0;
    this.trails.clear(); this.pointers.clear(); this.powerups = createPowerupState();
    this.elapsed = 0; this.spawnClock = .12; this.comboClock = 0; this.comboCount = 0; this.waveIndex = 0; this.screenShake = 0;
    this.running = true; this.paused = false; this.audio?.init(); this.audio?.startMusic();
    this.onEvent('start', this.snapshot()); this.onEvent('tick', this.snapshot());
  }

  pause() { if (!this.running || this.paused) return; this.paused = true; this.pointers.clear(); this.trails.clear(); this.audio?.stopMusic(); this.onEvent('pause', this.snapshot()); }
  resume() { if (!this.running || !this.paused) return; this.paused = false; this.lastFrame = performance.now(); this.audio?.startMusic(); this.onEvent('resume', this.snapshot()); }
  stop() { this.running = false; this.paused = false; this.audio?.stopMusic(); this.onEvent('stop', this.snapshot()); }

  activatePowerup(id) {
    if (!this.running || this.paused) return false;
    if (id === 'freeze') this.powerups.freeze = Math.max(this.powerups.freeze,4.5);
    else if (id === 'double') this.powerups.double = Math.max(this.powerups.double,8);
    else if (id === 'slow') this.powerups.slow = Math.max(this.powerups.slow,6);
    else if (id === 'mega') this.powerups.mega = Math.max(this.powerups.mega,7);
    else if (id === 'blade') this.powerups.blade = Math.max(this.powerups.blade,7);
    else if (id === 'life') { if (!this.mode.lives) return false; this.stats.lives += 1; }
    else if (id === 'frenzy') { this.powerups.frenzy = 5; this.spawnClock = .18; this.spawnWave(true); }
    else return false;
    burstParticles(this.particles, this.w/2, this.h*.55, '#76f2db', 28, 1.1, 'spark');
    this.onEvent('powerup', {id, active:true}); return true;
  }

  spawnWave(frenzy = false) {
    const difficulty = getDifficulty(this.level.number, this.elapsed);
    const pattern = !frenzy ? this.level.pattern[this.waveIndex % this.level.pattern.length] : null;
    this.waveIndex++;
    const count = frenzy ? 9 : (pattern?.count || Math.min(difficulty.groupSize, 2 + Math.floor(Math.random()*2.2)));
    const spread = pattern?.spread || 0.7;
    const pool = Math.max(5, this.level.fruitPoolSize || 20);
    const center = this.w * (.27 + Math.random()*.46);
    for (let i=0;i<count;i++) {
      const f = createFruit(this.w,this.h,difficulty.fruitSpeed,{allowSpecial:this.mode.id!=='zen' || Math.random()>.45,poolSize:pool});
      f.x = Math.max(f.r+5, Math.min(this.w-f.r-5, center + (i-(count-1)/2)*(f.r*1.45*spread) + (Math.random()-.5)*18));
      if (pattern?.includeSpecial && i === Math.floor(count/2) && !f.special) { f.special = ['golden','rainbow','time','freeze','double'][Math.floor(Math.random()*5)]; f.value += 15; }
      f.vx += (this.w/2-f.x)*.035; f.vy *= frenzy ? 1.07 : 1;
      this.fruits.push(f);
    }
    const allowBomb = this.mode.bombs && !frenzy && this.bombs.length < 1 && Math.random() < difficulty.bombChance;
    if (allowBomb && this.elapsed > 2.5) {
      const roll = Math.random();
      const type = this.level.number > 45 && roll > .96 ? 'time' : this.level.number > 30 && roll > .87 ? 'mega' : this.level.number > 12 && roll > .76 ? 'double' : 'normal';
      const b = createBomb(this.w,this.h,difficulty.fruitSpeed,type);
      if (Math.abs(b.x-center) < 80) b.x = Math.max(40,Math.min(this.w-40,b.x+(b.x<this.w/2?-120:120)));
      this.bombs.push(b);
      if (type === 'double') {
        const second = createBomb(this.w,this.h,difficulty.fruitSpeed,'normal');
        second.x = Math.max(32,Math.min(this.w-32,b.x + (b.x < this.w/2 ? 78 : -78)));
        second.vx = -b.vx * .55; second.vy = b.vy * .96;
        this.bombs.push(second);
      }
    }
    this.audio?.launch();
  }

  handleSwipe(a,b) {
    const distance = Math.hypot(b.x-a.x,b.y-a.y);
    if (distance < 4) return;
    this.stats.swipes++;
    const speed = distance / Math.max(.006, ((b.t || performance.now()) - (a.t || performance.now()-20)) / 1000);
    let sliced = 0;
    for (let i=this.fruits.length-1;i>=0;i--) {
      const fruit = this.fruits[i];
      if (fruit.sliced || !segmentCircle(a.x,a.y,b.x,b.y,fruit.x,fruit.y,fruit.r*.84)) continue;
      this.cutFruit(i,a,b,speed); sliced++;
    }
    for (let i=this.bombs.length-1;i>=0;i--) {
      const bomb = this.bombs[i];
      if (segmentCircle(a.x,a.y,b.x,b.y,bomb.x,bomb.y,bomb.r*.92)) this.hitBomb(i);
    }
    if (sliced && speed > 420) this.stats.perfectSlices += sliced;
  }

  cutFruit(index,a,b,speed) {
    const fruit = this.fruits[index]; this.fruits.splice(index,1); fruit.sliced = true;
    const impulse = splitImpulse(a.x,a.y,b.x,b.y,speed);
    const angle = Math.atan2(b.y-a.y,b.x-a.x); fruit.cutAngle = angle;
    const baseForce = impulse.force;
    this.pieces.push(
      {fruit,side:-1,x:fruit.x,y:fruit.y,vx:fruit.vx-impulse.nx*baseForce*.55,vy:fruit.vy-impulse.ny*baseForce*.55-55,rot:fruit.rot+angle,vr:fruit.vr-2.5,life:1.25},
      {fruit,side:1,x:fruit.x,y:fruit.y,vx:fruit.vx+impulse.nx*baseForce*.55,vy:fruit.vy+impulse.ny*baseForce*.55-55,rot:fruit.rot+angle,vr:fruit.vr+2.5,life:1.25}
    );
    this.stats.fruitsSliced++; this.stats.hits++;
    let points = fruit.value;
    if (fruit.special === 'golden') { points *= 5; this.stats.goldenFruits++; this.stats.coinsEarned += 5; }
    if (fruit.special === 'rainbow') points *= 3;
    if (this.powerups.double > 0 || fruit.special === 'double') points *= 2;
    if (this.powerups.mega > 0) points = Math.round(points*1.5);
    this.stats.score += points; this.stats.best = Math.max(this.stats.best,this.stats.score);
    this.comboClock = this.comboClock > 0 ? this.comboClock : .7; this.comboCount = this.comboClock > .4 ? this.comboCount+1 : 1; this.comboClock = .72;
    this.stats.combo = this.comboCount; this.stats.bestCombo = Math.max(this.stats.bestCombo,this.comboCount);
    if (this.comboCount > 1) {
      const bonus = (this.comboCount-1) * 5 * (this.powerups.mega > 0 ? 2 : 1);
      this.stats.score += bonus; this.stats.best = Math.max(this.stats.best,this.stats.score);
      this.onEvent('combo',{count:this.comboCount,bonus, label:comboLabel(this.comboCount)});
      if (this.comboCount>=2) this.audio?.combo(this.comboCount);
    } else this.audio?.slice(1);
    if (fruit.special) this.applySpecialFruit(fruit.special);
    burstParticles(this.particles,fruit.x,fruit.y,fruit.flesh,fruit.special==='golden'?30:20,fruit.special==='golden'?1.25:1,'juice');
    if (fruit.seeds) burstParticles(this.particles,fruit.x,fruit.y,fruit.seed,Math.min(10,fruit.seeds),.8,'seed');
    if (this.save?.equippedEffect === 'neon') burstParticles(this.particles,fruit.x,fruit.y,'#87fff0',26,1.15,'spark');
    if (this.save?.equippedEffect === 'confetti') burstParticles(this.particles,fruit.x,fruit.y,null,28,1.1,'juice');
    burstParticles(this.particles,(a.x+b.x)/2,(a.y+b.y)/2,bladeById(this.save?.equippedBlade).glow,7,.75,'spark');
    this.onEvent('slice',{fruit,points,combo:this.comboCount,perfect:speed>420});
  }

  applySpecialFruit(type) {
    this.stats.specialCount++;
    if (type === 'time' && this.mode.timed) this.stats.timer += 5;
    if (type === 'freeze') this.powerups.freeze = 3.5;
    if (type === 'frenzy') this.spawnWave(true);
    if (type === 'double') this.powerups.double = 5;
    if (type === 'rainbow') this.powerups.mega = Math.max(this.powerups.mega,3);
    this.onEvent('special',{type});
  }

  hitBomb(index) {
    const bomb = this.bombs[index]; this.bombs.splice(index,1);
    const penalty = bombPenalty(bomb.type);
    this.stats.bombHits++; this.stats.lives = Math.max(0,this.stats.lives-penalty);
    this.screenShake = .38; this.audio?.bomb();
    burstParticles(this.particles,bomb.x,bomb.y,'#ff7548',42,1.5,'spark');
    burstParticles(this.particles,bomb.x,bomb.y,'#414c60',22,1.2,'juice');
    this.onEvent('bomb',{penalty,lives:this.stats.lives});
    if ((this.mode.id === 'classic' || this.mode.id === 'survival' || this.mode.id === 'challenge') && this.stats.lives <= 0) this.endGame('bomb');
  }

  completeLevel() {
    if (!this.running) return;
    this.running = false; this.paused = false; this.audio?.complete(); this.audio?.stopMusic();
    const accuracy = this.stats.swipes ? Math.round(this.stats.hits/this.stats.swipes*100) : 100;
    const stars = this.stats.score >= this.level.targetScore*1.5 && this.stats.bestCombo>=4 ? 3 : this.stats.score >= this.level.targetScore*1.2 ? 2 : 1;
    const result = { ...this.snapshot(), accuracy, stars, rewardCoins:this.level.rewardCoins, rewardGems:this.level.rewardGems };
    this.onEvent('complete',result);
  }

  endGame(reason = 'time') {
    if (!this.running) return;
    this.running = false; this.audio?.gameOver(); this.audio?.stopMusic();
    const accuracy = this.stats.swipes ? Math.round(this.stats.hits/this.stats.swipes*100) : 0;
    this.onEvent('gameover',{...this.snapshot(),accuracy,reason});
  }

  update(dt) {
    if (!this.running || this.paused) return;
    this.elapsed += dt; this.stats.elapsed = this.elapsed;
    const freeze = this.powerups.freeze > 0 ? .08 : this.powerups.slow > 0 ? .48 : 1;
    const worldDt = dt * freeze;
    updatePowerups(this.powerups,dt);
    this.comboClock -= dt;
    if (this.comboClock <= 0) { this.comboCount = 0; this.stats.combo = 0; }
    const difficulty = getDifficulty(this.level.number,this.elapsed);
    this.spawnClock -= dt;
    const interval = this.powerups.frenzy > 0 ? Math.min(.58,difficulty.spawnInterval*.48) : difficulty.spawnInterval * (this.mode.id === 'zen' ? 1.12 : 1);
    if (this.spawnClock <= 0) { this.spawnWave(this.powerups.frenzy > 0); this.spawnClock = interval * (.78+Math.random()*.42); }
    if (this.mode.timed) {
      this.stats.timer = Math.max(0,this.stats.timer-dt);
      if (this.stats.timer <= 0) {
        if (this.mode.id === 'challenge' && this.challengeComplete()) this.completeLevel();
        else this.endGame('time');
      }
    }
    for (let i=this.fruits.length-1;i>=0;i--) {
      const f = this.fruits[i]; f.x += f.vx*worldDt; f.y += f.vy*worldDt; f.vy += difficulty.gravity*worldDt; f.rot += f.vr*worldDt;
      if (f.y > this.h+f.r*2 && f.vy>0) {
        this.fruits.splice(i,1);
        if (this.mode.missesCostLife) {
          this.stats.lives = Math.max(0,this.stats.lives-1);
          if ((this.mode.id==='classic' || this.mode.id==='challenge') && this.stats.lives<=0) this.endGame('missed');
        }
      }
    }
    for (let i=this.bombs.length-1;i>=0;i--) {
      const b=this.bombs[i]; b.x+=b.vx*worldDt; b.y+=b.vy*worldDt; b.vy+=difficulty.gravity*worldDt; b.rot+=b.vr*worldDt;
      if (b.warning>0) { b.warning-=dt; if (b.warning<=0 && b.type==='time') { this.hitBomb(i); continue; } }
      if (b.y>this.h+b.r*2 && b.vy>0) { this.bombs.splice(i,1); this.stats.bombsAvoided++; }
    }
    for (let i=this.pieces.length-1;i>=0;i--) {
      const p=this.pieces[i]; p.x+=p.vx*worldDt; p.y+=p.vy*worldDt; p.vy+=difficulty.gravity*worldDt; p.rot+=p.vr*worldDt; p.life-=dt;
      if(p.life<=0||p.y>this.h+p.fruit.r*3) this.pieces.splice(i,1);
    }
    updateParticles(this.particles,worldDt);
    if (this.mode.id === 'challenge' && this.challengeComplete()) { this.completeLevel(); return; }
    this.screenShake=Math.max(0,this.screenShake-dt);
    this.tickClock += dt;
    if(this.tickClock>.09){this.tickClock=0;this.onEvent('tick',this.snapshot());}
  }


  challengeComplete() {
    const objective = this.level.objective;
    if (objective === 'Reach the score target') return this.stats.score >= this.level.targetScore;
    if (objective === 'Slice 18 fruits') return this.stats.fruitsSliced >= 18;
    if (objective === 'Build a 5-fruit combo') return this.stats.bestCombo >= 5;
    if (objective === 'Land 5 perfect slices') return this.stats.perfectSlices >= 5;
    if (objective === 'Score with special fruit') return this.stats.specialCount >= 1;
    if (objective === 'Avoid every bomb') return this.stats.timer <= 0 && this.stats.bombHits === 0;
    return this.stats.score >= this.level.targetScore;
  }

  snapshot() {
    return { ...this.stats, mode:this.mode.id, paused:this.paused, running:this.running, powerups:{...this.powerups}, target:this.level.targetScore, level:this.level.number, objective:this.level.objective };
  }

  render(now = 0) {
    const ctx=this.ctx; const bg=BACKGROUNDS.find(x=>x.id===this.save?.equippedBackground)||BACKGROUNDS[0];
    ctx.save();
    if(this.screenShake>0){const amount=this.screenShake*13;ctx.translate((Math.random()-.5)*amount,(Math.random()-.5)*amount);}
    const gradient=ctx.createLinearGradient(0,0,0,this.h);gradient.addColorStop(0,bg.a);gradient.addColorStop(1,bg.b);
    ctx.fillStyle=gradient;ctx.fillRect(0,0,this.w,this.h);
    this.drawEnvironment(ctx,bg,now);
    for(const b of this.bombs) drawBomb(ctx,b,now/1000);
    for(const f of this.fruits) drawFruit(ctx,f);
    for(const p of this.pieces) drawFruitPiece(ctx,p);
    renderParticles(ctx,this.particles);
    for(const trail of this.trails.values()){
      const live=trail.filter(p=>now-p.t<230); const points=live.map(p=>({x:p.x,y:p.y}));
      drawBladeTrail(ctx,points,this.powerups.blade>0?'rainbow':(this.save?.equippedBlade||'classic'),Math.min(1,live.length/5));
    }
    this.drawPowerupAura(ctx);
    ctx.restore();
  }

  drawEnvironment(ctx,bg,now) {
    const t=now/1000;
    ctx.save();
    const glow=ctx.createRadialGradient(this.w*.5,this.h*.35,10,this.w*.5,this.h*.35,this.w*.82);
    glow.addColorStop(0,bg.accent+'20');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(0,0,this.w,this.h);
    for(const p of this.backgroundParticles){p.y+=p.speed/60;if(p.y>1){p.y=0;p.x=Math.random();}ctx.globalAlpha=.2+Math.sin(t+p.phase)*.12;ctx.fillStyle=bg.accent;ctx.beginPath();ctx.arc(p.x*this.w,p.y*this.h,p.size,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=.17;ctx.strokeStyle=bg.accent;ctx.lineWidth=1;
    if(bg.id==='dojo'||bg.id==='garden'||bg.id==='temple'){
      for(let i=0;i<8;i++){const y=this.h*.16+i*48;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(this.w,y);ctx.stroke();}
      ctx.beginPath();ctx.arc(this.w*.5,this.h*.23,this.w*.31,0,Math.PI*2);ctx.stroke();
    } else if(bg.id==='cyber'||bg.id==='neon'||bg.id==='galaxy'){
      for(let x=-this.h;x<this.w+this.h;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+this.h*.5,this.h);ctx.stroke();}
    } else {
      ctx.beginPath();ctx.moveTo(0,this.h*.79);ctx.quadraticCurveTo(this.w*.5,this.h*.7,this.w,this.h*.81);ctx.stroke();
    }
    ctx.globalAlpha=1;ctx.restore();
  }

  drawPowerupAura(ctx) {
    const active=Object.entries(this.powerups).filter(([,v])=>v>0);
    if(!active.length)return;
    const colors={freeze:'#77dfff',double:'#ffe477',frenzy:'#ff895f',slow:'#bba0ff',mega:'#ff7ce1',blade:'#8bfff0'};
    ctx.save();ctx.globalAlpha=.18+Math.sin(performance.now()/100)*.06;ctx.strokeStyle=colors[active[0][0]];ctx.lineWidth=4;ctx.beginPath();ctx.arc(this.w*.5,this.h*.52,Math.min(this.w,this.h)*.44,0,Math.PI*2);ctx.stroke();ctx.restore();
  }

  loop(time) {
    const dt=this.lastFrame?Math.min(.034,(time-this.lastFrame)/1000):0;this.lastFrame=time;
    this.update(dt);this.render(time);this.raf=requestAnimationFrame(this.boundLoop);
  }

  destroy() { cancelAnimationFrame(this.raf); this.resizeObserver?.disconnect(); this.audio?.stopMusic(); }
}

function comboLabel(n){if(n>=7)return 'CRITICAL COMBO';if(n===6)return 'PERFECT COMBO';if(n===5)return 'EXCELLENT COMBO';if(n===4)return 'AMAZING COMBO';if(n===3)return 'GREAT COMBO';return 'NICE COMBO';}
