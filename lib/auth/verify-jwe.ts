import { jwtDecrypt } from "jose";
import { cookies } from "next/headers";

const JWE_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production-32bytes",
);

export interface SessionPayload {
  address: string;
  userId: string;
  loginTime: number;
}

/**
 * Verify and decrypt JWE token from HTTP-only cookie
 * Returns the decrypted session payload or null if invalid
 */
export async function verifyJWE(
  token?: string,
): Promise<SessionPayload | null> {
  try {
    // Get token from cookie if not provided
    const tokenToVerify = token || (await cookies()).get("auth_token")?.value;

    if (!tokenToVerify) {
      return null;
    }

    // Decrypt and verify JWE token
    const { payload } = await jwtDecrypt(tokenToVerify, JWE_SECRET);

    // Validate payload structure
    if (
      typeof payload.address === "string" &&
      typeof payload.userId === "string" &&
      typeof payload.loginTime === "number"
    ) {
      return payload as unknown as SessionPayload;
    }

    return null;
  } catch (error) {
    console.error("JWE verification failed:", error);
    return null;
  }
}

/**
 * Get current user's address from session
 * Throws error if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const session = await verifyJWE();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session.address;
}

/**
 * Get current user's address from session
 * Returns null if not authenticated (no error thrown)
 */
export async function getAuthAddress(): Promise<string | null> {
  const session = await verifyJWE();
  return session?.address || null;
}
