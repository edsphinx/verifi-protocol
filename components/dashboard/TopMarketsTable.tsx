/**
 * @file Top Markets Table
 * @description Advanced table with sorting using TanStack Table
 */

"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { Card, Badge } from "@tremor/react";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { useTopMarkets } from "@/lib/hooks";
import { VeriFiLoader } from "@/components/ui/verifi-loader";
import { TableSkeleton } from "@/components/analytics/skeletons/TableSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import type { MarketMetrics } from "@/lib/types/database.types";
import { useState, useEffect } from "react";

const columnHelper = createColumnHelper<MarketMetrics>();

export function TopMarketsTable() {
  const { topMarkets, isLoading } = useTopMarkets(5);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "totalVolume", desc: true },
  ]);
  const [showLoader, setShowLoader] = useState(false);

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
      columnHelper.accessor("description", {
        header: "Market",
        cell: (info) => (
          <div className="max-w-md truncate font-medium" title={info.getValue()}>{info.getValue()}</div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const status = info.getValue();
          const variant =
            status === "OPEN"
              ? "emerald"
              : status === "CLOSED"
                ? "amber"
                : status === "RESOLVED_YES"
                  ? "blue"
                  : "red";
          return (
            <Badge color={variant} size="sm">
              {status.replace("_", " ")}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("volume24h", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
          >
            24h Volume
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
          <span className="text-right block">
            {info.getValue().toFixed(2)} APT
          </span>
        ),
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
          <span className="text-right block">
            {info.getValue().toFixed(2)} APT
          </span>
        ),
      }),
      columnHelper.accessor("yesPrice", {
        header: "YES Price",
        cell: (info) => (
          <span className="text-right block">
            {(info.getValue() * 100).toFixed(1)}%
          </span>
        ),
      }),
      columnHelper.accessor("uniqueTraders", {
        header: "Traders",
        cell: (info) => (
          <span className="text-right block">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("marketAddress", {
        header: "",
        cell: (info) => (
          <Link
            href={`/market/${info.getValue()}`}
            className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
          >
            View
            <ExternalLink className="h-3 w-3" />
          </Link>
        ),
        enableSorting: false,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: topMarkets,
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
              <VeriFiLoader message="Loading top markets..." />
            </Card>
          ) : (
            <TableSkeleton rows={5} />
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  if (topMarkets.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold mb-4">Top Markets by Volume</h3>
        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
          No markets available yet
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
          <h3 className="text-lg font-semibold mb-4">Top Markets by Volume</h3>
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
