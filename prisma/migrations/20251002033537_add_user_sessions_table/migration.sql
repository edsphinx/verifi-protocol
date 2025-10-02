-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "market_address" TEXT NOT NULL,
    "user_address" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activities_tx_hash_key" ON "activities"("tx_hash");
