import { BLADES } from './blades.js';
import { BACKGROUNDS, getShopItems } from './shop.js';
import { ACHIEVEMENTS, dailyMissions, missionProgress, isMissionClaimed, achievementProgress } from './missions.js';
import { getDifficultyBand } from './difficulty.js';

const $ = (id) => document.getElementById(id);
const ICONS = { blades:'⚔', backgrounds:'🌌', effects:'✨', powerups:'⚡', themes:'🎨' };

export class GameUI {
  constructor(save) {
    this.save = save; this.selectedPanel = ''; this.category = 'blades'; this.toastTimer = 0; this.comboTimer = 0;
    this.main = $('main-screen'); this.panel = $('panel-screen'); this.pause = $('pause-screen'); this.result = $('result-screen'); this.hud = $('game-hud');
  }
  setSave(save) { this.save = save; this.updateWallet(); }
  updateWallet() {
    $('coin-count').textContent = this.save.coins.toLocaleString(); $('gem-count').textContent = this.save.gems.toLocaleString();
    $('panel-coins').textContent = this.save.coins.toLocaleString();
    $('menu-level').textContent = this.save.level; $('menu-band').textContent = getDifficultyBand(this.save.level).toUpperCase();
  }
  showMenu() {
    this.main.classList.remove('hidden'); this.panel.classList.add('hidden'); this.pause.classList.add('hidden'); this.result.classList.add('hidden'); this.hud.classList.add('hidden');
    $('menu-level').textContent = this.save.level; $('menu-band').textContent = getDifficultyBand(this.save.level).toUpperCase();
    this.updateWallet();
  }
  showGame() { this.main.classList.add('hidden'); this.panel.classList.add('hidden'); this.pause.classList.add('hidden'); this.result.classList.add('hidden'); this.hud.classList.remove('hidden'); }
  showPause() { this.pause.classList.remove('hidden'); }
  hidePause() { this.pause.classList.add('hidden'); }
  showPanel(name, category = null) {
    this.selectedPanel = name;
    if (name === 'shop') this.category = category || 'blades';
    if (name === 'blades') this.category = 'blades';
    if (name === 'backgrounds') this.category = 'backgrounds';
    if (name === 'missions' || name === 'achievements' || name === 'stats' || name === 'settings' || name === 'help' || name === 'levels') this.category = name;
    $('panel-title').textContent = ({blades:'BLADE COLLECTION',backgrounds:'WORLDS',shop:'ARCADE SHOP',missions:'DAILY MISSIONS',achievements:'ACHIEVEMENTS',stats:'PLAYER STATS',settings:'SETTINGS',help:'HOW TO PLAY',levels:'LEVEL SELECT'})[name] || 'GAMERKIE';
    $('panel-coins').textContent = this.save.coins.toLocaleString();
    $('panel-content').innerHTML = this.renderPanel(name);
    this.main.classList.add('hidden'); this.pause.classList.add('hidden'); this.result.classList.add('hidden'); this.hud.classList.add('hidden'); this.panel.classList.remove('hidden');
  }
  closePanel() { this.panel.classList.add('hidden'); this.main.classList.remove('hidden'); this.updateWallet(); }
  renderPanel(name) {
    if (['blades','backgrounds','shop'].includes(name)) return this.renderShop(name);
    if (name === 'missions') return this.renderMissions();
    if (name === 'achievements') return this.renderAchievements();
    if (name === 'stats') return this.renderStats();
    if (name === 'settings') return this.renderSettings();
    if (name === 'help') return this.renderHelp();
    if (name === 'levels') return this.renderLevels();
    return '<p class="panel-intro">Welcome to FRUIT SLASH.</p>';
  }
  renderShop(panelName) {
    const categories = panelName === 'shop' ? ['blades','backgrounds','effects','powerups','themes'] : [panelName];
    const category = this.category;
    const tabs = panelName === 'shop' ? `<div class="category-tabs">${categories.map(c=>`<button data-shop-category="${c}" class="${category===c?'active':''}">${ICONS[c]} ${c.toUpperCase()}</button>`).join('')}</div>` : '';
    const items = getShopItems(category);
    const ownedMap = {blades:this.save.unlockedBlades,backgrounds:this.save.unlockedBackgrounds,effects:this.save.unlockedEffects,themes:this.save.unlockedThemes};
    const selected = {blades:this.save.equippedBlade,backgrounds:this.save.equippedBackground,effects:this.save.equippedEffect,themes:this.save.equippedTheme};
    const cards = items.map(item => {
      const owned = category === 'powerups' ? false : (ownedMap[category] || []).includes(item.id);
      const equipped = selected[category] === item.id;
      const inventory = this.save.powerupInventory?.[item.id] || 0;
      const art = category==='blades' ? '⚔️' : category==='backgrounds' ? '🌄' : category==='effects' ? '✨' : category==='powerups' ? (item.icon || '⚡') : '🎨';
      let button = '';
      if (category === 'powerups') button = `<button class="mini-button" data-buy-item data-category="${category}" data-id="${item.id}">BUY · ${item.cost} 🪙</button>`;
      else if (equipped) button = '<span class="item-equipped">✓ EQUIPPED</span>';
      else if (owned) button = `<button class="mini-button" data-buy-item data-category="${category}" data-id="${item.id}">EQUIP</button>`;
      else button = `<button class="mini-button" data-buy-item data-category="${category}" data-id="${item.id}">${item.cost===0?'UNLOCK':'BUY · '+item.cost+' 🪙'}</button>`;
      return `<article class="shop-item"><div class="item-art">${art}</div><strong class="item-name">${item.name}</strong><span class="item-desc">${category==='powerups' ? `${item.description} · Owned: ${inventory}` : (item.description || item.unlock || (item.cost===0?'Starter item':'Unlock to equip'))}</span><div class="item-bottom"><span class="item-cost">${category==='powerups' ? `× ${inventory}` : (owned?'OWNED':item.cost===0?'FREE':`${item.cost} 🪙`)}</span>${button}</div></article>`;
    }).join('');
    return `<p class="panel-intro">Unlock new looks with coins earned in play. Every blade is cosmetic, so your score always depends on your skill.</p>${tabs}<div class="item-grid">${cards}</div>`;
  }
  renderMissions() {
    const missions = dailyMissions();
    return `<p class="panel-intro">Your missions refresh each day. Complete an objective and claim your coin reward.</p>${missions.map(m=>{
      const progress=missionProgress(this.save,m), claimed=isMissionClaimed(this.save,m.id), pct=Math.min(100,progress/m.goal*100);
      return `<article class="mission-card"><div class="mission-top"><strong>${m.title}</strong><span>🪙 +${m.reward}</span></div><p>${m.desc}</p><div class="progress-track"><i style="width:${pct}%"></i></div><div class="mission-foot"><span>${progress.toLocaleString()} / ${m.goal.toLocaleString()}</span>${claimed?'<b class="item-equipped">✓ CLAIMED</b>':progress>=m.goal?`<button class="mini-button" data-claim-mission="${m.id}">CLAIM</button>`:'IN PROGRESS'}</div></article>`;
    }).join('')}`;
  }
  renderAchievements() {
    const icons=['🍓','🍉','👑','💣','🎯','🌟','⚔','🏆','🔥','✨'];
    return `<p class="panel-intro">Long-term goals that reward dedication. Your progress is saved on this device.</p>${ACHIEVEMENTS.map((a,i)=>{
      const value=achievementProgress(this.save,a), claimed=!!this.save.achievements[a.id],pct=Math.min(100,value/a.goal*100);
      return `<article class="achievement-card"><div class="achievement-icon">${icons[i]}</div><div class="achievement-details"><strong>${a.name}</strong><p>${a.desc}</p><div class="progress-track"><i style="width:${pct}%"></i></div></div><div class="achievement-value">${claimed?'✓':`${value}/${a.goal}`}<br>🪙 ${a.reward}</div></article>`;
    }).join('')}`;
  }
  renderStats() {
    const s=this.save, st=s.stats||{};
    const rows=[['HIGHEST SCORE',s.bestScore],['TOTAL SCORE',s.totalScore],['FRUITS SLICED',s.totalFruits],['TOTAL COMBOS',s.totalCombos],['LEVELS CLEARED',s.totalLevels],['BEST ACCURACY',`${s.bestAccuracy||0}%`],['BOMBS AVOIDED',s.bombsAvoided],['PLAY TIME',formatTime(s.totalPlaySeconds)],['BEST COMBO',st.highestCombo||0],['PERFECT SLICES',st.perfectSlices||0],['GAMES PLAYED',st.gamesPlayed||0],['HIGHEST LEVEL',s.highestLevel]];
    return `<p class="panel-intro">A snapshot of your slicing career.</p><div class="stat-grid">${rows.map(([label,val])=>`<div class="stat-card"><small>${label}</small><strong>${typeof val==='number'?val.toLocaleString():val}</strong></div>`).join('')}</div>`;
  }
  renderSettings() {
    const s=this.save.settings;
    const toggle=(key,label,desc)=>`<div class="setting-row"><div><strong>${label}</strong><small>${desc}</small></div><button class="toggle ${s[key]?'on':''}" data-setting="${key}" aria-label="Toggle ${label}"></button></div>`;
    const range=(key,label)=>`<div class="setting-row"><div><strong>${label}</strong></div><input class="range-input" type="range" min="0" max="1" step=".05" value="${s[key]}" data-volume="${key}"></div>`;
    return `<p class="panel-intro">Tune the arcade experience. Settings are saved automatically.</p>${toggle('sound','Sound Effects','Slicing, combos and arcade sounds')}${toggle('music','Background Music','Light looping arcade tones')}${toggle('vibration','Vibration','Haptic feedback where supported')}<div style="height:8px"></div>${range('masterVolume','Master Volume')}${range('effectsVolume','Effects Volume')}${range('musicVolume','Music Volume')}`;
  }
  renderHelp() {
    const steps=[['SWIPE TO SLICE','Drag your finger across flying fruits. A single swipe can cut several fruits at once.'],['AVOID THE BOMBS','Never swipe through a bomb. Bombs remove lives in Classic and can end your run.'],['BUILD COMBOS','Slice multiple fruits in a row to earn combo bonuses and bigger scores.'],['SPECIAL FRUITS','Golden fruits grant extra points. Rainbow, Freeze, Time and Frenzy fruits trigger bonus effects.'],['POWER-UPS','Use the power buttons during a run. Buy extra charges in the Shop.'],['KEEP PROGRESSING','Complete level targets to earn coins and unlock new blades and worlds. Levels are generated endlessly.']];
    return `<p class="panel-intro">A sharp blade and quick reflexes are all you need.</p>${steps.map((s,i)=>`<div class="help-step"><span>${i+1}</span><div><strong>${s[0]}</strong><p>${s[1]}</p></div></div>`).join('')}`;
  }
  renderLevels() {
    const current=this.save.level, highest=this.save.highestLevel;
    const start=Math.max(1,Math.floor((current-1)/32)*32+1);
    let cells='';
    for(let n=start;n<start+32;n++) cells+=`<button class="level-cell ${n===current?'current':''}" data-level="${n}" ${n>highest?'disabled':''}>${n}</button>`;
    return `<p class="panel-intro">Select a level you have already reached. New stages unlock as you complete level targets.</p><div class="level-list">${cells}</div>`;
  }
  updateHud(data) {
    $('hud-score').textContent=data.score.toLocaleString(); $('hud-best').textContent=Math.max(data.best,this.save.bestScore).toLocaleString();
    $('hud-level').textContent=data.level; $('hud-target').textContent=`${data.score.toLocaleString()} / ${data.target.toLocaleString()}`;
    $('hud-objective').textContent=(data.mode==='challenge'?data.objective:'SLICE FRUIT · AVOID BOMBS').toUpperCase();
    $('target-progress').style.width=`${Math.min(100,data.score/data.target*100)}%`;
    const lives=$('hud-lives'); const timer=$('hud-timer');
    if(data.mode==='arcade'||data.mode==='challenge'){lives.classList.add('hidden');timer.classList.remove('hidden');timer.textContent=Math.ceil(data.timer||0);}
    else {timer.classList.add('hidden');lives.classList.toggle('hidden',data.mode==='zen');lives.textContent='♥ '.repeat(Math.max(0,data.lives)).trim();}
    for(const b of document.querySelectorAll('[data-power]')){
      const id=b.dataset.power;const count=this.save.powerupInventory?.[id]||0;
      b.classList.toggle('active',(data.powerups?.[id]||0)>0);
      const small=b.querySelector('small');const labels={freeze:'Freeze',double:'Double',frenzy:'Frenzy',slow:'Slow',mega:'Mega',life:'Life',blade:'Blade'};if(small)small.textContent=(data.powerups?.[id]||0)>0?`${Math.ceil(data.powerups[id])}s`:`${labels[id]||id} · ${count}`;
      const unavailable = id==='life' && !['classic','challenge','survival'].includes(data.mode);
      b.disabled=unavailable || (count<=0&&(data.powerups?.[id]||0)<=0);
      b.style.opacity=b.disabled?'.45':'1';
    }
  }
  showCombo(info) {
    const el=$('combo-toast');el.textContent=info.count>=2?`${info.label} ×${info.count}  +${info.bonus}`:'';
    el.classList.add('show');clearTimeout(this.comboTimer);this.comboTimer=setTimeout(()=>el.classList.remove('show'),850);
  }
  showResult(data, completed) {
    this.hud.classList.add('hidden');this.pause.classList.add('hidden');this.panel.classList.add('hidden');this.main.classList.add('hidden');this.result.classList.remove('hidden');
    $('result-icon').textContent=completed?'🏆':'💥';$('result-eyebrow').textContent=completed?'LEVEL COMPLETE':'RUN FINISHED';$('result-title').textContent=completed?'LEVEL CLEARED!':'GAME OVER';
    $('result-score').textContent=data.score.toLocaleString();
    const stars=completed?(data.stars||1):0;
    $('result-stars').innerHTML=[0,1,2].map(i=>`<span class="${i<stars?'earned':''}">★</span>`).join(' ');
    const rows=[['FRUITS SLICED',data.fruitsSliced],['BEST COMBO',data.bestCombo],['PERFECT SLICES',data.perfectSlices],['BOMB HITS',data.bombHits],['ACCURACY',`${data.accuracy||0}%`],['LEVEL',data.level]];
    $('result-grid').innerHTML=rows.map(([l,v])=>`<div class="result-stat"><small>${l}</small><b>${(v??0).toLocaleString?.()??v}</b></div>`).join('');
    $('reward-row').innerHTML=completed?`🪙 +${data.rewardCoins||0} <span>💎 +${data.rewardGems||0}</span>`:`🪙 +${data.coinsEarned||0}`;
    const next=document.querySelector('[data-action="next"]');next.classList.toggle('hidden',!completed);next.disabled=!completed;
    document.querySelector('[data-action="retry"]').textContent='RETRY';
  }
  showToast(message) {
    const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>el.classList.remove('show'),1900);
  }
}

function formatTime(seconds=0){const s=Math.max(0,Math.floor(seconds));return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;}
