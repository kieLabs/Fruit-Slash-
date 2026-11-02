export const ACHIEVEMENTS = [
  {id:'first-slice',name:'First Slice',desc:'Slice your first fruit.',goal:1,stat:'totalFruits',reward:25},
  {id:'fruit-master',name:'Fruit Master',desc:'Slice 500 fruits.',goal:500,stat:'totalFruits',reward:150},
  {id:'combo-king',name:'Combo King',desc:'Reach a 7-fruit combo.',goal:7,stat:'highestCombo',reward:125},
  {id:'bomb-dodger',name:'Bomb Dodger',desc:'Avoid 50 bombs.',goal:50,stat:'bombsAvoided',reward:100},
  {id:'perfect-slicer',name:'Perfect Slicer',desc:'Land 100 perfect slices.',goal:100,stat:'perfectSlices',reward:150},
  {id:'golden-hunter',name:'Golden Hunter',desc:'Slice 20 golden fruits.',goal:20,stat:'goldenFruits',reward:180},
  {id:'blade-collector',name:'Blade Collector',desc:'Unlock all 10 blades.',goal:10,stat:'bladeCount',reward:300},
  {id:'level-master',name:'Level Master',desc:'Complete 25 levels.',goal:25,stat:'totalLevels',reward:200},
  {id:'endless-champion',name:'Endless Champion',desc:'Score 10,000 points in one game.',goal:10000,stat:'bestScore',reward:250},
  {id:'legendary-ninja',name:'Legendary Ninja',desc:'Reach level 100.',goal:100,stat:'highestLevel',reward:500}
];

export function dailyMissions(date = new Date()) {
  const day = date.getDate();
  const pool = [
    {id:'slice-40',title:'Fruit Fan',desc:'Slice 40 fruits',stat:'fruits',goal:40,reward:35},
    {id:'combo-5',title:'Combo Starter',desc:'Make 5 combos',stat:'combos',goal:5,reward:40},
    {id:'score-1500',title:'Score Hunter',desc:'Score 1,500 points',stat:'score',goal:1500,reward:45},
    {id:'perfect-6',title:'Sharp Blade',desc:'Make 6 perfect slices',stat:'perfect',goal:6,reward:40},
    {id:'level-1',title:'Level Up',desc:'Complete 1 level',stat:'levels',goal:1,reward:55},
    {id:'gold-2',title:'Golden Touch',desc:'Slice 2 golden fruits',stat:'golden',goal:2,reward:60}
  ];
  return [pool[day % pool.length], pool[(day + 2) % pool.length], pool[(day + 4) % pool.length]];
}

export function ensureDailyState(save, date = new Date()) {
  const stamp = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
  if (save.missionState.date !== stamp) save.missionState = { date:stamp, progress:{}, claimed:[] };
  return save.missionState;
}

export function addMissionProgress(save, stat, amount = 1) {
  const state = ensureDailyState(save);
  state.progress[stat] = (state.progress[stat] || 0) + amount;
}

export function missionProgress(save, mission) {
  const state = ensureDailyState(save);
  return Math.min(mission.goal, state.progress[mission.stat] || 0);
}

export function isMissionClaimed(save, missionId) {
  return ensureDailyState(save).claimed.includes(missionId);
}

export function claimMission(save, mission) {
  const state = ensureDailyState(save);
  if (state.claimed.includes(mission.id) || missionProgress(save, mission) < mission.goal) return false;
  state.claimed.push(mission.id); save.coins += mission.reward; return true;
}

export function achievementProgress(save, achievement) {
  if (achievement.stat === 'bladeCount') return Math.min(achievement.goal, (save.unlockedBlades || []).length);
  const stats = { ...save, ...save.stats };
  return Math.min(achievement.goal, Number(stats[achievement.stat] || 0));
}
