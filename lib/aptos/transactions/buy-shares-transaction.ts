import type { MoveFunctionId } from "@aptos-labs/ts-sdk";
import { VERIFI_PROTOCOL_ABI } from "@/utils/abis";

const MODULE_ADDRESS = VERIFI_PROTOCOL_ABI.address;

// This is the data our function needs to build the payload
type BuySharesPayloadArgs = {
  marketObjectAddress: string;
  amountOctas: number;
  buysYesShares: boolean;
};

// This is the structure of the payload our API will return
export interface EntryFunctionPayload {
  function: MoveFunctionId;
  functionArguments: (string | number | boolean)[];
  typeArguments?: string[];
}

/**
 * Builds the entry function payload for the `buy_shares` transaction.
 * This is a pure function that can be used safely on the server.
 * @param args The arguments for the transaction.
 * @returns The entry function payload object.
 */
export function buildBuySharesPayload(
  args: BuySharesPayloadArgs,
): EntryFunctionPayload {
  const { marketObjectAddress, amountOctas, buysYesShares } = args;

  return {
    function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
    functionArguments: [marketObjectAddress, amountOctas, buysYesShares],
  };
}
