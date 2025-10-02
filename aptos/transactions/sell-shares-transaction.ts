import { VERIFI_PROTOCOL_ABI } from "@/aptos/abis";
import type { EntryFunctionPayload, SellSharesApiPayload } from "@/lib/types";

const MODULE_ADDRESS = VERIFI_PROTOCOL_ABI.address;

/**
 * @notice Builds the raw transaction payload for the `sell_shares` entry function.
 * @dev A pure server-side function to construct the payload for selling shares.
 * It ensures numeric arguments are formatted as strings for robust SDK serialization.
 * @param args The arguments required for the `sell_shares` transaction.
 * @param args.marketObjectAddress The on-chain address of the Market object.
 * @param args.amountOctas The number of shares (as Octas) the user wants to sell.
 * @param args.sellsYesShares A boolean indicating the outcome being sold (`true` for YES, `false` for NO).
 * @returns An `EntryFunctionPayload` object ready to be used in a transaction.
 */
export function buildSellSharesPayload(
  args: SellSharesApiPayload,
): EntryFunctionPayload {
  const { marketObjectAddress, amountOctas, sellsYesShares } = args;

  return {
    function: `${MODULE_ADDRESS}::verifi_protocol::sell_shares`,
    functionArguments: [marketObjectAddress, amountOctas, sellsYesShares],
  };
}
