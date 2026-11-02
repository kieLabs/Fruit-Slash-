export function getDifficulty(level = 1, elapsed = 0) {
  const n = Math.max(1, Math.floor(Number(level) || 1));
  const tier = Math.log2(n + 1);
  return {
    fruitSpeed: Math.min(1.95, 1 + tier * 0.095 + Math.min(elapsed, 300) * 0.0008),
    spawnInterval: Math.max(0.54, 1.58 - tier * 0.075 - Math.min(elapsed, 300) * 0.0012),
    bombChance: Math.min(0.24, Math.max(0, 0.035 + tier * 0.014)),
    groupSize: Math.min(7, 2 + Math.floor(tier / 1.55)),
    targetScore: Math.round(450 + Math.pow(n, 0.78) * 78),
    gravity: 760 + Math.min(tier * 18, 190)
  };
}

export function getDifficultyBand(level = 1) {
  const n = Math.max(1, Math.floor(level));
  if (n <= 10) return 'Rookie';
  if (n <= 25) return 'Rising';
  if (n <= 50) return 'Skilled';
  if (n <= 100) return 'Expert';
  if (n <= 250) return 'Master';
  if (n <= 500) return 'Legend';
  return 'Endless';
}
