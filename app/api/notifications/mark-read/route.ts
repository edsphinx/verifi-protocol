/**
 * POST /api/notifications/mark-read
 * Marks notifications as read
 */

import { NextRequest, NextResponse } from "next/server";
import {
  markNotificationAsRead,
  markAllAsReadForUser,
} from "@/services/notification.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, userAddress, markAll } = body;

    if (markAll && userAddress) {
      // Mark all notifications as read for user
      const count = await markAllAsReadForUser(userAddress);
      return NextResponse.json({ success: true, count });
    } else if (notificationId) {
      // Mark single notification as read
      const notification = await markNotificationAsRead(notificationId);
      return NextResponse.json({ success: true, notification });
    } else {
      return NextResponse.json(
        { error: "Missing notificationId or userAddress" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 },
    );
  }
}
