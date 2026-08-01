export type InternalNotificationType =
  | 'appointment_booked'
  | 'appointment_cancelled'
  | 'appointment_updated';

export interface InternalNotification {
  id: string;
  type: InternalNotificationType;
  title: string;
  message: string;
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadNotificationCount {
  unreadCount: number;
}
