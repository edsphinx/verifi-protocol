import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkVolume() {
  console.log("📊 Checking market volumes and activities...\n");

  // Get recent markets
  const markets = await prisma.market.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      activities: {
        where: {
          action: { in: ["BUY", "SELL", "SWAP"] },
        },
      },
    },
  });

  for (const market of markets) {
    console.log(`\n📈 Market: ${market.marketAddress.substring(0, 10)}...`);
    console.log(`   Description: ${market.description}`);
    console.log(`   DB volume_24h: ${market.volume24h} APT`);
    console.log(`   DB total_volume: ${market.totalVolume} APT`);
    console.log(`   Total trades: ${market.totalTrades}`);
    console.log(`   Activities found: ${market.activities.length}`);

    if (market.activities.length > 0) {
      console.log(`\n   📋 Recent activities:`);
      for (const activity of market.activities.slice(0, 5)) {
        console.log(
          `      - ${activity.action} ${activity.outcome || ""}: amount=${activity.amount}, totalValue=${activity.totalValue}, price=${activity.price}`,
        );
      }

      // Calculate actual volume from activities
      const calculatedVolume = market.activities.reduce((sum, a) => {
        return sum + (a.totalValue || 0);
      }, 0);

      console.log(
        `\n   💰 Calculated volume from activities: ${calculatedVolume} APT`,
      );
      console.log(
        `   ⚠️  Discrepancy: ${calculatedVolume - market.volume24h} APT`,
      );
    }
  }

  await prisma.$disconnect();
}

checkVolume().catch(console.error);
