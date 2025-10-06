import { NextResponse } from "next/server";
import { verifySIWAAndCreateSession } from "@/services/auth.service";

/**
 * @api POST /api/auth/siwa/verify
 * @desc Verifies SIWA signature and creates authenticated session
 * @dev Thin proxy to auth service layer - all logic in services/auth.service.ts
 */
export async function POST(req: Request) {
  try {
    const { fullMessage, signature, address, publicKey, nonce } =
      await req.json();

    if (!fullMessage || !signature || !address || !publicKey || !nonce) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Delegate all logic to service layer
    const result = await verifySIWAAndCreateSession({
      fullMessage,
      signature,
      address,
      publicKey,
      nonce,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Set HTTP-only cookie with encrypted token
    const response = NextResponse.json({
      success: true,
      address: result.address,
      token: result.token,
    });

    response.cookies.set("auth_token", result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("SIWA verification failed:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
