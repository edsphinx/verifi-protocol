"use client";

import { useState, useEffect } from "react";

export function CompactSystemStatus() {
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/sync/status");
        const data = await res.json();
        setSyncStatus(data);
      } catch (error) {
        console.error("Failed to fetch sync status:", error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  if (!syncStatus) {
    return null;
  }

  const isHealthy = syncStatus.syncService?.online && syncStatus.indexerService?.online;

  return (
    <div className="relative">
      {/* Compact Status Bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-2 cursor-pointer hover:border-gray-700 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Health Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${isHealthy ? "bg-green-500" : "bg-red-500"} animate-pulse`}
            />
            <span className="text-sm font-medium text-white">
              {isHealthy ? "All Systems Operational" : "System Issues Detected"}
            </span>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Sync:</span>
              <span className={syncStatus.syncService?.online ? "text-green-400" : "text-red-400"}>
                {syncStatus.syncService?.online ? "Online" : "Offline"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Indexer:</span>
              <span className={syncStatus.indexerService?.online ? "text-green-400" : "text-red-400"}>
                {syncStatus.indexerService?.online ? "Online" : "Offline"}
              </span>
            </div>
            {syncStatus.syncService?.lastSync && (
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Last Sync:</span>
                <span className="text-gray-300">
                  {new Date(syncStatus.syncService.lastSync).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Expand Icon */}
        <div className="text-gray-400">
          {expanded ? "▼" : "▶"}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-lg border border-gray-800 bg-gray-900 p-4 shadow-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Sync Service Details */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white">Sync Service</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={syncStatus.syncService?.online ? "text-green-400" : "text-red-400"}>
                    {syncStatus.syncService?.online ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">URL:</span>
                  <span className="text-gray-300 font-mono truncate">{syncStatus.syncService?.url || "N/A"}</span>
                </div>
                {syncStatus.syncService?.status && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service:</span>
                    <span className="text-gray-300">{syncStatus.syncService.status}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Indexer Service Details */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white">Indexer Service</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={syncStatus.indexerService?.online ? "text-green-400" : "text-red-400"}>
                    {syncStatus.indexerService?.online ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">URL:</span>
                  <span className="text-gray-300 font-mono truncate">{syncStatus.indexerService?.url || "N/A"}</span>
                </div>
                {syncStatus.indexerService?.status && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service:</span>
                    <span className="text-gray-300">{syncStatus.indexerService.status}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
