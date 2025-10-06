"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PoweredByBadgeProps {
  provider: "tapp" | "nodit";
  variant?: "default" | "minimal" | "full";
  className?: string;
  showLink?: boolean;
}

const PROVIDER_CONFIG = {
  tapp: {
    name: "Tapp Exchange",
    url: "https://tapp.exchange",
    description: "Modular AMM Protocol on Aptos",
    color: "text-blue-500",
  },
  nodit: {
    name: "Nodit",
    url: "https://nodit.io",
    description: "Real-time Blockchain Indexing",
    color: "text-purple-500",
  },
} as const;

export function PoweredByBadge({
  provider,
  variant = "default",
  className,
  showLink = true,
}: PoweredByBadgeProps) {
  const config = PROVIDER_CONFIG[provider];

  if (variant === "minimal") {
    return (
      <a
        href={config.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("inline-flex items-center", className)}
      >
        <Badge
          variant="outline"
          className="text-xs gap-1.5 hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <span className="text-muted-foreground">via</span>
          <span className={cn("font-semibold", config.color)}>
            {config.name}
          </span>
        </Badge>
      </a>
    );
  }

  if (variant === "full") {
    return (
      <a
        href={config.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("block", className)}
      >
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Powered by</span>
              <span className={cn("font-semibold text-sm", config.color)}>
                {config.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {config.description}
            </p>
          </div>
          {showLink && (
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </a>
    );
  }

  // Default variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs text-muted-foreground">Powered by</span>
      <a
        href={config.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "text-xs font-semibold hover:underline inline-flex items-center gap-1",
          config.color,
        )}
      >
        {config.name}
        {showLink && <ExternalLink className="h-3 w-3" />}
      </a>
    </div>
  );
}
