/**
 * Normalize a Quality Gate category score to the 0–10 scale.
 * Handles AI responses that mistakenly use 0–100 for category scores.
 */
export function normalizeCategoryScore(score: number): number {
  if (score > 10 && score <= 100) {
    return score / 10;
  }
  return Math.max(0, Math.min(10, score));
}

/** Format a 0–10 category score for display (e.g. "6/10", "5.5/10"). */
export function formatScore(score: number): string {
  const normalized = normalizeCategoryScore(score);
  const rounded = Math.round(normalized * 10) / 10;
  const formatted = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${formatted}/10`;
}

export function getCategoryScoreColor(score: number): 'green' | 'orange' | 'red' {
  const normalized = normalizeCategoryScore(score);
  if (normalized >= 7) return 'green';
  if (normalized >= 5) return 'orange';
  return 'red';
}

export function getCategoryProgressWidth(score: number): number {
  return normalizeCategoryScore(score) * 10;
}
