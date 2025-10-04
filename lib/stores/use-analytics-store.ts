/**
 * @file Analytics Store
 * @description Zustand store for protocol-wide analytics and metrics
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  ProtocolMetrics,
  MarketMetrics,
  TraderMetrics,
} from '@/lib/types/database.types';
import { AnalyticsService } from '@/lib/services';

interface AnalyticsStore {
  // Protocol Metrics
  protocol: ProtocolMetrics | null;

  // Top Lists
  topMarkets: MarketMetrics[];
  topTraders: TraderMetrics[];

  // Loading States
  isLoadingProtocol: boolean;
  isLoadingMarkets: boolean;
  isLoadingTraders: boolean;
  error: string | null;

  // Last Updated
  lastUpdated: Date | null;

  // Actions
  setProtocolMetrics: (metrics: ProtocolMetrics) => void;
  setTopMarkets: (markets: MarketMetrics[]) => void;
  setTopTraders: (traders: TraderMetrics[]) => void;
  setError: (error: string | null) => void;

  // Async Actions
  fetchProtocolMetrics: () => Promise<void>;
  fetchTopMarkets: (limit?: number) => Promise<void>;
  fetchTopTraders: (limit?: number) => Promise<void>;
  refreshAll: () => Promise<void>;

  // Computed Selectors
  getVolumeChange24h: () => number;
  getTVLChange24h: () => number;
  getTopMarket: () => MarketMetrics | undefined;
  getTopTrader: () => TraderMetrics | undefined;
}

export const useAnalyticsStore = create<AnalyticsStore>()(
  devtools(
    immer((set, get) => ({
      // Initial State
      protocol: null,
      topMarkets: [],
      topTraders: [],
      isLoadingProtocol: false,
      isLoadingMarkets: false,
      isLoadingTraders: false,
      error: null,
      lastUpdated: null,

      // Sync Actions
      setProtocolMetrics: (metrics) =>
        set((state) => {
          state.protocol = metrics;
          state.lastUpdated = new Date();
        }),

      setTopMarkets: (markets) =>
        set((state) => {
          state.topMarkets = markets;
        }),

      setTopTraders: (traders) =>
        set((state) => {
          state.topTraders = traders;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      // Async Actions
      fetchProtocolMetrics: async () => {
        set((state) => {
          state.isLoadingProtocol = true;
          state.error = null;
        });

        try {
          const metrics = await AnalyticsService.getProtocolMetrics();
          get().setProtocolMetrics(metrics);
        } catch (error) {
          set((state) => {
            state.error =
              error instanceof Error
                ? error.message
                : 'Failed to fetch protocol metrics';
          });
        } finally {
          set((state) => {
            state.isLoadingProtocol = false;
          });
        }
      },

      fetchTopMarkets: async (limit = 10) => {
        set((state) => {
          state.isLoadingMarkets = true;
          state.error = null;
        });

        try {
          const { markets } = await AnalyticsService.getTopMarkets(limit);
          get().setTopMarkets(markets);
        } catch (error) {
          set((state) => {
            state.error =
              error instanceof Error
                ? error.message
                : 'Failed to fetch top markets';
          });
        } finally {
          set((state) => {
            state.isLoadingMarkets = false;
          });
        }
      },

      fetchTopTraders: async (limit = 10) => {
        set((state) => {
          state.isLoadingTraders = true;
          state.error = null;
        });

        try {
          const { traders } = await AnalyticsService.getTopTraders(limit);
          get().setTopTraders(traders);
        } catch (error) {
          set((state) => {
            state.error =
              error instanceof Error
                ? error.message
                : 'Failed to fetch top traders';
          });
        } finally {
          set((state) => {
            state.isLoadingTraders = false;
          });
        }
      },

      refreshAll: async () => {
        await Promise.all([
          get().fetchProtocolMetrics(),
          get().fetchTopMarkets(),
          get().fetchTopTraders(),
        ]);
      },

      // Computed Selectors
      getVolumeChange24h: () => {
        const { protocol } = get();
        if (!protocol) return 0;

        // Calculate volume change (simplified - use historical data in production)
        return 0; // TODO: Calculate from historical data
      },

      getTVLChange24h: () => {
        const { protocol } = get();
        return protocol?.tvlChange24h || 0;
      },

      getTopMarket: () => {
        const { topMarkets } = get();
        return topMarkets[0];
      },

      getTopTrader: () => {
        const { topTraders } = get();
        return topTraders[0];
      },
    })),
    { name: 'AnalyticsStore' }
  )
);
