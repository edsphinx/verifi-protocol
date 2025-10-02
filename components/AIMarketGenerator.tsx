"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface GeneratedMarket {
  title: string;
  description: string;
  oracleId: string;
  targetAddress: string;
  targetValue: string;
  operator: number;
  resolutionDate: string;
}

interface AIMarketGeneratorProps {
  onMarketGenerated: (market: GeneratedMarket) => void;
}

export function AIMarketGenerator({ onMarketGenerated }: AIMarketGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMarket, setGeneratedMarket] = useState<GeneratedMarket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe the market you want to create");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedMarket(null);

    try {
      const response = await fetch("/api/ai/generate-market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate market");
      }

      if (result.success && result.data) {
        setGeneratedMarket(result.data);
        toast.success("Market generated successfully!");
      } else if (result.message) {
        // AI couldn't generate valid market (e.g., unavailable oracle)
        setErrorMessage(result.message);
        toast.info("AI provided suggestions");
      }
    } catch (error) {
      console.error("Error generating market:", error);
      toast.error("Failed to generate market. Please try again.");
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseMarket = () => {
    if (generatedMarket) {
      onMarketGenerated(generatedMarket);
      toast.success("Market details populated!");
      // Clear state
      setPrompt("");
      setGeneratedMarket(null);
    }
  };

  const handleRegenerate = () => {
    setGeneratedMarket(null);
    setErrorMessage(null);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Market Generator
        </CardTitle>
        <CardDescription>
          Describe your prediction market in natural language, and AI will generate the details for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Textarea
            placeholder="Example: Will the USDC supply on Aptos exceed 1 billion by the end of 2025?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            disabled={isGenerating}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Available oracles: APT wallet balance, USDC total supply
          </p>
        </div>

        {errorMessage && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {generatedMarket && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-primary/20">
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-sm">Generated Market Preview</h4>
              <Check className="h-4 w-4 text-green-500" />
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Title:</span>
                <p className="text-muted-foreground mt-1">{generatedMarket.title}</p>
              </div>

              <div>
                <span className="font-medium">Description:</span>
                <p className="text-muted-foreground mt-1">{generatedMarket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div>
                  <span className="font-medium">Oracle:</span>
                  <p className="text-muted-foreground">{generatedMarket.oracleId}</p>
                </div>
                <div>
                  <span className="font-medium">Operator:</span>
                  <p className="text-muted-foreground">
                    {generatedMarket.operator === 0 ? "Greater Than" : "Less Than"}
                  </p>
                </div>
                {generatedMarket.targetAddress && (
                  <div className="col-span-2">
                    <span className="font-medium">Target Address:</span>
                    <p className="text-muted-foreground truncate">{generatedMarket.targetAddress}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium">Target Value:</span>
                  <p className="text-muted-foreground">{generatedMarket.targetValue}</p>
                </div>
                <div>
                  <span className="font-medium">Resolution:</span>
                  <p className="text-muted-foreground">
                    {new Date(generatedMarket.resolutionDate).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleUseMarket} size="sm" className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Use This Market
              </Button>
              <Button onClick={handleRegenerate} variant="outline" size="sm">
                Regenerate
              </Button>
            </div>
          </div>
        )}

        {!generatedMarket && (
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Market
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
