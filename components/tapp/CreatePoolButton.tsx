"use client";

/**
 * CreatePoolButton Component
 * Button to create a new Tapp AMM pool for a market
 */

import React, { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { buildCreatePoolTransaction } from "@/aptos/transactions/tapp/create-pool-transaction";
import { PlusCircle } from "lucide-react";

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
  const { account, signAndSubmitTransaction } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [fee, setFee] = useState("3000"); // 0.3% default
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePool = async () => {
    if (!account) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsCreating(true);
    try {
      const transaction = buildCreatePoolTransaction({
        yesTokenAddress,
        noTokenAddress,
        fee: Number.parseInt(fee),
      });

      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: transaction,
      });

      toast.success("Pool creation submitted!", {
        description: `Transaction hash: ${response.hash.substring(0, 8)}...`,
      });

      // Close dialog and notify parent
      setIsOpen(false);
      if (onPoolCreated && response.hash) {
        // In a real implementation, we'd extract pool address from events
        onPoolCreated(response.hash);
      }
    } catch (error) {
      console.error("Failed to create pool:", error);
      toast.error("Failed to create pool", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsCreating(false);
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
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="fee">Fee (basis points)</Label>
            <Input
              id="fee"
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="3000"
            />
            <p className="text-xs text-muted-foreground">
              3000 = 0.3%, 10000 = 1%
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Market: {marketAddress.substring(0, 8)}...
            </p>
            <p className="text-sm text-muted-foreground">
              YES Token: {yesTokenAddress.substring(0, 8)}...
            </p>
            <p className="text-sm text-muted-foreground">
              NO Token: {noTokenAddress.substring(0, 8)}...
            </p>
          </div>

          <Button
            onClick={handleCreatePool}
            disabled={isCreating || !account}
            className="w-full"
          >
            {isCreating ? "Creating Pool..." : "Create Pool"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
