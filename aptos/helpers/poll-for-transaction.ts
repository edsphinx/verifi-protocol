import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/aptos/client";

/**
 * Waits for a transaction to be indexed and successful by manually polling.
 * This is more robust as it silently handles intermediate 404 errors and explicitly
 * checks for the transaction's success status once found.
 * @param hash The hash of the transaction to wait for.
 * @throws If the transaction fails on-chain or if it times out.
 */
export async function pollForTransaction(hash: string): Promise<void> {
  const MAX_RETRIES = 30;
  const RETRY_INTERVAL_MS = 2000; // 2 seconds interval = 60 seconds total timeout

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      // Directly query the transaction by hash.
      const response = await aptosClient().getTransactionByHash({
        transactionHash: hash,
      });

      // Use the type guard to ensure it's a user transaction.
      if (isUserTransactionResponse(response)) {
        // If it's a user transaction, check for its success status.
        if (response.success) {
          // Success! The transaction was found and executed successfully.
          return;
        } else {
          // The transaction was found but failed. Throw an error with the VM status.
          throw new Error(
            `Transaction failed with VM status: ${response.vm_status}`,
          );
        }
      }
      // If the response is not a UserTransactionResponse, we'll just wait and retry,
      // as it might be an intermediate state.
    } catch (error: any) {
      // If the error is a 404, it's expected while we wait for propagation.
      // We'll ignore it and continue polling.
      if (error?.status !== 404) {
        // If it's any other error (including the one we threw for a failed TX),
        // we should stop polling and propagate the error.
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
  }
  // If the loop finishes without finding the transaction, we throw a final timeout error.
  throw new Error("Transaction confirmation timed out after multiple retries.");
}
