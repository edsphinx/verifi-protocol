import { type NextRequest, NextResponse } from "next/server";
import { buildSellSharesPayload } from "@/lib/aptos/transactions/sell-shares-transaction";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // The body should contain { marketObjectAddress, amountOctas, sellsYesShares }
    // We can add validation here later if needed.
    const payload = buildSellSharesPayload(body);

    return NextResponse.json(payload);

  } catch (error) {
    console.error("Error creating sell_shares payload:", error);
    return NextResponse.json({ error: "Failed to construct transaction" }, { status: 500 });
  }
}
