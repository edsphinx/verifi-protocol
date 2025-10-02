"use client";

/**
 * CreatePoolButton Component
 * Button to create a new Tapp AMM pool for a market
 */

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { PlusCircle } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCreatePool } from "@/lib/tapp/hooks/use-create-pool";

interface CreatePoolButtonProps {
  marketAddress: string;
  yesTokenAddress: string;
  noTokenAddress: string;
  onPoolCreated?: (poolAddress: string) => void;
}

export function CreatePoolButton({
  marketAddress,
  yesTokenAddress,
  noTokenAddress,
  onPoolCreated,
}: CreatePoolButtonProps) {
  const { account } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const createPool = useCreatePool();

  const handleCreatePool = async () => {
    if (!account) {
      return;
    }

    try {
      const result = await createPool.mutateAsync({
        marketId: marketAddress,
        yesTokenAddress,
        noTokenAddress,
      });

      // Close dialog and notify parent
      setIsOpen(false);
      if (onPoolCreated && result.poolAddress) {
        onPoolCreated(result.poolAddress);
      }
    } catch (error) {
      console.error("Failed to create pool:", error);
      // Error handling is done by the hook via toast
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create AMM Pool
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tapp AMM Pool</DialogTitle>
          <DialogDescription>
            Create a liquidity pool for this market to enable automated trading
            with YES/NO tokens
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Pool Configuration</Label>
            <div className="rounded-lg border p-3 space-y-2 bg-muted/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hook Type:</span>
                <span className="font-mono">HOOK_PREDICTION (4)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fee:</span>
                <span className="font-mono">0.3% (3000 bp)</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Market Tokens</Label>
            <div className="rounded-lg border p-3 space-y-2 bg-muted/50">
              <div className="text-xs">
                <span className="text-muted-foreground">Market: </span>
                <span className="font-mono">
                  {marketAddress.substring(0, 10)}...
                  {marketAddress.substring(marketAddress.length - 8)}
                </span>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">YES Token: </span>
                <span className="font-mono">
                  {yesTokenAddress.substring(0, 10)}...
                  {yesTokenAddress.substring(yesTokenAddress.length - 8)}
                </span>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">NO Token: </span>
                <span className="font-mono">
                  {noTokenAddress.substring(0, 10)}...
                  {noTokenAddress.substring(noTokenAddress.length - 8)}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreatePool}
            disabled={createPool.isPending || !account}
            className="w-full"
          >
            {createPool.isPending ? "Creating Pool..." : "Create Pool"}
          </Button>

          {!account && (
            <p className="text-xs text-center text-muted-foreground">
              Please connect your wallet to create a pool
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
