import {
  Injectable,
  Optional,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UpdateResourceProgressDto } from '../dto/update-resource-progress.dto';
import { EnrollLearningPathDto } from '../dto/enroll-learning-path.dto';
import {
  StudentResourceStatus,
  StudentPathEnrollmentStatus,
  LearningPathStatus,
  NotificationType,
  NotificationPriority,
} from '@prisma/client';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class StudentLearningService {
  private readonly logger = new Logger(StudentLearningService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  /**
   * Helper to resolve authenticated StudentProfile server-side
   */
  async resolveStudentProfile(userId: string) {
    let profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      profile = await this.prisma.studentProfile.create({
        data: { userId, fullName: user.email.split('@')[0] || 'Student' },
      });
    }

    return profile;
  }

  /**
   * Get student's personalized learning dashboard
   */
  async getMyLearningOverview(userId: string) {
    const profile = await this.resolveStudentProfile(userId);

    const [enrollments, resourceProgressList] = await Promise.all([
      this.prisma.studentPathEnrollment.findMany({
        where: { studentProfileId: profile.id },
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        include: {
          learningPath: {
            include: {
              careerRole: { select: { id: true, title: true, slug: true } },
              items: {
                orderBy: { order: 'asc' },
                include: {
                  resource: {
                    include: {
                      skill: { select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.studentResourceProgress.findMany({
        where: { studentProfileId: profile.id },
        orderBy: [{ updatedAt: 'desc' }],
        include: {
          resource: {
            include: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  category: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    // Aggregate statistics deterministically
    let totalMinutesSpent = 0;
    let completedResourcesCount = 0;
    let inProgressResourcesCount = 0;
    let savedResourcesCount = 0;

    resourceProgressList.forEach((rp) => {
      totalMinutesSpent += rp.timeSpentMinutes || 0;
      if (rp.status === StudentResourceStatus.COMPLETED) completedResourcesCount++;
      if (rp.status === StudentResourceStatus.IN_PROGRESS) inProgressResourcesCount++;
      if (rp.status === StudentResourceStatus.SAVED) savedResourcesCount++;
    });

    const activeEnrollmentsCount = enrollments.filter(
      (e) => e.status === StudentPathEnrollmentStatus.ENROLLED || e.status === StudentPathEnrollmentStatus.IN_PROGRESS,
    ).length;

    const completedPathsCount = enrollments.filter(
      (e) => e.status === StudentPathEnrollmentStatus.COMPLETED,
    ).length;

    return {
      stats: {
        totalEnrolledPaths: enrollments.length,
        activeEnrollmentsCount,
        completedPathsCount,
        totalResourcesInteracted: resourceProgressList.length,
        completedResourcesCount,
        inProgressResourcesCount,
        savedResourcesCount,
        totalHoursSpent: Math.round((totalMinutesSpent / 60) * 10) / 10,
      },
      enrollments,
      resourceProgress: resourceProgressList,
    };
  }

  /**
   * Enroll in a Learning Path
   */
  async enrollInPath(userId: string, pathId: string, _dto?: EnrollLearningPathDto) {
    const profile = await this.resolveStudentProfile(userId);

    const path = await this.prisma.learningPath.findUnique({
      where: { id: pathId },
      include: { items: true },
    });

    if (!path) {
      throw new NotFoundException(`Learning path with ID '${pathId}' not found`);
    }

    if (path.status !== LearningPathStatus.PUBLISHED) {
      throw new BadRequestException('Cannot enroll in an unpublished learning path');
    }

    // Check if already enrolled
    const existing = await this.prisma.studentPathEnrollment.findUnique({
      where: {
        studentProfileId_learningPathId: {
          studentProfileId: profile.id,
          learningPathId: pathId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    const totalItemsCount = path.items.length;

    // Check if student has already completed some items
    const resourceIds = path.items.map((i) => i.resourceId);
    const completedProgress = await this.prisma.studentResourceProgress.findMany({
      where: {
        studentProfileId: profile.id,
        resourceId: { in: resourceIds },
        status: StudentResourceStatus.COMPLETED,
      },
    });

    const completedItemsCount = completedProgress.length;
    const progressPercentage =
      totalItemsCount > 0
        ? Math.round((completedItemsCount / totalItemsCount) * 100 * 10) / 10
        : 0;

    const status =
      progressPercentage >= 100
        ? StudentPathEnrollmentStatus.COMPLETED
        : progressPercentage > 0
          ? StudentPathEnrollmentStatus.IN_PROGRESS
          : StudentPathEnrollmentStatus.ENROLLED;

    const enrollment = await this.prisma.studentPathEnrollment.create({
      data: {
        studentProfileId: profile.id,
        learningPathId: pathId,
        status,
        progressPercentage,
        completedItemsCount,
        totalItemsCount,
        completedAt: status === StudentPathEnrollmentStatus.COMPLETED ? new Date() : null,
      },
      include: {
        learningPath: {
          select: { id: true, title: true, slug: true, estimatedHours: true },
        },
      },
    });

    // Notify student of path enrollment
    if (this.notificationsService) {
      await this.notificationsService.dispatchNotification({
        recipientUserId: userId,
        type: NotificationType.LEARNING_PATH_ENROLLED,
        priority: NotificationPriority.LOW,
        title: 'Enrolled in Learning Path',
        message: `You have successfully enrolled in '${enrollment.learningPath.title}'.`,
        entityType: 'LEARNING_PATH',
        entityId: pathId,
        actionUrl: '/learning',
        idempotencyKey: `PATH_ENROLLED:PATH:${pathId}:${userId}`,
      });
    }

    return enrollment;
  }

  /**
   * Update student progress on a learning resource (Save, Start, Complete, Rate)
   */
  async updateResourceProgress(userId: string, resourceId: string, dto: UpdateResourceProgressDto) {
    const profile = await this.resolveStudentProfile(userId);

    const resource = await this.prisma.learningResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException(`Learning resource with ID '${resourceId}' not found`);
    }

    const existing = await this.prisma.studentResourceProgress.findUnique({
      where: {
        studentProfileId_resourceId: {
          studentProfileId: profile.id,
          resourceId,
        },
      },
    });

    const isCompletingNow =
      dto.status === StudentResourceStatus.COMPLETED &&
      (!existing || existing.status !== StudentResourceStatus.COMPLETED);

    let progress;
    if (!existing) {
      progress = await this.prisma.studentResourceProgress.create({
        data: {
          studentProfileId: profile.id,
          resourceId,
          status: dto.status,
          timeSpentMinutes: dto.timeSpentMinutes || 0,
          rating: dto.rating,
          notes: dto.notes,
          startedAt: dto.status !== StudentResourceStatus.SAVED ? new Date() : null,
          completedAt: isCompletingNow ? new Date() : null,
        },
        include: {
          resource: { select: { id: true, title: true, skillId: true } },
        },
      });
    } else {
      progress = await this.prisma.studentResourceProgress.update({
        where: { id: existing.id },
        data: {
          status: dto.status,
          timeSpentMinutes: (existing.timeSpentMinutes || 0) + (dto.timeSpentMinutes || 0),
          ...(dto.rating && { rating: dto.rating }),
          ...(dto.notes && { notes: dto.notes }),
          startedAt: existing.startedAt || (dto.status !== StudentResourceStatus.SAVED ? new Date() : null),
          completedAt: isCompletingNow ? new Date() : existing.completedAt,
        },
        include: {
          resource: { select: { id: true, title: true, skillId: true } },
        },
      });
    }

    // Recalculate any enrolled learning paths that contain this resource
    await this.recalculateEnrolledPathsForResource(profile.id, resourceId);

    return progress;
  }

  /**
   * Helper to recalculate student path progress deterministically
   */
  private async recalculateEnrolledPathsForResource(studentProfileId: string, resourceId: string) {
    // Find all paths containing this resource that the student is enrolled in
    const pathItems = await this.prisma.learningPathItem.findMany({
      where: { resourceId },
      select: { learningPathId: true },
    });

    const pathIds = pathItems.map((pi) => pi.learningPathId);
    if (pathIds.length === 0) return;

    const enrollments = await this.prisma.studentPathEnrollment.findMany({
      where: {
        studentProfileId,
        learningPathId: { in: pathIds },
      },
      include: {
        learningPath: {
          include: { items: true },
        },
      },
    });

    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: { userId: true },
    });

    for (const enrollment of enrollments) {
      const items = enrollment.learningPath.items;
      const totalItemsCount = items.length;
      const itemResourceIds = items.map((i) => i.resourceId);

      const completedCount = await this.prisma.studentResourceProgress.count({
        where: {
          studentProfileId,
          resourceId: { in: itemResourceIds },
          status: StudentResourceStatus.COMPLETED,
        },
      });

      const progressPercentage =
        totalItemsCount > 0
          ? Math.round((completedCount / totalItemsCount) * 100 * 10) / 10
          : 0;

      const isCompleted = progressPercentage >= 100;
      const newStatus = isCompleted
        ? StudentPathEnrollmentStatus.COMPLETED
        : completedCount > 0
          ? StudentPathEnrollmentStatus.IN_PROGRESS
          : StudentPathEnrollmentStatus.ENROLLED;

      await this.prisma.studentPathEnrollment.update({
        where: { id: enrollment.id },
        data: {
          progressPercentage,
          completedItemsCount: completedCount,
          totalItemsCount,
          status: newStatus,
          completedAt: isCompleted && !enrollment.completedAt ? new Date() : enrollment.completedAt,
        },
      });

      if (
        this.notificationsService &&
        isCompleted &&
        enrollment.status !== StudentPathEnrollmentStatus.COMPLETED &&
        studentProfile?.userId
      ) {
        await this.notificationsService.dispatchNotification({
          recipientUserId: studentProfile.userId,
          type: NotificationType.LEARNING_PATH_COMPLETED,
          priority: NotificationPriority.NORMAL,
          title: 'Learning Path Completed!',
          message: `Congratulations! You have completed the learning path '${enrollment.learningPath.title}'.`,
          entityType: 'LEARNING_PATH',
          entityId: enrollment.learningPathId,
          actionUrl: '/learning',
          idempotencyKey: `PATH_COMPLETED:PATH:${enrollment.learningPathId}:${studentProfile.userId}`,
        });
      }
    }
  }
}
