import { VERIFI_PROTOCOL_ABI } from "@/aptos/abis";
import type { CreateMarketApiPayload, EntryFunctionPayload } from "@/lib/types";

const MODULE_ADDRESS = VERIFI_PROTOCOL_ABI.address;

/**
 * @notice Builds the raw transaction payload for the `create_market` entry function.
 * @dev A pure server-side function to construct the payload for creating a new market.
 * It ensures all numeric arguments are correctly formatted as strings for the Aptos SDK
 * to prevent serialization errors.
 * @param args The arguments required for the `create_market` transaction.
 * @param args.description The market's question.
 * @param args.resolutionTimestamp The Unix timestamp for resolution.
 * @param args.resolverAddress The address for manual resolution.
 * @param args.targetAddress The address the on-chain oracle will query.
 * @param args.targetFunction [Legacy] The function name the oracle will query.
 * @param args.targetValue The value to compare the oracle's result against.
 * @param args.operator The comparison operator (0 for >, 1 for <).
 * @returns An `EntryFunctionPayload` object ready to be used in a transaction.
 */
export function buildCreateMarketPayload(
  args: CreateMarketApiPayload,
): EntryFunctionPayload {
  const {
    description,
    resolutionTimestamp,
    resolverAddress,
    oracleId,
    targetAddress,
    targetFunction,
    targetValue,
    operator,
  } = args;

  return {
    function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
    typeArguments: [],
    functionArguments: [
      description,
      resolutionTimestamp.toString(),
      resolverAddress,
      oracleId,
      targetAddress,
      targetFunction,
      targetValue.toString(),
      operator,
    ],
  };
}
