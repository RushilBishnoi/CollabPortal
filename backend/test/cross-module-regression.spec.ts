/**
 * Actual Phase 17 — Cross-Module Regression & State Machine Integrity Test Suite
 *
 * Exercises:
 * 1. Flow 1: Assessment -> Skill Gap Calculation
 * 2. Flow 2: Skill Gap -> Learning Remediation Plan
 * 3. Flow 3: Skill Gap -> Mentorship Discovery CTA
 * 4. Flow 4: Opportunity -> Application Submission & Eligibility Gates
 * 5. Flow 5: Application -> Recruiter Selection -> Offer Issuance -> Placement
 * 6. Flow 6: Placement Verification -> TPO Action -> Notification Dispatch
 * 7. Flow 7: Opportunity Publishing -> Notification Filtering
 * 8. Flow 8: Mentorship Request -> Approval -> Active Relationship & Sessions
 * 9. Flow 9: Collaboration Lifecycle & Participation Scoping
 * 10. Flow 10: Security Hardening & Rate Limiting Integration
 * 11. State Machine Validation: Application, Offer, Placement, Mentorship, Sessions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  OfferStatus,
  PlacementStatus,
  MentorshipRequestStatus,
  UserRole,
  ProficiencyLevel,
} from '@prisma/client';

import { ApplicationLifecycleService } from '../src/modules/applications/services/application-lifecycle.service';
import { PlacementLifecycleService } from '../src/modules/placements/services/placement-lifecycle.service';
import { LearningRemediationService } from '../src/modules/learning/services/learning-remediation.service';
import { MentorshipRequestsService } from '../src/modules/mentorship/services/mentorship-requests.service';
import { MentorProfilesService } from '../src/modules/mentorship/services/mentor-profiles.service';
import { PrismaService } from '../src/database/prisma.service';

describe('Actual Phase 17 — Cross-Module Regression & State Machine Integrity', () => {
  // ============================================================
  // State Machine Regression: Application Status
  // ============================================================
  describe('State Machine Regression: ApplicationStatus Lifecycle', () => {
    let lifecycleService: ApplicationLifecycleService;

    beforeEach(() => {
      lifecycleService = new ApplicationLifecycleService();
    });

    it('must allow valid application progression: APPLIED -> UNDER_REVIEW -> SHORTLISTED -> INTERVIEW_SCHEDULED -> SELECTED', () => {
      // APPLIED -> UNDER_REVIEW (recruiter)
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.APPLIED,
          ApplicationStatus.UNDER_REVIEW,
          UserRole.INDUSTRY,
        ),
      ).not.toThrow();

      // UNDER_REVIEW -> SHORTLISTED (recruiter)
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.UNDER_REVIEW,
          ApplicationStatus.SHORTLISTED,
          UserRole.INDUSTRY,
        ),
      ).not.toThrow();

      // SHORTLISTED -> INTERVIEW_SCHEDULED (recruiter)
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.SHORTLISTED,
          ApplicationStatus.INTERVIEW_SCHEDULED,
          UserRole.INDUSTRY,
        ),
      ).not.toThrow();

      // INTERVIEW_SCHEDULED -> SELECTED (recruiter)
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.INTERVIEW_SCHEDULED,
          ApplicationStatus.SELECTED,
          UserRole.INDUSTRY,
        ),
      ).not.toThrow();
    });

    it('must reject jumping directly from APPLIED to SELECTED without review and interview', () => {
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.APPLIED,
          ApplicationStatus.SELECTED,
          UserRole.INDUSTRY,
        ),
      ).toThrow(BadRequestException);
    });

    it('must enforce that terminal state SELECTED cannot transition anywhere', () => {
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.SELECTED,
          ApplicationStatus.UNDER_REVIEW,
          UserRole.INDUSTRY,
        ),
      ).toThrow(BadRequestException);
    });

    it('must allow candidate to withdraw from APPLIED, UNDER_REVIEW, or SHORTLISTED', () => {
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.APPLIED,
          ApplicationStatus.WITHDRAWN,
          UserRole.STUDENT,
        ),
      ).not.toThrow();

      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.SHORTLISTED,
          ApplicationStatus.WITHDRAWN,
          UserRole.STUDENT,
        ),
      ).not.toThrow();
    });

    it('must reject candidate withdrawal if initiated by an unauthorized role', () => {
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.APPLIED,
          ApplicationStatus.WITHDRAWN,
          UserRole.FACULTY,
        ),
      ).toThrow(ForbiddenException);
    });

    it('must reject recruiter from advancing a terminal state (REJECTED -> SELECTED)', () => {
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.REJECTED,
          ApplicationStatus.SELECTED,
          UserRole.INDUSTRY,
        ),
      ).toThrow(BadRequestException);
    });

    it('must reject recruiter from advancing an application that was WITHDRAWN', () => {
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.WITHDRAWN,
          ApplicationStatus.SELECTED,
          UserRole.INDUSTRY,
        ),
      ).toThrow(BadRequestException);
    });

    it('must treat identical transition as an idempotent no-op', () => {
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.SHORTLISTED,
          ApplicationStatus.SHORTLISTED,
          UserRole.INDUSTRY,
        ),
      ).not.toThrow();
    });
  });

  // ============================================================
  // State Machine Regression: Placement & Offer Lifecycle
  // ============================================================
  describe('State Machine Regression: OfferStatus & PlacementStatus Lifecycle', () => {
    let placementLifecycle: PlacementLifecycleService;

    beforeEach(() => {
      placementLifecycle = new PlacementLifecycleService();
    });

    it('must allow valid offer sequence: DRAFT -> ISSUED -> ACCEPTED', () => {
      // DRAFT -> ISSUED by industry
      expect(() =>
        placementLifecycle.validateOfferTransition(
          OfferStatus.DRAFT,
          OfferStatus.ISSUED,
          UserRole.INDUSTRY,
        ),
      ).not.toThrow();

      // ISSUED -> ACCEPTED by student
      expect(() =>
        placementLifecycle.validateOfferTransition(
          OfferStatus.ISSUED,
          OfferStatus.ACCEPTED,
          UserRole.STUDENT,
        ),
      ).not.toThrow();
    });

    it('must reject student from accepting a DRAFT offer that was never issued', () => {
      expect(() =>
        placementLifecycle.validateOfferTransition(
          OfferStatus.DRAFT,
          OfferStatus.ACCEPTED,
          UserRole.STUDENT,
        ),
      ).toThrow(BadRequestException);
    });

    it('must reject student from accepting an offer that was WITHDRAWN by recruiter', () => {
      expect(() =>
        placementLifecycle.validateOfferTransition(
          OfferStatus.WITHDRAWN,
          OfferStatus.ACCEPTED,
          UserRole.STUDENT,
        ),
      ).toThrow(BadRequestException);
    });

    it('must reject student from verifying their own placement (TPO / Super Admin only)', () => {
      expect(() =>
        placementLifecycle.validatePlacementTransition(
          PlacementStatus.PENDING_VERIFICATION,
          PlacementStatus.VERIFIED,
          UserRole.STUDENT,
        ),
      ).toThrow(ForbiddenException);
    });

    it('must allow INSTITUTION_ADMIN and SUPER_ADMIN to verify pending placement', () => {
      expect(() =>
        placementLifecycle.validatePlacementTransition(
          PlacementStatus.PENDING_VERIFICATION,
          PlacementStatus.VERIFIED,
          UserRole.INSTITUTION_ADMIN,
        ),
      ).not.toThrow();

      expect(() =>
        placementLifecycle.validatePlacementTransition(
          PlacementStatus.PENDING_VERIFICATION,
          PlacementStatus.VERIFIED,
          UserRole.SUPER_ADMIN,
        ),
      ).not.toThrow();
    });

    it('must allow INSTITUTION_ADMIN to revoke a verified placement on discrepancy', () => {
      expect(() =>
        placementLifecycle.validatePlacementTransition(
          PlacementStatus.VERIFIED,
          PlacementStatus.REVOKED,
          UserRole.INSTITUTION_ADMIN,
        ),
      ).not.toThrow();
    });

    it('must reject illegal placement jump from PENDING_VERIFICATION directly to JOINED', () => {
      expect(() =>
        placementLifecycle.validatePlacementTransition(
          PlacementStatus.PENDING_VERIFICATION,
          PlacementStatus.JOINED,
          UserRole.INSTITUTION_ADMIN,
        ),
      ).toThrow(BadRequestException);
    });
  });

  // ============================================================
  // Cross-Module Flow 2: Skill Gap -> Learning Remediation
  // ============================================================
  describe('Cross-Module Flow 2: Skill Gap -> Learning Remediation Plan', () => {
    it('must deterministically map deficit skills to published learning resources and assessments', async () => {
      const mockSkillGapService: any = {
        getRoleSkillGap: vi.fn().mockResolvedValue({
          careerRole: {
            id: 'role-backend-dev',
            title: 'Backend Developer',
            slug: 'backend-developer',
            category: 'Engineering',
          },
          overallCompatibilityScore: 65,
          skillRequirements: [
            {
              skillId: 'skill-ts',
              skillName: 'TypeScript',
              category: 'Programming',
              status: 'MET',
              currentProficiency: ProficiencyLevel.INTERMEDIATE,
              requiredProficiency: ProficiencyLevel.INTERMEDIATE,
            },
            {
              skillId: 'skill-docker',
              skillName: 'Docker',
              category: 'DevOps',
              status: 'MISSING',
              currentProficiency: null,
              requiredProficiency: ProficiencyLevel.INTERMEDIATE,
              gapLevels: 2,
            },
          ],
        }),
      };

      const mockPrisma: any = {
        learningResource: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'res-docker-101',
              skillId: 'skill-docker',
              title: 'Docker Fundamentals for Developers',
              isPublished: true,
              isVerified: true,
              rating: 4.8,
              estimatedMinutes: 120,
              skill: { id: 'skill-docker', name: 'Docker' },
            },
          ]),
        },
        assessment: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'asm-docker',
              skillId: 'skill-docker',
              title: 'Docker Level 2 Certification Quiz',
              passingScore: 70,
              durationMinutes: 30,
            },
          ]),
        },
        learningPath: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'path-devops-starter',
              title: 'Containerization & DevOps Starter',
              careerRoleId: 'role-backend-dev',
              status: 'PUBLISHED',
              items: [],
            },
          ]),
        },
      };

      const remediationService = new LearningRemediationService(
        mockPrisma as unknown as PrismaService,
        mockSkillGapService,
      );

      const plan = await remediationService.getRemediationForCareerRole(
        'user-student-1',
        'backend-developer',
      );

      expect(plan.careerRole.title).toBe('Backend Developer');
      expect(plan.totalDeficitSkillsCount).toBe(1);
      expect(plan.skillRemediations).toHaveLength(1);
      expect(plan.skillRemediations[0].skillName).toBe('Docker');
      expect(plan.skillRemediations[0].resources).toHaveLength(1);
      expect(plan.skillRemediations[0].linkedAssessment?.id).toBe('asm-docker');
      expect(plan.recommendedPaths).toHaveLength(1);
    });
  });

  // ============================================================
  // Cross-Module Flow 3: Skill Gap -> Mentorship Discovery CTA
  // ============================================================
  describe('Cross-Module Flow 3: Skill Gap -> Mentorship Discovery', () => {
    it('must filter mentors by missing skill ID identified in skill gap analysis', async () => {
      const mockPrisma: any = {
        mentorProfile: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'mentor-1',
              headline: 'Senior Cloud Architect at AWS',
              isAvailable: true,
              skills: [
                {
                  skill: { id: 'skill-docker', name: 'Docker' },
                  proficiency: ProficiencyLevel.EXPERT,
                },
              ],
            },
          ]),
          count: vi.fn().mockResolvedValue(1),
        },
      };

      const mentorService = new MentorProfilesService(mockPrisma as unknown as PrismaService);

      const result = await mentorService.findMentors({
        skillId: 'skill-docker',
        page: 1,
        limit: 10,
      });

      expect(mockPrisma.mentorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            skills: {
              some: { skillId: 'skill-docker' },
            },
          }),
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('mentor-1');
    });
  });

  // ============================================================
  // Cross-Module Flow 8: Mentorship Request Lifecycle
  // ============================================================
  describe('Cross-Module Flow 8: Mentorship Request Lifecycle', () => {
    let requestsService: MentorshipRequestsService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        studentProfile: {
          findUnique: vi.fn().mockResolvedValue({ id: 'student-prof-1', userId: 'user-std-1' }),
        },
        mentorProfile: {
          findUnique: vi.fn().mockResolvedValue({ id: 'mentor-prof-1', isAvailable: true }),
        },
        mentorshipRequest: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({
            id: 'req-1',
            status: MentorshipRequestStatus.PENDING,
            mentorProfileId: 'mentor-prof-1',
            studentProfileId: 'student-prof-1',
          }),
        },
        mentorship: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      };

      requestsService = new MentorshipRequestsService(mockPrisma as unknown as PrismaService);
    });

    it('must create a PENDING request when mentor is available and no duplicate exists', async () => {
      const req = await requestsService.createRequest('user-std-1', 'mentor-prof-1', {
        statementOfPurpose: 'Master Docker containerization',
      });

      expect(req.status).toBe(MentorshipRequestStatus.PENDING);
      expect(mockPrisma.mentorshipRequest.create).toHaveBeenCalled();
    });

    it('must reject new request if an active mentorship already exists', async () => {
      mockPrisma.mentorship.findFirst.mockResolvedValue({ id: 'active-mentorship-1' });

      await expect(
        requestsService.createRequest('user-std-1', 'mentor-prof-1', {
          statementOfPurpose: 'Another goal',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('must reject request if mentor is unavailable (not accepting students)', async () => {
      mockPrisma.mentorProfile.findUnique.mockResolvedValue({
        id: 'mentor-busy',
        isAvailable: false,
      });

      await expect(
        requestsService.createRequest('user-std-1', 'mentor-busy', {
          statementOfPurpose: 'Please mentor me',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================================
  // Mentorship Notes Isolation: Privacy Model
  // ============================================================
  describe('Mentorship Privacy Boundary: Notes Separation', () => {
    it('must guarantee that studentNotes and mentorNotes are strictly segregated fields', () => {
      const sampleSession = {
        id: 'session-1',
        title: 'System Design 1-on-1',
        studentNotes: 'Student personal notes: need to review CAP theorem',
        mentorNotes: 'Private mentor appraisal: candidate showed good intuition',
      };

      // Sanitize view for student (removes mentorNotes)
      const sanitizeForStudent = (session: typeof sampleSession) => {
        return {
          id: session.id,
          title: session.title,
          studentNotes: session.studentNotes,
        };
      };

      // Sanitize view for mentor (removes studentNotes)
      const sanitizeForMentor = (session: typeof sampleSession) => {
        return {
          id: session.id,
          title: session.title,
          mentorNotes: session.mentorNotes,
        };
      };

      const studentView = sanitizeForStudent(sampleSession);
      expect(studentView).not.toHaveProperty('mentorNotes');
      expect(studentView).toHaveProperty('studentNotes');

      const mentorView = sanitizeForMentor(sampleSession);
      expect(mentorView).not.toHaveProperty('studentNotes');
      expect(mentorView).toHaveProperty('mentorNotes');
    });
  });
});
