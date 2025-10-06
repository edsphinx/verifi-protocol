import { NextResponse } from "next/server";
import { getSessionFromRequest } from "./jwe";

/**
 * Authentication middleware for API routes
 * Usage: export const GET = withAuth(async (req, session) => { ... })
 */
export function withAuth(
  handler: (
    req: Request,
    session: { address: string; userId: string },
  ) => Promise<Response>,
) {
  return async (req: Request) => {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(req, {
      address: session.address,
      userId: session.userId,
    });
  };
}

/**
 * Optional authentication middleware for API routes
 * Returns session if available, but doesn't require it
 */
export function withOptionalAuth(
  handler: (
    req: Request,
    session: { address: string; userId: string } | null,
  ) => Promise<Response>,
) {
  return async (req: Request) => {
    const session = await getSessionFromRequest(req);

    return handler(
      req,
      session
        ? {
            address: session.address,
            userId: session.userId,
          }
        : null,
    );
  };
}
