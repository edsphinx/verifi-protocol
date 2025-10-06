import { getSessionFromRequest } from "@/lib/auth/jwe";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    return NextResponse.json({
      authenticated: !!session,
      address: session?.address || null,
    });
  } catch (error) {
    console.error("Status check failed:", error);
    return NextResponse.json({ authenticated: false, address: null });
  }
}
