"use client";

import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCreateMarketPayload, indexNewMarket } from "@/lib/aptos/api/market";
import { aptosClient } from "@/lib/aptos/client";
import { NETWORK } from "@/lib/aptos/constants";
import { VERIFI_PROTOCOL_ABI } from "@/utils/abis";

export function CreateMarketForm() {
  const [description, setDescription] = useState("");
  const [resolutionDate, setResolutionDate] = useState("");
  const { signAndSubmitTransaction, account } = useWallet();
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: getCreateMarketPayload,
    onSuccess: async (payload) => {
      if (!account?.address) return;
      try {
        const committedTxn = await signAndSubmitTransaction({
          sender: account.address,
          data: payload,
        });

        toast.info("Market creation submitted, waiting for confirmation...");

        const response = await aptosClient().waitForTransaction({
          transactionHash: committedTxn.hash,
          options: {
            timeoutSecs: 60,
            waitForIndexer: true,
          },
        });

        if (isUserTransactionResponse(response)) {
          const event = response.events.find(
            (e) =>
              e.type ===
              `${VERIFI_PROTOCOL_ABI.address}::verifi_protocol::MarketCreatedEvent`,
          );
          if (event) {
            await indexNewMarket(event.data);
            
            const marketAddress = event.data.market_address;
            toast.success("Market created successfully!", {
              description: "Redirecting you to the market page...",
              action: {
                label: "View Transaction",
                onClick: () =>
                  window.open(
                    `https://explorer.aptoslabs.com/txn/${response.hash}?network=${NETWORK.toLowerCase()}`,
                    "_blank",
                  ),
              },
            });
            router.push(`/market/${marketAddress}`);
          } else {
            throw new Error("MarketCreatedEvent not found in transaction.");
          }
        }
      } catch (e: any) {
        toast.error("Transaction Failed", { description: e.message });
      }
    },
    onError: (e: Error) =>
      toast.error("Error building transaction", { description: e.message }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account?.address) {
      toast.error("Please connect your wallet first.");
      return;
    }

    const resolutionTimestamp = Math.floor(
      new Date(resolutionDate).getTime() / 1000,
    );

    mutate({
      description,
      resolutionTimestamp,
      resolverAddress: account.address,
      targetAddress: "0x1",
      targetFunction: "get_tvl",
      targetValue: 1,
      operator: 0,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Market Details</CardTitle>
          <CardDescription>
            Define the question and resolution criteria for your market.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Market Question</Label>
            <Input
              id="description"
              placeholder="e.g., Will AMNIS Finance TVL be above $10M on...?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resolution-date">Resolution Date & Time</Label>
            <Input
              id="resolution-date"
              type="datetime-local"
              value={resolutionDate}
              onChange={(e) => setResolutionDate(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={!account || isPending}
          >
            {isPending ? "Creating Market..." : "Create Market"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
