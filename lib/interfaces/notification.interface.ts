/**
 * @file Notification-related interfaces
 * @description Interfaces for notification system
 */

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedAddress?: string | null;
  txHash?: string | null;
  metadata?: Record<string, any> | null;
  isGlobal: boolean;
  targetUser?: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}
