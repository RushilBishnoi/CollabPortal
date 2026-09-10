import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ApplicationsService } from '../src/modules/applications/services/applications.service';
import { ApplicationLifecycleService } from '../src/modules/applications/services/application-lifecycle.service';
import { ApplicationDocumentsService } from '../src/modules/applications/services/application-documents.service';
import { InterviewsService } from '../src/modules/applications/services/interviews.service';
import {
  ApplicationStatus,
  OpportunityStatus,
  UserRole,
  InterviewMode,
  InterviewStatus,
  DocumentType,
} from '@prisma/client';

describe('Phase 9: Applications & Recruitment Workflow Spec', () => {
  let applicationsService: ApplicationsService;
  let lifecycleService: ApplicationLifecycleService;
  let documentsService: ApplicationDocumentsService;
  let interviewsService: InterviewsService;
  let mockPrisma: any;
  let mockMatchingService: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn((cb) => cb(mockPrisma)),
      application: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      applicationDocument: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
      applicationStatusHistory: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      interview: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      opportunity: {
        findUnique: vi.fn(),
      },
      studentProfile: {
        findUnique: vi.fn(),
      },
    };

    mockMatchingService = {
      resolveStudentProfile: vi.fn(),
      checkEligibility: vi.fn(),
      evaluateOpportunityMatch: vi.fn(),
    };

    lifecycleService = new ApplicationLifecycleService();
    documentsService = new ApplicationDocumentsService(mockPrisma);
    interviewsService = new InterviewsService(mockPrisma, lifecycleService);

    applicationsService = new ApplicationsService(
      mockPrisma,
      mockMatchingService,
      lifecycleService,
      documentsService,
    );
  });

  describe('Application Creation & Eligibility Gatekeeping', () => {
    const studentUser = { id: 'student-user-1' };
    const mockStudent = {
      id: 'student-profile-1',
      userId: 'student-user-1',
      fullName: 'Aarav Sharma',
      cgpa: 8.8,
      graduationYear: 2026,
      department: 'Computer Science',
    };

    const mockOpportunity = {
      id: 'opp-1',
      title: 'Full Stack Engineer Intern',
      status: OpportunityStatus.PUBLISHED,
      deadline: new Date(Date.now() + 86400000), // tomorrow
      minCgpa: 7.5,
      minGraduationYear: 2025,
      maxGraduationYear: 2027,
      eligibleDepartments: ['Computer Science', 'Information Technology'],
      industryProfile: { id: 'ind-profile-1', userId: 'recruiter-user-1', companyName: 'Acme Corp' },
      skills: [],
    };

    it('should successfully submit application for eligible student and create match snapshot', async () => {
      mockMatchingService.resolveStudentProfile.mockResolvedValue(mockStudent);
      mockPrisma.opportunity.findUnique.mockResolvedValue(mockOpportunity);
      mockPrisma.application.findUnique.mockResolvedValue(null); // No duplicate

      mockMatchingService.checkEligibility.mockReturnValue({
        isEligible: true,
        checks: {
          cgpa: { passed: true },
          graduationYear: { passed: true },
          department: { passed: true },
        },
        failureReasons: [],
      });

      mockMatchingService.evaluateOpportunityMatch.mockReturnValue({
        overallScore: 88.5,
        breakdown: {
          skillCompatibility: { score: 45.0, max: 50.0, percentage: 90.0, explanation: 'Strong match' },
          verificationConfidence: { score: 15.0, max: 15.0, percentage: 100.0, explanation: 'All verified' },
          careerInterest: { score: 15.0, max: 15.0, percentage: 100.0, explanation: 'Target role' },
          academicReadiness: { score: 8.5, max: 10.0, percentage: 85.0, explanation: 'High CGPA' },
          locationPreference: { score: 5.0, max: 10.0, percentage: 50.0, explanation: 'Location ok' },
        },
        skillsSummary: { totalRequired: 3, satisfiedCount: 3, deficitCount: 0, missingCount: 0, verifiedCount: 3 },
        skillRequirements: [],
        eligibility: { isEligible: true, failureReasons: [] },
      });

      mockPrisma.application.create.mockResolvedValue({
        id: 'app-1',
        opportunityId: 'opp-1',
        studentProfileId: 'student-profile-1',
        status: ApplicationStatus.APPLIED,
        matchScoreSnapshot: 88.5,
      });

      await applicationsService.apply(studentUser.id, {
        opportunityId: 'opp-1',
        coverLetter: 'I am excited to apply for this engineering role.',
      });

      expect(mockMatchingService.checkEligibility).toHaveBeenCalledWith(mockStudent, mockOpportunity);
      expect(mockMatchingService.evaluateOpportunityMatch).toHaveBeenCalledWith(mockStudent, mockOpportunity);
      expect(mockPrisma.application.create).toHaveBeenCalled();
      expect(mockPrisma.applicationStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          applicationId: 'app-1',
          fromStatus: null,
          toStatus: ApplicationStatus.APPLIED,
          changedByRole: UserRole.STUDENT,
        }),
      });
    });

    it('should reject application if student fails hard eligibility criteria', async () => {
      mockMatchingService.resolveStudentProfile.mockResolvedValue(mockStudent);
      mockPrisma.opportunity.findUnique.mockResolvedValue(mockOpportunity);
      mockPrisma.application.findUnique.mockResolvedValue(null);

      mockMatchingService.checkEligibility.mockReturnValue({
        isEligible: false,
        checks: {
          cgpa: { passed: false },
          graduationYear: { passed: true },
          department: { passed: true },
        },
        failureReasons: ['CGPA 6.2 is below the required 7.5 minimum.'],
      });

      await expect(
        applicationsService.apply(studentUser.id, { opportunityId: 'opp-1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject duplicate application with 409 Conflict', async () => {
      mockMatchingService.resolveStudentProfile.mockResolvedValue(mockStudent);
      mockPrisma.opportunity.findUnique.mockResolvedValue(mockOpportunity);
      mockPrisma.application.findUnique.mockResolvedValue({ id: 'existing-app-1' }); // Duplicate exists

      await expect(
        applicationsService.apply(studentUser.id, { opportunityId: 'opp-1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject application to draft, closed or expired opportunity with 400 Bad Request', async () => {
      mockMatchingService.resolveStudentProfile.mockResolvedValue(mockStudent);
      mockPrisma.opportunity.findUnique.mockResolvedValue({
        ...mockOpportunity,
        status: OpportunityStatus.DRAFT,
      });

      await expect(
        applicationsService.apply(studentUser.id, { opportunityId: 'opp-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Centralized State Machine & Lifecycle Transitions', () => {
    it('should permit valid forward transitions in state machine', () => {
      // APPLIED -> UNDER_REVIEW
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.APPLIED,
          ApplicationStatus.UNDER_REVIEW,
          UserRole.INDUSTRY,
        ),
      ).not.toThrow();

      // UNDER_REVIEW -> SHORTLISTED
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.UNDER_REVIEW,
          ApplicationStatus.SHORTLISTED,
          UserRole.INDUSTRY,
        ),
      ).not.toThrow();

      // SHORTLISTED -> INTERVIEW_SCHEDULED
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.SHORTLISTED,
          ApplicationStatus.INTERVIEW_SCHEDULED,
          UserRole.INDUSTRY,
        ),
      ).not.toThrow();

      // INTERVIEW_SCHEDULED -> SELECTED
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.INTERVIEW_SCHEDULED,
          ApplicationStatus.SELECTED,
          UserRole.INDUSTRY,
        ),
      ).not.toThrow();
    });

    it('should block invalid transition skips or backward transitions with 400 Bad Request', () => {
      // Cannot skip directly from APPLIED to SELECTED
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.APPLIED,
          ApplicationStatus.SELECTED,
          UserRole.INDUSTRY,
        ),
      ).toThrow(BadRequestException);

      // Cannot reopen REJECTED
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.REJECTED,
          ApplicationStatus.SHORTLISTED,
          UserRole.INDUSTRY,
        ),
      ).toThrow(BadRequestException);

      // Cannot reopen WITHDRAWN
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.WITHDRAWN,
          ApplicationStatus.SELECTED,
          UserRole.INDUSTRY,
        ),
      ).toThrow(BadRequestException);
    });

    it('should permit student to withdraw active application but block non-students', () => {
      // Student withdraws from APPLIED
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.APPLIED,
          ApplicationStatus.WITHDRAWN,
          UserRole.STUDENT,
        ),
      ).not.toThrow();

      // Student withdraws from SHORTLISTED
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.SHORTLISTED,
          ApplicationStatus.WITHDRAWN,
          UserRole.STUDENT,
        ),
      ).not.toThrow();

      // Student cannot transition to recruiter-controlled states (e.g. UNDER_REVIEW)
      expect(() =>
        lifecycleService.validateTransition(
          ApplicationStatus.APPLIED,
          ApplicationStatus.UNDER_REVIEW,
          UserRole.STUDENT,
        ),
      ).toThrow(ForbiddenException);
    });

    it('should record audit history atomically upon executing transition', async () => {
      const mockTx = {
        application: {
          update: vi.fn().mockResolvedValue({ id: 'app-1', status: ApplicationStatus.SHORTLISTED }),
        },
        applicationStatusHistory: {
          create: vi.fn().mockResolvedValue({ id: 'hist-1' }),
        },
      };

      await lifecycleService.executeTransition(
        mockTx,
        'app-1',
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.SHORTLISTED,
        'recruiter-user-1',
        UserRole.INDUSTRY,
        'Candidate shortlisted after technical review',
      );

      expect(mockTx.application.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: expect.objectContaining({
          status: ApplicationStatus.SHORTLISTED,
        }),
      });

      expect(mockTx.applicationStatusHistory.create).toHaveBeenCalledWith({
        data: {
          applicationId: 'app-1',
          fromStatus: ApplicationStatus.UNDER_REVIEW,
          toStatus: ApplicationStatus.SHORTLISTED,
          changedByRole: UserRole.INDUSTRY,
          changedById: 'recruiter-user-1',
          notes: 'Candidate shortlisted after technical review',
        },
      });
    });
  });

  describe('Ownership & IDOR Security Controls', () => {
    it('should prevent Student A from withdrawing or viewing Student B application', async () => {
      mockMatchingService.resolveStudentProfile.mockResolvedValue({
        id: 'student-profile-A',
        userId: 'student-user-A',
      });

      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-B',
        studentProfileId: 'student-profile-B', // Belongs to Student B
        status: ApplicationStatus.APPLIED,
      });

      await expect(applicationsService.withdraw('student-user-A', 'app-B')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should prevent Recruiter A from accessing or updating Recruiter B candidate applications', async () => {
      mockPrisma.opportunity.findUnique.mockResolvedValue({
        id: 'opp-B',
        industryProfile: { id: 'ind-B', userId: 'recruiter-B' }, // Owned by Recruiter B
      });

      await expect(
        applicationsService.findRecruiterApplications('recruiter-A', 'opp-B'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should strictly exclude internal recruiter notes from student-facing responses', async () => {
      mockMatchingService.resolveStudentProfile.mockResolvedValue({
        id: 'student-profile-1',
        userId: 'student-user-1',
      });

      mockPrisma.application.count.mockResolvedValue(1);
      mockPrisma.application.findMany.mockResolvedValue([
        {
          id: 'app-1',
          status: ApplicationStatus.UNDER_REVIEW,
          submittedAt: new Date(),
          matchScoreSnapshot: 92.0,
          coverLetter: 'Hello',
          recruiterNotes: 'TOP SECRET INTERNAL INTERVIEW NOTE - DO NOT LEAK',
          rejectionReason: null,
          opportunity: { id: 'opp-1', title: 'Intern', opportunityType: 'INTERNSHIP', isRemote: true },
          documents: [],
          interviews: [
            {
              id: 'int-1',
              title: 'Round 1',
              scheduledAt: new Date(),
              durationMins: 45,
              mode: 'ONLINE_MEETING',
              status: 'SCHEDULED',
            },
          ],
          statusHistory: [],
        },
      ]);

      const result = await applicationsService.findStudentApplications('student-user-1');
      const firstItem = result.data[0] as any;

      expect(firstItem.recruiterNotes).toBeUndefined();
      expect(firstItem.matchScore).toBe(92.0);
    });
  });

  describe('Interview Scheduling & Evaluation', () => {
    it('should allow authorized recruiter to schedule interview and update status to INTERVIEW_SCHEDULED', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-1',
        status: ApplicationStatus.SHORTLISTED,
        opportunity: {
          industryProfile: { id: 'ind-1', userId: 'recruiter-user-1' },
        },
      });

      mockPrisma.interview.create.mockResolvedValue({
        id: 'int-1',
        applicationId: 'app-1',
        title: 'Technical Round 1',
        status: InterviewStatus.SCHEDULED,
      });

      const result = await interviewsService.scheduleInterview('recruiter-user-1', 'app-1', {
        title: 'Technical Round 1',
        scheduledAt: new Date(Date.now() + 172800000).toISOString(),
        durationMins: 60,
        mode: InterviewMode.ONLINE_MEETING,
        meetingLink: 'https://meet.google.com/abc-xyz',
        interviewer: 'Chief Architect',
        instructions: 'Please be ready with your code IDE.',
      });

      expect(result.id).toBe('int-1');
      expect(mockPrisma.interview.create).toHaveBeenCalled();
      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'app-1' },
          data: expect.objectContaining({ status: ApplicationStatus.INTERVIEW_SCHEDULED }),
        }),
      );
    });

    it('should reject interview scheduling from unauthorized recruiter with 403 Forbidden', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-1',
        status: ApplicationStatus.SHORTLISTED,
        opportunity: {
          industryProfile: { id: 'ind-1', userId: 'recruiter-user-1' }, // Owned by recruiter 1
        },
      });

      await expect(
        interviewsService.scheduleInterview('intruder-recruiter', 'app-1', {
          title: 'Technical Round 1',
          scheduledAt: new Date().toISOString(),
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Document Validation & Upload Security', () => {
    it('should reject file exceeding maximum 5MB size limit', async () => {
      const oversizedFile = {
        originalFilename: 'large_resume.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.alloc(6 * 1024 * 1024), // 6MB
        sizeBytes: 6 * 1024 * 1024,
      };

      const mockTx = { applicationDocument: { create: vi.fn() } };

      await expect(
        documentsService.storeDocument(mockTx, 'app-1', oversizedFile, DocumentType.RESUME),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unsafe executable or script file extensions', async () => {
      const maliciousFile = {
        originalFilename: 'exploit.exe',
        mimeType: 'application/x-msdownload',
        buffer: Buffer.from('malicious payload'),
        sizeBytes: 100,
      };

      const mockTx = { applicationDocument: { create: vi.fn() } };

      await expect(
        documentsService.storeDocument(mockTx, 'app-1', maliciousFile, DocumentType.RESUME),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
