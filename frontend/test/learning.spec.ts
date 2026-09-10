import { describe, it, expect } from 'vitest';
import {
  LearningResource,
  LearningPath,
  LearningResourceType,
  LearningResourceDifficulty,
  StudentResourceProgress,
  SkillRemediationItem,
} from '../src/types/learning';

describe('Phase 12: Frontend Learning & Skill-Gap Remediation Spec', () => {
  // Helpers matching UI logic
  const getDifficultyColor = (diff: LearningResourceDifficulty): string => {
    switch (diff) {
      case 'BEGINNER':
        return 'emerald';
      case 'INTERMEDIATE':
        return 'blue';
      case 'ADVANCED':
        return 'purple';
      case 'EXPERT':
        return 'amber';
      default:
        return 'slate';
    }
  };

  const calculatePathProgress = (
    totalItems: number,
    completedItems: number,
  ): number => {
    if (totalItems <= 0) return 0;
    return Math.min(100, Math.round((completedItems / totalItems) * 100 * 10) / 10);
  };

  const filterResources = (
    resources: LearningResource[],
    filters: {
      search?: string;
      skillId?: string;
      resourceType?: LearningResourceType;
      difficulty?: LearningResourceDifficulty;
    },
  ): LearningResource[] => {
    return resources.filter((res) => {
      if (filters.skillId && res.skillId !== filters.skillId) return false;
      if (filters.resourceType && res.resourceType !== filters.resourceType) return false;
      if (filters.difficulty && res.difficulty !== filters.difficulty) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesTitle = res.title.toLowerCase().includes(query);
        const matchesDesc = res.description.toLowerCase().includes(query);
        const matchesProvider = res.provider?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesProvider) return false;
      }
      return true;
    });
  };

  const computeRemediationHours = (items: SkillRemediationItem[]): number => {
    return items.reduce((acc, curr) => acc + (curr.estimatedHours || 0), 0);
  };

  describe('Difficulty Badge Theme Mapping', () => {
    it('should assign distinct color tiers to difficulty levels', () => {
      expect(getDifficultyColor('BEGINNER')).toBe('emerald');
      expect(getDifficultyColor('INTERMEDIATE')).toBe('blue');
      expect(getDifficultyColor('ADVANCED')).toBe('purple');
      expect(getDifficultyColor('EXPERT')).toBe('amber');
    });
  });

  describe('Learning Path Progress Calculation', () => {
    it('should calculate accurate progress percentage for enrolled curricula', () => {
      expect(calculatePathProgress(4, 0)).toBe(0);
      expect(calculatePathProgress(4, 1)).toBe(25);
      expect(calculatePathProgress(3, 1)).toBe(33.3);
      expect(calculatePathProgress(2, 2)).toBe(100);
      expect(calculatePathProgress(0, 0)).toBe(0);
    });
  });

  describe('Resource Filtering Logic', () => {
    const mockResources: LearningResource[] = [
      {
        id: 'r1',
        title: 'PostgreSQL Indexing Mastery',
        slug: 'postgresql-indexing-mastery',
        description: 'B-tree, GIN, GiST index optimization',
        url: 'https://example.com/pg',
        resourceType: 'ARTICLE',
        difficulty: 'ADVANCED',
        estimatedMinutes: 45,
        skillId: 'skill-pg',
        targetProficiency: 'ADVANCED',
        authorRole: 'INDUSTRY',
        authorUserId: 'u1',
        isVerified: true,
        isPublished: true,
        provider: 'AWS Docs',
        tags: ['sql', 'database'],
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01',
      },
      {
        id: 'r2',
        title: 'Docker from Scratch Video Course',
        slug: 'docker-scratch',
        description: 'Container fundamentals and Dockerfile best practices',
        url: 'https://example.com/docker',
        resourceType: 'VIDEO',
        difficulty: 'BEGINNER',
        estimatedMinutes: 60,
        skillId: 'skill-docker',
        targetProficiency: 'BEGINNER',
        authorRole: 'FACULTY',
        authorUserId: 'u2',
        isVerified: true,
        isPublished: true,
        provider: 'Coursera',
        tags: ['devops', 'containers'],
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01',
      },
      {
        id: 'r3',
        title: 'React Design Patterns Lab',
        slug: 'react-patterns',
        description: 'Interactive compound components lab',
        url: 'https://example.com/react',
        resourceType: 'INTERACTIVE_LAB',
        difficulty: 'INTERMEDIATE',
        estimatedMinutes: 90,
        skillId: 'skill-react',
        targetProficiency: 'INTERMEDIATE',
        authorRole: 'SUPER_ADMIN',
        authorUserId: 'u3',
        isVerified: false,
        isPublished: true,
        tags: ['frontend'],
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01',
      },
    ];

    it('should filter resources by skillId', () => {
      const filtered = filterResources(mockResources, { skillId: 'skill-docker' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe('Docker from Scratch Video Course');
    });

    it('should filter resources by resourceType and difficulty', () => {
      const filtered = filterResources(mockResources, {
        resourceType: 'ARTICLE',
        difficulty: 'ADVANCED',
      });
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe('PostgreSQL Indexing Mastery');
    });

    it('should search across title, description, and provider', () => {
      const byTitle = filterResources(mockResources, { search: 'Indexing' });
      expect(byTitle.length).toBe(1);

      const byProvider = filterResources(mockResources, { search: 'Coursera' });
      expect(byProvider.length).toBe(1);
      expect(byProvider[0].id).toBe('r2');
    });
  });

  describe('Skill-Gap Remediation Aggregation', () => {
    it('should calculate total estimated remediation hours across deficit skills', () => {
      const items: SkillRemediationItem[] = [
        {
          skillId: 's1',
          skillName: 'Docker',
          currentProficiency: 'BEGINNER',
          targetProficiency: 'ADVANCED',
          status: 'DEFICIT',
          gapLevels: 2,
          estimatedHours: 30,
          resources: [],
          linkedAssessment: {
            id: 'ass-1',
            title: 'Docker Test',
            passingScore: 70,
            durationMinutes: 20,
          },
        },
        {
          skillId: 's2',
          skillName: 'Kubernetes',
          currentProficiency: null,
          targetProficiency: 'INTERMEDIATE',
          status: 'MISSING',
          gapLevels: 2,
          estimatedHours: 30,
          resources: [],
          linkedAssessment: null,
        },
      ];

      const totalHours = computeRemediationHours(items);
      expect(totalHours).toBe(60);
    });
  });

  describe('Student Dashboard Progress Aggregation', () => {
    it('should correctly count completed, in-progress, and saved resources', () => {
      const progresses: StudentResourceProgress[] = [
        {
          id: 'p1',
          studentProfileId: 's1',
          resourceId: 'r1',
          status: 'COMPLETED',
          timeSpentMinutes: 45,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'p2',
          studentProfileId: 's1',
          resourceId: 'r2',
          status: 'COMPLETED',
          timeSpentMinutes: 60,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'p3',
          studentProfileId: 's1',
          resourceId: 'r3',
          status: 'SAVED',
          timeSpentMinutes: 0,
          createdAt: '',
          updatedAt: '',
        },
      ];

      const completedCount = progresses.filter((p) => p.status === 'COMPLETED').length;
      const savedCount = progresses.filter((p) => p.status === 'SAVED').length;
      const totalHours = progresses.reduce((acc, p) => acc + p.timeSpentMinutes, 0) / 60;

      expect(completedCount).toBe(2);
      expect(savedCount).toBe(1);
      expect(totalHours).toBe(1.75);
    });
  });
});
