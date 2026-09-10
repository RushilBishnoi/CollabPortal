import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CollaborationsService } from '../src/modules/collaborations/services/collaborations.service';
import { CollaborationLifecycleService } from '../src/modules/collaborations/services/collaboration-lifecycle.service';
import { ParticipationService } from '../src/modules/collaborations/services/participation.service';
import { AnalyticsService } from '../src/modules/analytics/services/analytics.service';
import {
  CollaborationStatus,
  ParticipationStatus,
  CollaborationAudience,
  CollaborationMode,
  CollaborationType,
  UserRole,
} from '@prisma/client';

describe('Phase 11: Academia–Industry Collaboration Domain Spec', () => {
  let collaborationsService: CollaborationsService;
  let lifecycleService: CollaborationLifecycleService;
  let participationService: ParticipationService;
  let analyticsService: AnalyticsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn((cb) => cb(mockPrisma)),
      user: {
        findUnique: vi.fn(),
      },
      collaboration: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      collaborationParticipation: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      collaborationStatusHistory: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      industryProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
      },
      facultyProfile: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      studentProfile: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      institutionProfile: {
        findUnique: vi.fn(),
        count: vi.fn(),
      },
    };

    lifecycleService = new CollaborationLifecycleService();
    collaborationsService = new CollaborationsService(mockPrisma, lifecycleService);
    participationService = new ParticipationService(mockPrisma, lifecycleService);
    analyticsService = new AnalyticsService(mockPrisma);
  });

  describe('1. Collaboration Authoring & CRUD', () => {
    const mockIndustry = {
      id: 'ind-1',
      userId: 'industry-user-1',
      companyName: 'Tech Innovations Ltd',
      industryType: 'Software',
      isVerified: true,
    };

    it('should successfully create a new collaboration in DRAFT status', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue(mockIndustry);
      mockPrisma.collaboration.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'collab-1',
          ...data,
          industryProfile: mockIndustry,
        }),
      );

      const result = await collaborationsService.create('industry-user-1', {
        title: 'Microservices & DevOps Masterclass',
        description: 'Hands-on training on modern microservices architecture',
        collaborationType: CollaborationType.WORKSHOP,
        targetAudience: CollaborationAudience.BOTH,
        mode: CollaborationMode.ONLINE,
        maxParticipants: 50,
        eligibleDepartments: ['Computer Science', 'Information Technology'],
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('collab-1');
      expect(result.title).toBe('Microservices & DevOps Masterclass');
      expect(result.status).toBe(CollaborationStatus.DRAFT);
      expect(result.industryProfileId).toBe('ind-1');
    });

    it('should throw NotFoundException if user does not exist during profile resolution', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        collaborationsService.create('unknown-user', {
          title: 'AI in Healthcare',
          description: 'Seminar',
          collaborationType: CollaborationType.GUEST_LECTURE,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should auto-provision industry profile with neutral non-fabricated placeholders if missing for valid authenticated INDUSTRY user', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'industry-user-new',
        email: 'recruiter@newtech.com',
        role: UserRole.INDUSTRY,
      });
      mockPrisma.industryProfile.create.mockResolvedValue({
        id: 'ind-new',
        userId: 'industry-user-new',
        companyName: 'Unspecified Organization',
        industryType: 'Unspecified',
      });
      mockPrisma.collaboration.findMany.mockResolvedValue([]);

      const result = await collaborationsService.findMyCollaborations('industry-user-new');

      expect(mockPrisma.industryProfile.create).toHaveBeenCalledWith({
        data: {
          userId: 'industry-user-new',
          companyName: 'Unspecified Organization',
          industryType: 'Unspecified',
        },
      });
      expect(mockPrisma.collaboration.findMany).toHaveBeenCalledWith({
        where: { industryProfileId: 'ind-new' },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              participations: true,
            },
          },
        },
      });
      expect(result).toEqual([]);
    });

    it('should return existing profile and not call create if profile already exists', async () => {
      const existingProfile = {
        id: 'ind-existing',
        userId: 'industry-user-existing',
        companyName: 'Existing Tech Ltd',
        industryType: 'Technology',
      };
      mockPrisma.industryProfile.findUnique.mockResolvedValue(existingProfile);

      const profile = await collaborationsService.resolveIndustryProfile('industry-user-existing');

      expect(profile).toEqual(existingProfile);
      expect(mockPrisma.industryProfile.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user role is not INDUSTRY during profile resolution', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'student-user-1',
        email: 'student@univ.edu',
        role: UserRole.STUDENT,
      });

      await expect(
        collaborationsService.resolveIndustryProfile('student-user-1'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.industryProfile.create).not.toHaveBeenCalled();
    });

    it('should handle concurrent profile resolution gracefully via fallback lookup', async () => {
      const fallbackProfile = {
        id: 'ind-concurrent',
        userId: 'industry-user-race',
        companyName: 'RACE Corp',
        industryType: 'Technology',
      };

      // 1st findUnique -> null (simulating initial check before concurrent insert)
      // 2nd findUnique -> fallbackProfile (simulating re-query after create error)
      mockPrisma.industryProfile.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(fallbackProfile);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'industry-user-race',
        email: 'race@tech.com',
        role: UserRole.INDUSTRY,
      });

      // Simulate P2002 unique constraint error from database on concurrent insert
      mockPrisma.industryProfile.create.mockRejectedValue(new Error('Unique constraint failed on userId'));

      const result = await collaborationsService.resolveIndustryProfile('industry-user-race');

      expect(result).toEqual(fallbackProfile);
    });

    it('should update collaboration details when called by the owner', async () => {
      const existing = {
        id: 'collab-1',
        industryProfileId: 'ind-1',
        status: CollaborationStatus.DRAFT,
        title: 'Old Title',
      };
      mockPrisma.collaboration.findUnique.mockResolvedValue(existing);
      mockPrisma.industryProfile.findUnique.mockResolvedValue(mockIndustry);
      mockPrisma.collaboration.update.mockResolvedValue({
        ...existing,
        title: 'Updated Title',
      });

      const result = await collaborationsService.update(
        'industry-user-1',
        'collab-1',
        { title: 'Updated Title' },
        UserRole.INDUSTRY,
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should reject editing if requester is not the owner (IDOR protection)', async () => {
      const existing = {
        id: 'collab-1',
        industryProfileId: 'ind-other',
        status: CollaborationStatus.DRAFT,
      };
      mockPrisma.collaboration.findUnique.mockResolvedValue(existing);
      mockPrisma.industryProfile.findUnique.mockResolvedValue(mockIndustry); // id: 'ind-1'

      await expect(
        collaborationsService.update(
          'industry-user-1',
          'collab-1',
          { title: 'Hacked Title' },
          UserRole.INDUSTRY,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject editing a COMPLETED or CANCELLED collaboration', async () => {
      const existing = {
        id: 'collab-1',
        industryProfileId: 'ind-1',
        status: CollaborationStatus.COMPLETED,
      };
      mockPrisma.collaboration.findUnique.mockResolvedValue(existing);
      mockPrisma.industryProfile.findUnique.mockResolvedValue(mockIndustry);

      await expect(
        collaborationsService.update(
          'industry-user-1',
          'collab-1',
          { title: 'New Title' },
          UserRole.INDUSTRY,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should delete a DRAFT collaboration', async () => {
      const existing = {
        id: 'collab-1',
        industryProfileId: 'ind-1',
        status: CollaborationStatus.DRAFT,
      };
      mockPrisma.collaboration.findUnique.mockResolvedValue(existing);
      mockPrisma.industryProfile.findUnique.mockResolvedValue(mockIndustry);
      mockPrisma.collaboration.delete.mockResolvedValue(existing);

      const res = await collaborationsService.delete('industry-user-1', 'collab-1', UserRole.INDUSTRY);
      expect(res.success).toBe(true);
    });

    it('should prevent deleting an active (OPEN) collaboration', async () => {
      const existing = {
        id: 'collab-1',
        industryProfileId: 'ind-1',
        status: CollaborationStatus.OPEN,
      };
      mockPrisma.collaboration.findUnique.mockResolvedValue(existing);
      mockPrisma.industryProfile.findUnique.mockResolvedValue(mockIndustry);

      await expect(
        collaborationsService.delete('industry-user-1', 'collab-1', UserRole.INDUSTRY),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Collaboration Lifecycle State Transitions', () => {
    it('should allow valid transitions for INDUSTRY owner: DRAFT -> OPEN -> CLOSED -> COMPLETED', () => {
      expect(() =>
        lifecycleService.validateCollaborationTransition(
          CollaborationStatus.DRAFT,
          CollaborationStatus.OPEN,
          UserRole.INDUSTRY,
        ),
      ).not.toThrow();

      expect(() =>
        lifecycleService.validateCollaborationTransition(
          CollaborationStatus.OPEN,
          CollaborationStatus.CLOSED,
          UserRole.INDUSTRY,
        ),
      ).not.toThrow();

      expect(() =>
        lifecycleService.validateCollaborationTransition(
          CollaborationStatus.CLOSED,
          CollaborationStatus.COMPLETED,
          UserRole.INDUSTRY,
        ),
      ).not.toThrow();
    });

    it('should reject invalid collaboration transitions', () => {
      // DRAFT cannot jump straight to COMPLETED
      expect(() =>
        lifecycleService.validateCollaborationTransition(
          CollaborationStatus.DRAFT,
          CollaborationStatus.COMPLETED,
          UserRole.INDUSTRY,
        ),
      ).toThrow(BadRequestException);

      // Terminal state cannot transition
      expect(() =>
        lifecycleService.validateCollaborationTransition(
          CollaborationStatus.COMPLETED,
          CollaborationStatus.OPEN,
          UserRole.INDUSTRY,
        ),
      ).toThrow(BadRequestException);

      expect(() =>
        lifecycleService.validateCollaborationTransition(
          CollaborationStatus.CANCELLED,
          CollaborationStatus.OPEN,
          UserRole.INDUSTRY,
        ),
      ).toThrow(BadRequestException);
    });

    it('should reject unauthorized roles from altering collaboration lifecycle', () => {
      expect(() =>
        lifecycleService.validateCollaborationTransition(
          CollaborationStatus.DRAFT,
          CollaborationStatus.OPEN,
          UserRole.STUDENT,
        ),
      ).toThrow(ForbiddenException);

      expect(() =>
        lifecycleService.validateCollaborationTransition(
          CollaborationStatus.DRAFT,
          CollaborationStatus.OPEN,
          UserRole.FACULTY,
        ),
      ).toThrow(ForbiddenException);
    });
  });

  describe('3. Faculty Participation & Gatekeeping', () => {
    const mockFaculty = {
      id: 'fac-1',
      userId: 'fac-user-1',
      fullName: 'Dr. Ramesh Kumar',
      department: 'Computer Science',
    };

    const mockOpenCollab = {
      id: 'collab-1',
      title: 'Faculty Development Program on Cloud Computing',
      status: CollaborationStatus.OPEN,
      targetAudience: CollaborationAudience.FACULTY,
      eligibleDepartments: ['Computer Science', 'Electronics'],
      deadline: new Date(Date.now() + 86400000), // tomorrow
      maxParticipants: 30,
    };

    it('should successfully submit participation request for eligible faculty', async () => {
      mockPrisma.facultyProfile.findUnique.mockResolvedValue(mockFaculty);
      mockPrisma.collaboration.findUnique.mockResolvedValue(mockOpenCollab);
      mockPrisma.collaborationParticipation.findUnique.mockResolvedValue(null); // No duplicate
      mockPrisma.collaborationParticipation.create.mockResolvedValue({
        id: 'part-1',
        collaborationId: 'collab-1',
        facultyProfileId: 'fac-1',
        studentProfileId: null,
        status: ParticipationStatus.PENDING,
      });

      const res = await participationService.requestFacultyParticipation(
        'fac-user-1',
        'collab-1',
        { motivation: 'Keen to learn hands-on cloud architectures.' },
      );

      expect(res).toBeDefined();
      expect(res.id).toBe('part-1');
      expect(res.status).toBe(ParticipationStatus.PENDING);
      expect(mockPrisma.collaborationStatusHistory.create).toHaveBeenCalled();
    });

    it('should reject participation if collaboration is not OPEN', async () => {
      mockPrisma.facultyProfile.findUnique.mockResolvedValue(mockFaculty);
      mockPrisma.collaboration.findUnique.mockResolvedValue({
        ...mockOpenCollab,
        status: CollaborationStatus.DRAFT,
      });

      await expect(
        participationService.requestFacultyParticipation('fac-user-1', 'collab-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject participation if target audience is STUDENT only', async () => {
      mockPrisma.facultyProfile.findUnique.mockResolvedValue(mockFaculty);
      mockPrisma.collaboration.findUnique.mockResolvedValue({
        ...mockOpenCollab,
        targetAudience: CollaborationAudience.STUDENT,
      });

      await expect(
        participationService.requestFacultyParticipation('fac-user-1', 'collab-1', {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject participation if faculty department is ineligible', async () => {
      mockPrisma.facultyProfile.findUnique.mockResolvedValue({
        ...mockFaculty,
        department: 'Mechanical Engineering',
      });
      mockPrisma.collaboration.findUnique.mockResolvedValue(mockOpenCollab);

      await expect(
        participationService.requestFacultyParticipation('fac-user-1', 'collab-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject participation if deadline has passed', async () => {
      mockPrisma.facultyProfile.findUnique.mockResolvedValue(mockFaculty);
      mockPrisma.collaboration.findUnique.mockResolvedValue({
        ...mockOpenCollab,
        deadline: new Date(Date.now() - 86400000), // yesterday
      });

      await expect(
        participationService.requestFacultyParticipation('fac-user-1', 'collab-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate participation request', async () => {
      mockPrisma.facultyProfile.findUnique.mockResolvedValue(mockFaculty);
      mockPrisma.collaboration.findUnique.mockResolvedValue(mockOpenCollab);
      mockPrisma.collaborationParticipation.findUnique.mockResolvedValue({
        id: 'existing-part',
      });

      await expect(
        participationService.requestFacultyParticipation('fac-user-1', 'collab-1', {}),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow faculty to withdraw their own pending participation', async () => {
      mockPrisma.facultyProfile.findUnique.mockResolvedValue(mockFaculty);
      mockPrisma.collaborationParticipation.findUnique.mockResolvedValue({
        id: 'part-1',
        facultyProfileId: 'fac-1',
        status: ParticipationStatus.PENDING,
      });
      mockPrisma.collaborationParticipation.update.mockResolvedValue({
        id: 'part-1',
        status: ParticipationStatus.WITHDRAWN,
      });

      const res = await participationService.withdrawParticipation(
        'fac-user-1',
        'part-1',
        UserRole.FACULTY,
      );

      expect(res.status).toBe(ParticipationStatus.WITHDRAWN);
    });
  });

  describe('4. Student Participation & Gatekeeping', () => {
    const mockStudent = {
      id: 'stud-1',
      userId: 'stud-user-1',
      fullName: 'Sneha Patel',
      department: 'Information Technology',
    };

    const mockOpenCollab = {
      id: 'collab-2',
      title: 'Industry Live Project on FinTech',
      status: CollaborationStatus.OPEN,
      targetAudience: CollaborationAudience.STUDENT,
      eligibleDepartments: ['Information Technology', 'Computer Science'],
      deadline: new Date(Date.now() + 86400000),
      maxParticipants: 10,
    };

    it('should successfully submit participation request for eligible student', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.collaboration.findUnique.mockResolvedValue(mockOpenCollab);
      mockPrisma.collaborationParticipation.findUnique.mockResolvedValue(null);
      mockPrisma.collaborationParticipation.create.mockResolvedValue({
        id: 'part-2',
        collaborationId: 'collab-2',
        facultyProfileId: null,
        studentProfileId: 'stud-1',
        status: ParticipationStatus.PENDING,
      });

      const res = await participationService.requestStudentParticipation(
        'stud-user-1',
        'collab-2',
        { motivation: 'Interested in building FinTech projects.' },
      );

      expect(res).toBeDefined();
      expect(res.id).toBe('part-2');
      expect(res.status).toBe(ParticipationStatus.PENDING);
    });

    it('should reject participation if target audience is FACULTY only', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.collaboration.findUnique.mockResolvedValue({
        ...mockOpenCollab,
        targetAudience: CollaborationAudience.FACULTY,
      });

      await expect(
        participationService.requestStudentParticipation('stud-user-1', 'collab-2', {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('5. Capacity & Transactional Approval Gatekeeping', () => {
    it('should approve participant if maxParticipants capacity is not exceeded', async () => {
      const mockCollab = { id: 'collab-1', maxParticipants: 5 };
      mockPrisma.collaborationParticipation.findUnique.mockResolvedValue({
        id: 'part-1',
        collaborationId: 'collab-1',
        status: ParticipationStatus.PENDING,
        collaboration: mockCollab,
      });
      mockPrisma.collaborationParticipation.count.mockResolvedValue(3); // 3 < 5
      mockPrisma.collaborationParticipation.update.mockResolvedValue({
        id: 'part-1',
        status: ParticipationStatus.APPROVED,
      });

      const res = await lifecycleService.executeParticipationTransition(
        mockPrisma,
        'part-1',
        ParticipationStatus.PENDING,
        ParticipationStatus.APPROVED,
        'ind-user-1',
        UserRole.INDUSTRY,
        'Approved for participation',
      );

      expect(res.status).toBe(ParticipationStatus.APPROVED);
    });

    it('should reject approval if maxParticipants capacity has been reached', async () => {
      const mockCollab = { id: 'collab-1', maxParticipants: 5 };
      mockPrisma.collaborationParticipation.findUnique.mockResolvedValue({
        id: 'part-1',
        collaborationId: 'collab-1',
        status: ParticipationStatus.PENDING,
        collaboration: mockCollab,
      });
      mockPrisma.collaborationParticipation.count.mockResolvedValue(5); // 5 >= 5

      await expect(
        lifecycleService.executeParticipationTransition(
          mockPrisma,
          'part-1',
          ParticipationStatus.PENDING,
          ParticipationStatus.APPROVED,
          'ind-user-1',
          UserRole.INDUSTRY,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('6. Participation Status Transitions & Terminal Constraints', () => {
    it('should enforce terminal state rules (REJECTED, WITHDRAWN, COMPLETED, CANCELLED cannot transition)', () => {
      expect(() =>
        lifecycleService.validateParticipationTransition(
          ParticipationStatus.REJECTED,
          ParticipationStatus.APPROVED,
          UserRole.INDUSTRY,
        ),
      ).toThrow(BadRequestException);

      expect(() =>
        lifecycleService.validateParticipationTransition(
          ParticipationStatus.WITHDRAWN,
          ParticipationStatus.APPROVED,
          UserRole.INDUSTRY,
        ),
      ).toThrow(BadRequestException);

      expect(() =>
        lifecycleService.validateParticipationTransition(
          ParticipationStatus.COMPLETED,
          ParticipationStatus.APPROVED,
          UserRole.INDUSTRY,
        ),
      ).toThrow(BadRequestException);
    });
  });

  describe('7. IDOR Protection & Private Field Isolation', () => {
    it('should prevent student A from viewing student B participation (IDOR protection)', async () => {
      mockPrisma.collaborationParticipation.findUnique.mockResolvedValue({
        id: 'part-99',
        studentProfileId: 'stud-other',
      });
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'stud-mine',
        userId: 'student-user-1',
      });

      await expect(
        participationService.getMyParticipationById('student-user-1', 'part-99', UserRole.STUDENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent faculty A from viewing faculty B participation (IDOR protection)', async () => {
      mockPrisma.collaborationParticipation.findUnique.mockResolvedValue({
        id: 'part-88',
        facultyProfileId: 'fac-other',
      });
      mockPrisma.facultyProfile.findUnique.mockResolvedValue({
        id: 'fac-mine',
        userId: 'faculty-user-1',
      });

      await expect(
        participationService.getMyParticipationById('faculty-user-1', 'part-88', UserRole.FACULTY),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('8. Collaboration Analytics Calculations', () => {
    it('should compute institutional collaboration metrics scoped to institution members', async () => {
      const mockInstitution = { id: 'inst-1', name: 'National Institute of Technology' };
      mockPrisma.institutionProfile.findUnique.mockResolvedValue(mockInstitution);

      mockPrisma.studentProfile.findMany.mockResolvedValue([{ id: 'stud-1' }, { id: 'stud-2' }]);
      mockPrisma.facultyProfile.findMany.mockResolvedValue([{ id: 'fac-1' }]);

      mockPrisma.collaborationParticipation.findMany.mockResolvedValue([
        {
          id: 'part-1',
          facultyProfileId: 'fac-1',
          studentProfileId: null,
          status: ParticipationStatus.APPROVED,
          collaboration: {
            collaborationType: CollaborationType.FDP,
            industryProfile: { id: 'ind-1', companyName: 'CloudCorp' },
          },
        },
        {
          id: 'part-2',
          facultyProfileId: null,
          studentProfileId: 'stud-1',
          status: ParticipationStatus.COMPLETED,
          collaboration: {
            collaborationType: CollaborationType.WORKSHOP,
            industryProfile: { id: 'ind-1', companyName: 'CloudCorp' },
          },
        },
        {
          id: 'part-3',
          facultyProfileId: null,
          studentProfileId: 'stud-2',
          status: ParticipationStatus.PENDING,
          collaboration: {
            collaborationType: CollaborationType.LIVE_PROJECT,
            industryProfile: { id: 'ind-2', companyName: 'DataInc' },
          },
        },
      ]);

      const analytics = await analyticsService.getCollaborationAnalytics(
        'inst-admin-user-1',
        UserRole.INSTITUTION_ADMIN,
      );

      expect(analytics).toBeDefined();
      expect(analytics.scope).toBe('INSTITUTION');
      expect(analytics.summary.totalParticipations).toBe(3);
      expect(analytics.summary.facultyParticipations).toBe(1);
      expect(analytics.summary.studentParticipations).toBe(2);
      expect(analytics.summary.approvedCount).toBe(1);
      expect(analytics.summary.completedCount).toBe(1);
      expect(analytics.summary.pendingCount).toBe(1);
      expect(analytics.summary.activeIndustriesCount).toBe(2);
      expect(analytics.byType![CollaborationType.FDP]).toBe(1);
      expect(analytics.byType![CollaborationType.WORKSHOP]).toBe(1);
      expect(analytics.byType![CollaborationType.LIVE_PROJECT]).toBe(1);
    });

    it('should compute global collaboration metrics for Super Admin', async () => {
      mockPrisma.collaboration.count.mockResolvedValue(10);
      mockPrisma.collaboration.findMany.mockResolvedValue([
        {
          id: 'c-1',
          status: CollaborationStatus.OPEN,
          collaborationType: CollaborationType.WORKSHOP,
          targetAudience: CollaborationAudience.BOTH,
          mode: CollaborationMode.ONLINE,
          industryProfile: { id: 'ind-1', companyName: 'Google Cloud' },
        },
        {
          id: 'c-2',
          status: CollaborationStatus.COMPLETED,
          collaborationType: CollaborationType.RESEARCH,
          targetAudience: CollaborationAudience.FACULTY,
          mode: CollaborationMode.HYBRID,
          industryProfile: { id: 'ind-1', companyName: 'Google Cloud' },
        },
      ]);

      mockPrisma.collaborationParticipation.findMany.mockResolvedValue([
        { id: 'p-1', status: ParticipationStatus.APPROVED, facultyProfileId: 'f-1', studentProfileId: null },
        { id: 'p-2', status: ParticipationStatus.COMPLETED, facultyProfileId: null, studentProfileId: 's-1' },
      ]);
      mockPrisma.industryProfile.count.mockResolvedValue(5);

      const analytics = await analyticsService.getCollaborationAnalytics(
        'super-admin-user-1',
        UserRole.SUPER_ADMIN,
      );

      expect(analytics).toBeDefined();
      expect(analytics.scope).toBe('PLATFORM');
      expect(analytics.summary.totalCollaborations).toBe(10);
      expect(analytics.summary.totalParticipations).toBe(2);
      expect(analytics.summary.activeCollaborations).toBe(1);
      expect(analytics.topCollaboratingIndustries![0].companyName).toBe('Google Cloud');
      expect(analytics.topCollaboratingIndustries![0].count).toBe(2);
    });
  });
});
