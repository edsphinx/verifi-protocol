import type { CreateMarketPayloadArgs, EntryFunctionPayload } from "@/lib/aptos/types";
import { VERIFI_PROTOCOL_ABI } from "@/utils/abis";

const MODULE_ADDRESS = VERIFI_PROTOCOL_ABI.address;

/**
 * Construye el payload de la entry function para la transacción `create_market`.
 * Esta es una función pura que se puede usar de forma segura en el servidor.
 * @param args Los argumentos para la transacción.
 * @returns El objeto de payload de la entry function.
 */
export function buildCreateMarketPayload(
  args: CreateMarketPayloadArgs,
): EntryFunctionPayload {
  const {
    description,
    resolutionTimestamp,
    resolverAddress,
    targetAddress,
    targetFunction,
    targetValue,
    operator,
  } = args;

  return {
    function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
    functionArguments: [
      description,
      resolutionTimestamp.toString(), // El contrato espera un u64, que se pasa como string
      resolverAddress,
      targetAddress,
      targetFunction,
      targetValue.toString(), // También un u64
      operator,
    ],
  };
}
