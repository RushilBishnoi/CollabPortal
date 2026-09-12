import { apiClient } from './api-client';
import {
  Notification,
  NotificationsListResponse,
  UnreadCountResponse,
  NotificationPreference,
  NotificationPreferenceItem,
  QueryNotificationsParams,
  CreateAnnouncementPayload,
} from '../types/notifications';

const buildQueryString = (params?: Record<string, unknown>): string => {
  if (!params) return '';
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
};

export const notificationsApi = {
  /**
   * Fetch paginated notifications with filters (unreadOnly, type, priority, page, limit).
   */
  getNotifications: (params?: QueryNotificationsParams) =>
    apiClient.get<NotificationsListResponse>(
      `/notifications${buildQueryString(params as Record<string, unknown>)}`,
    ),

  /**
   * Fast polling / lookup for unread notification badge count.
   */
  getUnreadCount: () =>
    apiClient.get<UnreadCountResponse>('/notifications/unread-count'),

  /**
   * Fetch a single notification by ID.
   */
  getNotificationById: (id: string) =>
    apiClient.get<Notification>(`/notifications/${id}`),

  /**
   * Mark a notification as read.
   */
  markAsRead: (id: string) =>
    apiClient.patch<Notification>(`/notifications/${id}/read`),

  /**
   * Mark all unread notifications of the user as read.
   */
  markAllAsRead: () =>
    apiClient.patch<{ count: number; success: boolean }>('/notifications/read-all'),

  /**
   * Dismiss / delete a single notification.
   */
  deleteNotification: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/notifications/${id}`),

  /**
   * Get user notification preferences with mandatory flags and default priorities.
   */
  getPreferences: () =>
    apiClient.get<NotificationPreference[]>('/notifications/preferences'),

  /**
   * Update notification preferences.
   */
  updatePreferences: (preferences: NotificationPreferenceItem[]) =>
    apiClient.put<NotificationPreference[]>('/notifications/preferences', { preferences }),

  /**
   * Super Admin: Broadcast announcement to all active users or targeted role.
   */
  broadcastAnnouncement: (payload: CreateAnnouncementPayload) =>
    apiClient.post<{ success: boolean; recipientsCount: number; message: string }>(
      '/notifications/announcements',
      payload,
    ),
};
