"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileText, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AIMarketChat } from "./AIMarketChat";
import { CreateMarketForm } from "./CreateMarketForm";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { VerifAIAvatar } from "./VerifAIAvatar";

type Mode = "ai" | "manual";

interface GeneratedMarket {
  title: string;
  description: string;
  oracleId: string;
  targetAddress: string;
  targetValue: string;
  operator: number;
  resolutionDate: string;
}

export function CreateMarketSelector() {
  const [mode, setMode] = useState<Mode>("ai");
  const [generatedMarket, setGeneratedMarket] =
    useState<GeneratedMarket | null>(null);

  const handleMarketReady = (market: GeneratedMarket) => {
    setGeneratedMarket(market);
    setMode("manual");
  };

  return (
    <Card className="border-primary/20 overflow-hidden">
      {/* Compact Header */}
      <div className="border-b border-border/40 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 px-4 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Left: Mode Indicator + Title */}
          <div className="flex items-center gap-3">
            {mode === "ai" ? (
              <>
                <VerifAIAvatar size="md" animate />
                <div>
                  <h1 className="text-base sm:text-lg font-bold font-[family-name:var(--font-chat)] leading-none">
                    VerifAI - Your Market Creation Assistant
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Describe your idea, I'll handle the rest
                  </p>
                </div>
              </>
            ) : (
              <>
                <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                <div>
                  <h1 className="text-base sm:text-lg font-bold leading-none">
                    Manual Market Creation
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fill out the form with market details
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Right: Switch Mode Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {mode === "ai" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode("manual")}
                className="h-8 px-3 text-xs border-border/60 hover:border-border group w-full sm:w-auto"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mr-1.5 h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity"
                >
                  <title>Manual Mode</title>
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                  <circle cx="15" cy="9" r="1.5" fill="currentColor" />
                  <path
                    d="M8 15 Q12 13, 16 15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <span className="opacity-60 group-hover:opacity-100 transition-opacity">
                  Oops, boring human manual mode
                </span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode("ai")}
                className={cn(
                  "h-8 px-3 text-xs relative overflow-hidden group border-primary/30 hover:border-primary/50 w-full sm:w-auto",
                )}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent"
                  animate={{ x: ["0%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Sparkles className="mr-1.5 h-3.5 w-3.5 relative z-10" />
                <span className="relative z-10">Let VerifAI help</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {mode === "ai" ? (
            <motion.div
              key="ai"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d" }}
              className="p-4"
            >
              <AIMarketChat onMarketReady={handleMarketReady} />
            </motion.div>
          ) : (
            <motion.div
              key="manual"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d" }}
              className="p-4"
            >
              <CreateMarketForm initialData={generatedMarket} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
