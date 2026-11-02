export const POWERUPS = [
  { id:'freeze', name:'Freeze Time', icon:'❄', cost:35, duration:4.5, description:'Slow the action for a moment.' },
  { id:'double', name:'Double Points', icon:'×2', cost:45, duration:8, description:'Double every fruit score.' },
  { id:'frenzy', name:'Frenzy Mode', icon:'⚡', cost:55, duration:5, description:'Trigger a bonus fruit wave.' },
  { id:'slow', name:'Slow Motion', icon:'◷', cost:40, duration:6, description:'Make fast waves easier to read.' },
  { id:'mega', name:'Mega Combo', icon:'✦', cost:70, duration:7, description:'Combo bonuses are boosted.' },
  { id:'life', name:'Extra Life', icon:'♥', cost:90, duration:0, description:'Gain one extra life.' },
  { id:'blade', name:'Special Blade', icon:'⚔', cost:85, duration:7, description:'Temporary rainbow blade trail.' }
];

export function createPowerupState() {
  return { freeze:0, double:0, frenzy:0, slow:0, mega:0, blade:0 };
}

export function activatePowerup(state, id) {
  const item = POWERUPS.find(p => p.id === id);
  if (!item || state[id] > 0) return false;
  state[id] = item.duration;
  return true;
}

export function updatePowerups(state, dt) {
  for (const key of Object.keys(state)) state[key] = Math.max(0, state[key] - dt);
}
