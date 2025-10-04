import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { MODULE_ADDRESS } from "../constants";

export interface RedeemWinningsPayload {
  marketObjectAddress: string;
  amountToRedeem: number; // in token units (10^6)
}

export function getRedeemWinningsPayload(
  payload: RedeemWinningsPayload,
): InputTransactionData {
  return {
    data: {
      function: `${MODULE_ADDRESS}::verifi_protocol::redeem_winnings`,
      functionArguments: [payload.marketObjectAddress, payload.amountToRedeem],
    },
  };
}
