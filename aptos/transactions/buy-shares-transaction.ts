import { VERIFI_PROTOCOL_ABI } from "@/aptos/abis";
import type { BuySharesApiPayload, EntryFunctionPayload } from "@/lib/types";

const MODULE_ADDRESS = VERIFI_PROTOCOL_ABI.address;

/**
 * @notice Builds the raw transaction payload for the `buy_shares` entry function.
 * @dev This is a pure server-side function that constructs the payload needed by the Aptos SDK.
 * It ensures type safety and consistency for the transaction's arguments.
 * @param args The arguments required for the `buy_shares` transaction.
 * @param args.marketObjectAddress The on-chain address of the Market object.
 * @param args.amountOctas The amount of APT (in Octas) the user wants to spend.
 * @param args.buysYesShares A boolean indicating the desired outcome (`true` for YES, `false` for NO).
 * @returns An `EntryFunctionPayload` object ready to be used in a transaction.
 */
export function buildBuySharesPayload(
  args: BuySharesApiPayload,
): EntryFunctionPayload {
  const { marketObjectAddress, amountOctas, buysYesShares } = args;

  return {
    function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
    functionArguments: [marketObjectAddress, amountOctas, buysYesShares],
  };
}
