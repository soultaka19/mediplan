import { Notification } from '../notification.entity';
import { NotificationType } from '../notification-type.enum';

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface UnreadNotificationCountResponse {
  unreadCount: number;
}

export function toNotificationResponse(notification: Notification): NotificationResponse {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    actionUrl: notification.actionUrl,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}
