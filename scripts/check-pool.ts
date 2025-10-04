import { aptosClient } from "../aptos/client";

const poolAddress =
  "0xcfbb0e27ae96b5af44dd2c94aae1d272e631423446368755a0c6390ddd575913";
const hookModule =
  "0x93bc73410f9345c6ff9c399c43913e7a7701a7331e375a70b0ba81ccca036674::tapp_prediction_hook";

async function checkPool() {
  try {
    console.log("Checking pool stats for:", poolAddress);
    const stats = await aptosClient().view({
      payload: {
        function: `${hookModule}::get_pool_stats` as any,
        typeArguments: [],
        functionArguments: [poolAddress],
      },
    });

    console.log("\nRaw stats:", stats);
    const [reserveYes, reserveNo, feeYes, feeNo, positionCount, isTrading] =
      stats as any[];
    console.log("\nParsed:");
    console.log({
      reserveYes,
      reserveNo,
      feeYes,
      feeNo,
      positionCount,
      tradingEnabled: isTrading,
    });
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

checkPool();
