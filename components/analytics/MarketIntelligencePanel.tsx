"use client";

import { useEffect } from "react";
import { useIntelligenceStore } from "@/lib/stores/use-intelligence-store";
import type { MarketMetrics } from "@/lib/types/database.types";

interface MarketIntelligencePanelProps {
  marketAddress: string;
  metrics: MarketMetrics;
}

export function MarketIntelligencePanel({
  marketAddress,
  metrics,
}: MarketIntelligencePanelProps) {
  const {
    getIntelligence,
    fetchMarketIntelligence,
    loadingMarkets,
  } = useIntelligenceStore();

  const intelligence = getIntelligence(marketAddress);
  const isLoading = loadingMarkets.has(marketAddress);

  useEffect(() => {
    if (!intelligence && !isLoading) {
      fetchMarketIntelligence(marketAddress, metrics);
    }
  }, [marketAddress, intelligence, isLoading, fetchMarketIntelligence, metrics]);

  if (isLoading || !intelligence) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <span className="text-sm text-gray-400">
            Analyzing market intelligence...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Market Intelligence
        </h3>
        <RiskBadge level={intelligence.riskLevel} />
      </div>

      {/* Sentiment & Prediction */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sentiment Gauge */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Market Sentiment</span>
            <span className="text-sm font-medium text-white">
              {intelligence.sentimentScore > 0 ? "Bullish" : intelligence.sentimentScore < 0 ? "Bearish" : "Neutral"}
            </span>
          </div>
          <SentimentGauge score={intelligence.sentimentScore} />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Bearish</span>
            <span>Neutral</span>
            <span>Bullish</span>
          </div>
        </div>

        {/* Prediction */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">AI Prediction</span>
            <span className="text-sm font-medium text-white">
              {intelligence.prediction.confidence}% confidence
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <OutcomeIcon outcome={intelligence.prediction.outcome} />
            <div>
              <div className="text-lg font-bold text-white">
                {intelligence.prediction.outcome}
              </div>
              <ConfidenceBar confidence={intelligence.prediction.confidence} />
            </div>
          </div>
        </div>
      </div>

      {/* Opportunity Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Opportunity Score</span>
          <span className="text-sm font-medium text-white">
            {intelligence.opportunityScore}/100
          </span>
        </div>
        <OpportunityMeter score={intelligence.opportunityScore} />
      </div>

      {/* Actionable Insights */}
      {intelligence.insights.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">
            Smart Insights
          </h4>
          <div className="space-y-2">
            {intelligence.insights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Confidence Level */}
      <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/30 p-3">
        <span className="text-sm text-gray-400">Data Confidence</span>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              style={{ width: `${intelligence.confidenceLevel}%` }}
            />
          </div>
          <span className="text-sm font-medium text-white">
            {intelligence.confidenceLevel}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Sub-components

function RiskBadge({ level }: { level: "LOW" | "MEDIUM" | "HIGH" }) {
  const colors = {
    LOW: "bg-green-500/10 text-green-400 border-green-500/20",
    MEDIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    HIGH: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const icons = {
    LOW: "✓",
    MEDIUM: "⚠",
    HIGH: "⚠",
  };

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${colors[level]}`}
    >
      <span>{icons[level]}</span>
      <span>{level} RISK</span>
    </div>
  );
}

function SentimentGauge({ score }: { score: number }) {
  // Normalize score from -100/+100 to 0-100 for positioning
  const normalizedPosition = ((score + 100) / 200) * 100;

  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-gray-700">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-gray-500 to-green-500" />

      {/* Indicator */}
      <div
        className="absolute top-0 h-full w-1 bg-white shadow-lg shadow-white/50"
        style={{ left: `${normalizedPosition}%` }}
      />
    </div>
  );
}

function OutcomeIcon({ outcome }: { outcome: "YES" | "NO" | "UNCERTAIN" }) {
  if (outcome === "YES") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-xl">
        ✓
      </div>
    );
  }
  if (outcome === "NO") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-xl">
        ✗
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-500/20 text-xl">
      ?
    </div>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  return (
    <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-gray-700">
      <div
        className="h-full bg-cyan-500"
        style={{ width: `${confidence}%` }}
      />
    </div>
  );
}

function OpportunityMeter({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 75) return "from-green-500 to-emerald-500";
    if (score >= 50) return "from-yellow-500 to-orange-500";
    return "from-gray-500 to-gray-600";
  };

  return (
    <div className="h-3 overflow-hidden rounded-full bg-gray-700">
      <div
        className={`h-full bg-gradient-to-r ${getColor(score)} transition-all duration-500`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function InsightCard({
  insight,
}: {
  insight: {
    type: "ARBITRAGE" | "PRICE_ANOMALY" | "VOLUME_SPIKE" | "CONSENSUS_SHIFT";
    severity: "INFO" | "WARNING" | "CRITICAL";
    message: string;
    actionable: boolean;
    suggestedAction?: string;
  };
}) {
  const severityColors = {
    INFO: "border-blue-500/20 bg-blue-500/5",
    WARNING: "border-yellow-500/20 bg-yellow-500/5",
    CRITICAL: "border-red-500/20 bg-red-500/5",
  };

  const typeIcons = {
    ARBITRAGE: "💰",
    PRICE_ANOMALY: "📊",
    VOLUME_SPIKE: "📈",
    CONSENSUS_SHIFT: "🔄",
  };

  return (
    <div
      className={`rounded-lg border p-3 ${severityColors[insight.severity]}`}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg">{typeIcons[insight.type]}</span>
        <div className="flex-1 space-y-1">
          <p className="text-sm text-gray-300">{insight.message}</p>
          {insight.actionable && insight.suggestedAction && (
            <p className="text-xs text-cyan-400">
              💡 {insight.suggestedAction}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
