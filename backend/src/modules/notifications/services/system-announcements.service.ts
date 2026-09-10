import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateSystemAnnouncementDto } from '../dto/create-announcement.dto';
import { NotificationType, NotificationPriority, UserStatus, Prisma } from '@prisma/client';

@Injectable()
export class SystemAnnouncementsService {
  private readonly logger = new Logger(SystemAnnouncementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Super Admin: Broadcast a platform-wide or role-targeted announcement.
   */
  async broadcastAnnouncement(
    adminUserId: string,
    dto: CreateSystemAnnouncementDto,
  ): Promise<{ success: boolean; recipientsCount: number; message: string }> {
    const where: Prisma.UserWhereInput = {
      status: UserStatus.ACTIVE,
      ...(dto.targetRole && { role: dto.targetRole }),
    };

    const targetUsers = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (targetUsers.length === 0) {
      return {
        success: true,
        recipientsCount: 0,
        message: 'No active users found for the target criteria.',
      };
    }

    const priority = dto.priority || NotificationPriority.HIGH;
    const announcementTimestamp = Date.now();

    // Chunk notifications in batches of 500 for high efficiency
    const CHUNK_SIZE = 500;
    let totalCreated = 0;

    for (let i = 0; i < targetUsers.length; i += CHUNK_SIZE) {
      const chunk = targetUsers.slice(i, i + CHUNK_SIZE);
      const data = chunk.map((user) => ({
        recipientUserId: user.id,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        priority,
        title: dto.title,
        message: dto.message,
        entityType: 'SYSTEM',
        actionUrl: dto.actionUrl || null,
        metadata: (dto.metadata || { broadcastByAdminId: adminUserId }) as any,
        idempotencyKey: `SYSTEM_ANNOUNCEMENT:${announcementTimestamp}:${user.id}`,
        isRead: false,
      }));

      const res = await this.prisma.notification.createMany({
        data,
        skipDuplicates: true,
      });

      totalCreated += res.count;
    }

    this.logger.log(
      `System announcement broadcast by admin '${adminUserId}' to ${totalCreated} users.`,
    );

    return {
      success: true,
      recipientsCount: totalCreated,
      message: `System announcement broadcast to ${totalCreated} recipient(s).`,
    };
  }
}
