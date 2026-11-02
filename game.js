import { GameEngine } from './engine.js';
import { GameUI } from './ui.js';
import { AudioManager } from './audio.js';
import { loadSave, writeSave } from './save.js';
import { BLADES } from './blades.js';
import { BACKGROUNDS, getShopItems, purchaseItem } from './shop.js';
import { dailyMissions, addMissionProgress, claimMission, ACHIEVEMENTS, achievementProgress } from './missions.js';

let save = loadSave();
const ui = new GameUI(save);
const audio = new AudioManager(save.settings);
const canvas = document.getElementById('game-canvas');
let selectedMode = 'classic';
let currentLevel = save.level;
let finalized = false;
let toastAchievementQueue = [];
let autosaveClock = 0;

const engine = new GameEngine(canvas, onEngineEvent, save, audio);
ui.updateWallet();
document.documentElement.dataset.theme = save.equippedTheme || 'mint';

function persist() {
  document.documentElement.dataset.theme = save.equippedTheme || 'mint';
  writeSave(save);
  ui.setSave(save);
  audio.setSettings(save.settings);
}

function onEngineEvent(type, data) {
  if (type === 'start') {
    currentLevel = data.level; finalized = false;
    save.stats.gamesPlayed = (save.stats.gamesPlayed || 0) + 1;
    persist(); ui.showGame(); ui.updateHud(data);
    return;
  }
  if (type === 'tick') {
    ui.updateHud(data);
    autosaveClock += 0.1;
    if (autosaveClock >= 2) { autosaveClock = 0; persist(); }
    return;
  }
  if (type === 'pause') { ui.showPause(); return; }
  if (type === 'resume') { ui.hidePause(); return; }
  if (type === 'combo') {
    ui.showCombo(data);
    if (data.count === 2) addMissionProgress(save, 'combos', 1);
    save.stats.highestCombo = Math.max(save.stats.highestCombo || 0, data.count);
    persist();
    return;
  }
  if (type === 'slice') {
    addMissionProgress(save, 'fruits', 1);
    addMissionProgress(save, 'score', data.points || 0);
    if (data.perfect) addMissionProgress(save, 'perfect', 1);
    if (data.fruit.special === 'golden') addMissionProgress(save, 'golden', 1);
    if (save.settings.vibration && navigator.vibrate) navigator.vibrate(data.perfect ? 14 : 7);
    if (data.fruit.special) ui.showToast(`${data.fruit.special.toUpperCase()} FRUIT · +${data.points}`);
    return;
  }
  if (type === 'special') {
    const labels = {golden:'GOLDEN BONUS',rainbow:'MULTIPLIER UP',time:'+5 SECONDS',freeze:'TIME FROZEN',frenzy:'FRUIT FRENZY',double:'DOUBLE POINTS'};
    ui.showToast(labels[data.type] || 'SPECIAL FRUIT'); return;
  }
  if (type === 'powerup') { ui.showToast(`${data.id.toUpperCase()} ACTIVATED`); return; }
  if (type === 'bomb') { if (save.settings.vibration && navigator.vibrate) navigator.vibrate(45); ui.showToast(`BOMB HIT · -${data.penalty} LIFE${data.penalty>1?'S':''}`); return; }
  if (type === 'complete') {
    finalizeRun(data, true);
    return;
  }
  if (type === 'gameover') {
    finalizeRun(data, false);
    return;
  }
}

function finalizeRun(data, completed) {
  if (finalized) return;
  finalized = true;
  const accuracy = Math.max(0, Math.min(100, Number(data.accuracy) || 0));
  save.totalScore += data.score;
  save.totalFruits += data.fruitsSliced;
  save.totalCombos += Math.max(0, data.bestCombo - 1);
  save.bestScore = Math.max(save.bestScore, data.score);
  save.bestAccuracy = Math.max(save.bestAccuracy || 0, accuracy);
  save.bombsAvoided += data.bombsAvoided;
  save.stats.perfectSlices = (save.stats.perfectSlices || 0) + data.perfectSlices;
  save.stats.bombHits = (save.stats.bombHits || 0) + data.bombHits;
  save.stats.goldenFruits = (save.stats.goldenFruits || 0) + data.goldenFruits;
  save.stats.highestCombo = Math.max(save.stats.highestCombo || 0, data.bestCombo);
  save.totalPlaySeconds += Math.round(data.elapsed || 0);

  let coinsEarned = data.coinsEarned || 0;
  if (completed) {
    coinsEarned += data.rewardCoins || 0;
    save.coins += (data.rewardCoins || 0) + (data.coinsEarned || 0);
    save.gems += data.rewardGems || 0;
    save.totalLevels += 1;
    save.level = Math.max(save.level, data.level + 1);
    save.highestLevel = Math.max(save.highestLevel, save.level);
    addMissionProgress(save, 'levels', 1);
  } else {
    const reward = Math.floor(data.fruitsSliced / 8) + Math.floor(data.score / 500) + coinsEarned;
    coinsEarned = reward;
    save.coins += reward;
  }

  checkAchievements();
  persist();
  ui.showResult({ ...data, accuracy, coinsEarned }, completed);
  ui.updateWallet();
}

