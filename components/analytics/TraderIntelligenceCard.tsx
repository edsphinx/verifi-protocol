"use client";

import { useEffect, useState } from "react";

interface TraderStats {
  userAddress: string;
  totalVolume: number;
  volume24h: number;
  totalTrades: number;
  trades24h: number;
  totalPnL: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalLiquidityProvided: number;
  feesEarnedAllTime: number;
  volumeRank?: number;
  pnlRank?: number;
}

interface TraderIntelligenceCardProps {
  userAddress: string;
  rank?: number;
  showFullDetails?: boolean;
}

export function TraderIntelligenceCard({
  userAddress,
  rank,
  showFullDetails = false,
}: TraderIntelligenceCardProps) {
  const [stats, setStats] = useState<TraderStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/trader-stats/${userAddress}`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch trader stats:", err);
        setLoading(false);
      });
  }, [userAddress]);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <span className="text-sm text-gray-400">Loading trader data...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <div className="text-center text-sm text-gray-400">
          No trading data available
        </div>
      </div>
    );
  }

  const profitLoss = stats.totalPnL;
  const isProfitable = profitLoss > 0;

  return (
    <div className="rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-900/50 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {rank && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-400">
                #{rank}
              </div>
            )}
            <div className="font-mono text-sm text-gray-400">
              {formatAddress(userAddress)}
            </div>
          </div>

          {/* Trader Level Badge */}
          <div className="mt-2 inline-flex">
            <TraderLevelBadge stats={stats} />
          </div>
        </div>

        {/* PnL */}
        <div className="text-right">
          <div className="text-xs text-gray-400">Total P&L</div>
          <div
            className={`text-lg font-bold ${isProfitable ? "text-green-400" : "text-red-400"}`}
          >
            {isProfitable ? "+" : ""}
            {profitLoss.toFixed(2)} APT
          </div>
        </div>
      </div>

      {/* Win Rate Circle */}
      <div className="flex items-center gap-6">
        <WinRateCircle winRate={stats.winRate} />

        {/* Quick Stats */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          <StatPill
            label="Trades"
            value={stats.totalTrades.toString()}
            subValue={`${stats.trades24h} today`}
          />
          <StatPill
            label="Volume"
            value={`${stats.totalVolume.toFixed(0)} APT`}
            subValue={`${stats.volume24h.toFixed(0)} today`}
          />
        </div>
      </div>

      {/* Detailed Stats (if enabled) */}
      {showFullDetails && (
        <>
          {/* Win/Loss Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Win/Loss Record</span>
              <span className="text-white">
                {stats.winningTrades}W - {stats.losingTrades}L
              </span>
            </div>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-700">
              <div
                className="bg-green-500"
                style={{
                  width: `${(stats.winningTrades / stats.totalTrades) * 100}%`,
                }}
              />
              <div
                className="bg-red-500"
                style={{
                  width: `${(stats.losingTrades / stats.totalTrades) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* LP Stats (if applicable) */}
          {stats.totalLiquidityProvided > 0 && (
            <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Liquidity Provided
                </span>
                <span className="text-sm font-medium text-white">
                  {stats.totalLiquidityProvided.toFixed(2)} APT
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Fees Earned</span>
                <span className="text-sm font-medium text-green-400">
                  +{stats.feesEarnedAllTime.toFixed(2)} APT
                </span>
              </div>
            </div>
          )}

          {/* Rankings */}
          {(stats.volumeRank || stats.pnlRank) && (
            <div className="flex gap-2">
              {stats.volumeRank && (
                <RankBadge label="Volume" rank={stats.volumeRank} />
              )}
              {stats.pnlRank && (
                <RankBadge label="P&L" rank={stats.pnlRank} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Sub-components

function TraderLevelBadge({ stats }: { stats: TraderStats }) {
  type ColorKey = "purple" | "blue" | "cyan" | "green" | "gray";

  const getLevel = (totalVolume: number): { label: string; color: ColorKey } => {
    if (totalVolume >= 10000) return { label: "🐋 Whale", color: "purple" };
    if (totalVolume >= 5000) return { label: "🦈 Shark", color: "blue" };
    if (totalVolume >= 1000) return { label: "🐬 Dolphin", color: "cyan" };
    if (totalVolume >= 100) return { label: "🐠 Fish", color: "green" };
    return { label: "🦐 Shrimp", color: "gray" };
  };

  const level = getLevel(stats.totalVolume);

  const colorClasses: Record<ColorKey, string> = {
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    gray: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <div
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${colorClasses[level.color]}`}
    >
      {level.label}
    </div>
  );
}

function WinRateCircle({ winRate }: { winRate: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (winRate / 100) * circumference;

  const getColor = (rate: number) => {
    if (rate >= 70) return "#10b981"; // green
    if (rate >= 50) return "#3b82f6"; // blue
    if (rate >= 30) return "#f59e0b"; // yellow
    return "#ef4444"; // red
  };

  return (
    <div className="relative h-20 w-20">
      <svg className="h-full w-full -rotate-90 transform">
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="#374151"
          strokeWidth="6"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke={getColor(winRate)}
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-lg font-bold text-white">{winRate.toFixed(0)}%</div>
        <div className="text-xs text-gray-400">Win Rate</div>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue: string;
}) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-2">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
      <div className="text-xs text-cyan-400">{subValue}</div>
    </div>
  );
}

function RankBadge({ label, rank }: { label: string; rank: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-yellow-400">
      <span className="text-xs">🏆</span>
      <span className="text-xs font-medium">
        #{rank} {label}
      </span>
    </div>
  );
}

// Utilities

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
