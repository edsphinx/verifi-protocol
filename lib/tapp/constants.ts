/**
 * Tapp AMM Constants
 */

// Tapp Hook Address (your deployed tapp_prediction_hook module)
export const TAPP_HOOK_ADDRESS =
  process.env.NEXT_PUBLIC_TAPP_HOOK_ADDRESS ||
  "0x93bc73410f9345c6ff9c399c43913e7a7701a7331e375a70b0ba81ccca036674";

// Tapp Protocol Address (Tapp.Exchange main protocol)
// Using your address for now - update if different
export const TAPP_PROTOCOL_ADDRESS =
  process.env.NEXT_PUBLIC_TAPP_PROTOCOL_ADDRESS ||
  "0x93bc73410f9345c6ff9c399c43913e7a7701a7331e375a70b0ba81ccca036674";

/**
 * Module names
 */
export const TAPP_HOOK_MODULE = `${TAPP_HOOK_ADDRESS}::tapp_prediction_hook`;

/**
 * Function names
 */
export const TAPP_FUNCTIONS = {
  // Hook interface functions
  POOL_SEED: "pool_seed",
  CREATE_POOL: "create_pool",
  ADD_LIQUIDITY: "add_liquidity",
  REMOVE_LIQUIDITY: "remove_liquidity",
  SWAP: "swap",
  COLLECT_FEE: "collect_fee",

  // View functions
  GET_RESERVES: "get_reserves",
  GET_POOL_STATS: "get_pool_stats",
  GET_CURRENT_FEE: "get_current_fee",
  IS_TRADING_ENABLED: "is_trading_enabled",
  GET_POSITION: "get_position",
  CALCULATE_SWAP_OUTPUT: "calculate_swap_output",
} as const;

/**
 * Event types
 */
export const TAPP_EVENTS = {
  POOL_CREATED: `${TAPP_HOOK_MODULE}::PoolCreated`,
  LIQUIDITY_ADDED: `${TAPP_HOOK_MODULE}::LiquidityAdded`,
  LIQUIDITY_REMOVED: `${TAPP_HOOK_MODULE}::LiquidityRemoved`,
  SWAPPED: `${TAPP_HOOK_MODULE}::Swapped`,
  FEE_COLLECTED: `${TAPP_HOOK_MODULE}::FeeCollected`,
  TRADING_STATUS_CHANGED: `${TAPP_HOOK_MODULE}::TradingStatusChanged`,
} as const;
