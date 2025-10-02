"use client";

import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { VERIFI_PROTOCOL_ABI } from "@/aptos/abis";
import { aptosClient } from "@/aptos/client";
import { NETWORK } from "@/aptos/constants";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Settings } from "lucide-react";
import { getCreateMarketPayload, indexNewMarket } from "@/lib/api/market";
import { MODULE_ADDRESS } from "@/aptos/constants";

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
  const [activeOracles, setActiveOracles] = useState<string[]>([]);
  const [checkingOracles, setCheckingOracles] = useState(true);

  const { signAndSubmitTransaction, account } = useWallet();
  const router = useRouter();

  // Set known active oracles on mount
  useEffect(() => {
    // Use hardcoded list of registered oracles for market creation
    // Note: tapp_prediction is a hook, not an oracle for markets
    setActiveOracles(["aptos-balance", "usdc-total-supply"]);
    setCheckingOracles(false);
  }, []);

  const selectedOracle =
    ORACLE_OPTIONS.find((opt) => opt.id === selectedOracleId) ||
    ORACLE_OPTIONS[0];

  const { mutate, isPending } = useMutation({
    mutationFn: getCreateMarketPayload,
    onSuccess: async (payload) => {
      if (!account?.address) return;
      try {
        console.log('[CreateMarketForm] Submitting transaction with payload:', payload);
        console.log('[CreateMarketForm] Sender address:', account.address);

        const committedTxn = await signAndSubmitTransaction({
          sender: account.address,
          data: payload,
        });

        console.log('[CreateMarketForm] Transaction committed:', committedTxn.hash);
        toast.info("Market creation submitted, waiting for confirmation...");

        console.log('[CreateMarketForm] Waiting for transaction confirmation...');

        const response = await aptosClient().waitForTransaction({
          transactionHash: committedTxn.hash,
          options: {
            timeoutSecs: 60,
            waitForIndexer: true,
          },
        });

        console.log('[CreateMarketForm] Transaction confirmed:', response);

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
        console.error('[CreateMarketForm] Transaction error:', e);
        console.error('[CreateMarketForm] Error details:', {
          message: e.message,
          stack: e.stack,
          response: e.response,
        });
        toast.error("Transaction Failed", { description: e.message });
      }
    },
    onError: (e: Error) => {
      console.error('[CreateMarketForm] Payload build error:', e);
      toast.error("Error building transaction", { description: e.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account?.address) {
      toast.error("Please connect your wallet first.");
      return;
    }

    // User enters local time, we convert to UTC for blockchain
    // datetime-local input gives us local time string like "2025-10-02T14:30"
    const localDate = new Date(resolutionDate);
    const utcTimestamp = Math.floor(localDate.getTime() / 1000);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const payload = {
      description,
      resolutionTimestamp: utcTimestamp,
      resolverAddress: account.address.toString(),
      oracleId: selectedOracle.id,
      targetAddress: selectedOracle.requiresTargetAddress
        ? targetAddress
        : "0x1",
      targetFunction: selectedOracle.targetMetric,
      targetValue: Number(targetValue),
      operator,
    };

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📅 [CREATE MARKET] TIMEZONE DEBUGGING');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📝 Input string from form:', resolutionDate);
    console.log('');
    console.log('🕐 LOCAL TIME:');
    console.log('  - Full string:', localDate.toString());
    console.log('  - ISO format:', localDate.toISOString());
    console.log('  - Locale string:', localDate.toLocaleString());
    console.log('  - Timezone offset:', -localDate.getTimezoneOffset() / 60, 'hours from UTC');
    console.log('');
    console.log('🌍 UTC TIME (Blockchain):');
    console.log('  - Full string:', localDate.toUTCString());
    console.log('  - Year:', localDate.getUTCFullYear());
    console.log('  - Month:', localDate.getUTCMonth() + 1);
    console.log('  - Day:', localDate.getUTCDate());
    console.log('  - Hour:', localDate.getUTCHours());
    console.log('  - Minute:', localDate.getUTCMinutes());
    console.log('');
    console.log('⏱️  TIMESTAMPS:');
    console.log('  - Resolution timestamp (saved):', utcTimestamp);
    console.log('  - Current timestamp:', currentTimestamp);
    console.log('  - Difference (seconds):', utcTimestamp - currentTimestamp);
    console.log('  - Difference (hours):', ((utcTimestamp - currentTimestamp) / 3600).toFixed(2));
    console.log('  - Difference (days):', ((utcTimestamp - currentTimestamp) / 86400).toFixed(2));
    console.log('');
    console.log('✅ VERIFICATION:');
    console.log('  - Market will close in future?', utcTimestamp > currentTimestamp ? '✓ YES' : '✗ NO (ERROR!)');
    console.log('  - Time until closure:', Math.floor((utcTimestamp - currentTimestamp) / 60), 'minutes');
    console.log('');
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    console.log('═══════════════════════════════════════════════════════════');

    mutate(payload);
  };

  const hasNoActiveOracles = !checkingOracles && activeOracles.length === 0;
  const isPublisher = account?.address === MODULE_ADDRESS;

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
          {/* Oracle Warning Alert */}
          {hasNoActiveOracles && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Active Oracles Available</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  There are no active oracles registered in the protocol. Markets require at least
                  one active oracle to function.
                </p>
                {isPublisher ? (
                  <p className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <Link href="/status" className="underline font-medium">
                      Go to Status page to register and activate oracles
                    </Link>
                  </p>
                ) : (
                  <p>
                    Please contact the protocol publisher to register oracles before creating markets.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {checkingOracles && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Checking for active oracles...</AlertDescription>
            </Alert>
          )}
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
            <p className="text-sm text-muted-foreground">
              Enter the time when the market should close in your local timezone.
              {resolutionDate && (
                <span className="block mt-1">
                  <strong>Your time:</strong> {resolutionDate.replace('T', ' at ')}
                  <br />
                  <strong>UTC:</strong> {new Date(resolutionDate + 'Z').toUTCString()}
                </span>
              )}
            </p>
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
