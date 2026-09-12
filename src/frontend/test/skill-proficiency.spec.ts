import { describe, it, expect } from 'vitest';
import { ProficiencyLevel } from '../src/types/skill';

export const FRONTEND_PROFICIENCY_WEIGHTS: Record<ProficiencyLevel, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
};

export function canAddSkill(existingSkillIds: Set<string>, targetSkillId: string): boolean {
  return !existingSkillIds.has(targetSkillId);
}

export function formatSearchQuery(raw: string): string {
  return raw.trim();
}

describe('Frontend Skill System Utilities & State Logic', () => {
  it('should map proficiency levels deterministically to scores 1-4', () => {
    expect(FRONTEND_PROFICIENCY_WEIGHTS.BEGINNER).toBe(1);
    expect(FRONTEND_PROFICIENCY_WEIGHTS.INTERMEDIATE).toBe(2);
    expect(FRONTEND_PROFICIENCY_WEIGHTS.ADVANCED).toBe(3);
    expect(FRONTEND_PROFICIENCY_WEIGHTS.EXPERT).toBe(4);
  });

  it('should detect duplicate skills before submission', () => {
    const existing = new Set(['skill-1', 'skill-2']);
    expect(canAddSkill(existing, 'skill-1')).toBe(false);
    expect(canAddSkill(existing, 'skill-3')).toBe(true);
  });

  it('should clean and trim search queries', () => {
    expect(formatSearchQuery('   react   ')).toBe('react');
    expect(formatSearchQuery('')).toBe('');
  });
});
