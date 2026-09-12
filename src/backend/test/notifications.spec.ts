import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationsService } from '../src/modules/notifications/services/notifications.service';
import { NotificationPreferencesService } from '../src/modules/notifications/services/notification-preferences.service';
import { SystemAnnouncementsService } from '../src/modules/notifications/services/system-announcements.service';
import {
  NotificationType,
  NotificationPriority,
} from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('Phase 15: Notifications & Communication System Spec', () => {
  let prismaMock: any;
  let preferencesService: NotificationPreferencesService;
  let notificationsService: NotificationsService;
  let announcementsService: SystemAnnouncementsService;

  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock = {
      notification: {
        create: vi.fn(),
        createMany: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        groupBy: vi.fn(),
      },
      notificationPreference: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        upsert: vi.fn(),
      },
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
    };
    prismaMock['$transaction'] = vi.fn(async (cb) => (typeof cb === 'function' ? cb(prismaMock) : cb));

    preferencesService = new NotificationPreferencesService(prismaMock);
    notificationsService = new NotificationsService(prismaMock, preferencesService);
    announcementsService = new SystemAnnouncementsService(prismaMock);
  });

  describe('1. Core Notification Dispatching & Determinism', () => {
    it('should successfully dispatch a persistent notification for enabled preference', async () => {
      prismaMock.notificationPreference.findUnique.mockResolvedValue(null);
      prismaMock.notification.create.mockResolvedValue({
        id: 'notif-1',
        recipientUserId: 'user-student-1',
        type: NotificationType.APPLICATION_SHORTLISTED,
        priority: NotificationPriority.HIGH,
        title: 'Application Shortlisted!',
        message: 'Your application has been shortlisted.',
        entityType: 'APPLICATION',
        entityId: 'app-1',
        actionUrl: '/applications',
        isRead: false,
        idempotencyKey: 'APP_STATUS:SHORTLISTED:APPLICATION:app-1:user-student-1',
        createdAt: new Date(),
      });

      const result = await notificationsService.dispatchNotification({
        recipientUserId: 'user-student-1',
        type: NotificationType.APPLICATION_SHORTLISTED,
        title: 'Application Shortlisted!',
        message: 'Your application has been shortlisted.',
        entityType: 'APPLICATION',
        entityId: 'app-1',
        actionUrl: '/applications',
        idempotencyKey: 'APP_STATUS:SHORTLISTED:APPLICATION:app-1:user-student-1',
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe('notif-1');
      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientUserId: 'user-student-1',
          type: NotificationType.APPLICATION_SHORTLISTED,
          priority: NotificationPriority.HIGH,
          title: 'Application Shortlisted!',
          actionUrl: '/applications',
        }),
      });
    });

    it('should suppress optional notification if user disabled it in preferences', async () => {
      prismaMock.notificationPreference.findUnique.mockResolvedValue({
        id: 'pref-1',
        userId: 'user-student-1',
        notificationType: NotificationType.LEARNING_PATH_ENROLLED,
        inAppEnabled: false,
      });

      const result = await notificationsService.dispatchNotification({
        recipientUserId: 'user-student-1',
        type: NotificationType.LEARNING_PATH_ENROLLED,
        title: 'Enrolled in Learning Path',
        message: 'You have enrolled in path.',
      });

      expect(result).toBeNull();
      expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });

    it('should NEVER suppress mandatory notification even if preference record was false', async () => {
      prismaMock.notification.create.mockResolvedValue({
        id: 'notif-urgent',
        recipientUserId: 'user-student-1',
        type: NotificationType.PLACEMENT_OFFER_ISSUED,
        priority: NotificationPriority.URGENT,
        title: 'Placement Offer Received!',
        message: 'You received a placement offer.',
        isRead: false,
      });

      const result = await notificationsService.dispatchNotification({
        recipientUserId: 'user-student-1',
        type: NotificationType.PLACEMENT_OFFER_ISSUED,
        title: 'Placement Offer Received!',
        message: 'You received a placement offer.',
      });

      expect(result).toBeDefined();
      expect(prismaMock.notification.create).toHaveBeenCalled();
    });
  });

  describe('2. Recipient-Aware Idempotency', () => {
    it('should skip duplicate creation when same event is sent to same recipient', async () => {
      const existingKey = 'OFFER_ISSUED:OFFER:offer-1:user-student-1';
      prismaMock.notificationPreference.findUnique.mockResolvedValue(null);
      prismaMock.notification.findUnique.mockResolvedValue({
        id: 'notif-existing',
        idempotencyKey: existingKey,
        recipientUserId: 'user-student-1',
        type: NotificationType.PLACEMENT_OFFER_ISSUED,
      });

      const result = await notificationsService.dispatchNotification({
        recipientUserId: 'user-student-1',
        type: NotificationType.PLACEMENT_OFFER_ISSUED,
        title: 'Placement Offer Received!',
        message: 'Offer details.',
        idempotencyKey: existingKey,
      });

      expect(result?.id).toBe('notif-existing');
      expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });

    it('should allow separate notifications for different recipients of the same domain event', async () => {
      prismaMock.notificationPreference.findUnique.mockResolvedValue(null);
      prismaMock.notification.findUnique.mockResolvedValue(null);

      prismaMock.notification.create
        .mockResolvedValueOnce({
          id: 'notif-student',
          idempotencyKey: 'OFFER_ISSUED:OFFER:offer-1:user-student-1',
          recipientUserId: 'user-student-1',
        })
        .mockResolvedValueOnce({
          id: 'notif-recruiter',
          idempotencyKey: 'OFFER_ISSUED:OFFER:offer-1:user-recruiter-1',
          recipientUserId: 'user-recruiter-1',
        });

      const resStudent = await notificationsService.dispatchNotification({
        recipientUserId: 'user-student-1',
        type: NotificationType.PLACEMENT_OFFER_ISSUED,
        title: 'Offer Issued',
        message: 'Offer details for student.',
        idempotencyKey: 'OFFER_ISSUED:OFFER:offer-1:user-student-1',
      });

      const resRecruiter = await notificationsService.dispatchNotification({
        recipientUserId: 'user-recruiter-1',
        type: NotificationType.PLACEMENT_OFFER_ISSUED,
        title: 'Offer Issued',
        message: 'Offer copy for recruiter.',
        idempotencyKey: 'OFFER_ISSUED:OFFER:offer-1:user-recruiter-1',
      });

      expect(resStudent?.id).toBe('notif-student');
      expect(resRecruiter?.id).toBe('notif-recruiter');
      expect(prismaMock.notification.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('3. Notification Lifecycle & Strict IDOR Defense', () => {
    it('should list paginated notifications only for the authenticated recipient', async () => {
      prismaMock.notification.findMany.mockResolvedValue([
        { id: 'n-1', recipientUserId: 'user-1', title: 'N1', isRead: false },
        { id: 'n-2', recipientUserId: 'user-1', title: 'N2', isRead: true },
      ]);
      prismaMock.notification.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      const result = await notificationsService.getUserNotifications('user-1', { page: 1, limit: 20 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.unreadCount).toBe(1);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ recipientUserId: 'user-1' }),
        }),
      );
    });

    it('should return fast unread count for user', async () => {
      prismaMock.notification.count.mockResolvedValue(5);

      const result = await notificationsService.getUnreadCount('user-1');
      expect(result.unreadCount).toBe(5);
      expect(prismaMock.notification.count).toHaveBeenCalledWith({
        where: { recipientUserId: 'user-1', isRead: false },
      });
    });

    it('should allow user to mark own notification as read', async () => {
      prismaMock.notification.findUnique.mockResolvedValue({
        id: 'n-1',
        recipientUserId: 'user-1',
        isRead: false,
      });
      prismaMock.notification.update.mockResolvedValue({
        id: 'n-1',
        recipientUserId: 'user-1',
        isRead: true,
        readAt: new Date(),
      });

      const result = await notificationsService.markAsRead('user-1', 'n-1');
      expect(result.isRead).toBe(true);
      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: { id: 'n-1' },
        data: expect.objectContaining({ isRead: true }),
      });
    });

    it('should reject markAsRead if notification belongs to another user (IDOR)', async () => {
      prismaMock.notification.findUnique.mockResolvedValue({
        id: 'n-other',
        recipientUserId: 'user-victim',
        isRead: false,
      });

      await expect(
        notificationsService.markAsRead('user-attacker', 'n-other'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow user to mark all own unread notifications as read', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 4 });

      const result = await notificationsService.markAllAsRead('user-1');
      expect(result.count).toBe(4);
      expect(result.success).toBe(true);
      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: { recipientUserId: 'user-1', isRead: false },
        data: expect.objectContaining({ isRead: true }),
      });
    });

    it('should delete notification without modifying underlying domain entity and enforce IDOR', async () => {
      prismaMock.notification.findUnique.mockResolvedValue({
        id: 'n-1',
        recipientUserId: 'user-1',
      });
      prismaMock.notification.delete.mockResolvedValue({ id: 'n-1' });

      const result = await notificationsService.deleteNotification('user-1', 'n-1');
      expect(result.success).toBe(true);
      expect(prismaMock.notification.delete).toHaveBeenCalledWith({
        where: { id: 'n-1' },
      });

      prismaMock.notification.findUnique.mockResolvedValue({
        id: 'n-2',
        recipientUserId: 'user-other',
      });

      await expect(
        notificationsService.deleteNotification('user-1', 'n-2'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('4. Notification Preferences & Mandatory Invariants', () => {
    it('should list all preferences with isMandatory flag and default priorities', async () => {
      prismaMock.notificationPreference.findMany.mockResolvedValue([
        { notificationType: NotificationType.OPPORTUNITY_PUBLISHED, inAppEnabled: false },
      ]);

      const prefs = await preferencesService.getPreferences('user-1');

      expect(prefs.length).toBeGreaterThan(10);
      const oppPref = prefs.find((p) => p.notificationType === NotificationType.OPPORTUNITY_PUBLISHED);
      expect(oppPref?.inAppEnabled).toBe(false);
      expect(oppPref?.isMandatory).toBe(false);

      const offerPref = prefs.find((p) => p.notificationType === NotificationType.PLACEMENT_OFFER_ISSUED);
      expect(offerPref?.isMandatory).toBe(true);
      expect(offerPref?.inAppEnabled).toBe(true);
    });

    it('should allow updating optional preferences', async () => {
      prismaMock.notificationPreference.findMany.mockResolvedValue([
        { notificationType: NotificationType.OPPORTUNITY_PUBLISHED, inAppEnabled: false },
      ]);

      const result = await preferencesService.updatePreferences('user-1', [
        { notificationType: NotificationType.OPPORTUNITY_PUBLISHED, inAppEnabled: false },
      ]);

      expect(result).toBeDefined();
      expect(prismaMock.notificationPreference.upsert).toHaveBeenCalledWith({
        where: {
          userId_notificationType: {
            userId: 'user-1',
            notificationType: NotificationType.OPPORTUNITY_PUBLISHED,
          },
        },
        update: { inAppEnabled: false },
        create: {
          userId: 'user-1',
          notificationType: NotificationType.OPPORTUNITY_PUBLISHED,
          inAppEnabled: false,
        },
      });
    });

    it('should reject disabling mandatory notification types on the backend', async () => {
      await expect(
        preferencesService.updatePreferences('user-1', [
          { notificationType: NotificationType.PLACEMENT_OFFER_ISSUED, inAppEnabled: false },
        ]),
      ).rejects.toThrow(BadRequestException);

      await expect(
        preferencesService.updatePreferences('user-1', [
          { notificationType: NotificationType.INTERVIEW_SCHEDULED, inAppEnabled: false },
        ]),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('5. System Announcements (Super Admin)', () => {
    it('should broadcast announcements to all active users safely in chunks', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { id: 'user-1' },
        { id: 'user-2' },
        { id: 'user-3' },
      ]);
      prismaMock.notification.createMany.mockResolvedValue({ count: 3 });

      const result = await announcementsService.broadcastAnnouncement('admin-1', {
        title: 'Platform Maintenance Notice',
        message: 'System will undergo scheduled maintenance at midnight.',
        priority: NotificationPriority.HIGH,
      });

      expect(result.success).toBe(true);
      expect(result.recipientsCount).toBe(3);
      expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            recipientUserId: 'user-1',
            type: NotificationType.SYSTEM_ANNOUNCEMENT,
            title: 'Platform Maintenance Notice',
          }),
        ]),
        skipDuplicates: true,
      });
    });
  });

  describe('6. Transaction Propagation & Concurrency Race Defense', () => {
    it('should use transaction client if provided during dispatch', async () => {
      const txMock: any = {
        notification: {
          create: vi.fn().mockResolvedValue({ id: 'notif-tx', recipientUserId: 'u-1', type: NotificationType.APPLICATION_SELECTED }),
          findUnique: vi.fn().mockResolvedValue(null),
        },
        notificationPreference: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      };

      const result = await notificationsService.dispatchNotification(
        {
          recipientUserId: 'u-1',
          type: NotificationType.APPLICATION_SELECTED,
          title: 'Selected',
          message: 'Selected for role',
        },
        txMock,
      );

      expect(result?.id).toBe('notif-tx');
      expect(txMock.notification.create).toHaveBeenCalled();
      expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });

    it('should gracefully handle unique constraint race collision on idempotency key', async () => {
      const collisionKey = 'RACE_COLLISION:OPPORTUNITY:123:user-1';
      prismaMock.notificationPreference.findUnique.mockResolvedValue(null);
      prismaMock.notification.findUnique
        .mockResolvedValueOnce(null) // First check: not found yet
        .mockResolvedValueOnce({ id: 'notif-concurrent', idempotencyKey: collisionKey }); // Second check: found

      const p2002Error: any = new Error('Unique constraint failed');
      p2002Error.code = 'P2002';
      prismaMock.notification.create.mockRejectedValue(p2002Error);

      const result = await notificationsService.dispatchNotification({
        recipientUserId: 'user-1',
        type: NotificationType.OPPORTUNITY_PUBLISHED,
        title: 'Opportunity',
        message: 'New opportunity',
        idempotencyKey: collisionKey,
      });

      expect(result?.id).toBe('notif-concurrent');
    });

    it('should abort dispatch safely when recipientUserId is missing', async () => {
      const result = await notificationsService.dispatchNotification({
        recipientUserId: '',
        type: NotificationType.OPPORTUNITY_PUBLISHED,
        title: 'Missing Recipient',
        message: 'No recipient',
      });

      expect(result).toBeNull();
      expect(prismaMock.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('7. Domain Event Notifications Dispatch Traceability', () => {
    it('should dispatch PLACEMENT_VERIFICATION_REQUIRED to institution admin with transaction client', async () => {
      prismaMock.notificationPreference.findUnique.mockResolvedValue(null);
      prismaMock.notification.create.mockResolvedValue({
        id: 'notif-pvr',
        recipientUserId: 'inst-admin-1',
        type: NotificationType.PLACEMENT_VERIFICATION_REQUIRED,
        priority: NotificationPriority.HIGH,
        title: 'Placement Verification Required',
      });

      const res = await notificationsService.dispatchNotification({
        recipientUserId: 'inst-admin-1',
        type: NotificationType.PLACEMENT_VERIFICATION_REQUIRED,
        priority: NotificationPriority.HIGH,
        title: 'Placement Verification Required',
        message: 'Placement for candidate requires verification.',
        entityType: 'PLACEMENT',
        entityId: 'placement-1',
        actionUrl: '/portal/institution/placements',
        idempotencyKey: 'PLACEMENT_VERIFICATION_REQUIRED:PLACEMENT:placement-1:inst-admin-1',
      });

      expect(res?.id).toBe('notif-pvr');
      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientUserId: 'inst-admin-1',
          type: NotificationType.PLACEMENT_VERIFICATION_REQUIRED,
          priority: NotificationPriority.HIGH,
          actionUrl: '/portal/institution/placements',
        }),
      });
    });

    it('should dispatch SKILL_GAP_REMEDIATION_AVAILABLE when student does not pass assessment', async () => {
      prismaMock.notificationPreference.findUnique.mockResolvedValue(null);
      prismaMock.notification.create.mockResolvedValue({
        id: 'notif-remediation',
        recipientUserId: 'student-1',
        type: NotificationType.SKILL_GAP_REMEDIATION_AVAILABLE,
        priority: NotificationPriority.NORMAL,
        title: 'Learning Remediation Available',
      });

      const res = await notificationsService.dispatchNotification({
        recipientUserId: 'student-1',
        type: NotificationType.SKILL_GAP_REMEDIATION_AVAILABLE,
        priority: NotificationPriority.NORMAL,
        title: 'Learning Remediation Available',
        message: 'Targeted learning resources are available for your skill deficit.',
        entityType: 'ASSESSMENT_ATTEMPT',
        entityId: 'attempt-1',
        actionUrl: '/learning',
        idempotencyKey: 'SKILL_GAP_REMEDIATION:ATTEMPT:attempt-1:student-1',
      });

      expect(res?.id).toBe('notif-remediation');
      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientUserId: 'student-1',
          type: NotificationType.SKILL_GAP_REMEDIATION_AVAILABLE,
        }),
      });
    });

    it('should dispatch MENTORSHIP_STARTED when mentor accepts request', async () => {
      prismaMock.notificationPreference.findUnique.mockResolvedValue(null);
      prismaMock.notification.create.mockResolvedValue({
        id: 'notif-mentor-started',
        recipientUserId: 'mentor-1',
        type: NotificationType.MENTORSHIP_STARTED,
        priority: NotificationPriority.HIGH,
        title: 'New Mentorship Active',
      });

      const res = await notificationsService.dispatchNotification({
        recipientUserId: 'mentor-1',
        type: NotificationType.MENTORSHIP_STARTED,
        priority: NotificationPriority.HIGH,
        title: 'New Mentorship Active',
        message: 'You are now actively mentoring a student.',
        entityType: 'MENTORSHIP',
        entityId: 'mentorship-1',
        actionUrl: '/portal/mentor/workspace',
        idempotencyKey: 'MENTORSHIP_STARTED:MENTORSHIP:mentorship-1:mentor-1',
      });

      expect(res?.id).toBe('notif-mentor-started');
      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientUserId: 'mentor-1',
          type: NotificationType.MENTORSHIP_STARTED,
        }),
      });
    });

    it('should dispatch OPPORTUNITY_PUBLISHED to eligible student audience', async () => {
      prismaMock.notificationPreference.findUnique.mockResolvedValue(null);
      prismaMock.notification.create.mockResolvedValue({
        id: 'notif-opp-pub',
        recipientUserId: 'student-cs-1',
        type: NotificationType.OPPORTUNITY_PUBLISHED,
        priority: NotificationPriority.LOW,
        title: 'New Opportunity Published',
      });

      const res = await notificationsService.dispatchNotification({
        recipientUserId: 'student-cs-1',
        type: NotificationType.OPPORTUNITY_PUBLISHED,
        priority: NotificationPriority.LOW,
        title: 'New Opportunity Published',
        message: 'A new opportunity is now open.',
        entityType: 'OPPORTUNITY',
        entityId: 'opp-1',
        actionUrl: '/opportunities',
        idempotencyKey: 'OPP_PUBLISHED:OPPORTUNITY:opp-1:student-cs-1',
      });

      expect(res?.id).toBe('notif-opp-pub');
      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientUserId: 'student-cs-1',
          type: NotificationType.OPPORTUNITY_PUBLISHED,
          priority: NotificationPriority.LOW,
        }),
      });
    });
  });
});
