-- AlterTable
ALTER TABLE "activities" ALTER COLUMN "outcome" DROP NOT NULL;

-- CreateTable
CREATE TABLE "tapp_pools" (
    "id" TEXT NOT NULL,
    "pool_address" TEXT NOT NULL,
    "market_address" TEXT NOT NULL,
    "hook_type" INTEGER NOT NULL,
    "yes_token_address" TEXT NOT NULL,
    "no_token_address" TEXT NOT NULL,
    "fee" INTEGER NOT NULL,
    "creator_address" TEXT NOT NULL,
    "total_liquidity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volume_24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tapp_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "related_address" TEXT,
    "tx_hash" TEXT,
    "metadata" JSONB,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "target_user" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tapp_pools_pool_address_key" ON "tapp_pools"("pool_address");

-- CreateIndex
CREATE INDEX "notifications_target_user_created_at_idx" ON "notifications"("target_user", "created_at");

-- CreateIndex
CREATE INDEX "notifications_is_global_created_at_idx" ON "notifications"("is_global", "created_at");
