import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { DispatchNotificationPayload } from '../dto/dispatch-notification.dto';
import { QueryNotificationsDto } from '../dto/query-notifications.dto';
import {
  DEFAULT_NOTIFICATION_PRIORITIES,
  NOTIFICATION_PAGINATION_DEFAULTS,
} from '../config/notification.constants';
import { Prisma, Notification, NotificationPriority } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly preferencesService: NotificationPreferencesService,
  ) {}

  /**
   * Dispatch a notification to a specific recipient.
   * Checks recipient preferences, enforces recipient-aware idempotency, and supports Prisma transactions.
   */
  async dispatchNotification(
    payload: DispatchNotificationPayload,
    tx?: Prisma.TransactionClient,
  ): Promise<Notification | null> {
    const client = tx || this.prisma;

    if (!payload.recipientUserId) {
      this.logger.warn('Notification dispatch aborted: Missing recipientUserId.');
      return null;
    }

    // 1. Preference check
    const isEnabled = await this.preferencesService.isNotificationEnabled(
      payload.recipientUserId,
      payload.type,
      tx,
    );

    if (!isEnabled) {
      this.logger.debug(
        `Notification of type '${payload.type}' suppressed by user '${payload.recipientUserId}' preference.`,
      );
      return null;
    }

    // 2. Determine Priority
    const priority =
      payload.priority ||
      DEFAULT_NOTIFICATION_PRIORITIES[payload.type] ||
      NotificationPriority.NORMAL;

    // 3. Recipient-aware Idempotency Check
    if (payload.idempotencyKey) {
      const existing = await client.notification.findUnique({
        where: { idempotencyKey: payload.idempotencyKey },
      });

      if (existing) {
        this.logger.debug(
          `Idempotent notification hit: '${payload.idempotencyKey}' already exists. Skipping duplicate.`,
        );
        return existing;
      }
    }

    // 4. Create Notification
    try {
      const notification = await client.notification.create({
        data: {
          recipientUserId: payload.recipientUserId,
          type: payload.type,
          priority,
          title: payload.title,
          message: payload.message,
          entityType: payload.entityType || null,
          entityId: payload.entityId || null,
          actionUrl: payload.actionUrl || null,
          metadata: payload.metadata || Prisma.JsonNull,
          idempotencyKey: payload.idempotencyKey || null,
          isRead: false,
        },
      });

      return notification;
    } catch (err: any) {
      // Handle unique constraint race condition gracefully on idempotencyKey
      if (err.code === 'P2002' && payload.idempotencyKey) {
        this.logger.debug(`Idempotency key collision handled gracefully: ${payload.idempotencyKey}`);
        return client.notification.findUnique({
          where: { idempotencyKey: payload.idempotencyKey },
        });
      }
      throw err;
    }
  }

  /**
   * List paginated notifications for the authenticated user with unread count and filters.
   * Strict IDOR isolation: Only queries recipientUserId = userId.
   */
  async getUserNotifications(userId: string, query: QueryNotificationsDto) {
    const page = Math.max(1, Number(query.page) || NOTIFICATION_PAGINATION_DEFAULTS.PAGE);
    const limit = Math.min(
      NOTIFICATION_PAGINATION_DEFAULTS.MAX_LIMIT,
      Math.max(1, Number(query.limit) || NOTIFICATION_PAGINATION_DEFAULTS.LIMIT),
    );
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      recipientUserId: userId,
      ...(query.unreadOnly && { isRead: false }),
      ...(query.type && { type: query.type }),
      ...(query.priority && { priority: query.priority }),
    };

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { recipientUserId: userId, isRead: false },
      }),
    ]);

    return {
      items,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Fast unread count lookup for header navigation bell.
   */
  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.prisma.notification.count({
      where: { recipientUserId: userId, isRead: false },
    });
    return { unreadCount };
  }

  /**
   * Get single notification with IDOR check.
   */
  async getNotificationById(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.recipientUserId !== userId) {
      throw new NotFoundException('Notification not found.');
    }

    return notification;
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.recipientUserId !== userId) {
      throw new NotFoundException('Notification not found.');
    }

    if (notification.isRead) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all unread notifications of the user as read.
   */
  async markAllAsRead(userId: string): Promise<{ count: number; success: boolean }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        recipientUserId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { count: result.count, success: true };
  }

  /**
   * Dismiss / delete a notification.
   * Strict IDOR check: Only deletes the notification record, never underlying domain entities.
   */
  async deleteNotification(userId: string, notificationId: string): Promise<{ success: boolean; message: string }> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.recipientUserId !== userId) {
      throw new NotFoundException('Notification not found.');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true, message: 'Notification dismissed successfully.' };
  }
}
