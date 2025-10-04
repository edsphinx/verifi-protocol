/**
 * Market Psychology Service
 *
 * Calculates market dynamics and prepares psychologically optimized
 * presentation of YES/NO outcomes based on dominance, momentum, and user position.
 */

export interface MarketPsychologyData {
  // Dominance metrics
  dominantOutcome: "YES" | "NO" | "BALANCED";
  dominancePercentage: number; // 0-100
  yesPercentage: number;
  noPercentage: number;

  // Visual hierarchy
  primaryOutcome: {
    name: "YES" | "NO";
    color: string;
    percentage: number;
    supply: number;
    userBalance: number;
    scale: number; // 1.0 - 1.5 for size scaling
    weight: "normal" | "medium" | "semibold" | "bold" | "extrabold";
    glow: "none" | "sm" | "md" | "lg";
  };

  secondaryOutcome: {
    name: "YES" | "NO";
    color: string;
    percentage: number;
    supply: number;
    userBalance: number;
    scale: number; // 0.85 - 1.0 for size scaling
    weight: "normal" | "medium" | "semibold" | "bold" | "extrabold";
    glow: "none" | "sm" | "md" | "lg";
  };

  // Market sentiment
  sentiment: "STRONG_YES" | "LEANING_YES" | "BALANCED" | "LEANING_NO" | "STRONG_NO";
  sentimentIntensity: number; // 0-100

  // User positioning
  userIsAligned: boolean; // User holds shares of dominant outcome
  userAdvantage: "HIGH" | "MODERATE" | "LOW" | "NONE";

  // Momentum (if historical data available)
  momentum?: "ACCELERATING" | "STABLE" | "REVERSING";
}

export interface MarketDynamicData {
  totalSupplyYes: number; // in smallest unit (10^6)
  totalSupplyNo: number; // in smallest unit (10^6)
  userYesBalance: number; // in smallest unit (10^6)
  userNoBalance: number; // in smallest unit (10^6)
  userAptBalance: number; // in smallest unit (10^8)
}

/**
 * Calculate market psychology and presentation strategy
 */
export function calculateMarketPsychology(
  dynamicData: MarketDynamicData
): MarketPsychologyData {
  const totalSupply = dynamicData.totalSupplyYes + dynamicData.totalSupplyNo;

  // Avoid division by zero
  if (totalSupply === 0) {
    return getBalancedMarket(dynamicData);
  }

  const yesPercentage = (dynamicData.totalSupplyYes / totalSupply) * 100;
  const noPercentage = (dynamicData.totalSupplyNo / totalSupply) * 100;

  // Calculate dominance (how far from 50/50)
  const dominancePercentage = Math.abs(yesPercentage - 50);

  // Determine dominant outcome
  let dominantOutcome: "YES" | "NO" | "BALANCED";
  if (dominancePercentage < 5) {
    dominantOutcome = "BALANCED";
  } else if (yesPercentage > noPercentage) {
    dominantOutcome = "YES";
  } else {
    dominantOutcome = "NO";
  }

  // Calculate sentiment
  const sentiment = calculateSentiment(yesPercentage);
  const sentimentIntensity = dominancePercentage * 2; // 0-100 scale

  // Determine visual hierarchy (winner gets primary position)
  const yesDominates = yesPercentage >= noPercentage;

  const primaryOutcome = {
    name: (yesDominates ? "YES" : "NO") as "YES" | "NO",
    color: yesDominates ? "green" : "red",
    percentage: yesDominates ? yesPercentage : noPercentage,
    supply: yesDominates ? dynamicData.totalSupplyYes : dynamicData.totalSupplyNo,
    userBalance: yesDominates ? dynamicData.userYesBalance : dynamicData.userNoBalance,
    scale: calculateScale(dominancePercentage, true),
    weight: calculateWeight(dominancePercentage, true),
    glow: calculateGlow(dominancePercentage, true),
  };

  const secondaryOutcome = {
    name: (yesDominates ? "NO" : "YES") as "YES" | "NO",
    color: yesDominates ? "red" : "green",
    percentage: yesDominates ? noPercentage : yesPercentage,
    supply: yesDominates ? dynamicData.totalSupplyNo : dynamicData.totalSupplyYes,
    userBalance: yesDominates ? dynamicData.userNoBalance : dynamicData.userYesBalance,
    scale: calculateScale(dominancePercentage, false),
    weight: calculateWeight(dominancePercentage, false),
    glow: calculateGlow(dominancePercentage, false),
  };

  // Calculate user positioning
  const userYesValue = dynamicData.userYesBalance;
  const userNoValue = dynamicData.userNoBalance;
  const userIsAligned =
    (dominantOutcome === "YES" && userYesValue > userNoValue) ||
    (dominantOutcome === "NO" && userNoValue > userYesValue) ||
    dominantOutcome === "BALANCED";

  const userAdvantage = calculateUserAdvantage(
    dominantOutcome,
    userYesValue,
    userNoValue,
    dominancePercentage
  );

  return {
    dominantOutcome,
    dominancePercentage,
    yesPercentage,
    noPercentage,
    primaryOutcome,
    secondaryOutcome,
    sentiment,
    sentimentIntensity,
    userIsAligned,
    userAdvantage,
  };
}

