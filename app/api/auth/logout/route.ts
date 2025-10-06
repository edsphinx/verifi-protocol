import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // JWE tokens are stateless, no database cleanup needed
    // Just clear the cookie to invalidate the session
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout failed:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
