/**
 * @file Intelligence Store
 * @description Zustand store for AI-powered market intelligence
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { MarketIntelligence, ProactiveAlert } from '@/lib/services';
import { IntelligenceService } from '@/lib/services';
import type { MarketMetrics } from '@/lib/types/database.types';

interface IntelligenceStore {
  // Intelligence by Market
  intelligenceMap: Map<string, MarketIntelligence>;

  // Proactive Alerts
  alerts: ProactiveAlert[];
  unreadAlertCount: number;

  // Loading States
  loadingMarkets: Set<string>;
  error: string | null;

  // Actions
  setIntelligence: (marketAddress: string, intelligence: MarketIntelligence) => void;
  addAlert: (alert: ProactiveAlert) => void;
  markAlertAsRead: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  setError: (error: string | null) => void;

  // Async Actions
  fetchMarketIntelligence: (marketAddress: string, metrics: MarketMetrics) => Promise<void>;

  // Computed Selectors
  getIntelligence: (marketAddress: string) => MarketIntelligence | undefined;
  getHighPriorityAlerts: () => ProactiveAlert[];
  getOpportunityAlerts: () => ProactiveAlert[];
}

export const useIntelligenceStore = create<IntelligenceStore>()(
  devtools(
    immer((set, get) => ({
      // Initial State
      intelligenceMap: new Map(),
      alerts: [],
      unreadAlertCount: 0,
      loadingMarkets: new Set(),
      error: null,

      // Sync Actions
      setIntelligence: (marketAddress, intelligence) =>
        set((state) => {
          state.intelligenceMap.set(marketAddress, intelligence);
        }),

      addAlert: (alert) =>
        set((state) => {
          state.alerts.unshift(alert); // Add to beginning
          state.unreadAlertCount++;

          // Keep only last 50 alerts
          if (state.alerts.length > 50) {
            state.alerts = state.alerts.slice(0, 50);
          }
        }),

      markAlertAsRead: (alertId) =>
        set((state) => {
          const alert = state.alerts.find((a) => a.id === alertId);
          if (alert) {
            state.unreadAlertCount = Math.max(0, state.unreadAlertCount - 1);
          }
        }),

      dismissAlert: (alertId) =>
        set((state) => {
          const index = state.alerts.findIndex((a) => a.id === alertId);
          if (index !== -1) {
            state.alerts.splice(index, 1);
            state.unreadAlertCount = Math.max(0, state.unreadAlertCount - 1);
          }
        }),

      clearAllAlerts: () =>
        set((state) => {
          state.alerts = [];
          state.unreadAlertCount = 0;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      // Async Actions
      fetchMarketIntelligence: async (marketAddress, metrics) => {
        set((state) => {
          state.loadingMarkets.add(marketAddress);
          state.error = null;
        });

        try {
          const intelligence = await IntelligenceService.getMarketIntelligence(
            marketAddress,
            metrics
          );
          get().setIntelligence(marketAddress, intelligence);

          // Generate alerts from insights
          intelligence.insights.forEach((insight) => {
            if (insight.actionable && insight.severity !== 'INFO') {
              get().addAlert({
                id: `${marketAddress}-${Date.now()}-${Math.random()}`,
                priority: insight.severity === 'CRITICAL' ? 'URGENT' : 'MEDIUM',
                category: 'OPPORTUNITY',
                title: insight.type.replace('_', ' '),
                description: insight.message,
                actions: [
                  {
                    label: 'View Market',
                    type: 'NAVIGATE',
                    href: `/market/${marketAddress}`,
                  },
                  {
                    label: 'Dismiss',
                    type: 'DISMISS',
                  },
                ],
                createdAt: new Date(),
              });
            }
          });
        } catch (error) {
          set((state) => {
            state.error =
              error instanceof Error
                ? error.message
                : 'Failed to fetch market intelligence';
          });
        } finally {
          set((state) => {
            state.loadingMarkets.delete(marketAddress);
          });
        }
      },

      // Computed Selectors
      getIntelligence: (marketAddress) => {
        const { intelligenceMap } = get();
        return intelligenceMap.get(marketAddress);
      },

      getHighPriorityAlerts: () => {
        const { alerts } = get();
        return alerts.filter(
          (a) => a.priority === 'URGENT' || a.priority === 'HIGH'
        );
      },

      getOpportunityAlerts: () => {
        const { alerts } = get();
        return alerts.filter((a) => a.category === 'OPPORTUNITY');
      },
    })),
    { name: 'IntelligenceStore' }
  )
);
