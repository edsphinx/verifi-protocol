import {
  Account,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  isUserTransactionResponse,
  type Network,
} from "@aptos-labs/ts-sdk";
import { networkName, nodeUrl, privateKey } from "./_config";

// ASUME que la dirección del módulo es la dirección del editor/administrador.
const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;
const ORACLE_ID_TO_TEST = "aptos-balance";

/**
 * Función de ayuda para registrar un nuevo oráculo.
 */
async function registerOracle(
  aptos: Aptos,
  adminAccount: Account,
  oracleId: string,
  protocolName: string,
) {
  try {
    const registerTxn = await aptos.transaction.build.simple({
      sender: adminAccount.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::oracle_registry::register_oracle`,
        functionArguments: [oracleId, protocolName],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: adminAccount,
      transaction: registerTxn,
    });
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    console.log(` Oracle "${oracleId}" registered successfully.`);
  } catch (error: any) {
    // Si el error es porque el oráculo ya existe, lo manejamos con gracia.
    // El código de error para `EALREADY_EXISTS` en el módulo de tabla es `0x6407`.
    if (error.message && error.message.includes("0x6407")) {
      console.log(`- Oracle "${oracleId}" is already registered. Skipping.`);
    } else {
      throw error;
    }
  }
}

/**
 * Función principal para ejecutar el flujo de prueba del oráculo.
 */
async function main() {
  if (!privateKey || !MODULE_ADDRESS) {
    throw new Error(
      "Required variables (privateKey, MODULE_ADDRESS) are not set in your .env file.",
    );
  }

  const aptosConfig = new AptosConfig({
    network: networkName as Network,
    fullnode: `${nodeUrl}`,
  });
  const aptos = new Aptos(aptosConfig);

  // La clave privada del .env se usa para la cuenta del administrador/editor.
  const adminPrivateKey = new Ed25519PrivateKey(privateKey);
  const adminAccount = Account.fromPrivateKey({ privateKey: adminPrivateKey });
  const adminAddress = adminAccount.accountAddress;

  console.log(" Starting Oracle Architecture Test Flow...");
  console.log(`- Using Admin Account: ${adminAddress.toString()}`);

  // === Paso 1: Registrar nuestro nuevo oráculo ===
  console.log(`\n[1/5] Registering new oracle: "${ORACLE_ID_TO_TEST}"...`);
  try {
    await registerOracle(
      aptos,
      adminAccount,
      ORACLE_ID_TO_TEST,
      "Aptos Native Balance",
    );
    console.log(" Oracle registered successfully.");
  } catch (error) {
    console.error(" Failed to register oracle.", error);
    process.exit(1);
  }

  // === Paso 2: Prueba Negativa - Intentar crear un mercado con un oráculo inválido ===
  console.log(
    "\n[2/5] Negative Test: Attempting to create market with an unregistered oracle...",
  );
  try {
    const createTxn = await aptos.transaction.build.simple({
      sender: adminAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
        functionArguments: [
          "Invalid Market Test",
          (Math.floor(Date.now() / 1000) + 3600).toString(), // 1 hora en el futuro
          adminAddress.toString(),
          "unregistered-oracle", // ID de oráculo inválido
          adminAddress.toString(),
          "balance",
          "1",
          0,
        ],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: adminAccount,
      transaction: createTxn,
    });
    // Si la transacción tiene éxito, es un error en nuestra lógica, así que fallamos la prueba.
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

    console.error(
      " Negative Test FAILED: Market was created with an unregistered oracle.",
    );
    process.exit(1);
  } catch (error: any) {
    // Esperamos un error. Comprobamos si es el error correcto (E_ORACLE_NOT_ACTIVE).
    const expectedErrorMessage = `verifi_protocol: E_ORACLE_NOT_ACTIVE(0xc)`;
    if (error.message && error.message.includes(expectedErrorMessage)) {
      console.log(
        " Negative Test PASSED: Contract correctly rejected the transaction.",
      );
    } else {
      console.error(
        " Negative Test FAILED with unexpected error:",
        error.message,
      );
      process.exit(1);
    }
  }

  let marketAddress: string | undefined;

  // === Paso 3: Crear un mercado con el oráculo válido ===
  console.log("\n[3/5] Creating a new market with a valid oracle...");
  try {
    const targetAddress = adminAddress.toString();
    const targetValue = "1000"; // Un valor bajo para asegurar que el balance sea mayor.

    const createTxn = await aptos.transaction.build.simple({
      sender: adminAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
        functionArguments: [
          `Will balance of ${targetAddress.slice(0, 6)}... be > ${targetValue} Octas?`,
          (Math.floor(Date.now() / 1000) + 5).toString(), // Resuelve en 5 segundos
          adminAddress.toString(),
          ORACLE_ID_TO_TEST,
          targetAddress,
          "balance",
          targetValue,
          0, // OPERATOR_GREATER_THAN
        ],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: adminAccount,
      transaction: createTxn,
    });
    const response = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    if (isUserTransactionResponse(response)) {
      const event = response.events.find(
        (e) =>
          e.type === `${MODULE_ADDRESS}::verifi_protocol::MarketCreatedEvent`,
      );
      if (event) {
        marketAddress = event.data.market_address;
        console.log(
          ` Market created successfully at address: ${marketAddress}`,
        );
      }
    }
  } catch (error) {
    console.error(" Failed to create market.", error);
    process.exit(1);
  }

  // === Paso 4: Esperar y resolver el mercado programáticamente ===
  console.log(
    "\n[4/5] Waiting for resolution time and resolving the market...",
  );
  await new Promise((resolve) => setTimeout(resolve, 6000)); // Esperar 6 segundos

  try {
    const resolveTxn = await aptos.transaction.build.simple({
      sender: adminAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::resolve_market_programmatically`,
        functionArguments: [marketAddress],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: adminAccount,
      transaction: resolveTxn,
    });
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    console.log(" Market resolved programmatically.");
  } catch (error) {
    console.error(" Failed to resolve market.", error);
    process.exit(1);
  }

  // === Paso 5: Verificar el estado final del mercado ===
  console.log("\n[5/5] Checking final market state...");
  try {
    const marketState = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_market_state`,
        functionArguments: [marketAddress],
      },
    });
    const status = marketState[0];
    // El estado 2 es STATUS_RESOLVED_YES
    if (status === 2) {
      console.log(` Market correctly resolved to YES (Status: ${status}).`);
    } else {
      console.error(
        ` Market resolved INCORRECTLY. Expected status 2 (YES), but got ${status}.`,
      );
    }
  } catch (error) {
    console.error(" Failed to get final market state.", error);
    process.exit(1);
  }

  console.log("\n Oracle flow test completed successfully!");
}

main();
