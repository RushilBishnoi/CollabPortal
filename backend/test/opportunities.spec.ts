import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpportunitiesService } from '../src/modules/opportunities/services/opportunities.service';
import { OpportunityMatchingService } from '../src/modules/opportunities/services/opportunity-matching.service';
import {
  OpportunityType,
  OpportunityStatus,
  ProficiencyLevel,
  VerificationStatus,
} from '@prisma/client';
import { ConflictException, ForbiddenException } from '@nestjs/common';

describe('Phase 8 Opportunity Management & Deterministic Matching Tests', () => {
  let opportunitiesService: OpportunitiesService;
  let matchingService: OpportunityMatchingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn(async (cb) => cb(mockPrisma)),
      industryProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      studentProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      careerRole: {
        findUnique: vi.fn(),
      },
      skill: {
        findUnique: vi.fn(),
      },
      opportunity: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      opportunitySkill: {
        create: vi.fn(),
        upsert: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    };

    opportunitiesService = new OpportunitiesService(mockPrisma);
    matchingService = new OpportunityMatchingService(mockPrisma);
  });

  // ─── Recruiter Opportunity Lifecycle Tests ─────────────────────────────────

  describe('Recruiter Opportunity Lifecycle & Management', () => {
    it('should create an opportunity with skills and profile resolution', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ind-profile-1',
        userId: 'user-recruiter-1',
        companyName: 'Acme Technologies',
      });

      mockPrisma.opportunity.findUnique.mockResolvedValue(null); // No slug conflict

      mockPrisma.skill.findUnique.mockResolvedValue({
        id: 'sk-react',
        name: 'React',
        isActive: true,
      });

      const createdOpportunity = {
        id: 'opp-1',
        industryProfileId: 'ind-profile-1',
        title: 'Frontend Intern',
        slug: 'frontend-intern',
        description: 'Build web UIs',
        opportunityType: OpportunityType.INTERNSHIP,
        status: OpportunityStatus.PUBLISHED,
        location: 'Bengaluru',
        isRemote: false,
        positionsCount: 2,
        skills: [
          {
            skillId: 'sk-react',
            requiredProficiency: ProficiencyLevel.ADVANCED,
            weight: 1.0,
            isMandatory: true,
            skill: { id: 'sk-react', name: 'React', category: { id: 'cat-1', name: 'Web' } },
          },
        ],
      };

      mockPrisma.opportunity.create.mockResolvedValue(createdOpportunity);
      mockPrisma.opportunity.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(createdOpportunity);

      const result = await opportunitiesService.create('user-recruiter-1', {
        title: 'Frontend Intern',
        slug: 'frontend-intern',
        description: 'Build web UIs',
        opportunityType: OpportunityType.INTERNSHIP,
        location: 'Bengaluru',
        positionsCount: 2,
        skills: [
          {
            skillId: 'sk-react',
            requiredProficiency: ProficiencyLevel.ADVANCED,
            weight: 1.0,
            isMandatory: true,
          },
        ],
      });

      expect(mockPrisma.opportunity.create).toHaveBeenCalled();
      expect(mockPrisma.opportunitySkill.create).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result?.title).toBe('Frontend Intern');
    });

    it('should throw ConflictException on duplicate slug', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ind-profile-1',
        userId: 'user-recruiter-1',
      });

      mockPrisma.opportunity.findUnique.mockResolvedValue({
        id: 'opp-existing',
        slug: 'existing-slug',
      });

      await expect(
        opportunitiesService.create('user-recruiter-1', {
          title: 'Frontend Intern',
          slug: 'existing-slug',
          description: 'Description',
          opportunityType: OpportunityType.INTERNSHIP,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow recruiter to update posting details', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ind-profile-1',
        userId: 'user-recruiter-1',
      });

      mockPrisma.opportunity.findUnique.mockResolvedValue({
        id: 'opp-1',
        industryProfileId: 'ind-profile-1',
        title: 'Old Title',
        slug: 'old-slug',
      });

      mockPrisma.opportunity.update.mockResolvedValue({
        id: 'opp-1',
        title: 'New Title',
        slug: 'old-slug',
      });

      const updated = await opportunitiesService.update('user-recruiter-1', 'opp-1', {
        title: 'New Title',
      });

      expect(mockPrisma.opportunity.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'opp-1' },
          data: expect.objectContaining({ title: 'New Title' }),
        }),
      );
      expect(updated.title).toBe('New Title');
    });

    it('should allow recruiter to update posting status to CLOSED or ARCHIVED', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ind-profile-1',
        userId: 'user-recruiter-1',
      });

      mockPrisma.opportunity.findUnique.mockResolvedValue({
        id: 'opp-1',
        industryProfileId: 'ind-profile-1',
        status: OpportunityStatus.PUBLISHED,
      });

      mockPrisma.opportunity.update.mockResolvedValue({
        id: 'opp-1',
        status: OpportunityStatus.CLOSED,
      });

      const res = await opportunitiesService.updateStatus('user-recruiter-1', 'opp-1', {
        status: OpportunityStatus.CLOSED,
      });

      expect(res.status).toBe(OpportunityStatus.CLOSED);
    });
  });

  // ─── IDOR & Ownership Security Tests ───────────────────────────────────────

  describe('IDOR & Ownership Security Protections', () => {
    it('should throw ForbiddenException if Recruiter A tries to view Recruiter B opportunity', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ind-profile-attacker',
        userId: 'user-attacker',
      });

      mockPrisma.opportunity.findUnique.mockResolvedValue({
        id: 'opp-victim',
        industryProfileId: 'ind-profile-victim',
      });

      await expect(
        opportunitiesService.findMyOpportunityById('user-attacker', 'opp-victim'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if Recruiter A tries to update Recruiter B opportunity', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ind-profile-attacker',
        userId: 'user-attacker',
      });

      mockPrisma.opportunity.findUnique.mockResolvedValue({
        id: 'opp-victim',
        industryProfileId: 'ind-profile-victim',
      });

      await expect(
        opportunitiesService.update('user-attacker', 'opp-victim', { title: 'Hacked Title' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if Recruiter A tries to modify skill requirements on Recruiter B opportunity', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ind-profile-attacker',
        userId: 'user-attacker',
      });

      mockPrisma.opportunity.findUnique.mockResolvedValue({
        id: 'opp-victim',
        industryProfileId: 'ind-profile-victim',
      });

      await expect(
        opportunitiesService.addSkillRequirement('user-attacker', 'opp-victim', {
          skillId: 'sk-1',
          requiredProficiency: ProficiencyLevel.ADVANCED,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Skill Requirements Management Tests ───────────────────────────────────

  describe('Opportunity Skill Requirements Management', () => {
    it('should upsert skill requirement on opportunity and prevent duplicates', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ind-profile-1',
        userId: 'user-recruiter-1',
      });

      mockPrisma.opportunity.findUnique.mockResolvedValue({
        id: 'opp-1',
        industryProfileId: 'ind-profile-1',
      });

      mockPrisma.skill.findUnique.mockResolvedValue({
        id: 'sk-ts',
        name: 'TypeScript',
        isActive: true,
      });

      mockPrisma.opportunitySkill.upsert.mockResolvedValue({
        id: 'opp-sk-1',
        opportunityId: 'opp-1',
        skillId: 'sk-ts',
        requiredProficiency: ProficiencyLevel.EXPERT,
        weight: 1.5,
      });

      const res = await opportunitiesService.addSkillRequirement('user-recruiter-1', 'opp-1', {
        skillId: 'sk-ts',
        requiredProficiency: ProficiencyLevel.EXPERT,
        weight: 1.5,
      });

      expect(mockPrisma.opportunitySkill.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            opportunityId_skillId: {
              opportunityId: 'opp-1',
              skillId: 'sk-ts',
            },
          },
        }),
      );
      expect(res.requiredProficiency).toBe(ProficiencyLevel.EXPERT);
    });

    it('should delete skill requirement from opportunity', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ind-profile-1',
        userId: 'user-recruiter-1',
      });

      mockPrisma.opportunity.findUnique.mockResolvedValue({
        id: 'opp-1',
        industryProfileId: 'ind-profile-1',
      });

      mockPrisma.opportunitySkill.findUnique.mockResolvedValue({
        id: 'opp-sk-1',
        opportunityId: 'opp-1',
        skillId: 'sk-ts',
      });

      const res = await opportunitiesService.removeSkillRequirement('user-recruiter-1', 'opp-1', 'sk-ts');
      expect(mockPrisma.opportunitySkill.delete).toHaveBeenCalledWith({ where: { id: 'opp-sk-1' } });
      expect(res.success).toBe(true);
    });
  });

  // ─── Hard Academic Eligibility Engine Tests ────────────────────────────────

  describe('Hard Academic Eligibility Checks (checkEligibility)', () => {
    const baseOpportunity = {
      id: 'opp-1',
      minCgpa: 7.5,
      minGraduationYear: 2025,
      maxGraduationYear: 2027,
      eligibleDepartments: ['Computer Science', 'Information Technology', 'CSE', 'IT'],
    };

    it('should pass eligibility when all CGPA, graduation batch, and department criteria are met', () => {
      const studentProfile = {
        cgpa: 8.2,
        graduationYear: 2026,
        department: 'Computer Science and Engineering (CSE)',
      };

      const result = matchingService.checkEligibility(studentProfile, baseOpportunity);

      expect(result.isEligible).toBe(true);
      expect(result.failureReasons).toHaveLength(0);
      expect(result.checks.cgpa.passed).toBe(true);
      expect(result.checks.graduationYear.passed).toBe(true);
      expect(result.checks.department.passed).toBe(true);
    });

    it('should fail eligibility with specific reason when CGPA is below requirement', () => {
      const studentProfile = {
        cgpa: 6.8,
        graduationYear: 2026,
        department: 'CSE',
      };

      const result = matchingService.checkEligibility(studentProfile, baseOpportunity);

      expect(result.isEligible).toBe(false);
      expect(result.checks.cgpa.passed).toBe(false);
      expect(result.checks.cgpa.message).toContain('is below minimum requirement');
      expect(result.failureReasons).toContain(result.checks.cgpa.message);
    });

    it('should fail eligibility when CGPA is required but missing on student profile', () => {
      const studentProfile = {
        cgpa: null,
        graduationYear: 2026,
        department: 'CSE',
      };

      const result = matchingService.checkEligibility(studentProfile, baseOpportunity);

      expect(result.isEligible).toBe(false);
      expect(result.checks.cgpa.passed).toBe(false);
      expect(result.checks.cgpa.message).toContain('No CGPA recorded');
    });

    it('should fail eligibility when graduation year is outside eligible batch window', () => {
      const studentProfile = {
        cgpa: 8.0,
        graduationYear: 2024, // earlier than min 2025
        department: 'CSE',
      };

      const result = matchingService.checkEligibility(studentProfile, baseOpportunity);

      expect(result.isEligible).toBe(false);
      expect(result.checks.graduationYear.passed).toBe(false);
      expect(result.checks.graduationYear.message).toContain('earlier than eligible batch');
    });

    it('should fail eligibility when student department is not in eligible departments list', () => {
      const studentProfile = {
        cgpa: 8.0,
        graduationYear: 2026,
        department: 'Civil Engineering',
      };

      const result = matchingService.checkEligibility(studentProfile, baseOpportunity);

      expect(result.isEligible).toBe(false);
      expect(result.checks.department.passed).toBe(false);
      expect(result.checks.department.message).toContain('Civil Engineering');
    });

    it('should pass department check when opportunity specifies no department restrictions (empty array)', () => {
      const openOpportunity = {
        minCgpa: 6.0,
        minGraduationYear: null,
        maxGraduationYear: null,
        eligibleDepartments: [],
      };

      const studentProfile = {
        cgpa: 7.0,
        graduationYear: 2025,
        department: 'Mechanical Engineering',
      };

      const result = matchingService.checkEligibility(studentProfile, openOpportunity);
      expect(result.isEligible).toBe(true);
      expect(result.checks.department.passed).toBe(true);
    });
  });

  // ─── 5-Factor Deterministic Opportunity Matching Tests ─────────────────────

  describe('5-Factor Deterministic Opportunity Matching Engine', () => {
    const mockOpportunity = {
      id: 'opp-match-1',
      title: 'Full Stack Engineering Intern',
      slug: 'full-stack-engineering-intern',
      opportunityType: OpportunityType.INTERNSHIP,
      status: OpportunityStatus.PUBLISHED,
      location: 'Bengaluru',
      isRemote: true,
      stipend: 35000,
      stipendCurrency: 'INR',
      stipendPeriod: 'MONTHLY',
      deadline: new Date('2026-12-31'),
      positionsCount: 3,
      description: 'Join our core platform engineering team.',
      minCgpa: 7.0,
      minGraduationYear: 2025,
      maxGraduationYear: 2027,
      eligibleDepartments: ['CSE', 'IT'],
      industryProfile: {
        id: 'ind-1',
        companyName: 'InnoTech Solutions',
        industryType: 'Software',
        headquarters: 'Bengaluru',
        website: 'https://innotech.example.com',
        isVerified: true,
      },
      careerRole: {
        id: 'role-fs',
        title: 'Full Stack Developer',
        category: 'Software Engineering',
      },
      skills: [
        {
          id: 'skreq-1',
          skillId: 'sk-react',
          requiredProficiency: ProficiencyLevel.ADVANCED, // 3
          weight: 1.0,
          isMandatory: true,
          skill: { id: 'sk-react', name: 'React', category: { id: 'c1', name: 'Web' } },
        },
        {
          id: 'skreq-2',
          skillId: 'sk-node',
          requiredProficiency: ProficiencyLevel.ADVANCED, // 3
          weight: 1.0,
          isMandatory: true,
          skill: { id: 'sk-node', name: 'Node.js', category: { id: 'c1', name: 'Backend' } },
        },
        {
          id: 'skreq-3',
          skillId: 'sk-sql',
          requiredProficiency: ProficiencyLevel.INTERMEDIATE, // 2
          weight: 1.0,
          isMandatory: false,
          skill: { id: 'sk-sql', name: 'PostgreSQL', category: { id: 'c2', name: 'Databases' } },
        },
      ],
    };

    it('should correctly classify satisfied, deficit, and missing skills and calculate Component 1 (50%)', () => {
      const studentProfile = {
        id: 'sp-1',
        fullName: 'Jordan Student',
        cgpa: 8.5,
        graduationYear: 2026,
        department: 'CSE',
        preferredRoles: ['Full Stack Developer'],
        careerInterests: ['Software Engineering'],
        preferredLocations: ['Remote'],
        studentSkills: [
          {
            skillId: 'sk-react',
            proficiency: ProficiencyLevel.ADVANCED, // 3/3 -> 1.0, verified
            verificationStatus: VerificationStatus.VERIFIED,
          },
          {
            skillId: 'sk-node',
            proficiency: ProficiencyLevel.INTERMEDIATE, // 2/3 -> 0.6667, pending
            verificationStatus: VerificationStatus.PENDING,
          },
          // sk-sql missing -> 0
        ],
        projects: [{ id: 'p-1' }],
        certifications: [{ id: 'c-1' }],
        experiences: [],
      };

      const result = matchingService.evaluateOpportunityMatch(studentProfile, mockOpportunity);

      expect(result.skillsSummary.totalRequired).toBe(3);
      expect(result.skillsSummary.satisfiedCount).toBe(1);
      expect(result.skillsSummary.deficitCount).toBe(1);
      expect(result.skillsSummary.missingCount).toBe(1);
      expect(result.skillsSummary.verifiedCount).toBe(1);

      // Total weighted match = (1.0 + 0.6667 + 0) / 3 = 1.6667 / 3 = 0.55556
      // Skill Score = round1(0.55556 * 50) = 27.8
      expect(result.breakdown.skillCompatibility.score).toBe(27.8);
      expect(result.breakdown.skillCompatibility.max).toBe(50.0);
    });

    it('should calculate Verification Confidence Component (15%) strictly from verified required skills', () => {
      const studentProfile = {
        id: 'sp-1',
        fullName: 'Jordan Student',
        cgpa: 8.0,
        studentSkills: [
          { skillId: 'sk-react', proficiency: ProficiencyLevel.ADVANCED, verificationStatus: VerificationStatus.VERIFIED },
          { skillId: 'sk-node', proficiency: ProficiencyLevel.ADVANCED, verificationStatus: VerificationStatus.VERIFIED },
          { skillId: 'sk-sql', proficiency: ProficiencyLevel.INTERMEDIATE, verificationStatus: VerificationStatus.PENDING },
        ],
      };

      const result = matchingService.evaluateOpportunityMatch(studentProfile, mockOpportunity);

      // 2 of 3 verified -> (2/3) * 15.0 = 10.0 pts
      expect(result.breakdown.verificationConfidence.score).toBe(10.0);
      expect(result.breakdown.verificationConfidence.max).toBe(15.0);
    });

    it('should award 15.0 pts for direct career role alignment in preferredRoles', () => {
      const studentProfile = {
        id: 'sp-1',
        studentSkills: [],
        preferredRoles: ['Full Stack Developer'],
        careerInterests: [],
      };

      const result = matchingService.evaluateOpportunityMatch(studentProfile, mockOpportunity);
      expect(result.breakdown.careerInterest.score).toBe(15.0);
    });

    it('should award 10.0 pts for location component on 100% remote opportunity', () => {
      const studentProfile = {
        id: 'sp-1',
        studentSkills: [],
        preferredLocations: ['Delhi'],
      };

      // Opportunity has isRemote: true
      const result = matchingService.evaluateOpportunityMatch(studentProfile, mockOpportunity);
      expect(result.breakdown.locationPreference.score).toBe(10.0);
    });

    it('should maintain mathematical invariant where overallScore is the exact sum of 5 components', () => {
      const studentProfile = {
        id: 'sp-1',
        fullName: 'Jordan Student',
        phoneNumber: '+91 9999999999',
        bio: 'Aspiring Full Stack Engineer',
        avatarUrl: 'https://example.com/avatar.jpg',
        degree: 'B.Tech',
        department: 'CSE',
        graduationYear: 2026,
        institutionId: 'inst-1',
        careerInterests: ['Software Engineering'],
        preferredRoles: ['Full Stack Developer'],
        preferredLocations: ['Bengaluru'],
        cgpa: 8.8,
        projects: [{ id: 'p-1' }],
        certifications: [{ id: 'c-1' }],
        experiences: [{ id: 'e-1' }],
        studentSkills: [
          { skillId: 'sk-react', proficiency: ProficiencyLevel.EXPERT, verificationStatus: VerificationStatus.VERIFIED },
          { skillId: 'sk-node', proficiency: ProficiencyLevel.ADVANCED, verificationStatus: VerificationStatus.VERIFIED },
          { skillId: 'sk-sql', proficiency: ProficiencyLevel.INTERMEDIATE, verificationStatus: VerificationStatus.VERIFIED },
        ],
      };

      const result = matchingService.evaluateOpportunityMatch(studentProfile, mockOpportunity);

      const computedSum = Math.round(
        (result.breakdown.skillCompatibility.score +
          result.breakdown.verificationConfidence.score +
          result.breakdown.careerInterest.score +
          result.breakdown.academicReadiness.score +
          result.breakdown.locationPreference.score) * 10,
      ) / 10;

      expect(result.overallScore).toBe(computedSum);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.eligibility.isEligible).toBe(true);
    });
  });

  // ─── Public Opportunity Catalog & Matched Queries Tests ────────────────────

  describe('Public Discovery & Student Matched Queries', () => {
    it('should query published opportunities with search and filter parameters', async () => {
      mockPrisma.opportunity.count.mockResolvedValue(1);
      mockPrisma.opportunity.findMany.mockResolvedValue([
        {
          id: 'opp-1',
          title: 'Backend Engineer',
          status: OpportunityStatus.PUBLISHED,
          opportunityType: OpportunityType.JOB,
          industryProfile: { id: 'ind-1', companyName: 'Enterprise' },
          skills: [],
        },
      ]);

      const res = await opportunitiesService.findAllPublished({
        search: 'Backend',
        opportunityType: OpportunityType.JOB,
        page: 1,
        limit: 20,
      });

      expect(mockPrisma.opportunity.findMany).toHaveBeenCalled();
      expect(res.data).toHaveLength(1);
      expect(res.meta.total).toBe(1);
    });
  });
});
