"use client";

import { useIntelligenceStore } from "@/lib/stores/use-intelligence-store";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SmartAlertsPanel() {
  const router = useRouter();
  const {
    alerts,
    unreadAlertCount,
    dismissAlert,
    clearAllAlerts,
    getHighPriorityAlerts,
    getOpportunityAlerts,
  } = useIntelligenceStore();

  const [filter, setFilter] = useState<"all" | "priority" | "opportunity">(
    "all",
  );

  const filteredAlerts =
    filter === "priority"
      ? getHighPriorityAlerts()
      : filter === "opportunity"
        ? getOpportunityAlerts()
        : alerts;

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
            <span className="text-2xl">🔔</span>
          </div>
          <h3 className="text-lg font-semibold text-white">No Alerts</h3>
          <p className="mt-1 text-sm text-gray-400">
            Smart alerts will appear here when opportunities arise
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Smart Alerts</h3>
          {unreadAlertCount > 0 && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadAlertCount}
            </div>
          )}
        </div>
        {alerts.length > 0 && (
          <button
            type="button"
            onClick={() => clearAllAlerts()}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <FilterButton
          active={filter === "all"}
          onClick={() => setFilter("all")}
          count={alerts.length}
        >
          All
        </FilterButton>
        <FilterButton
          active={filter === "priority"}
          onClick={() => setFilter("priority")}
          count={getHighPriorityAlerts().length}
        >
          Priority
        </FilterButton>
        <FilterButton
          active={filter === "opportunity"}
          onClick={() => setFilter("opportunity")}
          count={getOpportunityAlerts().length}
        >
          Opportunities
        </FilterButton>
      </div>

      {/* Alerts List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredAlerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDismiss={() => dismissAlert(alert.id)}
            onNavigate={(href) => {
              if (href) router.push(href);
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Sub-components

function FilterButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
          : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white"
      }`}
    >
      <span>{children}</span>
      <span
        className={`rounded-full px-1.5 py-0.5 text-xs ${
          active ? "bg-cyan-500/30" : "bg-gray-700"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function AlertCard({
  alert,
  onDismiss,
  onNavigate,
}: {
  alert: {
    id: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    category: "OPPORTUNITY" | "RISK" | "ACHIEVEMENT" | "UPDATE";
    title: string;
    description: string;
    actions: {
      label: string;
      type: "NAVIGATE" | "TRADE" | "DISMISS";
      href?: string;
    }[];
    createdAt: Date;
    expiresAt?: Date;
  };
  onDismiss: () => void;
  onNavigate: (href?: string) => void;
}) {
  const priorityConfig = {
    LOW: {
      border: "border-gray-700",
      bg: "bg-gray-800/30",
      icon: "ℹ️",
    },
    MEDIUM: {
      border: "border-blue-500/30",
      bg: "bg-blue-500/5",
      icon: "🔵",
    },
    HIGH: {
      border: "border-yellow-500/30",
      bg: "bg-yellow-500/5",
      icon: "⚠️",
    },
    URGENT: {
      border: "border-red-500/30",
      bg: "bg-red-500/5",
      icon: "🚨",
    },
  };

  const categoryIcons = {
    OPPORTUNITY: "💰",
    RISK: "⚠️",
    ACHIEVEMENT: "🎉",
    UPDATE: "📢",
  };

  const config = priorityConfig[alert.priority];
  const timeAgo = formatTimeAgo(alert.createdAt);

  return (
    <div
      className={`rounded-lg border ${config.border} ${config.bg} p-4 space-y-3`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-lg">{categoryIcons[alert.category]}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-white text-sm">
                {alert.title}
              </h4>
              <span className="text-xs text-gray-500">{timeAgo}</span>
            </div>
            <p className="mt-1 text-sm text-gray-300 leading-relaxed">
              {alert.description}
            </p>
          </div>
        </div>
        <span className="text-sm">{config.icon}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {alert.actions.map((action, idx) => (
          <ActionButton
            key={idx}
            action={action}
            onDismiss={onDismiss}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {/* Expiry Warning */}
      {alert.expiresAt && (
        <div className="flex items-center gap-1.5 text-xs text-yellow-400">
          <span>⏰</span>
          <span>Expires {formatTimeAgo(alert.expiresAt)}</span>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  action,
  onDismiss,
  onNavigate,
}: {
  action: {
    label: string;
    type: "NAVIGATE" | "TRADE" | "DISMISS";
    href?: string;
  };
  onDismiss: () => void;
  onNavigate: (href?: string) => void;
}) {
  const handleClick = () => {
    if (action.type === "DISMISS") {
      onDismiss();
    } else if (action.type === "NAVIGATE" && action.href) {
      onNavigate(action.href);
    }
  };

  const styles =
    action.type === "DISMISS"
      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
      : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${styles}`}
    >
      {action.label}
    </button>
  );
}

// Utilities

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
