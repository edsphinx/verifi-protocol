/**
 * @file Contains common, reusable TypeScript types for UI and page components.
 * @author edsphinx
 */

import type { MarketDetailsData } from "@/lib/types";

// ==================================
// Component Prop Types
// ==================================

/**
 * @notice Props for the main `ActionPanel` component on the market detail page.
 */
export interface ActionPanelProps {
  /** The on-chain address of the market, used for transactions. */
  marketId: string;
  /** The dynamic, real-time data for the market, fetched from on-chain view functions. */
  dynamicData: MarketDetailsData;
}

/**
 * @notice For typing the on-chain event data passed from the frontend.
 */
export type MarketCreatedEventData = {
  market_address: string;
  creator: string;
  description: string;
  resolution_timestamp: string; // Events return numbers as strings
};

/**
 * @notice Generic props for a Next.js dynamic route page component.
 * @dev This utility type correctly types `params` and `searchParams` for Next.js 15.
 * In Next.js 15, both params and searchParams are Promises in async Server Components.
 * @template PageParam The name of the dynamic parameter, e.g., `[id]`. Defaults to "id".
 * @template IsAsync A boolean to indicate if the page component is async. Defaults to `false`.
 */
export type PageProps<
  PageParam extends string = "id",
  IsAsync extends boolean = false,
> = {
  /**
   * An object containing the dynamic route parameters.
   * If `IsAsync` is true, this will be a Promise that must be awaited.
   */
  params: IsAsync extends true
    ? Promise<{ [key in PageParam]: string }>
    : { [key in PageParam]: string };

  /**
   * Search parameters from the URL query string.
   * If `IsAsync` is true, this will also be a Promise that must be awaited.
   */
  searchParams?: IsAsync extends true
    ? Promise<{ [key: string]: string | string[] | undefined }>
    : { [key: string]: string | string[] | undefined };
};
