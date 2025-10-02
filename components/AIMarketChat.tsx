"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Send, Loader2, CheckCircle2, User, Bot, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  onMarketReady: (market: GeneratedMarket) => void;
}

export function AIMarketChat({ onMarketReady }: AIMarketChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'll help you create a prediction market. What would you like to predict? For example:\n\n• Will USDC supply on Aptos exceed 1 billion?\n• Will a specific wallet hold more than 1000 APT?\n\nNote: I can only work with APT balance and USDC supply oracles.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMarket, setGeneratedMarket] = useState<GeneratedMarket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
          if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
            dateStr += 'Z'; // Force UTC interpretation
          }

          const resDate = new Date(dateStr);
          if (!isNaN(resDate.getTime())) {
            // Show in user's local timezone
            resolutionDateStr = resDate.toLocaleString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });

            // Also show UTC for reference
            resolutionUTC = resDate.toLocaleString('en-US', {
              timeZone: 'UTC',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });
          }
        } catch (e) {
          console.error("Error parsing resolution date:", e);
        }

        // Format oracle name nicely
        const oracleName = result.data.oracleId === "usdc-total-supply"
          ? "USDC Total Supply"
          : "APT Balance";

        // Format target value nicely
        // Note: USDC uses 6 decimals, APT uses 8 decimals
        const formattedTarget = result.data.oracleId === "usdc-total-supply"
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
        content: "Sorry, I encountered an error. Please try again or rephrase your request.",
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

  const handleCreateMarket = () => {
    if (generatedMarket) {
      onMarketReady(generatedMarket);
      // Reset for next market
      setGeneratedMarket(null);
      setInput("");
    }
  };

  const handleRegenerate = () => {
    setGeneratedMarket(null);
    const regenerateMessage: Message = {
      role: "assistant",
      content: "No problem! Please describe what you'd like to change or create a different market.",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, regenerateMessage]);
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hi! I'll help you create a prediction market. What would you like to predict? For example:\n\n• Will USDC supply on Aptos exceed 1 billion?\n• Will a specific wallet hold more than 1000 APT?\n\nNote: I can only work with APT balance and USDC supply oracles.",
        timestamp: new Date(),
      },
    ]);
    setGeneratedMarket(null);
    setInput("");
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Market Assistant
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <Separator />

      <div className="h-[400px] overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3 items-start",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={cn(
                  "flex flex-col gap-1 max-w-[80%]",
                  message.role === "user" && "items-end"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
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
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <CardContent className="p-4 space-y-3 bg-background">
        {generatedMarket ? (
          <div className="flex gap-2">
            <Button
              onClick={handleCreateMarket}
              className="flex-1"
              size="lg"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Create This Market
            </Button>
            <Button
              onClick={handleRegenerate}
              variant="outline"
              size="lg"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Describe your prediction market..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isGenerating}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              size="icon"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