function checkAchievements() {
  for (const achievement of ACHIEVEMENTS) {
    if (!save.achievements[achievement.id] && achievementProgress(save, achievement) >= achievement.goal) {
      save.achievements[achievement.id] = true;
      save.coins += achievement.reward;
      toastAchievementQueue.push(`${achievement.name} unlocked · +${achievement.reward} coins`);
    }
  }
  if (toastAchievementQueue.length) {
    setTimeout(() => ui.showToast(toastAchievementQueue.shift()), 400);
  }
}

function startGame(mode = selectedMode, level = save.level) {
  selectedMode = mode; currentLevel = level;
  engine.start(mode, level);
}

function openPanel(name) {
  if (!document.getElementById('pause-screen').classList.contains('hidden')) {
    // Panel opened from the pause layer; return there when closed.
    window.panelReturnToPause = true;
  } else window.panelReturnToPause = false;
  ui.showPanel(name);
}

function handleAction(action, button) {
  switch (action) {
    case 'play': startGame(selectedMode, save.level); break;
    case 'pause': engine.pause(); break;
    case 'resume': engine.resume(); break;
    case 'restart': startGame(selectedMode, currentLevel); break;
    case 'menu': engine.stop(); ui.showMenu(); break;
    case 'next': startGame(selectedMode, save.level); break;
    case 'retry': startGame(selectedMode, currentLevel); break;
    case 'settings': openPanel('settings'); break;
    case 'help': openPanel('help'); break;
    case 'close-panel':
      if (window.panelReturnToPause) {
        document.getElementById('panel-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.remove('hidden');
        window.panelReturnToPause = false;
      } else ui.closePanel();
      break;
    case 'fullscreen': toggleFullscreen(); break;
    default: break;
  }
}

async function toggleFullscreen() {
  const target = document.getElementById('game-frame');
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (target.requestFullscreen) await target.requestFullscreen();
    else ui.showToast('Fullscreen is not supported in this browser.');
  } catch { ui.showToast('Fullscreen could not be started.'); }
}

function buyItem(category, id) {
  const item = getShopItems(category).find(x => x.id === id);
  if (!item) return;
  const result = purchaseItem(save, category, item);
  if (!result.ok) { ui.showToast(result.reason); return; }
  checkAchievements();
  persist();
  ui.showPanel(window.currentPanelName || 'shop', category);
  ui.showToast(result.consumable ? `${item.name} added to inventory.` : result.purchased ? `${item.name} unlocked.` : `${item.name} equipped.`);
}

// Menu and modal action routing.
document.addEventListener('click', event => {
  const modeButton = event.target.closest('[data-mode]');
  if (modeButton) {
    selectedMode = modeButton.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(el => el.classList.toggle('selected', el === modeButton));
    return;
  }
  const actionButton = event.target.closest('[data-action]');
  if (actionButton) { handleAction(actionButton.dataset.action, actionButton); return; }
  const panelButton = event.target.closest('[data-panel]');
  if (panelButton) {
    const name = panelButton.dataset.panel;
    window.currentPanelName = name;
    openPanel(name); return;
  }
  const categoryButton = event.target.closest('[data-shop-category]');
  if (categoryButton) {
    const category = categoryButton.dataset.shopCategory;
    ui.showPanel('shop', category); window.currentPanelName = 'shop'; return;
  }
  const buyButton = event.target.closest('[data-buy-item]');
  if (buyButton) { buyItem(buyButton.dataset.category,buyButton.dataset.id); return; }
  const claimButton = event.target.closest('[data-claim-mission]');
  if (claimButton) {
    const mission = dailyMissions().find(m => m.id === claimButton.dataset.claimMission);
    if (mission && claimMission(save,mission)) { persist(); ui.showPanel('missions'); ui.showToast(`Mission complete · +${mission.reward} coins`); }
    return;
  }
  const levelButton = event.target.closest('[data-level]');
  if (levelButton && !levelButton.disabled) { startGame('classic',Number(levelButton.dataset.level)); return; }
  const settingButton = event.target.closest('[data-setting]');
  if (settingButton) {
    const key=settingButton.dataset.setting;save.settings[key]=!save.settings[key];persist();ui.showPanel('settings');return;
  }
  const powerButton = event.target.closest('[data-power]');
  if (powerButton) {
    const id=powerButton.dataset.power;save.powerupInventory ||= {};
    const remaining=save.powerupInventory[id]||0;
    if (remaining<=0) { ui.showToast('No charges left. Visit the Shop.'); return; }
    if (engine.activatePowerup(id)) { save.powerupInventory[id]=remaining-1;persist(); }
    return;
  }
});

document.addEventListener('input', event => {
  const input=event.target.closest('[data-volume]');
  if (!input) return;
  save.settings[input.dataset.volume]=Number(input.value);
  persist();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && engine.running && !engine.paused) engine.pause();
  if ((event.key === ' ' || event.key === 'Enter') && document.activeElement === document.body && !engine.running) startGame(selectedMode,save.level);
});

document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('visibilitychange', () => {
  if (document.hidden && engine.running && !engine.paused) engine.pause();
});
window.addEventListener('beforeunload', () => { persist(); engine.destroy(); });

// Preserve the selected collection tab when refreshing its own panel.
window.currentPanelName = 'shop';
window.addEventListener('error', event => {
  console.error('Fruit Slash runtime error:', event.error || event.message);
  ui.showToast('A game error occurred. Refresh to recover.');
});