/**
 * Calculate sentiment based on YES percentage
 */
function calculateSentiment(yesPercentage: number): MarketPsychologyData["sentiment"] {
  if (yesPercentage >= 70) return "STRONG_YES";
  if (yesPercentage >= 55) return "LEANING_YES";
  if (yesPercentage >= 45 && yesPercentage <= 55) return "BALANCED";
  if (yesPercentage >= 30) return "LEANING_NO";
  return "STRONG_NO";
}

/**
 * Calculate visual scale based on dominance
 * Primary outcome gets larger, secondary gets slightly smaller
 */
function calculateScale(dominancePercentage: number, isPrimary: boolean): number {
  if (isPrimary) {
    // Primary scales from 1.0 (balanced) to 1.5 (extreme dominance)
    return 1.0 + (dominancePercentage / 100) * 0.5;
  } else {
    // Secondary scales from 1.0 (balanced) to 0.85 (extreme dominance)
    return 1.0 - (dominancePercentage / 100) * 0.15;
  }
}

/**
 * Calculate font weight based on dominance
 */
function calculateWeight(
  dominancePercentage: number,
  isPrimary: boolean
): "normal" | "medium" | "semibold" | "bold" | "extrabold" {
  if (isPrimary) {
    if (dominancePercentage >= 30) return "extrabold";
    if (dominancePercentage >= 15) return "bold";
    return "semibold";
  } else {
    if (dominancePercentage >= 30) return "normal";
    if (dominancePercentage >= 15) return "medium";
    return "semibold";
  }
}

/**
 * Calculate glow intensity based on dominance
 */
function calculateGlow(
  dominancePercentage: number,
  isPrimary: boolean
): "none" | "sm" | "md" | "lg" {
  if (isPrimary) {
    if (dominancePercentage >= 30) return "lg";
    if (dominancePercentage >= 15) return "md";
    return "sm";
  } else {
    if (dominancePercentage >= 20) return "none";
    return "sm";
  }
}

/**
 * Calculate user's strategic advantage
 */
function calculateUserAdvantage(
  dominantOutcome: "YES" | "NO" | "BALANCED",
  userYesBalance: number,
  userNoBalance: number,
  dominancePercentage: number
): "HIGH" | "MODERATE" | "LOW" | "NONE" {
  if (dominantOutcome === "BALANCED") return "NONE";

  const userHoldsDominant =
    (dominantOutcome === "YES" && userYesBalance > userNoBalance) ||
    (dominantOutcome === "NO" && userNoBalance > userYesBalance);

  if (!userHoldsDominant) return "NONE";

  const dominantBalance = dominantOutcome === "YES" ? userYesBalance : userNoBalance;
  const otherBalance = dominantOutcome === "YES" ? userNoBalance : userYesBalance;

  const balanceRatio = dominantBalance / (otherBalance + 1); // +1 to avoid division by zero

  if (balanceRatio >= 5 && dominancePercentage >= 20) return "HIGH";
  if (balanceRatio >= 2 || dominancePercentage >= 15) return "MODERATE";
  return "LOW";
}

/**
 * Get balanced market state (when total supply is 0 or near equal)
 */
function getBalancedMarket(dynamicData: MarketDynamicData): MarketPsychologyData {
  return {
    dominantOutcome: "BALANCED",
    dominancePercentage: 0,
    yesPercentage: 50,
    noPercentage: 50,
    primaryOutcome: {
      name: "YES",
      color: "green",
      percentage: 50,
      supply: dynamicData.totalSupplyYes,
      userBalance: dynamicData.userYesBalance,
      scale: 1.0,
      weight: "semibold",
      glow: "sm",
    },
    secondaryOutcome: {
      name: "NO",
      color: "red",
      percentage: 50,
      supply: dynamicData.totalSupplyNo,
      userBalance: dynamicData.userNoBalance,
      scale: 1.0,
      weight: "semibold",
      glow: "sm",
    },
    sentiment: "BALANCED",
    sentimentIntensity: 0,
    userIsAligned: true,
    userAdvantage: "NONE",
  };
}

/**
 * Get CSS classes for outcome styling
 */
export function getOutcomeClasses(
  outcome: MarketPsychologyData["primaryOutcome"] | MarketPsychologyData["secondaryOutcome"]
) {
  const colorBase = outcome.color === "green" ? "green" : "red";

  const glowClasses = {
    none: "",
    sm: `shadow-sm shadow-${colorBase}-500/20`,
    md: `shadow-md shadow-${colorBase}-500/30`,
    lg: `shadow-lg shadow-${colorBase}-500/40`,
  };

  return {
    textColor: outcome.color === "green" ? "text-green-400" : "text-red-400",
    borderColor: outcome.color === "green" ? "border-green-500/30" : "border-red-500/30",
    bgGradient: outcome.color === "green"
      ? "bg-gradient-to-br from-green-500/5 via-background to-background"
      : "bg-gradient-to-br from-red-500/5 via-background to-background",
    glowClass: glowClasses[outcome.glow],
    fontWeight: `font-${outcome.weight}`,
  };
}
