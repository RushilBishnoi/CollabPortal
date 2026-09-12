import { describe, it, expect } from 'vitest';

export function calculatePercentageScore(earnedPoints: number, totalPoints: number): number {
  if (totalPoints <= 0) return 0;
  return Math.round((earnedPoints / totalPoints) * 100 * 10) / 10;
}

export function isPassingScore(score: number, passingThreshold: number): boolean {
  return score >= passingThreshold;
}

export function formatRemainingTimer(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const m = Math.floor(safeSeconds / 60);
  const s = safeSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function computeAnsweredProgress(
  selectedMap: Record<string, string>,
  totalQuestions: number,
): { answered: number; total: number; percent: number } {
  const answered = Object.keys(selectedMap).length;
  const percent = totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0;
  return { answered, total: totalQuestions, percent };
}

describe('Frontend Assessment Engine Utilities', () => {
  it('should calculate percentage score correctly', () => {
    expect(calculatePercentageScore(4, 5)).toBe(80);
    expect(calculatePercentageScore(7, 10)).toBe(70);
    expect(calculatePercentageScore(0, 5)).toBe(0);
    expect(calculatePercentageScore(0, 0)).toBe(0);
  });

  it('should evaluate pass/fail criteria accurately against threshold', () => {
    expect(isPassingScore(70, 70)).toBe(true);
    expect(isPassingScore(85, 70)).toBe(true);
    expect(isPassingScore(69.9, 70)).toBe(false);
  });

  it('should format countdown timer to MM:SS string correctly', () => {
    expect(formatRemainingTimer(900)).toBe('15:00');
    expect(formatRemainingTimer(65)).toBe('01:05');
    expect(formatRemainingTimer(9)).toBe('00:09');
    expect(formatRemainingTimer(0)).toBe('00:00');
    expect(formatRemainingTimer(-10)).toBe('00:00');
  });

  it('should compute answered progress percentage accurately', () => {
    const map = { 'q-1': 'opt-1', 'q-2': 'opt-3' };
    const progress = computeAnsweredProgress(map, 4);
    expect(progress.answered).toBe(2);
    expect(progress.total).toBe(4);
    expect(progress.percent).toBe(50);
  });
});
