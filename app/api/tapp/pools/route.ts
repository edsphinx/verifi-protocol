import { NextResponse } from "next/server";
import client from "@/lib/clients/prisma";

export async function GET() {
  try {
    const pools = await client.tappPool.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(pools);
  } catch (error) {
    console.error("[API /api/tapp/pools] Error fetching pools:", error);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
}
