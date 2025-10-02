"use client";

/**
 * Notification Context
 * Provides global notification state and polling for real-time updates
 */

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Notification, NotificationContextType } from "@/lib/interfaces";

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
  pollInterval?: number; // milliseconds (default: 10000 = 10s)
}

export function NotificationProvider({
  children,
  pollInterval = 10000,
}: NotificationProviderProps) {
  const { account } = useWallet();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(
    null,
  );

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams({
        limit: "20",
      });

      if (account?.address) {
        params.append("user", account.address.toString());
      }

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      // Check for new notifications to show toast
      if (data.notifications.length > 0) {
        const latestNotification = data.notifications[0];
        if (
          lastNotificationId &&
          latestNotification.id !== lastNotificationId
        ) {
          // New notification arrived - show toast
          toast.info(latestNotification.title, {
            description: latestNotification.message,
            action: latestNotification.relatedAddress
              ? {
                  label: "View",
                  onClick: () => {
                    window.location.href = `/market/${latestNotification.relatedAddress}`;
                  },
                }
              : undefined,
          });
        }
        setLastNotificationId(latestNotification.id);
      }

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!account?.address) return;

    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markAll: true,
          userAddress: account.address,
        }),
      });

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [account?.address]);

  // Poll for new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [account?.address, pollInterval, lastNotificationId]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refetch: fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
