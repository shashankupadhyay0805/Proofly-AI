export function computeRecommendedDifficulty(recentStepOutcomes) {
  // recentStepOutcomes: boolean[] (true=correct, false=incorrect)
  const arr = Array.isArray(recentStepOutcomes) ? recentStepOutcomes : [];
  if (!arr.length) return 'easy';

  const window = arr.slice(-8);
  const correct = window.filter(Boolean).length;
  const accuracy = correct / window.length;

  if (accuracy >= 0.8 && window.length >= 5) return 'hard';
  if (accuracy >= 0.55) return 'medium';
  return 'easy';
}

