import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  UserRole,
  MentorRoleType,
  MentorshipRequestStatus,
  MentorshipStatus,
  MentorshipSessionStatus,
  MentorshipGoalStatus,
} from '@prisma/client';
import { MentorProfilesService } from '../src/modules/mentorship/services/mentor-profiles.service';
import { MentorAvailabilityService } from '../src/modules/mentorship/services/mentor-availability.service';
import { MentorshipRequestsService } from '../src/modules/mentorship/services/mentorship-requests.service';
import { MentorshipSessionsService } from '../src/modules/mentorship/services/mentorship-sessions.service';
import { MentorshipGoalsService } from '../src/modules/mentorship/services/mentorship-goals.service';
import { AnalyticsService } from '../src/modules/analytics/services/analytics.service';
import {
  ForbiddenException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('Phase 14: Mentorship & Mentor Engagement System Tests', () => {
  let prismaMock: any;
  let profilesService: MentorProfilesService;
  let availabilityService: MentorAvailabilityService;
  let requestsService: MentorshipRequestsService;
  let sessionsService: MentorshipSessionsService;
  let goalsService: MentorshipGoalsService;
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    prismaMock = {
      $transaction: async (cb: any) => cb(prismaMock),
      mentorProfile: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        count: vi.fn(),
      },
      mentorSkill: {
        createMany: vi.fn(),
        deleteMany: vi.fn(),
        groupBy: vi.fn(),
      },
      mentorCareerRole: {
        createMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      mentorAvailability: {
        findMany: vi.fn(),
        createMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      mentorshipRequest: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      mentorship: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      mentorshipGoal: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      mentorshipSession: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      studentProfile: {
        findUnique: vi.fn(),
      },
      skill: {
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      careerRole: {
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      learningPath: {
        findUnique: vi.fn(),
      },
    };

    profilesService = new MentorProfilesService(prismaMock);
    availabilityService = new MentorAvailabilityService(prismaMock);
    requestsService = new MentorshipRequestsService(prismaMock);
    sessionsService = new MentorshipSessionsService(prismaMock);
    goalsService = new MentorshipGoalsService(prismaMock);
    analyticsService = new AnalyticsService(prismaMock);
  });

  // 1. Industry Mentor Profile Creation
  it('allows INDUSTRY user to create and upsert a mentor profile', async () => {
    prismaMock.mentorProfile.upsert.mockResolvedValue({ id: 'mentor-1', userId: 'ind-user-1' });
    prismaMock.mentorProfile.findUnique.mockResolvedValue({
      id: 'mentor-1',
      userId: 'ind-user-1',
      headline: 'Principal Engineer at Google',
      mentorRoleType: MentorRoleType.INDUSTRY,
    });

    const result = await profilesService.upsertProfile('ind-user-1', UserRole.INDUSTRY, {
      headline: 'Principal Engineer at Google',
      bio: 'Over 10 years in backend systems',
      designation: 'Staff SDE',
      companyOrInstitution: 'Google',
      yearsOfExperience: 10,
      maxMentees: 5,
    });

    expect(prismaMock.mentorProfile.upsert).toHaveBeenCalled();
    expect(result?.headline).toBe('Principal Engineer at Google');
  });

  // 2. Faculty Mentor Profile Creation
  it('allows FACULTY user to create a mentor profile with roleType FACULTY', async () => {
    prismaMock.mentorProfile.upsert.mockResolvedValue({ id: 'mentor-fac-1', userId: 'fac-user-1' });
    prismaMock.mentorProfile.findUnique.mockResolvedValue({
      id: 'mentor-fac-1',
      userId: 'fac-user-1',
      mentorRoleType: MentorRoleType.FACULTY,
    });

    const result = await profilesService.upsertProfile('fac-user-1', UserRole.FACULTY, {
      headline: 'Associate Professor of Computer Science',
      bio: 'Research in Distributed Databases',
      designation: 'Associate Professor',
      companyOrInstitution: 'IIT Bombay',
      yearsOfExperience: 15,
    });

    expect(prismaMock.mentorProfile.upsert).toHaveBeenCalled();
    expect(result?.mentorRoleType).toBe(MentorRoleType.FACULTY);
  });

  // 3. Unauthorized user role cannot become mentor
  it('rejects STUDENT user role attempting to create a mentor profile', async () => {
    await expect(
      profilesService.upsertProfile('student-user-1', UserRole.STUDENT, {
        headline: 'Aspiring Student',
        bio: 'Learning web development',
        designation: 'Student',
        companyOrInstitution: 'MIT',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  // 3b. Mentor Availability configuration
  it('configures weekly recurring availability slots for mentor', async () => {
    prismaMock.mentorProfile.findUnique.mockResolvedValue({ id: 'mentor-1', userId: 'ind-user-1' });
    prismaMock.mentorAvailability.findMany.mockResolvedValue([
      { id: 'avail-1', dayOfWeek: 1, startTime: '14:00', endTime: '18:00', slotDurationMins: 45 },
    ]);

    const result = await availabilityService.setAvailability('ind-user-1', {
      slots: [
        { dayOfWeek: 1, startTime: '14:00', endTime: '18:00', slotDurationMins: 45, isRecurring: true },
      ],
    });

    expect(prismaMock.mentorAvailability.deleteMany).toHaveBeenCalled();
    expect(prismaMock.mentorAvailability.createMany).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  // 3c. Invalid slot time range validation
  it('rejects availability slot when startTime is after endTime', async () => {
    prismaMock.mentorProfile.findUnique.mockResolvedValue({ id: 'mentor-1', userId: 'ind-user-1' });

    await expect(
      availabilityService.setAvailability('ind-user-1', {
        slots: [
          { dayOfWeek: 1, startTime: '18:00', endTime: '14:00' },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // 4. Mentor discovery filtering
  it('discovers mentors with skill, career role, and keyword filters', async () => {
    prismaMock.mentorProfile.findMany.mockResolvedValue([
      { id: 'mentor-1', headline: 'Cloud Solutions Architect', averageRating: 4.8 },
    ]);
    prismaMock.mentorProfile.count.mockResolvedValue(1);

    const result = await profilesService.findMentors({
      skillId: 'skill-cloud',
      search: 'Cloud',
      page: 1,
      limit: 10,
    });

    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  // 5. Student submits mentorship request
  it('allows student to submit a mentorship request', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue({ id: 'student-p-1', userId: 'std-user-1' });
    prismaMock.mentorProfile.findUnique.mockResolvedValue({ id: 'mentor-1', isAvailable: true });
    prismaMock.mentorshipRequest.findFirst.mockResolvedValue(null); // No existing pending
    prismaMock.mentorship.findFirst.mockResolvedValue(null); // No existing active
    prismaMock.mentorshipRequest.create.mockResolvedValue({
      id: 'req-1',
      status: MentorshipRequestStatus.PENDING,
      statementOfPurpose: 'Need guidance on distributed systems',
    });

    const result = await requestsService.createRequest('std-user-1', 'mentor-1', {
      statementOfPurpose: 'Need guidance on distributed systems',
      expectedDurationWeeks: 8,
    });

    expect(result.status).toBe(MentorshipRequestStatus.PENDING);
  });

  // 6. Duplicate pending request is rejected
  it('rejects duplicate pending mentorship request from same student', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue({ id: 'student-p-1', userId: 'std-user-1' });
    prismaMock.mentorProfile.findUnique.mockResolvedValue({ id: 'mentor-1', isAvailable: true });
    prismaMock.mentorshipRequest.findFirst.mockResolvedValue({ id: 'req-existing', status: 'PENDING' });

    await expect(
      requestsService.createRequest('std-user-1', 'mentor-1', {
        statementOfPurpose: 'Second request attempt',
      }),
    ).rejects.toThrow(ConflictException);
  });

  // 7. Mentor accepts request and creates Mentorship
  it('mentor accepts request atomically creating active Mentorship', async () => {
    prismaMock.mentorProfile.findUnique.mockResolvedValue({ id: 'mentor-1', userId: 'mentor-user-1', maxMentees: 5 });
    prismaMock.mentorshipRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      mentorProfileId: 'mentor-1',
      studentProfileId: 'student-p-1',
      status: MentorshipRequestStatus.PENDING,
    });
    prismaMock.mentorship.count.mockResolvedValue(2); // 2 active out of 5 max
    prismaMock.mentorshipRequest.update.mockResolvedValue({ id: 'req-1', status: MentorshipRequestStatus.ACCEPTED });
    prismaMock.mentorship.create.mockResolvedValue({
      id: 'mentorship-1',
      status: MentorshipStatus.ACTIVE,
      mentorProfileId: 'mentor-1',
      studentProfileId: 'student-p-1',
    });

    const result = await requestsService.respondToRequest('mentor-user-1', 'req-1', {
      action: 'ACCEPT' as any,
      notes: 'Happy to mentor you!',
    });

    expect(result.request.status).toBe(MentorshipRequestStatus.ACCEPTED);
    expect(result.mentorship?.status).toBe(MentorshipStatus.ACTIVE);
  });

  // 8. Max mentees capacity boundary enforcement
  it('rejects request acceptance when mentor is at max mentee capacity', async () => {
    prismaMock.mentorProfile.findUnique.mockResolvedValue({ id: 'mentor-1', userId: 'mentor-user-1', maxMentees: 3 });
    prismaMock.mentorshipRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      mentorProfileId: 'mentor-1',
      studentProfileId: 'student-p-1',
      status: MentorshipRequestStatus.PENDING,
    });
    prismaMock.mentorship.count.mockResolvedValue(3); // Capacity full!

    await expect(
      requestsService.respondToRequest('mentor-user-1', 'req-1', {
        action: 'ACCEPT' as any,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // 9. Session booking with valid future date
  it('books 1-on-1 session when no conflicts exist', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString(); // +24 hours
    prismaMock.studentProfile.findUnique.mockResolvedValue({ id: 'student-p-1', userId: 'std-user-1' });
    prismaMock.mentorProfile.findUnique.mockResolvedValue({
      id: 'mentor-1',
      defaultMeetingPlatform: 'GOOGLE_MEET',
      defaultMeetingLink: 'https://meet.google.com/abc-defg-hij',
    });
    prismaMock.mentorshipSession.findFirst.mockResolvedValue(null); // No overlap
    prismaMock.mentorshipSession.create.mockResolvedValue({
      id: 'sess-1',
      status: MentorshipSessionStatus.SCHEDULED,
      scheduledAt: new Date(futureDate),
    });

    const result = await sessionsService.bookSession('std-user-1', 'mentor-1', {
      title: 'Career Role Q&A',
      scheduledAt: futureDate,
      durationMinutes: 45,
    });

    expect(result.status).toBe(MentorshipSessionStatus.SCHEDULED);
  });

  // 10. Past session booking is rejected
  it('rejects session booking scheduled in the past or under 15 mins in future', async () => {
    const pastDate = new Date(Date.now() - 60000).toISOString();
    prismaMock.studentProfile.findUnique.mockResolvedValue({ id: 'student-p-1', userId: 'std-user-1' });
    prismaMock.mentorProfile.findUnique.mockResolvedValue({ id: 'mentor-1' });

    await expect(
      sessionsService.bookSession('std-user-1', 'mentor-1', {
        title: 'Past meeting',
        scheduledAt: pastDate,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // 11. Mentor overlapping session conflict
  it('rejects session booking when mentor has an overlapping session', async () => {
    const futureDate = new Date(Date.now() + 86400000);
    prismaMock.studentProfile.findUnique.mockResolvedValue({ id: 'student-p-1', userId: 'std-user-1' });
    prismaMock.mentorProfile.findUnique.mockResolvedValue({ id: 'mentor-1' });

    // Simulate existing mentor session from futureDate to futureDate + 45 min
    prismaMock.mentorshipSession.findFirst.mockResolvedValueOnce({
      id: 'existing-sess',
      scheduledAt: futureDate,
      durationMinutes: 45,
    });

    await expect(
      sessionsService.bookSession('std-user-1', 'mentor-1', {
        title: 'Overlapping Session',
        scheduledAt: futureDate.toISOString(),
        durationMinutes: 45,
      }),
    ).rejects.toThrow(ConflictException);
  });

  // 12. Student overlapping session conflict
  it('rejects session booking when student has an overlapping session', async () => {
    const futureDate = new Date(Date.now() + 86400000);
    prismaMock.studentProfile.findUnique.mockResolvedValue({ id: 'student-p-1', userId: 'std-user-1' });
    prismaMock.mentorProfile.findUnique.mockResolvedValue({ id: 'mentor-1' });

    // Mentor has no overlap, but student has overlap
    prismaMock.mentorshipSession.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'student-other-sess',
        scheduledAt: futureDate,
        durationMinutes: 45,
      });

    await expect(
      sessionsService.bookSession('std-user-1', 'mentor-1', {
        title: 'Overlapping Session',
        scheduledAt: futureDate.toISOString(),
        durationMinutes: 45,
      }),
    ).rejects.toThrow(ConflictException);
  });

  // 13. Reschedule session with conflict validation
  it('reschedules session and updates status to RESCHEDULED', async () => {
    const newFutureDate = new Date(Date.now() + 86400000 * 2).toISOString();
    prismaMock.mentorshipSession.findUnique.mockResolvedValue({
      id: 'sess-1',
      mentorProfileId: 'mentor-1',
      studentProfileId: 'student-p-1',
      studentProfile: { userId: 'std-user-1' },
      mentorProfile: { userId: 'mentor-user-1' },
      scheduledAt: new Date(),
      durationMinutes: 45,
    });
    prismaMock.mentorshipSession.findFirst.mockResolvedValue(null); // No overlap
    prismaMock.mentorshipSession.update.mockResolvedValue({
      id: 'sess-1',
      status: MentorshipSessionStatus.RESCHEDULED,
      scheduledAt: new Date(newFutureDate),
    });

    const result = await sessionsService.updateSession(
      'std-user-1',
      UserRole.STUDENT,
      'sess-1',
      { scheduledAt: newFutureDate },
    );

    expect(result.status).toBe(MentorshipSessionStatus.RESCHEDULED);
  });

  // 14. Session feedback & rating aggregation
  it('completes session and aggregates mentor star rating atomically', async () => {
    prismaMock.mentorshipSession.findUnique.mockResolvedValue({
      id: 'sess-1',
      mentorProfileId: 'mentor-1',
      studentProfile: { userId: 'std-user-1' },
      mentorProfile: { userId: 'mentor-user-1' },
      studentRating: null,
    });
    prismaMock.mentorshipSession.update.mockResolvedValue({
      id: 'sess-1',
      status: MentorshipSessionStatus.COMPLETED,
      studentRating: 5,
    });
    prismaMock.mentorProfile.findUnique.mockResolvedValue({
      id: 'mentor-1',
      averageRating: 4.0,
      ratingCount: 1,
    });
    prismaMock.mentorProfile.update.mockResolvedValue({});

    const result = await sessionsService.submitFeedback(
      'std-user-1',
      UserRole.STUDENT,
      'sess-1',
      {
        studentRating: 5,
        studentFeedback: 'Exceptional guidance on system architecture!',
        sharedSummary: 'Reviewed architecture and scheduled follow-up on Kafka.',
      },
    );

    expect(result.status).toBe(MentorshipSessionStatus.COMPLETED);
    expect(prismaMock.mentorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          averageRating: 4.5, // (4.0 * 1 + 5) / 2 = 4.5
          ratingCount: 2,
        }),
      }),
    );
  });

  // 15. Mentorship Goals linked to Canonical Skill and LearningPath
  it('creates a mentorship goal linked to canonical skill and learning path', async () => {
    prismaMock.mentorship.findUnique.mockResolvedValue({
      id: 'mentorship-1',
      studentProfile: { userId: 'std-user-1' },
      mentorProfile: { userId: 'mentor-user-1' },
    });
    prismaMock.skill.findUnique.mockResolvedValue({ id: 'skill-react', name: 'React.js' });
    prismaMock.learningPath.findUnique.mockResolvedValue({ id: 'path-fullstack', title: 'Fullstack Path' });
    prismaMock.mentorshipGoal.create.mockResolvedValue({
      id: 'goal-1',
      title: 'Build React Component Library',
      status: MentorshipGoalStatus.PENDING,
      linkedSkillId: 'skill-react',
      linkedLearningPathId: 'path-fullstack',
    });

    const result = await goalsService.createGoal('std-user-1', UserRole.STUDENT, 'mentorship-1', {
      title: 'Build React Component Library',
      linkedSkillId: 'skill-react',
      linkedLearningPathId: 'path-fullstack',
    });

    expect(result.title).toBe('Build React Component Library');
    expect(result.linkedSkillId).toBe('skill-react');
  });

  // 16. IDOR Protection: Private Notes are masked for other participants
  it('masks mentor private notes when student retrieves session', async () => {
    prismaMock.mentorshipSession.findUnique.mockResolvedValue({
      id: 'sess-1',
      studentProfile: { userId: 'std-user-1' },
      mentorProfile: { userId: 'mentor-user-1' },
      mentorNotes: 'Private mentor note: Student needs more DSA practice.',
      studentNotes: 'Private student note: Ask about salary expectations.',
      sharedSummary: 'Discussed interview preparation.',
    });

    const result = await sessionsService.getSessionById('std-user-1', UserRole.STUDENT, 'sess-1');

    expect(result.mentorNotes).toBeNull();
    expect(result.studentNotes).toBe('Private student note: Ask about salary expectations.');
    expect(result.sharedSummary).toBe('Discussed interview preparation.');
  });

  // 17. Mentorship Analytics
  it('computes mentorship analytics summary and top skills', async () => {
    prismaMock.mentorProfile.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(6)  // industry
      .mockResolvedValueOnce(4); // faculty
    prismaMock.mentorship.count
      .mockResolvedValueOnce(15) // active
      .mockResolvedValueOnce(8);  // completed
    prismaMock.mentorshipSession.count
      .mockResolvedValueOnce(40) // total
      .mockResolvedValueOnce(35) // completed
      .mockResolvedValueOnce(3)  // cancelled
      .mockResolvedValueOnce(2);  // no-show
    prismaMock.mentorProfile.findMany.mockResolvedValue([
      { averageRating: 4.8, ratingCount: 5, totalSessionsCompleted: 10 },
    ]);
    prismaMock.mentorSkill.groupBy.mockResolvedValue([
      { skillId: 'skill-1', _count: { skillId: 8 } },
    ]);
    prismaMock.skill.findUnique.mockResolvedValue({ id: 'skill-1', name: 'TypeScript' });

    const result = await analyticsService.getMentorshipAnalytics('admin-1', UserRole.SUPER_ADMIN);

    expect(result.summary.totalMentors).toBe(10);
    expect(result.summary.industryMentors).toBe(6);
    expect(result.summary.facultyMentors).toBe(4);
    expect(result.summary.sessionCompletionRate).toBe(87.5);
    expect(result.topMentorshipSkills[0].name).toBe('TypeScript');
  });

  // 18. Discovery by CareerRole
  it('discovers mentors filtered by CareerRole', async () => {
    prismaMock.mentorProfile.findMany.mockResolvedValue([
      { id: 'mentor-role-1', headline: 'Staff Frontend Architect', careerRoles: [{ careerRoleId: 'role-fe' }] },
    ]);
    prismaMock.mentorProfile.count.mockResolvedValue(1);

    const result = await profilesService.findMentors({
      careerRoleId: 'role-fe',
      page: 1,
      limit: 10,
    });

    expect(result.items).toHaveLength(1);
    expect(prismaMock.mentorProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          careerRoles: { some: { careerRoleId: 'role-fe' } },
        }),
      }),
    );
  });

  // 19. Session Cancellation
  it('allows session cancellation and records reason and cancelledByRole', async () => {
    prismaMock.mentorshipSession.findUnique.mockResolvedValue({
      id: 'sess-cancel-1',
      studentProfileId: 'student-p-1',
      mentorProfileId: 'mentor-1',
      studentProfile: { userId: 'std-user-1' },
      mentorProfile: { userId: 'mentor-user-1' },
      scheduledAt: new Date(),
      durationMinutes: 45,
    });
    prismaMock.mentorshipSession.update.mockResolvedValue({
      id: 'sess-cancel-1',
      status: MentorshipSessionStatus.CANCELLED,
      cancellationReason: 'Emergency conflict',
      cancelledByRole: UserRole.STUDENT,
    });

    const result = await sessionsService.updateSession(
      'std-user-1',
      UserRole.STUDENT,
      'sess-cancel-1',
      {
        status: MentorshipSessionStatus.CANCELLED,
        cancellationReason: 'Emergency conflict',
      },
    );

    expect(result.status).toBe(MentorshipSessionStatus.CANCELLED);
    expect(prismaMock.mentorshipSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: MentorshipSessionStatus.CANCELLED,
          cancellationReason: 'Emergency conflict',
          cancelledByRole: UserRole.STUDENT,
        }),
      }),
    );
  });

  // 20. Rating Validation: Reject rating out of bounds
  it('rejects feedback rating outside 1 to 5 range', async () => {
    prismaMock.mentorshipSession.findUnique.mockResolvedValue({
      id: 'sess-rating-err',
      studentProfile: { userId: 'std-user-1' },
      mentorProfile: { userId: 'mentor-user-1' },
    });

    await expect(
      sessionsService.submitFeedback('std-user-1', UserRole.STUDENT, 'sess-rating-err', {
        studentRating: 6, // Invalid > 5
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // 21. Mentor IDOR Protection: Cannot respond to other mentor's request
  it('rejects mentor attempting to respond to another mentor request', async () => {
    prismaMock.mentorProfile.findUnique.mockResolvedValue({ id: 'mentor-1', userId: 'mentor-user-1' });
    prismaMock.mentorshipRequest.findUnique.mockResolvedValue({
      id: 'req-other',
      mentorProfileId: 'mentor-2', // Different mentor!
      studentProfileId: 'student-p-1',
      status: MentorshipRequestStatus.PENDING,
    });

    await expect(
      requestsService.respondToRequest('mentor-user-1', 'req-other', {
        action: 'ACCEPT' as any,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  // 22. Student IDOR Protection: Cannot withdraw another student request
  it('rejects student attempting to withdraw another student request', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue({ id: 'student-p-1', userId: 'std-user-1' });
    prismaMock.mentorshipRequest.findUnique.mockResolvedValue({
      id: 'req-other-std',
      studentProfileId: 'student-p-2', // Different student!
      status: MentorshipRequestStatus.PENDING,
    });

    await expect(
      requestsService.withdrawRequest('std-user-1', 'req-other-std'),
    ).rejects.toThrow(NotFoundException);
  });

  // 23. IDOR Protection: Mask student private notes when mentor retrieves session
  it('masks student private notes when mentor retrieves session', async () => {
    prismaMock.mentorshipSession.findUnique.mockResolvedValue({
      id: 'sess-notes-2',
      studentProfile: { userId: 'std-user-1' },
      mentorProfile: { userId: 'mentor-user-1' },
      mentorNotes: 'Private mentor note: Good progress on TypeScript.',
      studentNotes: 'Private student note: Prepared questions on concurrency.',
      sharedSummary: 'Reviewed async await best practices.',
    });

    const result = await sessionsService.getSessionById('mentor-user-1', UserRole.INDUSTRY, 'sess-notes-2');

    expect(result.studentNotes).toBeNull();
    expect(result.mentorNotes).toBe('Private mentor note: Good progress on TypeScript.');
    expect(result.sharedSummary).toBe('Reviewed async await best practices.');
  });
});
