"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  User,
  Bot,
  RotateCcw,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { VerifAIAvatar } from "@/components/VerifAIAvatar";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { aptosClient } from "@/aptos/client";
import { VERIFI_PROTOCOL_ABI } from "@/aptos/abis";
import { NETWORK } from "@/aptos/constants";
import { getCreateMarketPayload, indexNewMarket } from "@/lib/api/market";
import { recordActivity } from "@/lib/services/activity-client.service";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface GeneratedMarket {
  title: string;
  description: string;
  oracleId: string;
  targetAddress: string;
  targetValue: string;
  operator: number;
  resolutionDate: string;
}

interface AIMarketChatProps {
  onMarketReady?: (market: GeneratedMarket) => void;
}

export function AIMarketChat({ onMarketReady }: AIMarketChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'll help you create a prediction market. What would you like to predict? For example:\n\n• Will USDC supply on Aptos exceed 1 billion?\n• Will a specific wallet hold more than 1000 APT?\n\nNote: I can only work with APT balance and USDC supply oracles.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMarket, setGeneratedMarket] =
    useState<GeneratedMarket | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { signAndSubmitTransaction, account } = useWallet();
  const router = useRouter();

  const loadingMessages = [
    "🔍 Scanning blockchain oracles...",
    "🧠 Analyzing market conditions...",
    "🎲 Consulting probability crystals...",
    "🔮 Predicting the unpredictable...",
    "🌊 Surfing liquidity pools...",
    "🚀 Deploying prediction satellites...",
    "🎯 Calculating FOMO coefficients...",
    "⚡ Charging verification shields...",
    "🌟 Channeling on-chain wisdom...",
    "🎪 Summoning market makers...",
    "🧙 Casting oracle spells...",
    "🎨 Painting probability curves...",
    "🔬 Testing market hypotheses...",
    "🎭 Rehearsing resolution scenarios...",
    "🌈 Finding arbitrage rainbows...",
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Loading message rotation effect
  useEffect(() => {
    if (!isGenerating) {
      setLoadingMessage("");
      return;
    }

    let currentIndex = 0;
    setLoadingMessage(loadingMessages[0]);

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[currentIndex]);
    }, 1500);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentPrompt = input.trim();
    setInput("");
    setIsGenerating(true);

    try {
      // Send conversation history for context
      const conversationHistory = messages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      }));

      const response = await fetch("/api/ai/generate-market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentPrompt,
          history: conversationHistory,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate response");
      }

      if (result.success && result.data) {
        // Market successfully generated
        setGeneratedMarket(result.data);

        // Validate and format the resolution date
        let resolutionDateStr = "Invalid Date";
        let resolutionUTC = "";
        try {
          // Ensure the date string is interpreted as UTC
          let dateStr = result.data.resolutionDate;
          if (!dateStr.endsWith("Z") && !dateStr.includes("+")) {
            dateStr += "Z"; // Force UTC interpretation
          }

          const resDate = new Date(dateStr);
          if (!isNaN(resDate.getTime())) {
            // Show in user's local timezone
            resolutionDateStr = resDate.toLocaleString(undefined, {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });

            // Also show UTC for reference
            resolutionUTC = resDate.toLocaleString("en-US", {
              timeZone: "UTC",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });
          }
        } catch (e) {
          console.error("Error parsing resolution date:", e);
        }

        // Format oracle name nicely
        const oracleName =
          result.data.oracleId === "usdc-total-supply"
            ? "USDC Total Supply"
            : "APT Balance";

        // Format target value nicely
        // Note: USDC uses 6 decimals, APT uses 8 decimals
        const formattedTarget =
          result.data.oracleId === "usdc-total-supply"
            ? `${Number(result.data.targetValue).toLocaleString()} USDC (base units)`
            : `${(Number(result.data.targetValue) / 100000000).toLocaleString()} APT`;

        const confirmationMessage: Message = {
          role: "assistant",
          content: `Perfect! I've prepared your market:\n\n**${result.data.title}**\n\n${result.data.description}\n\n**Details:**\n• Oracle: ${oracleName}\n• Target: ${formattedTarget}\n• Condition: ${result.data.operator === 0 ? "Greater than" : "Less than"}\n• Resolution: ${resolutionDateStr}\n  (${resolutionUTC} UTC)\n\nDoes this look good? Click "Create This Market" below to proceed!`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, confirmationMessage]);
      } else if (result.message) {
        // AI provided explanation (e.g., unavailable oracle)
        const explanationMessage: Message = {
          role: "assistant",
          content: result.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, explanationMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Sorry, I encountered an error. Please try again or rephrase your request.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Failed to generate response");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const { mutate: createMarket, isPending: isCreatingMarket } = useMutation({
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

            await recordActivity({
              txHash: response.hash,
              marketAddress,
              userAddress: account.address.toString(),
              action: "CREATE_MARKET",
              outcome: null,
              amount: 0,
              price: null,
              totalValue: null,
            });

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
        console.error("[AIMarketChat] Transaction error:", e);
        console.error("[AIMarketChat] Full error object:", JSON.stringify(e, null, 2));
        console.error("[AIMarketChat] Error details:", {
          message: e.message,
          stack: e.stack,
          response: e.response,
          code: e.code,
          type: typeof e,
          keys: Object.keys(e || {}),
        });

        let errorMessage = "Transaction failed";
        if (typeof e === "string") {
          errorMessage = e;
        } else if (e?.message) {
          errorMessage = e.message;
        } else if (e?.toString && typeof e.toString === "function") {
          errorMessage = e.toString();
        }

        toast.error("Transaction Failed", { description: errorMessage });
      }
    },
    onError: (e: Error) => {
      console.error("[AIMarketChat] Payload build error:", e);
      toast.error("Error building transaction", { description: e.message });
    },
  });

  const handleCreateMarket = () => {
    if (!generatedMarket) return;
    if (!account?.address) {
      toast.error("Please connect your wallet first.");
      return;
    }

    // Convert resolution date to UTC timestamp
    const localDate = new Date(generatedMarket.resolutionDate);
    const utcTimestamp = Math.floor(localDate.getTime() / 1000);

    const payload = {
      description: generatedMarket.description,
      resolutionTimestamp: utcTimestamp,
      resolverAddress: account.address.toString(),
      oracleId: generatedMarket.oracleId,
      targetAddress: generatedMarket.targetAddress || "0x1",
      targetFunction: generatedMarket.oracleId === "usdc-total-supply" ? "total_supply" : "balance",
      targetValue: Number(generatedMarket.targetValue),
      operator: generatedMarket.operator,
    };

    createMarket(payload);
  };

  const handleRegenerate = async () => {
    setGeneratedMarket(null);
    setIsGenerating(true);

    const regenerateRequestMessage: Message = {
      role: "user",
      content: "Please regenerate the market with a different variation.",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, regenerateRequestMessage]);

    try {
      // Send conversation history for context
      const conversationHistory = messages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      }));

      const response = await fetch("/api/ai/generate-market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Please regenerate the market with a different variation.",
          history: conversationHistory,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to regenerate market");
      }

      if (result.success && result.data) {
        // Market successfully generated
        setGeneratedMarket(result.data);

        // Validate and format the resolution date
        let resolutionDateStr = "Invalid Date";
        let resolutionUTC = "";
        try {
          // Ensure the date string is interpreted as UTC
          let dateStr = result.data.resolutionDate;
          if (!dateStr.endsWith("Z") && !dateStr.includes("+")) {
            dateStr += "Z"; // Force UTC interpretation
          }

          const resDate = new Date(dateStr);
          if (!isNaN(resDate.getTime())) {
            // Show in user's local timezone
            resolutionDateStr = resDate.toLocaleString(undefined, {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });

            // Also show UTC for reference
            resolutionUTC = resDate.toLocaleString("en-US", {
              timeZone: "UTC",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });
          }
        } catch (e) {
          console.error("Error parsing resolution date:", e);
        }

        // Format oracle name nicely
        const oracleName =
          result.data.oracleId === "usdc-total-supply"
            ? "USDC Total Supply"
            : "APT Balance";

        // Format target value nicely
        const formattedTarget =
          result.data.oracleId === "usdc-total-supply"
            ? `${Number(result.data.targetValue).toLocaleString()} USDC (base units)`
            : `${(Number(result.data.targetValue) / 100000000).toLocaleString()} APT`;

        const confirmationMessage: Message = {
          role: "assistant",
          content: `Here's a new variation:\n\n**${result.data.title}**\n\n${result.data.description}\n\n**Details:**\n• Oracle: ${oracleName}\n• Target: ${formattedTarget}\n• Condition: ${result.data.operator === 0 ? "Greater than" : "Less than"}\n• Resolution: ${resolutionDateStr}\n  (${resolutionUTC} UTC)\n\nDoes this look good? Click "Create This Market" below to proceed!`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, confirmationMessage]);
      } else if (result.message) {
        // AI provided explanation
        const explanationMessage: Message = {
          role: "assistant",
          content: result.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, explanationMessage]);
      }
    } catch (error) {
      console.error("Error regenerating:", error);
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Sorry, I encountered an error regenerating. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Failed to regenerate market");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReviewAndEdit = () => {
    // Clear generated market to allow user to continue chatting and refining
    setGeneratedMarket(null);
    const reviewMessage: Message = {
      role: "assistant",
      content:
        "Sure! Tell me what you'd like to adjust. For example:\n\n• Change the target value\n• Modify the resolution date\n• Update the market description\n• Change the condition (greater/less than)\n\nWhat would you like to change?",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, reviewMessage]);
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I'll help you create a prediction market. What would you like to predict? For example:\n\n• Will USDC supply on Aptos exceed 1 billion?\n• Will a specific wallet hold more than 1000 APT?\n\nNote: I can only work with APT balance and USDC supply oracles.",
        timestamp: new Date(),
      },
    ]);
    setGeneratedMarket(null);
    setInput("");
  };

  return (
    <div className="font-[family-name:var(--font-chat)] space-y-3">
      {/* Chat Messages - Increased height */}
      <div className="h-[500px] overflow-y-auto border border-border/40 rounded-lg bg-muted/20 p-3" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3 items-start",
                message.role === "user" && "flex-row-reverse",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "",
                )}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <VerifAIAvatar size="sm" animate />
                )}
              </div>
              <div
                className={cn(
                  "flex flex-col gap-1 max-w-[80%]",
                  message.role === "user" && "items-end",
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted",
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
                <span className="text-xs text-muted-foreground px-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex gap-3 items-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                <VerifAIAvatar size="sm" animate />
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg px-4 py-2.5">
                <div className="relative">
                  <VerifAIAvatar size="sm" animate />
                  <div className="absolute inset-0 animate-ping opacity-20">
                    <VerifAIAvatar size="sm" animate={false} />
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground animate-pulse">
                  {loadingMessage}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input/Actions Area */}
      <div className="space-y-2">
        {generatedMarket ? (
          <div className="space-y-2">
            <Button
              onClick={handleCreateMarket}
              className="w-full"
              size="lg"
              disabled={isCreatingMarket || !account}
            >
              {isCreatingMarket ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Market...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Create This Market
                </>
              )}
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleReviewAndEdit}
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={isCreatingMarket}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Review & Edit
              </Button>
              <Button
                onClick={handleRegenerate}
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={isCreatingMarket}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Regenerate
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Describe your prediction market idea..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isGenerating}
              className="flex-1 h-10"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              size="icon"
              className="h-10 w-10"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
