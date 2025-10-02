"use client";

/**
 * Admin Checklist Component
 * Tracks configuration tasks completed by admin
 * Uses localStorage to persist checked items
 */

import React, { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw } from "lucide-react";
import { MODULE_ADDRESS } from "@/aptos/constants";

interface ChecklistItem {
  id: string;
  category: "deployment" | "nodit" | "database" | "frontend";
  task: string;
  description: string;
  docsLink?: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Deployment
  {
    id: "deploy-verifi",
    category: "deployment",
    task: "Deploy VeriFi Protocol modules",
    description: "Run pnpm move:publish to deploy all core modules",
  },
  {
    id: "deploy-tapp",
    category: "deployment",
    task: "Deploy Tapp AMM modules",
    description: "Deploy router and prediction hook modules",
  },
  {
    id: "register-oracles",
    category: "deployment",
    task: "Register & activate oracles",
    description: "Register at least one oracle (aptos-balance, usdc-total-supply)",
  },

  // Nodit Configuration
  {
    id: "nodit-account",
    category: "nodit",
    task: "Create Nodit account",
    description: "Sign up at nodit.io and create project",
    docsLink: "https://nodit.io",
  },
  {
    id: "nodit-webhook-market",
    category: "nodit",
    task: "Configure MarketCreatedEvent webhook",
    description: "Set up webhook for MarketCreatedEvent → /api/webhooks/nodit",
    docsLink: "/docs/NODIT_SETUP_GUIDE.md",
  },
  {
    id: "nodit-webhook-pool",
    category: "nodit",
    task: "Configure PoolCreated webhook",
    description: "Set up webhook for Tapp PoolCreated event",
    docsLink: "/docs/NODIT_SETUP_GUIDE.md",
  },
  {
    id: "nodit-webhook-trade",
    category: "nodit",
    task: "Configure trade event webhooks",
    description: "Set up webhooks for buy/sell/swap events for activity feed",
  },

  // Database
  {
    id: "db-migrations",
    category: "database",
    task: "Run database migrations",
    description: "Execute: npx prisma migrate dev --name add_tapp_and_notifications",
  },
  {
    id: "db-seed",
    category: "database",
    task: "Seed initial data (optional)",
    description: "Run pnpm db:seed if needed for test data",
  },

  // Frontend
  {
    id: "env-config",
    category: "frontend",
    task: "Configure environment variables",
    description: "Set all required env vars in .env.local",
  },
  {
    id: "test-notifications",
    category: "frontend",
    task: "Test notification system",
    description: "Create a market and verify global notification appears",
  },
  {
    id: "test-pool-creation",
    category: "frontend",
    task: "Test AMM pool creation",
    description: "Create a pool for a market and verify it appears in UI",
  },
];

export function AdminChecklist() {
  const { account } = useWallet();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const isPublisher = account?.address === MODULE_ADDRESS;

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin-checklist");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCheckedItems(new Set(parsed));
      } catch (e) {
        console.error("Failed to load checklist:", e);
      }
    }
  }, []);

  // Save to localStorage
  const toggleItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
    localStorage.setItem("admin-checklist", JSON.stringify([...newChecked]));
  };

  const resetChecklist = () => {
    setCheckedItems(new Set());
    localStorage.removeItem("admin-checklist");
  };

  const getCategoryProgress = (category: ChecklistItem["category"]) => {
    const items = CHECKLIST_ITEMS.filter((item) => item.category === category);
    const completed = items.filter((item) => checkedItems.has(item.id)).length;
    return { completed, total: items.length };
  };

  const categories: Array<{ name: string; key: ChecklistItem["category"]; color: string }> = [
    { name: "Deployment", key: "deployment", color: "bg-blue-500" },
    { name: "Nodit Setup", key: "nodit", color: "bg-purple-500" },
    { name: "Database", key: "database", color: "bg-green-500" },
    { name: "Frontend", key: "frontend", color: "bg-orange-500" },
  ];

  const totalProgress = {
    completed: checkedItems.size,
    total: CHECKLIST_ITEMS.length,
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Overall Progress:</span>
            <Badge variant={totalProgress.completed === totalProgress.total ? "default" : "secondary"}>
              {totalProgress.completed}/{totalProgress.total}
            </Badge>
          </div>
          {!isPublisher && (
            <p className="text-xs text-muted-foreground">
              (Connect publisher account to see admin context)
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={resetChecklist} className="gap-2">
          <RefreshCw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const progress = getCategoryProgress(cat.key);
          return (
            <div key={cat.key} className="p-3 border rounded-lg">
              <div className={`h-1 ${cat.color} rounded-full mb-2 opacity-20`} />
              <p className="text-sm font-medium">{cat.name}</p>
              <p className="text-xs text-muted-foreground">
                {progress.completed}/{progress.total}
              </p>
            </div>
          );
        })}
      </div>

      {/* Checklist Items by Category */}
      {categories.map((cat) => {
        const items = CHECKLIST_ITEMS.filter((item) => item.category === cat.key);
        return (
          <div key={cat.key} className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <div className={`h-2 w-2 ${cat.color} rounded-full`} />
              {cat.name}
            </h3>
            <div className="space-y-2 pl-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={item.id}
                    checked={checkedItems.has(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={item.id}
                      className={`text-sm font-medium cursor-pointer ${
                        checkedItems.has(item.id) ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {item.task}
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  </div>
                  {item.docsLink && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        if (item.docsLink?.startsWith("http")) {
                          window.open(item.docsLink, "_blank");
                        } else {
                          window.open(item.docsLink, "_blank");
                        }
                      }}
                    >
                      Docs
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
