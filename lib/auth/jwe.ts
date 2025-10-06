import { jwtDecrypt } from "jose";

const JWE_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production-32bytes",
);

export interface SessionPayload {
  address: string;
  userId: string;
  loginTime: number;
}

/**
 * Decrypt and verify a JWE token
 * @param token - The encrypted JWE token
 * @returns The decrypted payload or null if invalid
 */
export async function verifyJWE(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtDecrypt(token, JWE_SECRET);

    return {
      address: payload.address as string,
      userId: payload.userId as string,
      loginTime: payload.loginTime as number,
    };
  } catch (error) {
    console.error("JWE verification failed:", error);
    return null;
  }
}

/**
 * Extract session from cookies or authorization header
 * @param request - Next.js request object
 * @returns Session payload or null
 */
export async function getSessionFromRequest(
  request: Request,
): Promise<SessionPayload | null> {
  // Try to get token from cookie
  const cookieHeader = request.headers.get("cookie");
  const cookies = cookieHeader
    ?.split(";")
    .map((c) => c.trim())
    .reduce(
      (acc, cookie) => {
        const [key, value] = cookie.split("=");
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    );

  let token = cookies?.auth_token;

  // Fallback to Authorization header
  if (!token) {
    const authHeader = request.headers.get("authorization");
    token = authHeader?.replace("Bearer ", "");
  }

  if (!token) {
    return null;
  }

  return verifyJWE(token);
}
