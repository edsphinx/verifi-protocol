"use client";

import {
  type InputTransactionData,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aptosClient } from "@/lib/aptos/client";
import { getMessageContent } from "@/lib/aptos/queries/get-message-content";
import { MESSAGE_BOARD_ABI } from "@/utils/abis";

export function MessageBoard() {
  const { connected, signAndSubmitTransaction } = useWallet();

  const queryClient = useQueryClient();

  const [messageContent, setMessageContent] = useState<string>();
  const [newMessageContent, setNewMessageContent] = useState<string>();

  const { data } = useQuery({
    queryKey: ["message-content"],
    refetchInterval: 10_000,
    queryFn: async () => {
      try {
        const content = await getMessageContent();

        return {
          content,
        };
      } catch (error: any) {
        console.error(`Failed to fetch message content: ${error.message}`);
        return {
          content: "",
        };
      }
    },
  });

  const onClickButton = async () => {
    if (!newMessageContent || !connected) {
      return;
    }

    try {
      const payload: InputTransactionData = {
        data: {
          function: `${MESSAGE_BOARD_ABI.address}::message_board::post_message`,
          typeArguments: [],
          functionArguments: [newMessageContent],
        },
      };

      const committedTransaction = await signAndSubmitTransaction(payload);

      const executedTransaction = await aptosClient().waitForTransaction({
        transactionHash: committedTransaction.hash,
      });

      queryClient.invalidateQueries({
        queryKey: ["message-content"],
      });
      toast.success("Success", {
        description: `Transaction succeeded, hash: ${executedTransaction.hash}`,
      });
    } catch (error: any) {
      console.error(`Failed to fetch message content: ${error.message}`);
    }
  };

  useEffect(() => {
    if (data) {
      if (!data.content) {
        return;
      }
      setMessageContent(data.content);
    }
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      <h4 className="text-lg font-medium">Message content: {messageContent}</h4>
      New message{" "}
      <Input
        disabled={!connected}
        placeholder="yoho"
        onChange={(e) => setNewMessageContent(e.target.value)}
      />
      <Button
        disabled={
          !connected ||
          !newMessageContent ||
          newMessageContent.length === 0 ||
          newMessageContent.length > 100
        }
        onClick={onClickButton}
      >
        Write
      </Button>
    </div>
  );
}
