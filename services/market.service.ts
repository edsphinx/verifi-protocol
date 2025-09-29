import type { Market } from "@prisma/client";
import client from "../lib/clients/prisma";

type CreateMarketData = {
  marketAddress: string;
  creatorAddress: string;
  description: string;
  resolutionTimestamp: Date;
};

export async function recordNewMarket(
  marketData: CreateMarketData,
): Promise<Market> {
  return await client.market.create({
    data: marketData,
  });
}

export async function getActiveMarkets(): Promise<Market[]> {
  return await client.market.findMany({
    where: {
      status: "active",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
