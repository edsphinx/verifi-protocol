import { type NextRequest, NextResponse } from "next/server";
import { buildCreateMarketPayload } from "@/lib/aptos/transactions/create-market-transaction";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Aquí podríamos añadir validación para los datos del body si es necesario.
    // Por ejemplo, verificar la longitud de la descripción o que el timestamp sea futuro.

    const payload = buildCreateMarketPayload(body);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error creating create_market payload:", error);
    return NextResponse.json(
      { error: "Failed to construct transaction" },
      { status: 500 },
    );
  }
}
