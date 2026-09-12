import { describe, it, expect } from 'vitest';
import { DepartmentMetric, RecruitmentFunnel } from '../src/types/analytics';

describe('Phase 10: Frontend Analytics Helpers & Calculations Spec', () => {
  const calculateConversionRate = (selected: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((selected / total) * 1000) / 10;
  };

  const computeFunnelProgression = (funnel: RecruitmentFunnel) => {
    const total = funnel.applied;
    if (total === 0) {
      return {
        reviewRate: 0,
        shortlistRate: 0,
        interviewRate: 0,
        placementRate: 0,
      };
    }

    return {
      reviewRate: Math.round((funnel.underReview / total) * 100),
      shortlistRate: Math.round((funnel.shortlisted / total) * 100),
      interviewRate: Math.round((funnel.interviewScheduled / total) * 100),
      placementRate: Math.round((funnel.selected / total) * 100),
    };
  };

  const rankDepartmentsByPlacement = (depts: DepartmentMetric[]) => {
    return [...depts].sort((a, b) => b.placementRate - a.placementRate);
  };

  describe('Metric & Rate Calculations', () => {
    it('should compute exact decimal conversion rate rounded to 1 decimal place', () => {
      expect(calculateConversionRate(25, 100)).toBe(25.0);
      expect(calculateConversionRate(1, 3)).toBe(33.3);
      expect(calculateConversionRate(0, 0)).toBe(0);
    });

    it('should calculate recruitment funnel stage progression percentages', () => {
      const mockFunnel: RecruitmentFunnel = {
        applied: 100,
        underReview: 80,
        shortlisted: 40,
        interviewScheduled: 20,
        selected: 15,
        rejected: 10,
        withdrawn: 5,
      };

      const progression = computeFunnelProgression(mockFunnel);
      expect(progression.reviewRate).toBe(80);
      expect(progression.shortlistRate).toBe(40);
      expect(progression.interviewRate).toBe(20);
      expect(progression.placementRate).toBe(15);
    });
  });

  describe('Department Ranking & Filtering', () => {
    it('should sort departments by highest placement rate', () => {
      const depts: DepartmentMetric[] = [
        {
          department: 'Civil Engineering',
          totalStudents: 50,
          placedStudents: 20,
          placementRate: 40.0,
          averageCgpa: 7.5,
          applicationCount: 60,
          verifiedSkillCount: 30,
        },
        {
          department: 'Computer Science',
          totalStudents: 100,
          placedStudents: 85,
          placementRate: 85.0,
          averageCgpa: 8.8,
          applicationCount: 220,
          verifiedSkillCount: 190,
        },
        {
          department: 'Mechanical Engineering',
          totalStudents: 60,
          placedStudents: 36,
          placementRate: 60.0,
          averageCgpa: 7.9,
          applicationCount: 90,
          verifiedSkillCount: 50,
        },
      ];

      const ranked = rankDepartmentsByPlacement(depts);
      expect(ranked[0].department).toBe('Computer Science');
      expect(ranked[1].department).toBe('Mechanical Engineering');
      expect(ranked[2].department).toBe('Civil Engineering');
    });
  });
});
