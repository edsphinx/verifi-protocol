import { Aptos, AptosConfig, type Network } from "@aptos-labs/ts-sdk";
import { networkName, nodeUrl } from "./_config";
import { trader1Account } from "./_test-accounts";

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS!;

async function main() {
  const aptosConfig = new AptosConfig({
    network: networkName as Network,
    fullnode: nodeUrl,
  });
  const aptos = new Aptos(aptosConfig);

  const account = trader1Account;

  console.log("Cleaning up session for:", account.accountAddress.toString());

  try {
    // Check if session exists
    const result = await aptos.view<[boolean, string, string, string, string]>({
      payload: {
        function: `${MODULE_ADDRESS}::session_key_mockup::get_session`,
        functionArguments: [account.accountAddress.toString()],
      },
    });

    console.log("Session exists:", result[0]);

    if (result[0]) {
      // Revoke session
      const txn = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: {
          function: `${MODULE_ADDRESS}::session_key_mockup::revoke_session`,
          functionArguments: [],
        },
      });

      const pendingTx = await aptos.signAndSubmitTransaction({
        signer: account,
        transaction: txn,
      });

      await aptos.waitForTransaction({ transactionHash: pendingTx.hash });
      console.log("✅ Session revoked:", pendingTx.hash);
    } else {
      console.log("✅ No session to clean up");
    }
  } catch (error: any) {
    console.log("Error or no session:", error.message);
  }
}

main().catch(console.error);