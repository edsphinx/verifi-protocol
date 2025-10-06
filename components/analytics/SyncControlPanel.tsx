/**
 * @file Sync Control Panel
 * @description Component to monitor and trigger sync service operations
 */

"use client";

import { useState, useEffect } from "react";
import { Card } from "@tremor/react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, Activity, BarChart3, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface SyncStatus {
  syncService: {
    online: boolean;
    lastMetricsSync?: string;
    lastPoolsSync?: string;
    lastActivitiesSync?: string;
    metricsSyncCount?: number;
    poolsSyncCount?: number;
    activitiesSyncCount?: number;
    errors?: number;
  };
  indexerService: {
    online: boolean;
    status?: string;
    last_version?: number;
    network?: string;
  };
}

export function SyncControlPanel() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState({
    metrics: false,
    pools: false,
    activities: false,
  });

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/sync/status", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch sync status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const triggerSync = async (type: "metrics" | "pools" | "activities") => {
    setIsSyncing((prev) => ({ ...prev, [type]: true }));

    try {
      const response = await fetch(`/api/sync/${type}`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} sync completed successfully`);
        await fetchStatus(); // Refresh status after sync
      } else {
        toast.error(data.error || `Failed to sync ${type}`);
      }
    } catch (error) {
      toast.error(`Error triggering ${type} sync`);
    } finally {
      setIsSyncing((prev) => ({ ...prev, [type]: false }));
    }
  };

  const formatLastSync = (timestamp?: string) => {
    if (!timestamp || timestamp === "0001-01-01T00:00:00Z") {
      return "Never";
    }
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </Card>
    );
  }

  const syncOnline = status?.syncService.online || false;
  const indexerOnline = status?.indexerService.online || false;

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Sync Services Status</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Service Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            {syncOnline ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="font-medium">Sync Service</p>
              <p className="text-xs text-muted-foreground">
                {syncOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            {indexerOnline ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="font-medium">Indexer Service</p>
              <p className="text-xs text-muted-foreground">
                {indexerOnline
                  ? `Running • Version ${status?.indexerService.last_version || 0}`
                  : "Offline"}
              </p>
            </div>
          </div>
        </div>

        {/* Sync Actions */}
        {syncOnline && (
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-muted-foreground">Manual Sync Triggers</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Protocol Metrics */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">Protocol Metrics</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatLastSync(status?.syncService.lastMetricsSync)}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => triggerSync("metrics")}
                  disabled={isSyncing.metrics}
                  className="w-full gap-2"
                >
                  {isSyncing.metrics && <RefreshCw className="h-3 w-3 animate-spin" />}
                  {isSyncing.metrics ? "Syncing..." : "Sync Now"}
                </Button>
              </div>

              {/* Pool Stats */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">Pool Stats</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatLastSync(status?.syncService.lastPoolsSync)}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => triggerSync("pools")}
                  disabled={isSyncing.pools}
                  className="w-full gap-2"
                >
                  {isSyncing.pools && <RefreshCw className="h-3 w-3 animate-spin" />}
                  {isSyncing.pools ? "Syncing..." : "Sync Now"}
                </Button>
              </div>

              {/* Activities */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  <span className="font-medium text-sm">Activities</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatLastSync(status?.syncService.lastActivitiesSync)}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => triggerSync("activities")}
                  disabled={isSyncing.activities}
                  className="w-full gap-2"
                >
                  {isSyncing.activities && <RefreshCw className="h-3 w-3 animate-spin" />}
                  {isSyncing.activities ? "Syncing..." : "Sync Now"}
                </Button>
              </div>
            </div>

            {/* Sync Stats */}
            {(status?.syncService.metricsSyncCount ||
              status?.syncService.poolsSyncCount ||
              status?.syncService.activitiesSyncCount) && (
              <div className="grid grid-cols-3 gap-4 pt-3 text-center text-xs">
                <div>
                  <p className="text-muted-foreground">Metrics Syncs</p>
                  <p className="font-semibold text-lg">{status?.syncService.metricsSyncCount || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pools Syncs</p>
                  <p className="font-semibold text-lg">{status?.syncService.poolsSyncCount || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Activity Syncs</p>
                  <p className="font-semibold text-lg">{status?.syncService.activitiesSyncCount || 0}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!syncOnline && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              ⚠️ Sync service is offline. Please check the deployment at 198.144.183.32:3001
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
