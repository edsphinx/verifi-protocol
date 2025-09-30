import { AccountAddress } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { aptosClient } from "@/lib/aptos/client";
import { VERIFI_PROTOCOL_ABI } from "@/utils/abis";
import { getAccountAPTBalance } from "./get-account-balance";

const MODULE_ADDRESS = VERIFI_PROTOCOL_ABI.address;

// The combined data structure this hook will return
export interface MarketDetailsData {
  // From get_market_state
  status: number;
  totalSupplyYes: number;
  totalSupplyNo: number;
  poolYes: number;
  poolNo: number;
  // From get_balances + getAccountAPTBalance
  userAptBalance: number;
  userYesBalance: number;
  userNoBalance: number;
}

/**
 * A comprehensive hook to fetch all dynamic data for the market detail page.
 * @param marketObjectAddress The address of the market object.
 */
export function useMarketDetails(marketObjectAddress: string) {
  const { account } = useWallet();
  const accountAddress = account?.address;

  return useQuery<MarketDetailsData | null>({
    queryKey: ["marketDetails", marketObjectAddress, accountAddress],
    queryFn: async () => {
      if (!accountAddress) return null;

      const ownerAddress = AccountAddress.from(accountAddress);

      // Fetch all data in parallel for maximum efficiency
      const [marketState, userBalances, aptBalance] = await Promise.all([
        // Call get_market_state
        aptosClient().view<[string, string, string, string, string]>({
          payload: {
            function: `${MODULE_ADDRESS}::verifi_protocol::get_market_state`,
            functionArguments: [marketObjectAddress],
          },
        }),
        // Call get_balances
        aptosClient().view<[string, string]>({
          payload: {
            function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
            functionArguments: [accountAddress, marketObjectAddress],
          },
        }),
        // Get user's APT balance
        getAccountAPTBalance({ accountAddress: ownerAddress.toString() }),
      ]);

      const [status, totalSupplyYes, totalSupplyNo, poolYes, poolNo] =
        marketState;
      const [userYesBalance, userNoBalance] = userBalances;

      return {
        status: parseInt(status, 10),
        totalSupplyYes: parseInt(totalSupplyYes, 10),
        totalSupplyNo: parseInt(totalSupplyNo, 10),
        poolYes: parseInt(poolYes, 10),
        poolNo: parseInt(poolNo, 10),
        userAptBalance: aptBalance,
        userYesBalance: parseInt(userYesBalance, 10),
        userNoBalance: parseInt(userNoBalance, 10),
      };
    },
    enabled: !!accountAddress && !!marketObjectAddress,
    refetchInterval: 5000, // Refetch data every 5 seconds
  });
}
