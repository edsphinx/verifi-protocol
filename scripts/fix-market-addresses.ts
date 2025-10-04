/**
 * Fix Market Addresses Script
 *
 * Validates and fixes market addresses in the database:
 * - Checks for invalid hex addresses
 * - Attempts to fix common issues
 * - Deletes markets that can't be fixed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMarketAddresses() {
  console.log('🔍 Checking market addresses...\n');

  const markets = await prisma.market.findMany();
  console.log(`📊 Total markets in database: ${markets.length}\n`);

  let fixed = 0;
  let deleted = 0;
  let valid = 0;

  for (const market of markets) {
    const addr = market.marketAddress;

    // Check if address is valid hex
    const isValid = /^0x[0-9a-fA-F]+$/.test(addr);

    if (isValid) {
      valid++;
      continue;
    }

    console.log(`❌ Invalid address: ${addr}`);
    console.log(`   Description: ${market.description.slice(0, 50)}...`);

    // Try to fix common issues
    let fixedAddr = addr;

    // Remove any non-hex characters
    fixedAddr = fixedAddr.replace(/[^0-9a-fA-Fx]/g, '');

    // Ensure it starts with 0x
    if (!fixedAddr.startsWith('0x')) {
      fixedAddr = '0x' + fixedAddr;
    }

    // Check if fixed version is valid
    const isFixedValid = /^0x[0-9a-fA-F]+$/.test(fixedAddr) && fixedAddr.length >= 10;

    if (isFixedValid && fixedAddr !== addr) {
      console.log(`   ✅ Fixed to: ${fixedAddr}`);

      try {
        await prisma.market.update({
          where: { id: market.id },
          data: { marketAddress: fixedAddr },
        });
        fixed++;
      } catch (error) {
        console.log(`   ⚠️  Could not update: ${error}`);
        console.log(`   🗑️  Deleting market...`);
        await prisma.market.delete({ where: { id: market.id } });
        deleted++;
      }
    } else {
      console.log(`   🗑️  Cannot fix - deleting market...`);
      await prisma.market.delete({ where: { id: market.id } });
      deleted++;
    }

    console.log('');
  }

  console.log('='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Valid markets:   ${valid}`);
  console.log(`🔧 Fixed markets:   ${fixed}`);
  console.log(`🗑️  Deleted markets: ${deleted}`);
  console.log(`📦 Total processed: ${valid + fixed + deleted}`);
  console.log('='.repeat(60));
}

fixMarketAddresses()
  .then(() => {
    console.log('\n✅ Cleanup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
