import {
  Aptos,
  AptosConfig,
  type Network,
} from "@aptos-labs/ts-sdk";
import { networkName, nodeUrl } from "../_config";
import { publisherAccount } from "../_test-accounts";

const TRADER5_ADDR = process.env.NEXT_PUBLIC_TRADER5_ACCOUNT_ADDRESS!;

async function main() {
  const aptos = new Aptos(
    new AptosConfig({ network: networkName as Network, fullnode: nodeUrl }),
  );

  console.log("💰 Funding Trader 5 account");
  console.log(`From: ${publisherAccount.accountAddress}`);
  console.log(`To: ${TRADER5_ADDR}`);

  const txn = await aptos.transaction.build.simple({
    sender: publisherAccount.accountAddress,
    data: {
      function: "0x1::aptos_account::transfer",
      functionArguments: [TRADER5_ADDR, 1000000000], // 10 APT
    },
  });

  const committed = await aptos.signAndSubmitTransaction({
    signer: publisherAccount,
    transaction: txn,
  });

  await aptos.waitForTransaction({ transactionHash: committed.hash });
  console.log("✅ Transferred 10 APT to trader 5");
  console.log(
    `TX: https://explorer.aptoslabs.com/txn/${committed.hash}?network=${networkName}`,
  );
}

main();
