interface RecordActivityParams {
  txHash: string;
  marketAddress: string;
  userAddress: string;
  action: string;
  outcome?: string | null;
  amount?: number;
  price?: number | null;
  totalValue?: number | null;
  poolAddress?: string;
  yesAmount?: number;
  noAmount?: number;
  lpTokens?: number;
}

export async function recordActivity(params: RecordActivityParams): Promise<void> {
  try {
    const response = await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Failed to record activity: ${response.statusText}`);
    }

    console.log(`[ActivityService] ${params.action} activity recorded in database`);
  } catch (error) {
    console.error(`[ActivityService] Failed to record ${params.action} activity:`, error);
  }
}
