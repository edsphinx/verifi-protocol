"use client";

import {
  type InputTransactionData,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aptosClient } from "@/lib/aptos/client";
import { getAccountAPTBalance } from "@/lib/aptos/queries/get-account-balance";
import { LabelValueGrid } from "./LabelValueGrid";

const APTOS_COIN_TYPE = "0x1::aptos_coin::AptosCoin";

export function TransferAPT() {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const queryClient = useQueryClient();

  const accountAddress = account?.address?.toString();

  const [recipient, setRecipient] = useState<string>(
    "0x2e72ed04241107c339545a3e7df228b9a232e88748ef016caaa8aa7664bd7d86",
  );
  const [transferAmount, setTransferAmount] = useState<string>("0.1");

  const { data: balanceData, isLoading } = useQuery({
    queryKey: ["apt-balance", accountAddress],
    queryFn: async () => {
      if (!accountAddress) return null;
      try {
        return getAccountAPTBalance({ accountAddress });
      } catch (error: any) {
        console.error(`Failed to fetch balance: ${error.message}`);
        toast.error("Failed to fetch balance", {
          description: error.message,
        });
        return null;
      }
    },
    enabled: !!accountAddress,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const balance = balanceData ?? 0;

  const onClickButton = async () => {
    if (!connected || !recipient || !transferAmount) {
      return;
    }

    try {
      const payload: InputTransactionData = {
        data: {
          function: "0x1::coin::transfer",
          typeArguments: [APTOS_COIN_TYPE],
          functionArguments: [
            recipient,
            Math.floor(parseFloat(transferAmount) * 10 ** 8),
          ],
        },
      };

      const committedTransaction = await signAndSubmitTransaction(payload);

      await aptosClient().waitForTransaction({
        transactionHash: committedTransaction.hash,
      });

      queryClient.invalidateQueries({
        queryKey: ["apt-balance", accountAddress],
      });

      toast.success("Transfer successful!", {
        description: `Transaction confirmed.`,
        action: {
          label: "View on Explorer",
          onClick: () =>
            window.open(
              `https://explorer.aptoslabs.com/txn/${committedTransaction.hash}?network=local`,
              "_blank",
            ),
        },
      });

      queryClient.invalidateQueries({
        queryKey: ["apt-balance", accountAddress],
      });
    } catch (error: any) {
      console.error(error);
      toast.error("Transfer failed", {
        description: error.message || "An unknown error occurred.",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <LabelValueGrid
        items={[
          {
            label: "Your APT Balance",
            value: isLoading ? "Loading..." : `${balance / 10 ** 8}`,
          },
        ]}
      />
      <Input
        disabled={!connected}
        placeholder="Recipient address (0x...)"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <Input
        type="number"
        disabled={!connected}
        placeholder="Amount (e.g., 1.5)"
        value={transferAmount}
        onChange={(e) => setTransferAmount(e.target.value)}
      />
      <Button
        disabled={
          !connected ||
          !recipient ||
          !transferAmount ||
          parseFloat(transferAmount) * 10 ** 8 > balance ||
          parseFloat(transferAmount) <= 0
        }
        onClick={onClickButton}
      >
        Transfer
      </Button>
    </div>
  );
}
