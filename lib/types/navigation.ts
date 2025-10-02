/**
 * Navigation types for the VeriFi Protocol application
 */

export interface NavItem {
  title: string;
  href: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export type RouteType =
  | "markets"
  | "create"
  | "portfolio"
  | "amm"
  | "liquidity";

export interface NavigationConfig {
  mainNav: NavSection[];
  sidebarNav?: NavSection[];
  footerNav?: NavSection[];
}
