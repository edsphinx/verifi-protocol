/**
 * @file Services Index
 * @description Barrel file for all service layer exports
 */

export { AnalyticsService } from './analytics.service';
export { PortfolioService } from './portfolio.service';
export { IntelligenceService } from './intelligence.service';

// Re-export types
export type {
  MarketIntelligence,
  SmartInsight,
  ProactiveAlert,
} from './intelligence.service';
