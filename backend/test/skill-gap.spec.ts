import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillGapService } from '../src/modules/skill-gap/services/skill-gap.service';
import { ProficiencyLevel, VerificationStatus } from '@prisma/client';

describe('Phase 7 Skill Gap Analysis & Deterministic Matching Unit Tests', () => {
  let skillGapService: SkillGapService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      studentProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      careerRole: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
    };

    skillGapService = new SkillGapService(mockPrisma);
  });

  const mockFrontendRole = {
    id: 'role-fe',
    title: 'Frontend Developer',
    slug: 'frontend-developer',
    category: 'Software Engineering',
    description: 'Builds modern web user interfaces',
    minExperienceYears: 0,
    skills: [
      {
        id: 'req-1',
        skillId: 'sk-react',
        requiredProficiency: ProficiencyLevel.ADVANCED, // 3
        weight: 1.0,
        isMandatory: true,
        skill: { id: 'sk-react', name: 'React', category: { name: 'Web Development' } },
      },
      {
        id: 'req-2',
        skillId: 'sk-ts',
        requiredProficiency: ProficiencyLevel.ADVANCED, // 3
        weight: 1.0,
        isMandatory: true,
        skill: { id: 'sk-ts', name: 'TypeScript', category: { name: 'Programming Languages' } },
      },
      {
        id: 'req-3',
        skillId: 'sk-css',
        requiredProficiency: ProficiencyLevel.INTERMEDIATE, // 2
        weight: 1.0,
        isMandatory: false,
        skill: { id: 'sk-css', name: 'Tailwind CSS', category: { name: 'Web Development' } },
      },
      {
        id: 'req-4',
        skillId: 'sk-api',
        requiredProficiency: ProficiencyLevel.INTERMEDIATE, // 2
        weight: 1.0,
        isMandatory: true,
        skill: { id: 'sk-api', name: 'REST APIs', category: { name: 'Web Development' } },
      },
    ],
  };

  describe('Skill Gap Classification & Pure Proficiency Matching (Component 1)', () => {
    it('should correctly classify SATISFIED, DEFICIT, and MISSING skills', () => {
      const studentProfile = {
        id: 'sp-1',
        fullName: 'Alex Student',
        studentSkills: [
          {
            skillId: 'sk-react',
            proficiency: ProficiencyLevel.ADVANCED, // 3/3 -> SATISFIED (gap 0)
            verificationStatus: VerificationStatus.VERIFIED,
          },
          {
            skillId: 'sk-ts',
            proficiency: ProficiencyLevel.INTERMEDIATE, // 2/3 -> DEFICIT (gap 1)
            verificationStatus: VerificationStatus.PENDING,
          },
          {
            skillId: 'sk-css',
            proficiency: ProficiencyLevel.BEGINNER, // 1/2 -> DEFICIT (gap 1)
            verificationStatus: VerificationStatus.PENDING,
          },
          // sk-api is completely missing -> MISSING (gap 2)
        ],
        preferredRoles: [],
        careerInterests: [],
        projects: [],
        certifications: [],
        experiences: [],
      };

      const result = skillGapService.evaluateRoleMatch(studentProfile, mockFrontendRole);

      expect(result.skillsSummary.satisfiedCount).toBe(1);
      expect(result.skillsSummary.deficitCount).toBe(2);
      expect(result.skillsSummary.missingCount).toBe(1);
      expect(result.skillsSummary.totalRequired).toBe(4);

      const reactReq = result.skillRequirements.find((r) => r.skillId === 'sk-react');
      expect(reactReq?.status).toBe('SATISFIED');
      expect(reactReq?.gapLevels).toBe(0);
      expect(reactReq?.isVerified).toBe(true);

      const tsReq = result.skillRequirements.find((r) => r.skillId === 'sk-ts');
      expect(tsReq?.status).toBe('DEFICIT');
      expect(tsReq?.gapLevels).toBe(1);
      expect(tsReq?.isVerified).toBe(false);

      const apiReq = result.skillRequirements.find((r) => r.skillId === 'sk-api');
      expect(apiReq?.status).toBe('MISSING');
      expect(apiReq?.gapLevels).toBe(2);
      expect(apiReq?.studentProficiency).toBeNull();
    });

    it('should calculate pure skill compatibility without multiplying verification in Component 1', () => {
      // Skill match ratios:
      // React: 3/3 = 1.0 (weight 1.0)
      // TypeScript: 2/3 = 0.6667 (weight 1.0)
      // Tailwind CSS: 1/2 = 0.5 (weight 1.0)
      // REST APIs: 0 (weight 1.0)
      // Total weighted match = (1.0 + 0.6667 + 0.5 + 0) / 4 = 2.1667 / 4 = 0.54167
      // 50% Component Score = round1(0.54167 * 50) = 27.1
      const studentProfile = {
        id: 'sp-1',
        fullName: 'Alex Student',
        studentSkills: [
          { skillId: 'sk-react', proficiency: ProficiencyLevel.ADVANCED, verificationStatus: VerificationStatus.VERIFIED },
          { skillId: 'sk-ts', proficiency: ProficiencyLevel.INTERMEDIATE, verificationStatus: VerificationStatus.PENDING },
          { skillId: 'sk-css', proficiency: ProficiencyLevel.BEGINNER, verificationStatus: VerificationStatus.PENDING },
        ],
        preferredRoles: [],
        careerInterests: [],
      };

      const result = skillGapService.evaluateRoleMatch(studentProfile, mockFrontendRole);
      expect(result.breakdown.skillCompatibility.score).toBe(27.1);
      expect(result.breakdown.skillCompatibility.max).toBe(50.0);
    });

    it('should cap skill match ratio at 1.0 when student level exceeds requirement', () => {
      const studentProfile = {
        id: 'sp-1',
        fullName: 'Expert Student',
        studentSkills: [
          { skillId: 'sk-react', proficiency: ProficiencyLevel.EXPERT, verificationStatus: VerificationStatus.VERIFIED }, // 4/3 -> capped at 1.0
          { skillId: 'sk-ts', proficiency: ProficiencyLevel.EXPERT, verificationStatus: VerificationStatus.VERIFIED }, // 4/3 -> capped at 1.0
          { skillId: 'sk-css', proficiency: ProficiencyLevel.ADVANCED, verificationStatus: VerificationStatus.VERIFIED }, // 3/2 -> capped at 1.0
          { skillId: 'sk-api', proficiency: ProficiencyLevel.ADVANCED, verificationStatus: VerificationStatus.VERIFIED }, // 3/2 -> capped at 1.0
        ],
        preferredRoles: ['Frontend Developer'],
        careerInterests: ['Software Engineering'],
      };

      const result = skillGapService.evaluateRoleMatch(studentProfile, mockFrontendRole);
      // All 4 skills ratio = 1.0 -> 50.0 / 50.0
      expect(result.breakdown.skillCompatibility.score).toBe(50.0);
    });
  });

  describe('Verification Confidence (Component 2 - 15%)', () => {
    it('should evaluate verification confidence strictly from verified required skills count', () => {
      // 2 of 4 required skills verified -> (2/4) * 15.0 = 7.5 pts
      const studentProfile = {
        id: 'sp-1',
        fullName: 'Alex Student',
        studentSkills: [
          { skillId: 'sk-react', proficiency: ProficiencyLevel.ADVANCED, verificationStatus: VerificationStatus.VERIFIED },
          { skillId: 'sk-ts', proficiency: ProficiencyLevel.ADVANCED, verificationStatus: VerificationStatus.VERIFIED },
          { skillId: 'sk-css', proficiency: ProficiencyLevel.INTERMEDIATE, verificationStatus: VerificationStatus.PENDING },
          { skillId: 'sk-api', proficiency: ProficiencyLevel.INTERMEDIATE, verificationStatus: VerificationStatus.PENDING },
        ],
      };

      const result = skillGapService.evaluateRoleMatch(studentProfile, mockFrontendRole);
      expect(result.breakdown.verificationConfidence.score).toBe(7.5);
      expect(result.breakdown.verificationConfidence.max).toBe(15.0);
      expect(result.skillsSummary.verifiedCount).toBe(2);
    });
  });

  describe('Career Interest Alignment (Component 3 - 15%)', () => {
    it('should award 15.0 pts for direct role match in preferredRoles', () => {
      const studentProfile = {
        id: 'sp-1',
        studentSkills: [],
        preferredRoles: ['Frontend Developer'],
        careerInterests: [],
      };

      const result = skillGapService.evaluateRoleMatch(studentProfile, mockFrontendRole);
      expect(result.breakdown.careerInterest.score).toBe(15.0);
    });

    it('should award 10.0 pts for category/domain match in careerInterests', () => {
      const studentProfile = {
        id: 'sp-1',
        studentSkills: [],
        preferredRoles: [],
        careerInterests: ['Software Engineering'],
      };

      const result = skillGapService.evaluateRoleMatch(studentProfile, mockFrontendRole);
      expect(result.breakdown.careerInterest.score).toBe(10.0);
    });

    it('should award 5.0 pts for general declared interest not matching this role', () => {
      const studentProfile = {
        id: 'sp-1',
        studentSkills: [],
        preferredRoles: ['Data Analyst'],
        careerInterests: ['Machine Learning'],
      };

      const result = skillGapService.evaluateRoleMatch(studentProfile, mockFrontendRole);
      expect(result.breakdown.careerInterest.score).toBe(5.0);
    });

    it('should award 0.0 pts if no career interests or preferred roles declared', () => {
      const studentProfile = {
        id: 'sp-1',
        studentSkills: [],
        preferredRoles: [],
        careerInterests: [],
      };

      const result = skillGapService.evaluateRoleMatch(studentProfile, mockFrontendRole);
      expect(result.breakdown.careerInterest.score).toBe(0.0);
    });
  });

  describe('Academic Readiness & Profile Completeness (Component 4 - 10%)', () => {
    it('should award correct points based on profile completeness and CGPA tier', () => {
      // 100% complete -> 5.0 pts comp
      // CGPA 8.8 (>= 8.5) -> 5.0 pts cgpa
      // Total = 10.0 pts
      const studentProfile = {
        id: 'sp-1',
        fullName: 'Alex Student',
        phoneNumber: '+91 9876543210',
        bio: 'Aspiring software engineer',
        avatarUrl: 'https://example.com/avatar.png',
        degree: 'B.Tech Computer Science',
        department: 'CSE',
        graduationYear: 2026,
        institutionId: 'inst-1',
        careerInterests: ['Software Engineering'],
        preferredRoles: ['Frontend Developer'],
        preferredLocations: ['Bengaluru'],
        cgpa: 8.8,
        projects: [{ id: 'p-1', technologies: ['React'] }],
        certifications: [{ id: 'c-1' }],
        experiences: [{ id: 'e-1' }],
        studentSkills: [],
      };

      const result = skillGapService.evaluateRoleMatch(studentProfile, mockFrontendRole);
      expect(result.breakdown.academicReadiness.score).toBe(10.0);
    });
  });

  describe('Projects & Practical Experience (Component 5 - 10%)', () => {
    it('should award 5.0 pts for 2 domain projects and 5.0 pts for work experience (10.0 total)', () => {
      const studentProfile = {
        id: 'sp-1',
        fullName: 'Alex Student',
        studentSkills: [],
        projects: [
          { id: 'p-1', title: 'React Dashboard', technologies: ['React', 'TypeScript'] },
          { id: 'p-2', title: 'REST API Service', technologies: ['REST APIs', 'Node.js'] },
        ],
        experiences: [{ id: 'exp-1', title: 'Frontend Intern', company: 'Tech Corp' }],
      };

      const result = skillGapService.evaluateRoleMatch(studentProfile, mockFrontendRole);
      expect(result.breakdown.practicalExperience.score).toBe(10.0);
    });
  });

  describe('Mathematical Invariant & Summation Check', () => {
    it('should guarantee that breakdown components sum exactly to the final overall score', () => {
      const studentProfile = {
        id: 'sp-1',
        fullName: 'Alex Student',
        phoneNumber: '+91 9876543210',
        bio: 'Portfolio bio',
        avatarUrl: 'https://example.com/img.jpg',
        degree: 'B.Tech',
        department: 'CSE',
        graduationYear: 2026,
        institutionId: 'inst-1',
        careerInterests: ['Web Development'],
        preferredRoles: ['Frontend Developer'],
        preferredLocations: ['Remote'],
        cgpa: 7.8,
        projects: [
          { id: 'p-1', title: 'Web App', technologies: ['React'] },
        ],
        certifications: [{ id: 'c-1' }],
        experiences: [],
        studentSkills: [
          { skillId: 'sk-react', proficiency: ProficiencyLevel.ADVANCED, verificationStatus: VerificationStatus.VERIFIED },
          { skillId: 'sk-ts', proficiency: ProficiencyLevel.INTERMEDIATE, verificationStatus: VerificationStatus.PENDING },
          { skillId: 'sk-css', proficiency: ProficiencyLevel.INTERMEDIATE, verificationStatus: VerificationStatus.VERIFIED },
        ],
      };

      const result = skillGapService.evaluateRoleMatch(studentProfile, mockFrontendRole);

      const expectedSum = Math.round(
        (result.breakdown.skillCompatibility.score +
          result.breakdown.verificationConfidence.score +
          result.breakdown.careerInterest.score +
          result.breakdown.academicReadiness.score +
          result.breakdown.practicalExperience.score) * 10
      ) / 10;

      expect(result.overallScore).toBe(expectedSum);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Ranked Recommendations & Student Readiness Overview', () => {
    it('should rank roles descending by overall compatibility score', async () => {
      const backendRole = {
        id: 'role-be',
        title: 'Backend Developer',
        slug: 'backend-developer',
        category: 'Software Engineering',
        skills: [
          {
            id: 'req-be-1',
            skillId: 'sk-node',
            requiredProficiency: ProficiencyLevel.ADVANCED,
            weight: 1.0,
            isMandatory: true,
            skill: { id: 'sk-node', name: 'Node.js', category: { name: 'Web Development' } },
          },
        ],
      };

      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        fullName: 'Frontend Focused Student',
        studentSkills: [
          { skillId: 'sk-react', proficiency: ProficiencyLevel.ADVANCED, verificationStatus: VerificationStatus.VERIFIED, skill: { name: 'React' } },
          { skillId: 'sk-ts', proficiency: ProficiencyLevel.ADVANCED, verificationStatus: VerificationStatus.VERIFIED, skill: { name: 'TypeScript' } },
          { skillId: 'sk-css', proficiency: ProficiencyLevel.INTERMEDIATE, verificationStatus: VerificationStatus.VERIFIED, skill: { name: 'Tailwind CSS' } },
          { skillId: 'sk-api', proficiency: ProficiencyLevel.INTERMEDIATE, verificationStatus: VerificationStatus.VERIFIED, skill: { name: 'REST APIs' } },
        ],
        preferredRoles: ['Frontend Developer'],
        careerInterests: ['Software Engineering'],
        projects: [],
        certifications: [],
        experiences: [],
      });

      mockPrisma.careerRole.findMany.mockResolvedValue([backendRole, mockFrontendRole]);

      const recommendations = await skillGapService.getRecommendedRoles('user-1');

      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].careerRole.slug).toBe('frontend-developer');
      expect(recommendations[0].overallScore).toBeGreaterThan(recommendations[1].overallScore);
    });

    it('should build student readiness overview with verified, deficit, and missing skills', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        fullName: 'Alex Student',
        degree: 'B.Tech',
        department: 'CSE',
        studentSkills: [
          {
            id: 'ss-1',
            skillId: 'sk-react',
            proficiency: ProficiencyLevel.ADVANCED,
            score: 95,
            verificationStatus: VerificationStatus.VERIFIED,
            skill: { id: 'sk-react', name: 'React', category: { name: 'Web' } },
          },
          {
            id: 'ss-2',
            skillId: 'sk-ts',
            proficiency: ProficiencyLevel.BEGINNER,
            verificationStatus: VerificationStatus.PENDING,
            skill: { id: 'sk-ts', name: 'TypeScript', category: { name: 'Languages' } },
          },
        ],
        preferredRoles: ['Frontend Developer'],
        careerInterests: ['Software Engineering'],
        projects: [],
        certifications: [],
        experiences: [],
      });

      mockPrisma.careerRole.findMany.mockResolvedValue([mockFrontendRole]);

      const overview = await skillGapService.getStudentReadinessOverview('user-1');

      expect(overview.profileSummary.totalAcquiredSkills).toBe(2);
      expect(overview.profileSummary.verifiedSkillsCount).toBe(1);
      expect(overview.profileSummary.pendingSkillsCount).toBe(1);
      expect(overview.verifiedSkills).toHaveLength(1);
      expect(overview.verifiedSkills[0].name).toBe('React');
      expect(overview.topRecommendations).toHaveLength(1);
    });
  });
});
