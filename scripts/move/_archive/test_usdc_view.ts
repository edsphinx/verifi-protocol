import { Aptos, AptosConfig, type Network } from "@aptos-labs/ts-sdk";

import { networkName, nodeUrl } from "../_config";

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;

/**
 * Main function to test the `get_total_supply` view function from the oracle_usdc module.
 */
async function main() {
  if (!MODULE_ADDRESS) {
    throw new Error(
      "NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS is not set in your .env file.",
    );
  }

  const aptosConfig = new AptosConfig({
    network: networkName as Network,
    fullnode: `${nodeUrl}`,
  });
  const aptos = new Aptos(aptosConfig);

  console.log(
    `🚀 Calling get_total_supply from ${MODULE_ADDRESS}::oracle_usdc...`,
  );

  try {
    // Llama a la función `view` del contrato. No requiere argumentos.
    const totalSupplyResponse = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::oracle_usdc::get_total_supply`,
        functionArguments: [],
      },
    });

    // La respuesta es un array, el primer elemento es nuestro valor.
    const rawSupply = Number(totalSupplyResponse[0]);

    // Formateamos el valor para que sea legible, considerando los 6 decimales de USDC.
    const formattedSupply = rawSupply / 10 ** 6;

    console.log("\n✅ View function executed successfully!");
    console.log(`   - Raw Total Supply (smallest unit): ${rawSupply}`);
    console.log(
      `   - Formatted Total Supply: ${formattedSupply.toLocaleString()} USDC`,
    );
  } catch (error) {
    console.error("❌ Failed to call view function.", error);
    process.exit(1);
  }
}

main();
