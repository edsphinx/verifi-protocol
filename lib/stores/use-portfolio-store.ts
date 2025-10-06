/**
 * @file Portfolio Store
 * @description Zustand store for user portfolio and positions
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  PortfolioData,
  PortfolioPosition,
} from "@/lib/types/database.types";
import { PortfolioService } from "@/lib/services";

interface PortfolioStore {
  // User Address
  userAddress: string | null;

  // Portfolio Data
  portfolio: PortfolioData | null;

  // Loading States
  isLoading: boolean;
  error: string | null;

  // Last Updated
  lastUpdated: Date | null;

  // Actions
  setUserAddress: (address: string | null) => void;
  setPortfolio: (portfolio: PortfolioData) => void;
  setError: (error: string | null) => void;
  clearPortfolio: () => void;

  // Async Actions
  fetchPortfolio: (address: string) => Promise<void>;
  refreshPortfolio: () => Promise<void>;

  // Computed Selectors
  getTotalValue: () => number;
  getTotalPnL: () => number;
  getTotalPnLPct: () => number;
  getOpenPositionsCount: () => number;
  getBestPosition: () => PortfolioPosition | null;
  getWorstPosition: () => PortfolioPosition | null;
  getROI: () => number;
  isDiversified: () => boolean;
}

export const usePortfolioStore = create<PortfolioStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        userAddress: null,
        portfolio: null,
        isLoading: false,
        error: null,
        lastUpdated: null,

        // Sync Actions
        setUserAddress: (address) =>
          set((state) => {
            state.userAddress = address;
            if (!address) {
              state.portfolio = null;
            }
          }),

        setPortfolio: (portfolio) =>
          set((state) => {
            state.portfolio = portfolio;
            state.lastUpdated = new Date();
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        clearPortfolio: () =>
          set((state) => {
            state.portfolio = null;
            state.userAddress = null;
            state.lastUpdated = null;
          }),

        // Async Actions
        fetchPortfolio: async (address: string) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
            state.userAddress = address;
          });

          try {
            const portfolio = await PortfolioService.getUserPortfolio(address);
            get().setPortfolio(portfolio);
          } catch (error) {
            set((state) => {
              state.error =
                error instanceof Error
                  ? error.message
                  : "Failed to fetch portfolio";
            });
          } finally {
            set((state) => {
              state.isLoading = false;
            });
          }
        },

        refreshPortfolio: async () => {
          const { userAddress } = get();
          if (!userAddress) {
            throw new Error("No user address set");
          }
          await get().fetchPortfolio(userAddress);
        },

        // Computed Selectors
        getTotalValue: () => {
          const { portfolio } = get();
          return portfolio?.totalValue || 0;
        },

        getTotalPnL: () => {
          const { portfolio } = get();
          return portfolio?.unrealizedPnL || 0;
        },

        getTotalPnLPct: () => {
          const { portfolio } = get();
          return portfolio?.unrealizedPnLPct || 0;
        },

        getOpenPositionsCount: () => {
          const { portfolio } = get();
          return portfolio?.openPositions.length || 0;
        },

        getBestPosition: () => {
          const { portfolio } = get();
          if (!portfolio) return null;
          return PortfolioService.getBestPerformingPosition(portfolio);
        },

        getWorstPosition: () => {
          const { portfolio } = get();
          if (!portfolio) return null;
          return PortfolioService.getWorstPerformingPosition(portfolio);
        },

        getROI: () => {
          const { portfolio } = get();
          if (!portfolio) return 0;
          return PortfolioService.calculateROI(portfolio);
        },

        isDiversified: () => {
          const { portfolio } = get();
          if (!portfolio) return false;
          return PortfolioService.isDiversified(portfolio);
        },
      })),
      {
        name: "portfolio-storage",
        partialize: (state) => ({
          userAddress: state.userAddress,
        }),
      },
    ),
    { name: "PortfolioStore" },
  ),
);
