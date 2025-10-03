import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getActiveMarketsFromApi } from "@/lib/api/market";
import { aptosClient } from "@/aptos/client";
import { VERIFI_PROTOCOL_ABI } from "@/aptos/abis";

const MODULE_ADDRESS = VERIFI_PROTOCOL_ABI.address;

// Market status constants (from contract)
const MARKET_STATUS = {
  OPEN: 0,
  CLOSED: 1,
  RESOLVED_YES: 2,
  RESOLVED_NO: 3,
} as const;

// Time threshold for "resolving soon" (24 hours in milliseconds)
const SOON_THRESHOLD_MS = 24 * 60 * 60 * 1000;

interface MarketWithStatus {
  id: string;
  title: string;
  category: string;
  totalVolume: number;
  resolvesOn: string;
  resolvesOnDate: Date;
  resolutionTimestamp: number;
  onChainStatus?: number;
}

export function useMarkets() {
  const {
    data: markets,
    isLoading: isLoadingMarkets,
    isError,
  } = useQuery({
    queryKey: ["activeMarkets"],
    queryFn: getActiveMarketsFromApi,
    staleTime: 30000, // Consider data fresh for 30s
    // Removed refetchInterval to prevent constant re-renders
  });

  const [marketsWithStatus, setMarketsWithStatus] = useState<MarketWithStatus[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Fetch on-chain status for all markets
  useEffect(() => {
    async function fetchMarketStatuses() {
      if (!markets || markets.length === 0) {
        setMarketsWithStatus([]);
        return;
      }

      setIsLoadingStatus(true);
      try {
        const statusPromises = markets.map(async (market) => {
          try {
            const [status] = await aptosClient().view<[string]>({
              payload: {
                function: `${MODULE_ADDRESS}::verifi_protocol::get_market_state`,
                functionArguments: [market.id],
              },
            });
            return {
              ...market,
              onChainStatus: parseInt(status, 10),
            };
          } catch (error) {
            console.error(`[useMarkets] Error fetching status for market ${market.id}:`, error);
            // If we can't fetch status, assume OPEN if before resolution, CLOSED after
            const now = new Date();
            const isExpired = market.resolvesOnDate < now;
            return {
              ...market,
              onChainStatus: isExpired ? MARKET_STATUS.CLOSED : MARKET_STATUS.OPEN,
            };
          }
        });

        const results = await Promise.all(statusPromises);
        setMarketsWithStatus(results);
      } catch (error) {
        console.error("[useMarkets] Error fetching market statuses:", error);
        setMarketsWithStatus(markets.map(m => ({ ...m, onChainStatus: MARKET_STATUS.OPEN })));
      } finally {
        setIsLoadingStatus(false);
      }
    }

    fetchMarketStatuses();
  }, [markets]);

  // La lógica de filtrado y separación vive en el hook, no en el componente.
  const { featuredMarket, otherMarkets, soon, expired, resolved } = useMemo(() => {
    // Handle null, undefined, or empty arrays
    if (!marketsWithStatus || marketsWithStatus.length === 0) {
      return {
        featuredMarket: undefined,
        otherMarkets: [],
        soon: [],
        expired: [],
        resolved: [],
      };
    }

    const now = new Date();
    const soonThreshold = new Date(now.getTime() + SOON_THRESHOLD_MS);

    // Filter by status
    const activeMarkets = marketsWithStatus.filter(
      (market) => market.onChainStatus === MARKET_STATUS.OPEN
    );

    const expiredMarkets = marketsWithStatus.filter(
      (market) => market.onChainStatus === MARKET_STATUS.CLOSED
    );

    const resolvedMarkets = marketsWithStatus.filter(
      (market) =>
        market.onChainStatus === MARKET_STATUS.RESOLVED_YES ||
        market.onChainStatus === MARKET_STATUS.RESOLVED_NO
    );

    // "Resolving Soon" = OPEN markets that expire within 24 hours
    const soonMarkets = activeMarkets.filter((market) => {
      try {
        const resolutionDate = market.resolvesOnDate;
        return resolutionDate > now && resolutionDate <= soonThreshold;
      } catch {
        return false;
      }
    });

    // Featured market = first active market with most volume
    const sortedActive = [...activeMarkets].sort((a, b) => b.totalVolume - a.totalVolume);
    const featured = sortedActive[0];
    const others = sortedActive.slice(1);

    return {
      featuredMarket: featured,
      otherMarkets: others,
      soon: soonMarkets,
      expired: expiredMarkets,
      resolved: resolvedMarkets,
    };
  }, [marketsWithStatus]);

  return {
    markets: marketsWithStatus,
    featuredMarket,
    otherMarkets,
    soon,
    expired,
    resolved,
    isLoading: isLoadingMarkets || isLoadingStatus,
    isError,
  };
}
