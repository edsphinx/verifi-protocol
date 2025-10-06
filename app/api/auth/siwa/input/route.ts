import { NextResponse } from "next/server";
import { createNonce } from "@/services/auth.service";
import type { AptosSignInInput } from "@aptos-labs/wallet-adapter-react";

/**
 * @api GET /api/auth/siwa/input
 * @desc Returns AptosSignInInput for wallet adapter's signIn() method
 * @dev This follows the official Aptos SIWA standard for one-click authentication
 */
export async function GET(req: Request) {
  try {
    const { nonce } = await createNonce();

    // Get the current host from the request for development
    const host = req.headers.get("host") || "localhost:3003";
    const protocol = host.includes("localhost") ? "http" : "https";
    const currentUrl = `${protocol}://${host}`;

    // Use environment variables with fallback to current request host
    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || host;
    const uri = process.env.NEXT_PUBLIC_APP_URL || currentUrl;

    // Get network from environment
    const network = process.env.NEXT_PUBLIC_APTOS_NETWORK || "testnet";

    const input: AptosSignInInput = {
      nonce,
      domain,
      statement: "Sign in to VeriFi Protocol to access prediction markets",
      uri,
      version: "1",
      chainId: `aptos:${network}`, // Must be "aptos:mainnet" or "aptos:testnet"
    };

    // Store the input in a cookie for verification in callback
    const response = NextResponse.json({ data: input });

    response.cookies.set("siwa-input", JSON.stringify(input), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 5 * 60, // 5 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Failed to generate SIWA input:", error);
    return NextResponse.json(
      { error: "Failed to generate SIWA input" },
      { status: 500 },
    );
  }
}
