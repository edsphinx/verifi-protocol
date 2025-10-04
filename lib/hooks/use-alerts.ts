/**
 * @file Alerts Hook
 * @description Custom hook for proactive alerts and notifications
 */

import { useIntelligenceStore } from '@/lib/stores';

export function useAlerts() {
  const alerts = useIntelligenceStore((state) => state.alerts);
  const unreadAlertCount = useIntelligenceStore(
    (state) => state.unreadAlertCount
  );
  const addAlert = useIntelligenceStore((state) => state.addAlert);
  const markAlertAsRead = useIntelligenceStore(
    (state) => state.markAlertAsRead
  );
  const dismissAlert = useIntelligenceStore((state) => state.dismissAlert);
  const clearAllAlerts = useIntelligenceStore(
    (state) => state.clearAllAlerts
  );
  const getHighPriorityAlerts = useIntelligenceStore(
    (state) => state.getHighPriorityAlerts
  );
  const getOpportunityAlerts = useIntelligenceStore(
    (state) => state.getOpportunityAlerts
  );

  return {
    alerts,
    unreadAlertCount,
    highPriorityAlerts: getHighPriorityAlerts(),
    opportunityAlerts: getOpportunityAlerts(),
    addAlert,
    markAlertAsRead,
    dismissAlert,
    clearAllAlerts,
  };
}
