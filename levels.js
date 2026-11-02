import { getDifficulty, getDifficultyBand } from './difficulty.js';

const objectives = [
  'Reach the score target', 'Slice a 3-fruit combo', 'Avoid every bomb',
  'Land 5 perfect slices', 'Slice 18 fruits', 'Build a 5-fruit combo',
  'Score with special fruit'
];

export function generateLevel(level = 1, seed = Date.now()) {
  const n = Math.max(1, Math.floor(Number(level) || 1));
  const d = getDifficulty(n);
  const random = mulberry32((Number(seed) + n * 2654435761) >>> 0);
  const objectiveIndex = Math.floor(random() * objectives.length);
  const fruitPoolSize = Math.min(20, 5 + Math.floor(Math.log2(n + 1) * 2));
  const pattern = Array.from({ length: 4 + Math.min(8, Math.floor(n / 12)) }, (_, i) => ({
    offset: i * d.spawnInterval * 0.7,
    count: Math.max(1, Math.min(7, 2 + Math.floor(random() * d.groupSize))),
    spread: 0.35 + random() * 0.5,
    includeSpecial: n >= 8 && random() > 0.72
  }));
  return {
    number: n,
    band: getDifficultyBand(n),
    targetScore: d.targetScore,
    fruitSpeed: d.fruitSpeed,
    spawnInterval: d.spawnInterval,
    bombProbability: d.bombChance,
    fruitPoolSize,
    pattern,
    objective: objectives[objectiveIndex],
    rewardCoins: 18 + Math.min(250, Math.floor(n * 2.2)),
    rewardGems: n % 10 === 0 ? 2 + Math.floor(n / 100) : 0,
    gravity: d.gravity
  };
}

export function nextLevel(level) {
  return generateLevel(Math.max(1, Math.floor(level)) + 1);
}

function mulberry32(a) {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
