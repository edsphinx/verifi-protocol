-- CreateTable
CREATE TABLE "public"."markets" (
    "id" TEXT NOT NULL,
    "market_address" TEXT NOT NULL,
    "creator_address" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolution_timestamp" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "total_volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "markets_market_address_key" ON "public"."markets"("market_address");
