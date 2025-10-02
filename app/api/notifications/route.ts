/**
 * GET /api/notifications
 * Returns notifications for the current user (or global if no user specified)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllNotificationsForUser, getUnreadCount } from "@/services/notification.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userAddress = searchParams.get("user");
    const limit = parseInt(searchParams.get("limit") || "20");

    const notifications = await getAllNotificationsForUser(
      userAddress || undefined,
      limit
    );

    const unreadCount = await getUnreadCount(userAddress || undefined);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
