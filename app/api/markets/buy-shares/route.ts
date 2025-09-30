import { type NextRequest, NextResponse } from "next/server";
import { buildBuySharesPayload } from "@/lib/aptos/transactions/buy-shares-transaction"; // ✅ Import our new builder

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // The body should contain { marketObjectAddress, amountOctas, buysYesShares }
    // We can add validation here later if needed.

    // ✅ Use the builder function to construct the payload
    const payload = buildBuySharesPayload(body);

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error creating buy_shares payload:", error);
    return NextResponse.json(
      { error: "Failed to construct transaction" },
      { status: 500 },
    );
  }
}
