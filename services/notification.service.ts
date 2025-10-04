/**
 * @file Service layer for all database operations related to notifications.
 * @dev This module handles global and user-specific notifications from blockchain events.
 */

import type { Notification } from "@prisma/client";
import type { NotificationType, CreateNotificationData } from "@/lib/types";
import client from "../lib/clients/prisma";

/**
 * @notice Creates a new notification in the database.
 * @dev Called by webhook handlers when significant events occur.
 * @param notificationData Data for the new notification
 * @returns The newly created Notification object
 */
export async function createNotification(
  notificationData: CreateNotificationData,
): Promise<Notification> {
  return await client.notification.create({
    data: {
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      relatedAddress: notificationData.relatedAddress,
      txHash: notificationData.txHash,
      metadata: notificationData.metadata || {},
      isGlobal: notificationData.isGlobal || false,
      targetUser: notificationData.targetUser,
      read: false,
    },
  });
}

/**
 * @notice Creates a global notification visible to all users.
 * @param type Type of notification
 * @param title Notification title
 * @param message Notification message
 * @param relatedAddress Optional related address (market/pool)
 * @param txHash Optional transaction hash
 * @param metadata Optional additional data
 * @returns The created notification
 */
export async function createGlobalNotification(
  type: NotificationType,
  title: string,
  message: string,
  relatedAddress?: string,
  txHash?: string,
  metadata?: Record<string, any>,
): Promise<Notification> {
  return createNotification({
    type,
    title,
    message,
    relatedAddress,
    txHash,
    metadata,
    isGlobal: true,
  });
}

/**
 * @notice Creates a user-specific notification.
 * @param targetUser User address to notify
 * @param type Type of notification
 * @param title Notification title
 * @param message Notification message
 * @param relatedAddress Optional related address
 * @param txHash Optional transaction hash
 * @param metadata Optional additional data
 * @returns The created notification
 */
export async function createUserNotification(
  targetUser: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedAddress?: string,
  txHash?: string,
  metadata?: Record<string, any>,
): Promise<Notification> {
  return createNotification({
    type,
    title,
    message,
    relatedAddress,
    txHash,
    metadata,
    isGlobal: false,
    targetUser,
  });
}

/**
 * @notice Retrieves global notifications (newest first).
 * @param limit Number of notifications to return
 * @returns Array of global notifications
 */
export async function getGlobalNotifications(
  limit = 20,
): Promise<Notification[]> {
  return await client.notification.findMany({
    where: {
      isGlobal: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/**
 * @notice Retrieves notifications for a specific user.
 * @param userAddress User address
 * @param limit Number of notifications to return
 * @returns Array of user notifications
 */
export async function getUserNotifications(
  userAddress: string,
  limit = 20,
): Promise<Notification[]> {
  return await client.notification.findMany({
    where: {
      targetUser: userAddress,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/**
 * @notice Retrieves all notifications for a user (user-specific + global).
 * @param userAddress User address (optional, if null returns only global)
 * @param limit Number of notifications to return
 * @returns Array of notifications
 */
export async function getAllNotificationsForUser(
  userAddress?: string,
  limit = 20,
): Promise<Notification[]> {
  const where = userAddress
    ? {
        OR: [{ isGlobal: true }, { targetUser: userAddress }],
      }
    : { isGlobal: true };

  return await client.notification.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/**
 * @notice Marks a notification as read.
 * @param notificationId Notification ID
 * @returns The updated notification
 */
export async function markNotificationAsRead(
  notificationId: string,
): Promise<Notification> {
  return await client.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      read: true,
    },
  });
}

/**
 * @notice Marks all notifications as read for a user.
 * @param userAddress User address
 * @returns Count of updated notifications
 */
export async function markAllAsReadForUser(
  userAddress: string,
): Promise<number> {
  const result = await client.notification.updateMany({
    where: {
      OR: [{ targetUser: userAddress }, { isGlobal: true }],
      read: false,
    },
    data: {
      read: true,
    },
  });

  return result.count;
}

/**
 * @notice Gets count of unread notifications for a user.
 * @param userAddress User address (optional)
 * @returns Count of unread notifications
 */
export async function getUnreadCount(userAddress?: string): Promise<number> {
  const where = userAddress
    ? {
        OR: [{ isGlobal: true }, { targetUser: userAddress }],
        read: false,
      }
    : {
        isGlobal: true,
        read: false,
      };

  return await client.notification.count({ where });
}

/**
 * @notice Deletes old notifications (cleanup).
 * @param daysOld Number of days to keep (default: 30)
 * @returns Count of deleted notifications
 */
export async function deleteOldNotifications(daysOld = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await client.notification.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
      read: true,
    },
  });

  return result.count;
}
