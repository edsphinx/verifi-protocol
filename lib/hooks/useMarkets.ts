import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getActiveMarketsFromApi } from "@/lib/api/market";

export function useMarkets() {
  const {
    data: markets,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["activeMarkets"],
    queryFn: getActiveMarketsFromApi,
    refetchInterval: 10000, // Actualiza los datos cada 10 segundos
  });

  // La lógica de filtrado y separación vive en el hook, no en el componente.
  const { featuredMarket, otherMarkets, soon, resolved } = useMemo(() => {
    if (!markets)
      return {
        featuredMarket: undefined,
        otherMarkets: [],
        soon: [],
        resolved: [],
      };

    const now = new Date();
    const soonThreshold = new Date();
    soonThreshold.setDate(now.getDate() + 7);

    const featured = markets[0];
    const others = markets.slice(1);

    const soon = markets.filter((market) => {
      const resolutionDate = new Date(market.resolvesOn);
      return resolutionDate > now && resolutionDate <= soonThreshold;
    });
    const resolved = markets.filter(
      (market) => new Date(market.resolvesOn) < now,
    );

    return { featuredMarket: featured, otherMarkets: others, soon, resolved };
  }, [markets]);

  return {
    markets,
    featuredMarket,
    otherMarkets,
    soon,
    resolved,
    isLoading,
    isError,
  };
}
