import type { InputViewFunctionData } from "@aptos-labs/ts-sdk";
import { aptosClient } from "../client";

export type AccountAPTBalanceArguments = {
  accountAddress: string;
};

export const getAccountAPTBalance = async (
  args: AccountAPTBalanceArguments,
): Promise<number> => {
  const { accountAddress } = args;

  const payload: InputViewFunctionData = {
    function: "0x1::coin::balance",
    typeArguments: ["0x1::aptos_coin::AptosCoin"],
    functionArguments: [accountAddress],
  };

  try {
    const result = await aptosClient().view({ payload });
    // The balance is returned as a string, which we parse to a number
    return parseInt(result[0] as string);
  } catch (error) {
    console.error(`Failed to fetch APT balance for ${accountAddress}:`, error);
    return 0;
  }
};
