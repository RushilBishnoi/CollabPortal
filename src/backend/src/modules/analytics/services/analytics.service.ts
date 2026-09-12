import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { ApplicationStatus, VerificationStatus, UserRole } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private round1(num: number): number {
    return Math.round(num * 10) / 10;
  }

  /**
   * Resolve authenticated institution profile for an INSTITUTION_ADMIN or SUPER_ADMIN user.
   */
  async resolveInstitutionProfile(userId: string) {
    let profile = await this.prisma.institutionProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // 1. Check if there is an existing unlinked or primary institution profile
      const primaryInstitution = await this.prisma.institutionProfile.findFirst({
        orderBy: { createdAt: 'asc' },
      });

      if (primaryInstitution && !primaryInstitution.userId) {
        // Link this institution profile to the authenticated admin
        profile = await this.prisma.institutionProfile.update({
          where: { id: primaryInstitution.id },
          data: { userId },
        });
      } else if (primaryInstitution) {
        // Use primary institution profile for analytics scoping
        profile = primaryInstitution;
      } else {
        // 2. Create default institution profile for this admin user if database has no institution profiles yet
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          throw new NotFoundException('User not found');
        }

        profile = await this.prisma.institutionProfile.create({
          data: {
            userId,
            name: 'Institution of Technology',
            type: 'UNIVERSITY',
          },
        });
      }
    }

    return profile;
  }

  /**
   * Institution Admin: Comprehensive Institutional & Placement Analytics
   */
  async getInstitutionOverview(userId: string, query?: AnalyticsQueryDto) {
    const institution = await this.resolveInstitutionProfile(userId);

    // Student filter criteria for this institution
    const studentWhere: any = {
      institutionId: institution.id,
    };

    if (query?.department) {
      studentWhere.department = { contains: query.department, mode: 'insensitive' };
    }

    if (query?.graduationYear) {
      studentWhere.graduationYear = query.graduationYear;
    }

    if (query?.degree) {
      studentWhere.degree = { contains: query.degree, mode: 'insensitive' };
    }

    // 1. Fetch Students of this Institution
    const students = await this.prisma.studentProfile.findMany({
      where: studentWhere,
      select: {
        id: true,
        department: true,
        graduationYear: true,
        cgpa: true,
        studentSkills: {
          select: {
            verificationStatus: true,
            skill: { select: { id: true, name: true, category: { select: { name: true } } } },
          },
        },
        assessmentAttempts: {
          select: { id: true, score: true, passed: true, createdAt: true },
        },
        applications: {
          select: {
            id: true,
            status: true,
            opportunity: {
              select: {
                id: true,
                title: true,
                opportunityType: true,
                industryProfile: { select: { companyName: true } },
              },
            },
          },
        },
      },
    });

    const totalStudents = students.length;

    // 2. Skill Metrics
    let totalSkillsRecorded = 0;
    let totalVerifiedSkills = 0;
    const skillCountMap: Record<string, { count: number; verified: number; name: string }> = {};

    students.forEach((s: any) => {
      (s.studentSkills || []).forEach((sk: any) => {
        totalSkillsRecorded++;
        const isVerified = sk.verificationStatus === VerificationStatus.VERIFIED;
        if (isVerified) totalVerifiedSkills++;

        const skillName = sk.skill?.name || 'General Skill';
        if (!skillCountMap[skillName]) {
          skillCountMap[skillName] = { count: 0, verified: 0, name: skillName };
        }
        skillCountMap[skillName].count++;
        if (isVerified) skillCountMap[skillName].verified++;
      });
    });

    const topSkills = Object.values(skillCountMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const skillVerificationRate =
      totalSkillsRecorded > 0
        ? this.round1((totalVerifiedSkills / totalSkillsRecorded) * 100)
        : 0;

    // 3. Assessment Performance
    let totalAssessmentAttempts = 0;
    let passedAttempts = 0;
    let totalScoreSum = 0;

    students.forEach((s: any) => {
      (s.assessmentAttempts || []).forEach((att: any) => {
        totalAssessmentAttempts++;
        if (att.passed) passedAttempts++;
        totalScoreSum += (att.score || 0);
      });
    });

    const assessmentPassRate =
      totalAssessmentAttempts > 0
        ? this.round1((passedAttempts / totalAssessmentAttempts) * 100)
        : 0;

    const averageAssessmentScore =
      totalAssessmentAttempts > 0
        ? this.round1(totalScoreSum / totalAssessmentAttempts)
        : 0;

    // 4. Applications & Recruitment Funnel
    let totalApplications = 0;
    let underReviewCount = 0;
    let shortlistedCount = 0;
    let interviewCount = 0;
    let selectedCount = 0;
    let rejectedCount = 0;
    let withdrawnCount = 0;

    const placedStudentIds = new Set<string>();
    const companyHiringMap: Record<string, { companyName: string; selectedCount: number; applicationCount: number }> = {};

    students.forEach((s: any) => {
      (s.applications || []).forEach((app: any) => {
        totalApplications++;
        if (app.status === ApplicationStatus.UNDER_REVIEW) underReviewCount++;
        if (app.status === ApplicationStatus.SHORTLISTED) shortlistedCount++;
        if (app.status === ApplicationStatus.INTERVIEW_SCHEDULED) interviewCount++;
        if (app.status === ApplicationStatus.SELECTED) {
          selectedCount++;
          placedStudentIds.add(s.id);
        }
        if (app.status === ApplicationStatus.REJECTED) rejectedCount++;
        if (app.status === ApplicationStatus.WITHDRAWN) withdrawnCount++;

        const compName = app.opportunity?.industryProfile?.companyName || 'Corporate Partner';
        if (!companyHiringMap[compName]) {
          companyHiringMap[compName] = { companyName: compName, selectedCount: 0, applicationCount: 0 };
        }
        companyHiringMap[compName].applicationCount++;
        if (app.status === ApplicationStatus.SELECTED) {
          companyHiringMap[compName].selectedCount++;
        }
      });
    });

    const placedStudentsCount = placedStudentIds.size;
    const placementRate =
      totalStudents > 0
        ? this.round1((placedStudentsCount / totalStudents) * 100)
        : 0;

    const applicationConversionRate =
      totalApplications > 0
        ? this.round1((selectedCount / totalApplications) * 100)
        : 0;

    const topHiringCompanies = Object.values(companyHiringMap)
      .sort((a, b) => b.selectedCount - a.selectedCount || b.applicationCount - a.applicationCount)
      .slice(0, 6);

    // 5. Department-wise Breakdown
    const deptMap: Record<
      string,
      {
        department: string;
        totalStudents: number;
        placedStudents: number;
        cgpaSum: number;
        cgpaCount: number;
        applicationCount: number;
        verifiedSkillCount: number;
      }
    > = {};

    students.forEach((s: any) => {
      const dept = s.department || 'General Engineering';
      if (!deptMap[dept]) {
        deptMap[dept] = {
          department: dept,
          totalStudents: 0,
          placedStudents: 0,
          cgpaSum: 0,
          cgpaCount: 0,
          applicationCount: 0,
          verifiedSkillCount: 0,
        };
      }
      deptMap[dept].totalStudents++;
      if (placedStudentIds.has(s.id)) {
        deptMap[dept].placedStudents++;
      }
      if (s.cgpa) {
        deptMap[dept].cgpaSum += s.cgpa;
        deptMap[dept].cgpaCount++;
      }
      deptMap[dept].applicationCount += (s.applications || []).length;
      deptMap[dept].verifiedSkillCount += (s.studentSkills || []).filter(
        (sk: any) => sk.verificationStatus === VerificationStatus.VERIFIED,
      ).length;
    });

    const departmentAnalytics = Object.values(deptMap).map((d) => ({
      department: d.department,
      totalStudents: d.totalStudents,
      placedStudents: d.placedStudents,
      placementRate: d.totalStudents > 0 ? this.round1((d.placedStudents / d.totalStudents) * 100) : 0,
      averageCgpa: d.cgpaCount > 0 ? this.round1(d.cgpaSum / d.cgpaCount) : 0,
      applicationCount: d.applicationCount,
      verifiedSkillCount: d.verifiedSkillCount,
    }));

    // 6. Graduation Batch Trends
    const batchMap: Record<
      number,
      { graduationYear: number; totalStudents: number; placedStudents: number; totalApplications: number }
    > = {};

    students.forEach((s: any) => {
      const year = s.graduationYear || 2026;
      if (!batchMap[year]) {
        batchMap[year] = {
          graduationYear: year,
          totalStudents: 0,
          placedStudents: 0,
          totalApplications: 0,
        };
      }
      batchMap[year].totalStudents++;
      if (placedStudentIds.has(s.id)) {
        batchMap[year].placedStudents++;
      }
      batchMap[year].totalApplications += (s.applications || []).length;
    });

    const batchTrends = Object.values(batchMap)
      .sort((a, b) => a.graduationYear - b.graduationYear)
      .map((b) => ({
        ...b,
        placementRate: b.totalStudents > 0 ? this.round1((b.placedStudents / b.totalStudents) * 100) : 0,
      }));

    return {
      institution: {
        id: institution.id,
        name: institution.name,
        code: institution.code,
        city: institution.city,
        state: institution.state,
      },
      summary: {
        totalStudents,
        placedStudentsCount,
        placementRate,
        totalApplications,
        selectedCount,
        interviewCount,
        shortlistedCount,
        underReviewCount,
        applicationConversionRate,
        totalSkillsRecorded,
        totalVerifiedSkills,
        skillVerificationRate,
        totalAssessmentAttempts,
        assessmentPassRate,
        averageAssessmentScore,
      },
      funnel: {
        applied: totalApplications,
        underReview: underReviewCount,
        shortlisted: shortlistedCount,
        interviewScheduled: interviewCount,
        selected: selectedCount,
        rejected: rejectedCount,
        withdrawn: withdrawnCount,
      },
      topSkills,
      topHiringCompanies,
      departmentAnalytics,
      batchTrends,
    };
  }

  /**
   * Super Admin: Global Platform Overview Analytics
   */
  async getPlatformOverview(_query?: AnalyticsQueryDto) {
    const [
      totalInstitutions,
      totalIndustries,
      totalStudents,
      totalOpportunities,
      totalApplications,
      selectedApplications,
      totalAssessments,
      totalLearningResources,
      totalLearningPaths,
      totalLearningEnrollments,
    ] = await Promise.all([
      this.prisma.institutionProfile.count(),
      this.prisma.industryProfile.count(),
      this.prisma.studentProfile.count(),
      this.prisma.opportunity.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.application.count(),
      this.prisma.application.count({ where: { status: 'SELECTED' } }),
      this.prisma.assessment.count(),
      this.prisma.learningResource?.count
        ? this.prisma.learningResource.count({ where: { isPublished: true } })
        : Promise.resolve(0),
      this.prisma.learningPath?.count
        ? this.prisma.learningPath.count({ where: { status: 'PUBLISHED' } })
        : Promise.resolve(0),
      this.prisma.studentPathEnrollment?.count
        ? this.prisma.studentPathEnrollment.count()
        : Promise.resolve(0),
    ]);

    const globalPlacementRate =
      totalStudents > 0
        ? this.round1((selectedApplications / totalStudents) * 100)
        : 0;

    return {
      summary: {
        totalInstitutions,
        totalIndustries,
        totalStudents,
        totalOpportunities,
        totalApplications,
        selectedApplications,
        totalAssessments,
        globalPlacementRate,
        totalLearningResources,
        totalLearningPaths,
        totalLearningEnrollments,
      },
    };
  }

  /**
   * Collaboration Analytics for Institution Admin and Super Admin
   */
  async getCollaborationAnalytics(
    userId: string,
    userRole: UserRole,
    query?: AnalyticsQueryDto,
  ) {
    if (userRole === UserRole.INSTITUTION_ADMIN) {
      const institution = await this.resolveInstitutionProfile(userId);

      // Student and Faculty IDs for this institution
      const [students, facultyMembers] = await Promise.all([
        this.prisma.studentProfile.findMany({
          where: {
            institutionId: institution.id,
            ...(query?.department && {
              department: { contains: query.department, mode: 'insensitive' },
            }),
          },
          select: { id: true, department: true },
        }),
        this.prisma.facultyProfile.findMany({
          where: {
            institutionId: institution.id,
            ...(query?.department && {
              department: { contains: query.department, mode: 'insensitive' },
            }),
          },
          select: { id: true, department: true },
        }),
      ]);

      const studentIds = students.map((s) => s.id);
      const facultyIds = facultyMembers.map((f) => f.id);

      const participations = await this.prisma.collaborationParticipation.findMany({
        where: {
          OR: [
            { studentProfileId: { in: studentIds } },
            { facultyProfileId: { in: facultyIds } },
          ],
        },
        include: {
          collaboration: {
            select: {
              id: true,
              title: true,
              collaborationType: true,
              mode: true,
              industryProfile: {
                select: { id: true, companyName: true, industryType: true },
              },
            },
          },
        },
      });

      const totalParticipations = participations.length;
      let facultyParticipations = 0;
      let studentParticipations = 0;

      const byStatus: Record<string, number> = {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        WITHDRAWN: 0,
        COMPLETED: 0,
        CANCELLED: 0,
      };

      const byType: Record<string, number> = {};
      const industryMap: Record<string, { companyName: string; count: number }> = {};

      participations.forEach((p) => {
        if (p.facultyProfileId) facultyParticipations++;
        if (p.studentProfileId) studentParticipations++;

        if (byStatus[p.status] !== undefined) {
          byStatus[p.status]++;
        }

        const type = p.collaboration.collaborationType;
        byType[type] = (byType[type] || 0) + 1;

        const industry = p.collaboration.industryProfile;
        if (industry) {
          if (!industryMap[industry.id]) {
            industryMap[industry.id] = { companyName: industry.companyName, count: 0 };
          }
          industryMap[industry.id].count++;
        }
      });

      const participatingIndustries = Object.values(industryMap).sort(
        (a, b) => b.count - a.count,
      );

      return {
        scope: 'INSTITUTION',
        institution: {
          id: institution.id,
          name: institution.name,
        },
        summary: {
          totalParticipations,
          facultyParticipations,
          studentParticipations,
          approvedCount: byStatus['APPROVED'] || 0,
          completedCount: byStatus['COMPLETED'] || 0,
          pendingCount: byStatus['PENDING'] || 0,
          activeIndustriesCount: participatingIndustries.length,
        },
        byStatus,
        byType,
        participatingIndustries,
      };
    }

    // Super Admin: Global Collaboration Analytics
    const [
      totalCollaborations,
      collaborations,
      participations,
      totalIndustries,
    ] = await Promise.all([
      this.prisma.collaboration.count(),
      this.prisma.collaboration.findMany({
        select: {
          id: true,
          status: true,
          collaborationType: true,
          targetAudience: true,
          mode: true,
          industryProfile: {
            select: { id: true, companyName: true },
          },
        },
      }),
      this.prisma.collaborationParticipation.findMany({
        select: {
          id: true,
          status: true,
          facultyProfileId: true,
          studentProfileId: true,
        },
      }),
      this.prisma.industryProfile.count(),
    ]);

    const collaborationStatusMap: Record<string, number> = {};
    const collaborationTypeMap: Record<string, number> = {};
    const audienceMap: Record<string, number> = {};
    const modeMap: Record<string, number> = {};
    const industryCollabMap: Record<string, { companyName: string; count: number }> = {};

    collaborations.forEach((c) => {
      collaborationStatusMap[c.status] = (collaborationStatusMap[c.status] || 0) + 1;
      collaborationTypeMap[c.collaborationType] = (collaborationTypeMap[c.collaborationType] || 0) + 1;
      audienceMap[c.targetAudience] = (audienceMap[c.targetAudience] || 0) + 1;
      modeMap[c.mode] = (modeMap[c.mode] || 0) + 1;

      if (c.industryProfile) {
        if (!industryCollabMap[c.industryProfile.id]) {
          industryCollabMap[c.industryProfile.id] = {
            companyName: c.industryProfile.companyName,
            count: 0,
          };
        }
        industryCollabMap[c.industryProfile.id].count++;
      }
    });

    const participationStatusMap: Record<string, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    let facultyParticipations = 0;
    let studentParticipations = 0;

    participations.forEach((p) => {
      if (p.facultyProfileId) facultyParticipations++;
      if (p.studentProfileId) studentParticipations++;
      if (participationStatusMap[p.status] !== undefined) {
        participationStatusMap[p.status]++;
      }
    });

    const topIndustries = Object.values(industryCollabMap).sort((a, b) => b.count - a.count);

    return {
      scope: 'PLATFORM',
      summary: {
        totalCollaborations,
        totalParticipations: participations.length,
        facultyParticipations,
        studentParticipations,
        activeCollaborations: collaborationStatusMap['OPEN'] || 0,
        totalIndustries,
      },
      collaborationStatus: collaborationStatusMap,
      collaborationType: collaborationTypeMap,
      targetAudience: audienceMap,
      mode: modeMap,
      participationStatus: participationStatusMap,
      topCollaboratingIndustries: topIndustries,
    };
  }

  /**
   * Learning & Skill-Gap Remediation Analytics (Phase 12)
   */
  async getLearningAnalytics(
    userId: string,
    userRole: UserRole,
    query?: AnalyticsQueryDto,
  ) {
    if (userRole === UserRole.INSTITUTION_ADMIN) {
      const institution = await this.resolveInstitutionProfile(userId);

      const students = await this.prisma.studentProfile.findMany({
        where: {
          institutionId: institution.id,
          ...(query?.department && {
            department: { contains: query.department, mode: 'insensitive' },
          }),
        },
        select: { id: true, department: true },
      });

      const studentIds = students.map((s) => s.id);

      const [enrollments, progressList] = await Promise.all([
        this.prisma.studentPathEnrollment.findMany({
          where: { studentProfileId: { in: studentIds } },
          include: {
            learningPath: {
              select: { id: true, title: true, targetProficiency: true },
            },
          },
        }),
        this.prisma.studentResourceProgress.findMany({
          where: { studentProfileId: { in: studentIds } },
          include: {
            resource: {
              select: {
                id: true,
                title: true,
                skill: { select: { id: true, name: true } },
              },
            },
          },
        }),
      ]);

      const totalEnrollments = enrollments.length;
      const completedEnrollments = enrollments.filter((e) => e.status === 'COMPLETED').length;
      const activeEnrollments = enrollments.filter((e) => e.status === 'IN_PROGRESS' || e.status === 'ENROLLED').length;

      let totalMinutesSpent = 0;
      const skillLearningMap: Record<string, { skillName: string; count: number }> = {};

      progressList.forEach((p) => {
        totalMinutesSpent += p.timeSpentMinutes || 0;
        const sName = p.resource.skill.name;
        if (!skillLearningMap[sName]) {
          skillLearningMap[sName] = { skillName: sName, count: 0 };
        }
        skillLearningMap[sName].count++;
      });

      const topLearnedSkills = Object.values(skillLearningMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      return {
        scope: 'INSTITUTION',
        institution: { id: institution.id, name: institution.name },
        summary: {
          totalEnrollments,
          completedEnrollments,
          activeEnrollments,
          completionRate: totalEnrollments > 0 ? this.round1((completedEnrollments / totalEnrollments) * 100) : 0,
          totalHoursSpent: this.round1(totalMinutesSpent / 60),
          totalResourcesInteracted: progressList.length,
        },
        topLearnedSkills,
      };
    }

    // Platform-wide Learning Analytics (Super Admin)
    const [
      totalResources,
      verifiedResources,
      totalPaths,
      totalEnrollments,
      completedEnrollments,
      resourcesByType,
      resourcesByDifficulty,
      resourcesByAuthorRole,
    ] = await Promise.all([
      this.prisma.learningResource.count(),
      this.prisma.learningResource.count({ where: { isVerified: true } }),
      this.prisma.learningPath.count(),
      this.prisma.studentPathEnrollment.count(),
      this.prisma.studentPathEnrollment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.learningResource.groupBy({
        by: ['resourceType'],
        _count: { id: true },
      }),
      this.prisma.learningResource.groupBy({
        by: ['difficulty'],
        _count: { id: true },
      }),
      this.prisma.learningResource.groupBy({
        by: ['authorRole'],
        _count: { id: true },
      }),
    ]);

    return {
      scope: 'PLATFORM',
      summary: {
        totalResources,
        verifiedResources,
        totalPaths,
        totalEnrollments,
        completedEnrollments,
        globalCompletionRate:
          totalEnrollments > 0
            ? this.round1((completedEnrollments / totalEnrollments) * 100)
            : 0,
      },
      resourcesByType: resourcesByType.map((r) => ({ type: r.resourceType, count: r._count.id })),
      resourcesByDifficulty: resourcesByDifficulty.map((r) => ({ difficulty: r.difficulty, count: r._count.id })),
      resourcesByAuthorRole: resourcesByAuthorRole.map((r) => ({ role: r.authorRole, count: r._count.id })),
    };
  }

  /**
   * Comprehensive Post-Selection Placement Analytics (Phase 13)
   */
  async getPlacementAnalytics(
    userId: string,
    userRole: UserRole,
    _query?: AnalyticsQueryDto,
  ) {
    let institutionId: string | undefined;

    if (userRole === UserRole.INSTITUTION_ADMIN) {
      const inst = await this.resolveInstitutionProfile(userId);
      institutionId = inst.id;
    }

    const placementWhere: any = {};
    if (institutionId) {
      placementWhere.institutionId = institutionId;
    }

    const [
      totalPlacements,
      pendingVerificationCount,
      verifiedCount,
      confirmedCount,
      joinedCount,
      revokedCount,
      offers,
      placementsList,
    ] = await Promise.all([
      this.prisma.placement.count({ where: placementWhere }),
      this.prisma.placement.count({ where: { ...placementWhere, status: 'PENDING_VERIFICATION' } }),
      this.prisma.placement.count({ where: { ...placementWhere, status: 'VERIFIED' } }),
      this.prisma.placement.count({ where: { ...placementWhere, status: 'CONFIRMED' } }),
      this.prisma.placement.count({ where: { ...placementWhere, status: 'JOINED' } }),
      this.prisma.placement.count({ where: { ...placementWhere, status: 'REVOKED' } }),
      this.prisma.placementOffer.findMany({
        where: institutionId
          ? { studentProfile: { institutionId } }
          : {},
        select: {
          id: true,
          status: true,
          ctcAnnual: true,
          employmentType: true,
          industryProfile: { select: { companyName: true } },
          studentProfile: { select: { department: true } },
        },
      }),
      this.prisma.placement.findMany({
        where: placementWhere,
        select: {
          id: true,
          status: true,
          annualCtcSnapshot: true,
          companyNameSnapshot: true,
          jobTitleSnapshot: true,
          studentProfile: { select: { department: true } },
        },
      }),
    ]);

    const totalOffers = offers.length;
    const issuedOffers = offers.filter((o) => o.status === 'ISSUED').length;
    const acceptedOffers = offers.filter((o) => o.status === 'ACCEPTED').length;
    const declinedOffers = offers.filter((o) => o.status === 'DECLINED').length;
    const expiredOffers = offers.filter((o) => o.status === 'EXPIRED').length;

    const offerAcceptanceRate =
      totalOffers > 0 ? this.round1((acceptedOffers / totalOffers) * 100) : 0;

    // CTC Metrics
    const validCtcs = placementsList
      .map((p) => p.annualCtcSnapshot)
      .filter((c): c is number => typeof c === 'number' && c > 0);

    const averageCtcLpa =
      validCtcs.length > 0
        ? this.round1(validCtcs.reduce((a, b) => a + b, 0) / validCtcs.length / 100000)
        : 0;

    const highestCtcLpa =
      validCtcs.length > 0
        ? this.round1(Math.max(...validCtcs) / 100000)
        : 0;

    // Department Breakdown
    const deptPlacementsMap: Record<string, { department: string; placedCount: number; ctcSum: number }> = {};
    placementsList.forEach((p) => {
      const dept = p.studentProfile?.department || 'General Engineering';
      if (!deptPlacementsMap[dept]) {
        deptPlacementsMap[dept] = { department: dept, placedCount: 0, ctcSum: 0 };
      }
      deptPlacementsMap[dept].placedCount++;
      if (p.annualCtcSnapshot) deptPlacementsMap[dept].ctcSum += p.annualCtcSnapshot;
    });

    const departmentBreakdown = Object.values(deptPlacementsMap).map((d) => ({
      department: d.department,
      placedCount: d.placedCount,
      averageCtcLpa: d.placedCount > 0 ? this.round1(d.ctcSum / d.placedCount / 100000) : 0,
    }));

    return {
      summary: {
        totalPlacements,
        pendingVerificationCount,
        verifiedCount,
        confirmedCount,
        joinedCount,
        revokedCount,
        totalOffers,
        issuedOffers,
        acceptedOffers,
        declinedOffers,
        expiredOffers,
        offerAcceptanceRate,
        averageCtcLpa,
        highestCtcLpa,
      },
      departmentBreakdown,
    };
  }

  /**
   * Sanitize a string value for safe inclusion in a CSV cell.
   * Prevents formula injection attacks (CSV injection / Formula Injection).
   * Cells starting with =, +, -, @, TAB, CR trigger formula execution in spreadsheet tools.
   */
  private sanitizeCsvCell(value: string): string {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    // Prefix with apostrophe if the cell could be interpreted as a spreadsheet formula
    if (/^[=+\-@\t\r]/.test(trimmed)) {
      return `'${trimmed.replace(/"/g, '""')}`;
    }
    return trimmed.replace(/"/g, '""');
  }

  /**
   * Export Institutional Analytics Data as CSV Report
   */
  async exportInstitutionReport(userId: string, reportType: string = 'departments'): Promise<string> {
    const overview = await this.getInstitutionOverview(userId);

    if (reportType === 'departments') {
      const headers = 'Department,Total Students,Placed Students,Placement Rate (%),Average CGPA,Applications,Verified Skills\n';
      const rows = overview.departmentAnalytics
        .map(
          (d) =>
            `"${this.sanitizeCsvCell(d.department)}",${d.totalStudents},${d.placedStudents},${d.placementRate},${d.averageCgpa},${d.applicationCount},${d.verifiedSkillCount}`,
        )
        .join('\n');
      return headers + rows;
    }

    if (reportType === 'skills') {
      const headers = 'Skill Name,Total Students Possessing,Verified by Assessment\n';
      const rows = overview.topSkills
        .map((s) => `"${this.sanitizeCsvCell(s.name)}",${s.count},${s.verified}`)
        .join('\n');
      return headers + rows;
    }

    // Default Placements Summary Report
    const headers = 'Metric,Value\n';
    const rows = [
      `"Institution Name","${this.sanitizeCsvCell(overview.institution.name)}"`,
      `"Total Enrolled Students",${overview.summary.totalStudents}`,
      `"Total Placed Students",${overview.summary.placedStudentsCount}`,
      `"Placement Rate (%)",${overview.summary.placementRate}%`,
      `"Total Applications Submitted",${overview.summary.totalApplications}`,
      `"Applications Converted to Placement",${overview.summary.selectedCount}`,
      `"Skill Verification Rate (%)",${overview.summary.skillVerificationRate}%`,
      `"Assessment Pass Rate (%)",${overview.summary.assessmentPassRate}%`,
    ].join('\n');

    return headers + rows;
  }

  /**
   * Mentorship & Mentor Engagement Analytics (Phase 14)
   */
  async getMentorshipAnalytics(
    userId: string,
    userRole: UserRole,
    _query?: AnalyticsQueryDto,
  ) {
    let institutionId: string | undefined;

    if (userRole === UserRole.INSTITUTION_ADMIN) {
      const inst = await this.resolveInstitutionProfile(userId);
      institutionId = inst.id;
    }

    const studentWhere = institutionId ? { studentProfile: { institutionId } } : {};

    const [
      totalMentors,
      industryMentors,
      facultyMentors,
      activeMentorships,
      completedMentorships,
      totalSessions,
      completedSessions,
      cancelledSessions,
      noShowSessions,
      mentorProfiles,
      skillsData,
    ] = await Promise.all([
      this.prisma.mentorProfile.count(),
      this.prisma.mentorProfile.count({ where: { mentorRoleType: 'INDUSTRY' } }),
      this.prisma.mentorProfile.count({ where: { mentorRoleType: 'FACULTY' } }),
      this.prisma.mentorship.count({ where: { ...studentWhere, status: 'ACTIVE' } }),
      this.prisma.mentorship.count({ where: { ...studentWhere, status: 'COMPLETED' } }),
      this.prisma.mentorshipSession.count({ where: studentWhere }),
      this.prisma.mentorshipSession.count({ where: { ...studentWhere, status: 'COMPLETED' } }),
      this.prisma.mentorshipSession.count({ where: { ...studentWhere, status: 'CANCELLED' } }),
      this.prisma.mentorshipSession.count({ where: { ...studentWhere, status: 'NO_SHOW' } }),
      this.prisma.mentorProfile.findMany({
        select: {
          averageRating: true,
          ratingCount: true,
          totalSessionsCompleted: true,
        },
      }),
      this.prisma.mentorSkill.groupBy({
        by: ['skillId'],
        _count: { skillId: true },
        orderBy: { _count: { skillId: 'desc' } },
        take: 5,
      }),
    ]);

    // Average rating
    const ratedMentors = mentorProfiles.filter((m) => m.ratingCount > 0);
    const avgRating =
      ratedMentors.length > 0
        ? Math.round(
            (ratedMentors.reduce((acc, m) => acc + m.averageRating, 0) /
              ratedMentors.length) *
              10,
          ) / 10
        : 0.0;

    const sessionCompletionRate =
      totalSessions > 0
        ? Math.round((completedSessions / totalSessions) * 100 * 10) / 10
        : 0.0;

    // Resolve top skill names
    const topSkillsWithNames = await Promise.all(
      skillsData.map(async (item) => {
        const skill = await this.prisma.skill.findUnique({
          where: { id: item.skillId },
          select: { name: true },
        });
        return {
          skillId: item.skillId,
          name: skill?.name || 'Unknown',
          count: item._count.skillId,
        };
      }),
    );

    return {
      summary: {
        totalMentors,
        industryMentors,
        facultyMentors,
        activeMentorships,
        completedMentorships,
        totalSessions,
        completedSessions,
        cancelledSessions,
        noShowSessions,
        sessionCompletionRate,
        averageMentorRating: avgRating,
      },
      topMentorshipSkills: topSkillsWithNames,
    };
  }

  /**
   * Institution Admin / Super Admin: Get notification delivery & engagement analytics
   */
  async getNotificationAnalytics(
    userId: string,
    userRole: UserRole,
    _query?: AnalyticsQueryDto,
  ) {
    let whereClause: any = {};

    if (userRole === UserRole.INSTITUTION_ADMIN) {
      const institution = await this.resolveInstitutionProfile(userId);
      whereClause = {
        recipient: {
          OR: [
            { studentProfile: { institutionId: institution.id } },
            { facultyProfile: { institutionId: institution.id } },
            { institutionProfile: { institutionId: institution.id } },
          ],
        },
      };
    }

    const [totalNotifications, unreadCount, byTypeRaw, byPriorityRaw] = await Promise.all([
      this.prisma.notification.count({ where: whereClause }),
      this.prisma.notification.count({ where: { ...whereClause, isRead: false } }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where: whereClause,
        _count: { type: true },
      }),
      this.prisma.notification.groupBy({
        by: ['priority'],
        where: whereClause,
        _count: { priority: true },
      }),
    ]);

    const readCount = totalNotifications - unreadCount;
    const readRate =
      totalNotifications > 0
        ? Math.round((readCount / totalNotifications) * 100 * 10) / 10
        : 0;

    const byType: Record<string, number> = {};
    byTypeRaw.forEach((item) => {
      byType[item.type] = item._count.type;
    });

    const byPriority: Record<string, number> = {};
    byPriorityRaw.forEach((item) => {
      byPriority[item.priority] = item._count.priority;
    });

    return {
      scope: userRole === UserRole.SUPER_ADMIN ? 'PLATFORM' : 'INSTITUTION',
      summary: {
        totalNotifications,
        unreadCount,
        readCount,
        readRate,
      },
      byType,
      byPriority,
    };
  }
}
