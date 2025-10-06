"use client";

import { useIntelligenceStore } from "@/lib/stores/use-intelligence-store";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CompactAlertsButton() {
  const router = useRouter();
  const {
    alerts,
    unreadAlertCount,
    dismissAlert,
    getHighPriorityAlerts,
  } = useIntelligenceStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const priorityAlerts = getHighPriorityAlerts().slice(0, 5); // Show max 5

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative rounded-lg border border-gray-800 bg-gray-900/50 p-2 hover:border-cyan-500/50 transition-colors"
      >
        <div className="relative">
          <span className="text-xl">🔔</span>
          {unreadAlertCount > 0 && (
            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadAlertCount > 9 ? "9+" : unreadAlertCount}
            </div>
          )}
        </div>
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Alert Dropdown */}
          <div className="absolute top-full right-0 z-50 mt-2 w-96 rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
            <div className="border-b border-gray-800 p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Smart Alerts
                </h3>
                <div className="text-xs text-gray-400">
                  {alerts.length} total
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {priorityAlerts.length > 0 ? (
                <div className="divide-y divide-gray-800">
                  {priorityAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">
                          {alert.category === "OPPORTUNITY" ? "💰" : "⚠️"}
                        </span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">
                            {alert.title}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            {alert.description}
                          </div>
                          <div className="mt-2 flex gap-2">
                            {alert.actions.map((action, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  if (action.type === "DISMISS") {
                                    dismissAlert(alert.id);
                                  } else if (action.type === "NAVIGATE" && action.href) {
                                    router.push(action.href);
                                    setShowDropdown(false);
                                  }
                                }}
                                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                                  action.type === "DISMISS"
                                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
                                }`}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-gray-400">
                  No priority alerts
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
