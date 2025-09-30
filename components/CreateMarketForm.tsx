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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCreateMarketPayload, indexNewMarket } from "@/lib/aptos/api/market";
import { aptosClient } from "@/lib/aptos/client";
import { NETWORK } from "@/lib/aptos/constants";
import { VERIFI_PROTOCOL_ABI } from "@/utils/abis";

type OracleOption = {
  id: string; // El oracle_id que espera el contrato
  label: string; // El texto que ve el usuario
  requiresTargetAddress: boolean;
  targetMetric: string; // e.g., "balance", "total_supply"
  targetValueLabel: string; // e.g., "Target Balance (in Octas)"
};

const ORACLE_OPTIONS: OracleOption[] = [
  {
    id: "aptos-balance",
    label: "APT Balance of an Account",
    requiresTargetAddress: true,
    targetMetric: "balance",
    targetValueLabel: "Target Balance (in Octas)",
  },
  {
    id: "usdc-total-supply",
    label: "USDC Total Supply",
    requiresTargetAddress: false,
    targetMetric: "total_supply",
    targetValueLabel: "Target Supply (6 decimals)",
  },
  // Aquí es donde añadiremos los oráculos de los patrocinadores en el futuro.
];

export function CreateMarketForm() {
  const [description, setDescription] = useState("");
  const [resolutionDate, setResolutionDate] = useState("");
  const [selectedOracleId, setSelectedOracleId] = useState<string>(
    ORACLE_OPTIONS[0].id,
  );
  const [targetAddress, setTargetAddress] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [operator, setOperator] = useState<number>(0);

  const { signAndSubmitTransaction, account } = useWallet();
  const router = useRouter();

  const selectedOracle =
    ORACLE_OPTIONS.find((opt) => opt.id === selectedOracleId) ||
    ORACLE_OPTIONS[0];

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

    mutate({
      description,
      resolutionTimestamp: Math.floor(
        new Date(resolutionDate).getTime() / 1000,
      ),
      resolverAddress: account.address,
      oracleId: selectedOracle.id,
      targetAddress: selectedOracle.requiresTargetAddress
        ? targetAddress
        : "0x1",
      targetFunction: selectedOracle.targetMetric,
      targetValue,
      operator,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Create New Market</CardTitle>
          <CardDescription>
            Create a new prediction market based on a verifiable, on-chain
            event.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Market Question</Label>
            <Input
              id="description"
              placeholder="e.g., Will USDC total supply be > 1,000,000?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oracle-type">On-Chain Data Source (Oracle)</Label>
            <Select
              onValueChange={setSelectedOracleId}
              defaultValue={selectedOracle.id}
              disabled={isPending}
            >
              <SelectTrigger id="oracle-type">
                <SelectValue placeholder="Select an oracle" />
              </SelectTrigger>
              <SelectContent>
                {ORACLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOracle.requiresTargetAddress && (
            <div className="space-y-2">
              <Label htmlFor="target-address">Target Account Address</Label>
              <Input
                id="target-address"
                placeholder="0x..."
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operator">Condition</Label>
              <Select
                onValueChange={(val) => setOperator(Number(val))}
                defaultValue="0"
                disabled={isPending}
              >
                <SelectTrigger id="operator">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Greater Than (&gt;)</SelectItem>
                  <SelectItem value="1">Less Than (&lt;)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-value">
                {selectedOracle.targetValueLabel}
              </Label>
              <Input
                id="target-value"
                type="number"
                placeholder="e.g., 1000000"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
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
            {isPending ? "Submitting Transaction..." : "Create Market"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
