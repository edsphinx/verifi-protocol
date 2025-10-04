-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "totalValue" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "markets" ADD COLUMN     "category" TEXT,
ADD COLUMN     "no_price" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "no_supply" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_trades" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unique_traders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "volume_24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "volume_7d" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "yes_price" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "yes_supply" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tapp_pools" ADD COLUMN     "apy_7d" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fees_24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fees_7d" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fees_all_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "no_reserve" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "utilization" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "volume_7d" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "volume_all_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "yes_reserve" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "market_price_history" (
    "id" TEXT NOT NULL,
    "market_address" TEXT NOT NULL,
    "yes_price" DOUBLE PRECISION NOT NULL,
    "no_price" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_volume_history" (
    "id" TEXT NOT NULL,
    "market_address" TEXT NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "trades" INTEGER NOT NULL,
    "unique_users" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_volume_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_positions" (
    "id" TEXT NOT NULL,
    "user_address" TEXT NOT NULL,
    "market_address" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "shares_owned" DOUBLE PRECISION NOT NULL,
    "avg_entry_price" DOUBLE PRECISION NOT NULL,
    "total_invested" DOUBLE PRECISION NOT NULL,
    "current_price" DOUBLE PRECISION NOT NULL,
    "current_value" DOUBLE PRECISION NOT NULL,
    "unrealized_pnl" DOUBLE PRECISION NOT NULL,
    "unrealized_pnl_pct" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "exit_price" DOUBLE PRECISION,
    "realized_pnl" DOUBLE PRECISION,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidity_positions" (
    "id" TEXT NOT NULL,
    "user_address" TEXT NOT NULL,
    "pool_address" TEXT NOT NULL,
    "market_address" TEXT NOT NULL,
    "lp_tokens" DOUBLE PRECISION NOT NULL,
    "liquidity_provided" DOUBLE PRECISION NOT NULL,
    "yes_amount" DOUBLE PRECISION NOT NULL,
    "no_amount" DOUBLE PRECISION NOT NULL,
    "current_value" DOUBLE PRECISION NOT NULL,
    "fees_earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unrealized_pnl" DOUBLE PRECISION NOT NULL,
    "apr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "withdrawn_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liquidity_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_metrics" (
    "id" TEXT NOT NULL,
    "total_volume" DOUBLE PRECISION NOT NULL,
    "volume_24h" DOUBLE PRECISION NOT NULL,
    "volume_7d" DOUBLE PRECISION NOT NULL,
    "total_value_locked" DOUBLE PRECISION NOT NULL,
    "tvl_change_24h" DOUBLE PRECISION NOT NULL,
    "total_markets" INTEGER NOT NULL,
    "active_markets" INTEGER NOT NULL,
    "resolved_markets" INTEGER NOT NULL,
    "total_users" INTEGER NOT NULL,
    "active_users_24h" INTEGER NOT NULL,
    "active_users_7d" INTEGER NOT NULL,
    "total_trades" INTEGER NOT NULL,
    "trades_24h" INTEGER NOT NULL,
    "total_pools" INTEGER NOT NULL,
    "total_liquidity" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocol_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total_volume" DOUBLE PRECISION NOT NULL,
    "total_trades" INTEGER NOT NULL,
    "active_users" INTEGER NOT NULL,
    "tvl" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_stats" (
    "id" TEXT NOT NULL,
    "user_address" TEXT NOT NULL,
    "total_volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volume_24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_trades" INTEGER NOT NULL DEFAULT 0,
    "trades_24h" INTEGER NOT NULL DEFAULT 0,
    "total_pnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "winning_trades" INTEGER NOT NULL DEFAULT 0,
    "losing_trades" INTEGER NOT NULL DEFAULT 0,
    "win_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_liquidity_provided" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fees_earned_all_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volume_rank" INTEGER,
    "pnl_rank" INTEGER,
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "market_price_history_market_address_timestamp_idx" ON "market_price_history"("market_address", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "market_price_history_market_address_timestamp_key" ON "market_price_history"("market_address", "timestamp");

-- CreateIndex
CREATE INDEX "market_volume_history_market_address_date_idx" ON "market_volume_history"("market_address", "date");

-- CreateIndex
CREATE UNIQUE INDEX "market_volume_history_market_address_date_key" ON "market_volume_history"("market_address", "date");

-- CreateIndex
CREATE INDEX "user_positions_user_address_status_idx" ON "user_positions"("user_address", "status");

-- CreateIndex
CREATE INDEX "user_positions_market_address_idx" ON "user_positions"("market_address");

-- CreateIndex
CREATE UNIQUE INDEX "user_positions_user_address_market_address_outcome_key" ON "user_positions"("user_address", "market_address", "outcome");

-- CreateIndex
CREATE INDEX "liquidity_positions_user_address_status_idx" ON "liquidity_positions"("user_address", "status");

-- CreateIndex
CREATE INDEX "liquidity_positions_pool_address_idx" ON "liquidity_positions"("pool_address");

-- CreateIndex
CREATE INDEX "protocol_metrics_timestamp_idx" ON "protocol_metrics"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "daily_metrics_date_key" ON "daily_metrics"("date");

-- CreateIndex
CREATE INDEX "daily_metrics_date_idx" ON "daily_metrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "user_stats_user_address_key" ON "user_stats"("user_address");

-- CreateIndex
CREATE INDEX "user_stats_total_volume_idx" ON "user_stats"("total_volume");

-- CreateIndex
CREATE INDEX "user_stats_total_pnl_idx" ON "user_stats"("total_pnl");

-- CreateIndex
CREATE INDEX "activities_market_address_timestamp_idx" ON "activities"("market_address", "timestamp");

-- CreateIndex
CREATE INDEX "activities_user_address_timestamp_idx" ON "activities"("user_address", "timestamp");

-- CreateIndex
CREATE INDEX "activities_action_idx" ON "activities"("action");

-- CreateIndex
CREATE INDEX "markets_status_idx" ON "markets"("status");

-- CreateIndex
CREATE INDEX "markets_creator_address_idx" ON "markets"("creator_address");

-- CreateIndex
CREATE INDEX "markets_volume_24h_idx" ON "markets"("volume_24h");

-- CreateIndex
CREATE INDEX "tapp_pools_market_address_idx" ON "tapp_pools"("market_address");

-- CreateIndex
CREATE INDEX "tapp_pools_total_liquidity_idx" ON "tapp_pools"("total_liquidity");

-- CreateIndex
CREATE INDEX "tapp_pools_volume_24h_idx" ON "tapp_pools"("volume_24h");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_market_address_fkey" FOREIGN KEY ("market_address") REFERENCES "markets"("market_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tapp_pools" ADD CONSTRAINT "tapp_pools_market_address_fkey" FOREIGN KEY ("market_address") REFERENCES "markets"("market_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_price_history" ADD CONSTRAINT "market_price_history_market_address_fkey" FOREIGN KEY ("market_address") REFERENCES "markets"("market_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_volume_history" ADD CONSTRAINT "market_volume_history_market_address_fkey" FOREIGN KEY ("market_address") REFERENCES "markets"("market_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_positions" ADD CONSTRAINT "user_positions_market_address_fkey" FOREIGN KEY ("market_address") REFERENCES "markets"("market_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidity_positions" ADD CONSTRAINT "liquidity_positions_pool_address_fkey" FOREIGN KEY ("pool_address") REFERENCES "tapp_pools"("pool_address") ON DELETE RESTRICT ON UPDATE CASCADE;
