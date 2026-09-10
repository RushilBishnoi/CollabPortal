import { NotificationType, NotificationPriority } from '@prisma/client';

export interface DispatchNotificationPayload {
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}
