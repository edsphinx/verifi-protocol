/**
 * @file Top Traders Table
 * @description Leaderboard showing top-performing traders
 */

"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { Card, Badge } from "@tremor/react";
import { ArrowUpDown, ArrowUp, ArrowDown, Trophy, Medal, Award } from "lucide-react";
import { useTopTraders } from "@/lib/hooks";
import { VeriFiLoader } from "@/components/ui/verifi-loader";
import { TableSkeleton } from "./skeletons/TableSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useState as useReactState, useEffect } from "react";
import type { TraderMetrics } from "@/lib/types/database.types";

const columnHelper = createColumnHelper<TraderMetrics>();

export function TopTradersTable() {
  const { topTraders, isLoading } = useTopTraders(5);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "totalVolume", desc: true },
  ]);
  const [showLoader, setShowLoader] = useReactState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowLoader(true), 400);
      return () => clearTimeout(timer);
    } else {
      setShowLoader(false);
    }
  }, [isLoading]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "rank",
        header: "Rank",
        cell: (info) => {
          const rank = info.row.index + 1;
          let icon = null;
          let color = "text-muted-foreground";

          if (rank === 1) {
            icon = <Trophy className="h-4 w-4 text-yellow-500" />;
            color = "text-yellow-600 dark:text-yellow-500 font-bold";
          } else if (rank === 2) {
            icon = <Medal className="h-4 w-4 text-gray-400" />;
            color = "text-gray-600 dark:text-gray-400 font-semibold";
          } else if (rank === 3) {
            icon = <Award className="h-4 w-4 text-orange-600" />;
            color = "text-orange-600 dark:text-orange-500 font-semibold";
          }

          return (
            <div className="flex items-center gap-2">
              {icon}
              <span className={color}>#{rank}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor("address", {
        header: "Trader",
        cell: (info) => {
          const address = info.getValue();
          const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
          return (
            <span className="font-mono text-sm font-medium" title={address}>
              {short}
            </span>
          );
        },
      }),
      columnHelper.accessor("totalVolume", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Total Volume
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3" />
            )}
          </button>
        ),
        cell: (info) => (
          <span className="text-right block font-semibold">
            {info.getValue().toFixed(2)} APT
          </span>
        ),
      }),
      columnHelper.accessor("totalTrades", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Trades
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3" />
            )}
          </button>
        ),
        cell: (info) => (
          <span className="text-right block">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("winRate", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Win Rate
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3" />
            )}
          </button>
        ),
        cell: (info) => {
          const winRate = info.getValue();
          const color =
            winRate >= 70
              ? "emerald"
              : winRate >= 50
                ? "blue"
                : winRate >= 30
                  ? "amber"
                  : "red";
          return (
            <Badge color={color} size="sm">
              {(winRate * 100).toFixed(1)}%
            </Badge>
          );
        },
      }),
      columnHelper.accessor("profitLoss", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
          >
            P&L
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3" />
            )}
          </button>
        ),
        cell: (info) => {
          const pnl = info.getValue(); // Already in APT
          const isProfit = pnl >= 0;
          return (
            <span
              className={`text-right block font-semibold ${
                isProfit
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isProfit ? "+" : ""}
              {pnl.toFixed(2)} APT
            </span>
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: topTraders,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="loading"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {showLoader ? (
            <Card className="min-h-[400px] flex items-center justify-center">
              <VeriFiLoader message="Loading top traders..." />
            </Card>
          ) : (
            <TableSkeleton rows={5} />
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  if (topTraders.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold mb-4">Top Traders</h3>
        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
          No trading activity yet
        </p>
      </Card>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="content"
        initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.34, 1.56, 0.64, 1],
        }}
      >
        <Card>
          <h3 className="text-lg font-semibold mb-4">Top Traders by Volume</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-slate-200 dark:border-slate-700"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-slate-700 dark:text-slate-300 font-medium"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
