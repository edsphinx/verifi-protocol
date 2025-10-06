/**
 * @file Portfolio Service
 * @description Business logic for user portfolio and positions
 */

import type { PortfolioData } from "@/lib/types/database.types";

export class PortfolioService {
  /**
   * Fetch user portfolio
   */
  static async getUserPortfolio(address: string): Promise<PortfolioData> {
    const response = await fetch(`/api/portfolio/${address}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user portfolio");
    }

    return response.json();
  }

  /**
   * Calculate total portfolio value
   */
  static calculateTotalValue(portfolio: PortfolioData): number {
    return portfolio.totalValue;
  }

  /**
   * Calculate unrealized P&L percentage
   */
  static calculatePnLPercentage(
    currentValue: number,
    invested: number,
  ): number {
    if (invested === 0) return 0;
    return ((currentValue - invested) / invested) * 100;
  }

  /**
   * Calculate ROI (Return on Investment)
   */
  static calculateROI(portfolio: PortfolioData): number {
    const totalReturns = portfolio.unrealizedPnL + (portfolio.realizedPnL || 0);
    if (portfolio.totalInvested === 0) return 0;
    return (totalReturns / portfolio.totalInvested) * 100;
  }

  /**
   * Get best performing position
   */
  static getBestPerformingPosition(portfolio: PortfolioData) {
    if (portfolio.openPositions.length === 0) return null;

    return portfolio.openPositions.reduce((best, current) => {
      return current.unrealizedPnLPct > best.unrealizedPnLPct ? current : best;
    });
  }

  /**
   * Get worst performing position
   */
  static getWorstPerformingPosition(portfolio: PortfolioData) {
    if (portfolio.openPositions.length === 0) return null;

    return portfolio.openPositions.reduce((worst, current) => {
      return current.unrealizedPnLPct < worst.unrealizedPnLPct
        ? current
        : worst;
    });
  }

  /**
   * Calculate position risk level
   */
  static calculatePositionRisk(
    invested: number,
    totalPortfolioValue: number,
  ): "LOW" | "MEDIUM" | "HIGH" {
    const percentage = (invested / totalPortfolioValue) * 100;

    if (percentage > 40) return "HIGH";
    if (percentage > 20) return "MEDIUM";
    return "LOW";
  }

  /**
   * Format P&L for display
   */
  static formatPnL(pnl: number): {
    value: string;
    color: "green" | "red" | "gray";
    sign: "+" | "-" | "";
  } {
    if (pnl > 0) {
      return {
        value: pnl.toFixed(2),
        color: "green",
        sign: "+",
      };
    }
    if (pnl < 0) {
      return {
        value: Math.abs(pnl).toFixed(2),
        color: "red",
        sign: "-",
      };
    }
    return {
      value: "0.00",
      color: "gray",
      sign: "",
    };
  }

  /**
   * Check if portfolio is diversified
   */
  static isDiversified(portfolio: PortfolioData): boolean {
    // Portfolio is diversified if no single position is > 30% of total
    if (portfolio.openPositions.length < 3) return false;

    const maxPositionPct = Math.max(
      ...portfolio.openPositions.map(
        (p) => (p.totalInvested / portfolio.totalInvested) * 100,
      ),
    );

    return maxPositionPct < 30;
  }
}
