/**
 * @file Protocol Metrics Hook
 * @description Custom hook for accessing protocol-wide analytics
 */

import { useEffect } from 'react';
import { useAnalyticsStore } from '@/lib/stores';

export function useProtocolMetrics() {
  const protocol = useAnalyticsStore((state) => state.protocol);
  const isLoading = useAnalyticsStore((state) => state.isLoadingProtocol);
  const error = useAnalyticsStore((state) => state.error);
  const lastUpdated = useAnalyticsStore((state) => state.lastUpdated);
  const fetchProtocolMetrics = useAnalyticsStore(
    (state) => state.fetchProtocolMetrics
  );
  const getVolumeChange24h = useAnalyticsStore(
    (state) => state.getVolumeChange24h
  );
  const getTVLChange24h = useAnalyticsStore((state) => state.getTVLChange24h);

  // Auto-fetch on mount
  useEffect(() => {
    if (!protocol && !isLoading) {
      fetchProtocolMetrics();
    }
  }, [protocol, isLoading, fetchProtocolMetrics]);

  return {
    protocol,
    isLoading,
    error,
    lastUpdated,
    volumeChange24h: getVolumeChange24h(),
    tvlChange24h: getTVLChange24h(),
    refetch: fetchProtocolMetrics,
  };
}
