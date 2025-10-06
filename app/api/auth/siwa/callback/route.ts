import { NextResponse } from "next/server";
import { verifySIWASignInOutput } from "@/services/auth.service";
import type { AptosSignInOutput } from "@aptos-labs/wallet-adapter-react";

/**
 * @api POST /api/auth/siwa/callback
 * @desc Verifies wallet adapter signIn() output and creates authenticated session
 * @dev This follows the official Aptos SIWA standard for one-click authentication
 */
export async function POST(req: Request) {
  try {
    const { output } = await req.json();

    if (!output || !output.signature || !output.publicKey || !output.input) {
      return NextResponse.json(
        { error: "Missing required fields in signIn output" },
        { status: 400 },
      );
    }

    // Get the original input from cookie (set by /api/auth/siwa/input)
    const cookies = req.headers.get("cookie");
    const siwaInputCookie = cookies
      ?.split(";")
      .find((c) => c.trim().startsWith("siwa-input="));

    if (!siwaInputCookie) {
      return NextResponse.json(
        { error: "SIWA input not found. Please request a new sign-in." },
        { status: 400 },
      );
    }

    const expectedInput = JSON.parse(
      decodeURIComponent(siwaInputCookie.split("=")[1]),
    );

    // Verify the signIn output using our service
    const result = await verifySIWASignInOutput(
      output as any, // Type assertion for compatibility between wallet-adapter and wallet-standard versions
      expectedInput,
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Set HTTP-only cookie with encrypted token
    const response = NextResponse.json({
      success: true,
      address: result.address,
      userId: result.userId,
    });

    response.cookies.set("auth_token", result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    // Clear the siwa-input cookie
    response.cookies.set("siwa-input", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("SIWA callback failed:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}
