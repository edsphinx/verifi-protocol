import { NextResponse } from "next/server";
import { createNonce } from "@/services/auth.service";

/**
 * @api POST /api/auth/siwa/generate-nonce
 * @desc Generates a cryptographically secure nonce for SIWA authentication
 * @dev Thin proxy to auth service layer
 */
export async function POST() {
  try {
    const { nonce, expiresAt } = await createNonce();

    return NextResponse.json({
      nonce,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to generate nonce:", error);
    return NextResponse.json(
      { error: "Failed to generate nonce" },
      { status: 500 },
    );
  }
}
