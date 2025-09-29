import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  console.log("Deleting old market data...");
  await prisma.market.deleteMany({});
  console.log("Old data deleted.");

  console.log("Creating test markets...");

  const market1 = await prisma.market.create({
    data: {
      marketAddress:
        "0x1111111111111111111111111111111111111111111111111111111111111111",
      creatorAddress:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      description: "Will AMNIS Finance TVL be above $10M on Oct 31, 2025?",
      resolutionTimestamp: new Date("2025-10-31T23:59:59Z"),
      status: "active",
    },
  });

  const market2 = await prisma.market.create({
    data: {
      marketAddress:
        "0x2222222222222222222222222222222222222222222222222222222222222222",
      creatorAddress:
        "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      description:
        "Will the floor price of Aptos Monkeys NFT be over 500 APT by year end?",
      resolutionTimestamp: new Date("2025-12-31T23:59:59Z"),
      status: "active",
    },
  });

  const market3 = await prisma.market.create({
    data: {
      marketAddress:
        "0x3333333333333333333333333333333333333333333333333333333333333333",
      creatorAddress:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      description:
        "Will 'Overmind' game reach 10k daily active users in its first month?",
      resolutionTimestamp: new Date("2025-11-15T23:59:59Z"),
      status: "active",
    },
  });

  console.log("Test markets created:");
  console.log({ market1, market2, market3 });

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
