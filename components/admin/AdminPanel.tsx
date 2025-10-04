"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LogEntry {
  timestamp: string;
  type: "info" | "success" | "error" | "warning";
  message: string;
}

export function AdminPanel() {
  const [isResolving, setIsResolving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (type: LogEntry["type"], message: string) => {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [...prev, { timestamp, type, message }]);
  };

  const handleResolveExpired = async () => {
    setIsResolving(true);
    setResult(null);
    setError(null);
    setLogs([]); // Clear previous logs

    addLog("info", "🚀 Starting market resolution process...");

    try {
      addLog("info", "📡 Calling /api/admin/resolve-expired endpoint...");

      const response = await fetch("/api/admin/resolve-expired", {
        method: "POST",
      });

      addLog("info", `📥 Received response with status: ${response.status}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resolve markets");
      }

      const { results } = data;

      addLog("success", `✅ Found ${results.total} total markets`);
      addLog("info", `⏰ Detected ${results.expired} expired markets`);

      if (results.resolved > 0) {
        addLog(
          "success",
          `✨ Successfully resolved ${results.resolved} markets`,
        );
      }

      if (results.failed > 0) {
        addLog("error", `❌ Failed to resolve ${results.failed} markets`);
      }

      if (results.txHashes && results.txHashes.length > 0) {
        addLog(
          "info",
          `📝 Generated ${results.txHashes.length} transaction(s)`,
        );
        results.txHashes.forEach((hash: string, idx: number) => {
          addLog("info", `  TX ${idx + 1}: ${hash.substring(0, 20)}...`);
        });
      }

      if (results.errors && results.errors.length > 0) {
        results.errors.forEach((err: string) => {
          addLog("error", `⚠️  ${err}`);
        });
      }

      addLog("success", "✅ Resolution process completed!");
      setResult(results);
    } catch (err: any) {
      addLog("error", `❌ Fatal error: ${err.message}`);
      setError(err.message);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Card className="border-amber-500/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <CardTitle>Admin Panel</CardTitle>
        </div>
        <CardDescription>
          Administrative tools for market management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resolve Expired Markets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Resolve Expired Markets</h3>
              <p className="text-xs text-muted-foreground">
                Automatically resolve all markets that have passed their
                expiration time
              </p>
            </div>
            <Button
              onClick={handleResolveExpired}
              disabled={isResolving}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isResolving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Resolve Now
                </>
              )}
            </Button>
          </div>

          {/* Terminal Logs */}
          {logs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Terminal className="h-4 w-4" />
                <span>Execution Log</span>
              </div>
              <div
                ref={terminalRef}
                className="bg-black/90 border border-gray-700 rounded-lg p-4 font-mono text-xs h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
              >
                {logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`mb-1 ${
                      log.type === "success"
                        ? "text-green-400"
                        : log.type === "error"
                          ? "text-red-400"
                          : log.type === "warning"
                            ? "text-yellow-400"
                            : "text-gray-300"
                    }`}
                  >
                    <span className="text-gray-500">[{log.timestamp}]</span>{" "}
                    {log.message}
                  </div>
                ))}
                {isResolving && (
                  <div className="text-amber-400 animate-pulse">
                    <span className="text-gray-500">
                      [
                      {new Date().toLocaleTimeString("en-US", {
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                      ]
                    </span>{" "}
                    ⏳ Processing...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Result */}
          {result && (
            <div className="space-y-3">
              <Alert className="border-green-500/20 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-400">
                  Successfully resolved {result.resolved} expired markets
                </AlertDescription>
              </Alert>

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">
                    Total Markets
                  </div>
                  <div className="text-2xl font-bold">{result.total}</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="text-xs text-amber-400 mb-1">Expired</div>
                  <div className="text-2xl font-bold text-amber-400">
                    {result.expired}
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="text-xs text-green-400 mb-1">Resolved</div>
                  <div className="text-2xl font-bold text-green-400">
                    {result.resolved}
                  </div>
                </div>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <div className="text-xs text-destructive mb-1">Failed</div>
                  <div className="text-2xl font-bold text-destructive">
                    {result.failed}
                  </div>
                </div>
              </div>

              {/* Transaction Hashes */}
              {result.txHashes && result.txHashes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Transaction Hashes:</h4>
                  <div className="space-y-1">
                    {result.txHashes.map((hash: string, idx: number) => (
                      <div
                        key={idx}
                        className="text-xs font-mono bg-muted/50 p-2 rounded flex items-center justify-between"
                      >
                        <span className="truncate flex-1">{hash}</span>
                        <a
                          href={`https://explorer.aptoslabs.com/txn/${hash}?network=testnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-primary hover:underline"
                        >
                          View →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {result.errors && result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-semibold">Errors encountered:</div>
                      {result.errors.map((err: string, idx: number) => (
                        <div key={idx} className="text-xs">
                          • {err}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
