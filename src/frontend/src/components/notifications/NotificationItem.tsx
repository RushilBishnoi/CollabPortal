import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  Trash2,
  ExternalLink,
  AlertCircle,
  Briefcase,
  BookOpen,
  Users,
  Award,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { Notification, NotificationPriority, NotificationType } from '../../types/notifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const getPriorityBadge = (priority: NotificationPriority) => {
  switch (priority) {
    case 'URGENT':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900">
          Urgent
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
          High
        </span>
      );
    case 'NORMAL':
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
          Normal
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          Low
        </span>
      );
  }
};

const getTypeIcon = (type: NotificationType) => {
  if (type.startsWith('APPLICATION') || type.startsWith('OPPORTUNITY')) {
    return <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
  }
  if (type.startsWith('PLACEMENT')) {
    return <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
  }
  if (type.startsWith('INTERVIEW')) {
    return <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
  }
  if (type.startsWith('MENTOR')) {
    return <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
  }
  if (type.startsWith('LEARNING') || type.startsWith('ASSESSMENT') || type.startsWith('SKILL')) {
    return <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
  }
  if (type.startsWith('COLLABORATION')) {
    return <MessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
  }
  if (type === 'SYSTEM_ANNOUNCEMENT') {
    return <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
  }
  return <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
};

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString();
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
}) => {
  const navigate = useNavigate();

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleMarkReadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <div
      data-testid={`notification-item-${notification.id}`}
      className={`group relative flex items-start gap-3 p-3.5 transition-colors border-b last:border-b-0 ${
        notification.isRead
          ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          : 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-950/30'
      }`}
    >
      {/* Type Icon */}
      <div className="mt-0.5 flex-shrink-0 p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
        {getTypeIcon(notification.type)}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getPriorityBadge(notification.priority)}
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {formatTimeAgo(notification.createdAt)}
          </span>
          {!notification.isRead && (
            <span
              data-testid="unread-dot"
              className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0"
              title="Unread"
            />
          )}
        </div>

        <h4
          className={`text-sm tracking-tight ${
            notification.isRead
              ? 'font-medium text-slate-800 dark:text-slate-200'
              : 'font-semibold text-slate-900 dark:text-white'
          }`}
        >
          {notification.title}
        </h4>

        <p
          className={`text-xs mt-0.5 leading-relaxed ${
            compact
              ? 'line-clamp-2 text-slate-600 dark:text-slate-400'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          {notification.message}
        </p>

        {/* Action Link Button */}
        {notification.actionUrl && (
          <button
            onClick={handleActionClick}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <span>View details</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && onMarkAsRead && (
          <button
            data-testid={`mark-read-btn-${notification.id}`}
            onClick={handleMarkReadClick}
            title="Mark as read"
            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            data-testid={`delete-btn-${notification.id}`}
            onClick={handleDeleteClick}
            title="Dismiss notification"
            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
