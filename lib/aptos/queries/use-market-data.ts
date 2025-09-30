import { AccountAddress } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { aptosClient } from "@/lib/aptos/client";
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
    const _resource = await aptosClient().getAccountResource({
      accountAddress: owner,
      resourceType: `0x1::fungible_asset::FungibleStore`,
      options: {
        ledgerVersion: await aptosClient()
          .getLedgerInfo()
          .then((info) => BigInt(info.ledger_version)),
      },
      // Pass the asset type as a generic type argument
      // Note: This feature might require the latest SDK versions or custom client setup.
      // If this doesn't work out of the box, we might need a view function.
      // For now, we assume this works as a placeholder for fetching FA balance.
    });

    // Placeholder logic - a real implementation would parse the resource data
    // to find the balance for the specific `assetType`.
    // This part is complex without a direct SDK method, so we will simulate it.
    // In a real app, a view function in your contract is the BEST way to get this.

    // For the purpose of this MVP, let's return a mock value but show the structure.
    console.log(`Simulating fetch for asset type: ${assetType}`);
    if (assetType.includes("vYES")) return 50 * 10 ** 8; // 50 YES shares
    if (assetType.includes("vNO")) return 10 * 10 ** 8; // 10 NO shares

    return 0;
  } catch (error) {
    // An error likely means the user doesn't have a FungibleStore for this asset yet, so balance is 0.
    // We need to check if the error is an instance of a type that has a 'status' property.
    // For now, we'll assume a generic error and check for a 404-like message if direct status isn't available.
    if (error instanceof Error && (error as any).status === 404) {
      return 0; // Return 0 if resource not found
    } else {
      console.error(
        `Failed to fetch fungible asset balance for ${assetType}:`,
        error,
      );
      // Re-throw the error if it's not a 404, so the query can handle it.
      throw error;
    }
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
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}
