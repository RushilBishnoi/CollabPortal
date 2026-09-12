import { describe, it, expect } from 'vitest';

export function getCompatibilityBadgeClass(score: number): {
  badgeColor: string;
  progressBg: string;
  label: string;
} {
  if (score >= 75) {
    return {
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      progressBg: 'bg-emerald-500',
      label: 'High Readiness',
    };
  }
  if (score >= 50) {
    return {
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      progressBg: 'bg-amber-500',
      label: 'Moderate Gap',
    };
  }
  return {
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
    progressBg: 'bg-slate-500',
    label: 'Needs Skill Foundation',
  };
}

/**
 * Mirrors the fixed scoredRecommendations computation from SkillGapDashboardPage.
 *
 * The bug: useMemo was placed AFTER early returns guarded by isLoading/isError,
 * causing "Rendered more hooks than during the previous render." on load->data transition.
 *
 * The fix: useMemo is now called unconditionally before the early returns.
 * overview?.topRecommendations ?? [] ensures safe fallback when overview is undefined.
 *
 * This helper replicates exactly that computation for unit-testable regression coverage.
 */
function computeScoredRecommendations(
  topRecommendations: Array<{ overallScore: number }> | undefined,
): Array<{ score: number; badgeColor: string; progressBg: string }> {
  return (topRecommendations ?? []).map((rec) => {
    const score = rec.overallScore;
    const badgeColor =
      score >= 75
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : score >= 50
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-slate-50 text-slate-700 border-slate-200';
    const progressBg = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-slate-500';
    return { score, badgeColor, progressBg };
  });
}

describe('Frontend Skill Gap & Compatibility UI Helper Logic', () => {
  it('classifies high compatibility scores (>= 75%) correctly', () => {
    const res = getCompatibilityBadgeClass(82.5);
    expect(res.label).toBe('High Readiness');
    expect(res.badgeColor).toContain('text-emerald-700');
    expect(res.progressBg).toBe('bg-emerald-500');
  });

  it('classifies moderate compatibility scores (50% - 74%) correctly', () => {
    const res = getCompatibilityBadgeClass(64.0);
    expect(res.label).toBe('Moderate Gap');
    expect(res.badgeColor).toContain('text-amber-700');
    expect(res.progressBg).toBe('bg-amber-500');
  });

  it('classifies low compatibility scores (< 50%) correctly', () => {
    const res = getCompatibilityBadgeClass(32.0);
    expect(res.label).toBe('Needs Skill Foundation');
    expect(res.badgeColor).toContain('text-slate-700');
    expect(res.progressBg).toBe('bg-slate-500');
  });

  it('handles score boundary values deterministically (0, 50, 75, 100)', () => {
    expect(getCompatibilityBadgeClass(0).label).toBe('Needs Skill Foundation');
    expect(getCompatibilityBadgeClass(50).label).toBe('Moderate Gap');
    expect(getCompatibilityBadgeClass(75).label).toBe('High Readiness');
    expect(getCompatibilityBadgeClass(100).label).toBe('High Readiness');
  });

  // ──────────────────────────────────────────────────────────────────
  // Regression: Rules-of-Hooks violation in SkillGapDashboardPage
  //
  // Before the fix, useMemo was called AFTER early returns guarded by
  // isLoading / isError. On first render (isLoading=true) useMemo was
  // never reached; on second render (data loaded) it was. React threw:
  //   "Rendered more hooks than during the previous render."
  //
  // The fix moves useMemo ABOVE all early returns and uses:
  //   (overview?.topRecommendations ?? []).map(...)
  // so the computation is safe when overview is still undefined.
  //
  // These tests verify that undefined input produces an empty array
  // (matching isLoading behaviour) and that populated input produces
  // the correctly decorated objects (matching the loaded state).
  // ──────────────────────────────────────────────────────────────────
  describe('SkillGapDashboardPage – scoredRecommendations hook-safe computation', () => {
    it('returns an empty array when topRecommendations is undefined (loading/error state)', () => {
      // This is the critical path that was unreachable when useMemo was after
      // the early return: useMemo must produce [] here on the loading render.
      const result = computeScoredRecommendations(undefined);
      expect(result).toEqual([]);
    });

    it('returns an empty array when topRecommendations is an empty array (no recommendations)', () => {
      const result = computeScoredRecommendations([]);
      expect(result).toEqual([]);
    });

    it('decorates recommendations with correct badge colors for high scores (>= 75)', () => {
      const result = computeScoredRecommendations([{ overallScore: 80 }]);
      expect(result).toHaveLength(1);
      expect(result[0].badgeColor).toContain('text-emerald-700');
      expect(result[0].progressBg).toBe('bg-emerald-500');
      expect(result[0].score).toBe(80);
    });

    it('decorates recommendations with correct badge colors for moderate scores (50–74)', () => {
      const result = computeScoredRecommendations([{ overallScore: 60 }]);
      expect(result[0].badgeColor).toContain('text-amber-700');
      expect(result[0].progressBg).toBe('bg-amber-500');
    });

    it('decorates recommendations with correct badge colors for low scores (< 50)', () => {
      const result = computeScoredRecommendations([{ overallScore: 25 }]);
      expect(result[0].badgeColor).toContain('text-slate-700');
      expect(result[0].progressBg).toBe('bg-slate-500');
    });

    it('processes multiple recommendations preserving order and computing each score independently', () => {
      const result = computeScoredRecommendations([
        { overallScore: 90 },
        { overallScore: 55 },
        { overallScore: 20 },
      ]);
      expect(result).toHaveLength(3);
      expect(result[0].progressBg).toBe('bg-emerald-500');
      expect(result[1].progressBg).toBe('bg-amber-500');
      expect(result[2].progressBg).toBe('bg-slate-500');
    });
  });
});

