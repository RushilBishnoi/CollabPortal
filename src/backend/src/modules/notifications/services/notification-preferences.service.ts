import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';
import {
  MANDATORY_NOTIFICATION_TYPES,
  DEFAULT_NOTIFICATION_PRIORITIES,
} from '../config/notification.constants';
import { NotificationPreferenceItemDto } from '../dto/update-preferences.dto';

export interface UserPreferenceResponseItem {
  notificationType: NotificationType;
  inAppEnabled: boolean;
  isMandatory: boolean;
  defaultPriority: string;
}

@Injectable()
export class NotificationPreferencesService {
  private readonly logger = new Logger(NotificationPreferencesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all notification preferences for a user, including defaults for unconfigured types.
   */
  async getPreferences(userId: string): Promise<UserPreferenceResponseItem[]> {
    const savedPrefs = await this.prisma.notificationPreference.findMany({
      where: { userId },
    });

    const savedMap = new Map<NotificationType, boolean>();
    savedPrefs.forEach((p) => savedMap.set(p.notificationType, p.inAppEnabled));

    const allTypes = Object.values(NotificationType);
    return allTypes.map((type) => {
      const isMandatory = MANDATORY_NOTIFICATION_TYPES.has(type);
      const inAppEnabled = isMandatory ? true : (savedMap.has(type) ? savedMap.get(type)! : true);

      return {
        notificationType: type,
        inAppEnabled,
        isMandatory,
        defaultPriority: DEFAULT_NOTIFICATION_PRIORITIES[type],
      };
    });
  }

  /**
   * Update notification preferences for a user.
   * Server-authoritative: Rejects attempts to disable mandatory notification types.
   */
  async updatePreferences(
    userId: string,
    items: NotificationPreferenceItemDto[],
  ): Promise<UserPreferenceResponseItem[]> {
    // Validate: Disallow disabling mandatory notification types
    for (const item of items) {
      if (MANDATORY_NOTIFICATION_TYPES.has(item.notificationType) && !item.inAppEnabled) {
        throw new BadRequestException(
          `Cannot disable mandatory notification type '${item.notificationType}'. Critical security, placement, and interview notices must remain enabled.`,
        );
      }
    }

    // Upsert preferences within transaction
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (!MANDATORY_NOTIFICATION_TYPES.has(item.notificationType)) {
          await tx.notificationPreference.upsert({
            where: {
              userId_notificationType: {
                userId,
                notificationType: item.notificationType,
              },
            },
            update: { inAppEnabled: item.inAppEnabled },
            create: {
              userId,
              notificationType: item.notificationType,
              inAppEnabled: item.inAppEnabled,
            },
          });
        }
      }
    });

    return this.getPreferences(userId);
  }

  /**
   * Check whether a notification type is enabled for a given user.
   */
  async isNotificationEnabled(
    userId: string,
    type: NotificationType,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    if (MANDATORY_NOTIFICATION_TYPES.has(type)) {
      return true;
    }

    const client = tx || this.prisma;
    const pref = await client.notificationPreference.findUnique({
      where: {
        userId_notificationType: {
          userId,
          notificationType: type,
        },
      },
    });

    return pref ? pref.inAppEnabled : true;
  }
}
