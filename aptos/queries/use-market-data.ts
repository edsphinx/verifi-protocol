import { AccountAddress } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { aptosClient } from "@/aptos/client";
import { getAccountAPTBalance } from "./get-account-balance"; // You already have this

// Helper function to get the balance of a specific Fungible Asset
async function getFungibleAssetBalance({
  owner,
  assetType,
}: {
  owner: AccountAddress;
  assetType: string;
}) {
  try {
    console.log(
      `[getFungibleAssetBalance] Fetching balance for owner: ${owner.toString()}, asset: ${assetType}`,
    );

    // Use the primary_fungible_store::balance view function
    // Signature: balance<T: key>(account: address, metadata: Object<T>): u64
    const balance = await aptosClient().view({
      payload: {
        function:
          "0x1::primary_fungible_store::balance" as `${string}::${string}::${string}`,
        typeArguments: ["0x1::fungible_asset::Metadata"],
        functionArguments: [owner.toString(), assetType],
      },
    });

    const balanceValue = Number(balance[0]);
    console.log(`[getFungibleAssetBalance] Balance (raw): ${balanceValue}`);
    return balanceValue; // Return raw value, will be converted in the component
  } catch (error) {
    // An error likely means the user doesn't have a FungibleStore for this asset yet, so balance is 0.
    console.log(`[getFungibleAssetBalance] Error (likely no balance):`, error);
    return 0;
  }
}

// The main custom hook
export function useMarketData(market: {
  id: string;
  yesToken: string;
  noToken: string;
}) {
  const { account } = useWallet();
  const accountAddress = account?.address;

  return useQuery({
    queryKey: ["marketData", accountAddress, market.id],
    queryFn: async () => {
      if (!accountAddress) return null;

      const ownerAddress = AccountAddress.from(accountAddress);

      // Fetch all data in parallel for efficiency
      const [aptBalance, yesBalance, noBalance] = await Promise.all([
        getAccountAPTBalance({ accountAddress: ownerAddress.toString() }),
        getFungibleAssetBalance({
          owner: ownerAddress,
          assetType: market.yesToken,
        }),
        getFungibleAssetBalance({
          owner: ownerAddress,
          assetType: market.noToken,
        }),
      ]);

      return {
        aptBalance,
        yesBalance,
        noBalance,
      };
    },
    enabled: !!accountAddress, // Only run the query if the user is connected
    staleTime: 15000, // Consider data fresh for 15s
    // Removed refetchInterval
  });
}
