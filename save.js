const KEY = 'gamerkie-fruit-slash-save';
const VERSION = 1;

export function defaultSave() {
  return {
    version: VERSION,
    level: 1,
    highestLevel: 1,
    coins: 120,
    gems: 5,
    bestScore: 0,
    totalScore: 0,
    totalFruits: 0,
    totalCombos: 0,
    totalLevels: 0,
    bestAccuracy: 0,
    bombsAvoided: 0,
    totalPlaySeconds: 0,
    unlockedBlades: ['classic'],
    equippedBlade: 'classic',
    unlockedBackgrounds: ['dojo'],
    equippedBackground: 'dojo',
    unlockedEffects: ['classic'],
    equippedEffect: 'classic',
    powerupInventory: { freeze:2, double:2, frenzy:1, slow:1, mega:1, life:1, blade:1 },
    unlockedThemes: ['mint'],
    equippedTheme: 'mint',
    achievements: {},
    missionState: {},
    stats: { gamesPlayed: 0, perfectSlices: 0, bombHits: 0, highestCombo: 0, goldenFruits: 0 },
    settings: { sound: true, music: true, masterVolume: 0.65, effectsVolume: 0.75, musicVolume: 0.35, vibration: true }
  };
}

export function loadSave(storage = globalThis.localStorage) {
  const fallback = defaultSave();
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== VERSION || typeof parsed !== 'object') return fallback;
    return mergeSafe(fallback, parsed);
  } catch {
    return fallback;
  }
}

export function writeSave(save, storage = globalThis.localStorage) {
  try {
    if (!storage) return false;
    storage.setItem(KEY, JSON.stringify({ ...save, version: VERSION }));
    return true;
  } catch {
    return false;
  }
}

export function mergeSafe(base, source) {
  const result = structuredCloneSafe(base);
  for (const [key, value] of Object.entries(source)) {
    if (key === 'version') continue;
    if (value && typeof value === 'object' && !Array.isArray(value) && result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      result[key] = { ...result[key], ...value };
    } else if (value !== undefined && typeof value === typeof result[key]) {
      result[key] = Array.isArray(value) ? value.slice() : value;
    }
  }
  result.version = VERSION;
  result.level = Math.max(1, Math.floor(Number(result.level) || 1));
  result.highestLevel = Math.max(result.level, Math.floor(Number(result.highestLevel) || 1));
  result.coins = Math.max(0, Math.floor(Number(result.coins) || 0));
  result.gems = Math.max(0, Math.floor(Number(result.gems) || 0));
  return result;
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}
