# VeriFi Economic Model: Visual Flow Diagram

## 3-Phase Value Flow System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VERIFI PROPORTIONAL PAYOUT MODEL                     │
│                                                                               │
│  Primary Issuance → AMM Speculation → Proportional Resolution                │
└─────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════╗
║                            PHASE 1: PRIMARY ISSUANCE                       ║
║                              (Risk-Free Minting)                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

    User Deposits 1 APT
           │
           ▼
    ┌──────────────┐
    │   Protocol   │
    │   Treasury   │──────► Store 1 APT in Market Treasury
    └──────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │  Mint Complete Set:          │
    │  1 YES token + 1 NO token    │
    └──────────────────────────────┘
           │
           ▼
    User receives both tokens

    📊 State After 3 Users Mint:
    ═══════════════════════════════
    Treasury:     3 APT
    YES Supply:   3 tokens
    NO Supply:    3 tokens

╔═══════════════════════════════════════════════════════════════════════════╗
║                       PHASE 2: SECONDARY MARKET (TAPP AMM)                 ║
║                            (Price Discovery)                               ║
╚═══════════════════════════════════════════════════════════════════════════╝

    ┌─────────────────────────────────────────────────────────────┐
    │                    TAPP.EXCHANGE AMM POOL                    │
    │                                                               │
    │              CPMM Formula: x × y = k                         │
    │                                                               │
    │   ┌─────────────┐              ┌─────────────┐             │
    │   │  YES Pool   │              │  NO Pool    │             │
    │   │   Reserve   │◄────────────►│   Reserve   │             │
    │   └─────────────┘              └─────────────┘             │
    │                                                               │
    │   Current Prices:                                            │
    │   YES = 0.73 APT  (73% probability)                         │
    │   NO  = 0.27 APT  (27% probability)                         │
    └─────────────────────────────────────────────────────────────┘

    ┌─── ALICE (Bullish Trader) ─────────────────────────────────┐
    │                                                              │
    │  Has: 1 YES + 1 NO                                          │
    │  Strategy: Sell losing side, keep winner                    │
    │                                                              │
    │  Action: Sell 1 NO → Receive 0.27 APT                      │
    │                                                              │
    │  Final Position:                                            │
    │  ✅ 1 YES token                                             │
    │  ✅ 0.27 APT (from sale)                                    │
    │  Net Cost: 0.73 APT (1 - 0.27)                             │
    └──────────────────────────────────────────────────────────────┘

    ┌─── BOB (Uncertain Trader) ──────────────────────────────────┐
    │                                                              │
    │  Has: 1 YES + 1 NO                                          │
    │  Strategy: Exit with liquidity                              │
    │                                                              │
    │  Action: Sell 1 YES → Receive 0.73 APT                     │
    │                                                              │
    │  Final Position:                                            │
    │  ✅ 1 NO token                                              │
    │  ✅ 0.73 APT (from sale)                                    │
    │  Net Recovery: 0.73 APT                                     │
    └──────────────────────────────────────────────────────────────┘

    ┌─── CHARLIE (Hedged Trader) ─────────────────────────────────┐
    │                                                              │
    │  Has: 1 YES + 1 NO                                          │
    │  Strategy: Keep complete set                                │
    │                                                              │
    │  Action: HOLD both tokens                                   │
    │                                                              │
    │  Final Position:                                            │
    │  ✅ 1 YES token                                             │
    │  ✅ 1 NO token                                              │
    │  Net Cost: 1 APT                                            │
    └──────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════╗
║                        PHASE 3: MARKET RESOLUTION                          ║
║                         (Proportional Payout)                              ║
╚═══════════════════════════════════════════════════════════════════════════╝

    📋 Market Resolves: YES WINS ✅

    ┌──────────────────────────────────────────────────────────────┐
    │                     PROPORTIONAL PAYOUT                       │
    │                                                               │
    │   Formula: Payout = (Treasury) / (Winning Token Supply)     │
    │                                                               │
    │   Treasury:              3 APT                               │
    │   Winning Token Supply:  2 YES (Alice + Charlie)            │
    │   Losing Token Supply:   3 NO (worthless)                   │
    │                                                               │
    │   ════════════════════════════════════════════════════       │
    │                                                               │
    │   Payout per YES token = 3 APT / 2 = 1.5 APT                │
    │                                                               │
    └──────────────────────────────────────────────────────────────┘

    ┌─────────────────── ALICE'S REDEMPTION ──────────────────────┐
    │                                                              │
    │  Redeems: 1 YES token                                       │
    │           │                                                  │
    │           ▼                                                  │
    │  ┌──────────────────────────────┐                          │
    │  │  Protocol calculates:        │                          │
    │  │  (1 × 3 APT) / 2 = 1.5 APT  │                          │
    │  └──────────────────────────────┘                          │
    │           │                                                  │
    │           ▼                                                  │
    │  💰 Receives: 1.5 APT                                       │
    │                                                              │
    │  📊 Total P&L:                                              │
    │     Spent:    1 APT (mint)                                  │
    │     Received: 0.27 APT (sold NO) + 1.5 APT (redeemed)     │
    │     Total:    1.77 APT                                      │
    │     Profit:   0.77 APT (77% ROI) 🚀                        │
    └──────────────────────────────────────────────────────────────┘

    ┌──────────────────── BOB'S POSITION ─────────────────────────┐
    │                                                              │
    │  Holds: 1 NO token (losing side)                           │
    │         │                                                    │
    │         ▼                                                    │
    │  ┌──────────────────────────────┐                          │
    │  │  NO tokens are worthless     │                          │
    │  │  Cannot redeem               │                          │
    │  └──────────────────────────────┘                          │
    │         │                                                    │
    │         ▼                                                    │
    │  💸 Value: 0 APT                                            │
    │                                                              │
    │  📊 Total P&L:                                              │
    │     Spent:    1 APT (mint)                                  │
    │     Received: 0.73 APT (sold YES)                          │
    │     Total:    0.73 APT                                      │
    │     Loss:     -0.27 APT (-27%) ❌                          │
    └──────────────────────────────────────────────────────────────┘

    ┌─────────────────── CHARLIE'S REDEMPTION ────────────────────┐
    │                                                              │
    │  Redeems: 1 YES token (NO token worthless)                 │
    │           │                                                  │
    │           ▼                                                  │
    │  ┌──────────────────────────────┐                          │
    │  │  Protocol calculates:        │                          │
    │  │  (1 × 3 APT) / 2 = 1.5 APT  │                          │
    │  └──────────────────────────────┘                          │
    │           │                                                  │
    │           ▼                                                  │
    │  💰 Receives: 1.5 APT                                       │
    │                                                              │
    │  📊 Total P&L:                                              │
    │     Spent:    1 APT (mint)                                  │
    │     Received: 1.5 APT (redeemed YES)                       │
    │     Total:    1.5 APT                                       │
    │     Profit:   0.5 APT (50% ROI) ⚠️                         │
    │                                                              │
    │  Note: Had 1 NO token that became worthless                │
    └──────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════╗
║                            VERIFICATION & PROOF                            ║
╚═══════════════════════════════════════════════════════════════════════════╝

    ┌──────────────────────────────────────────────────────────────┐
    │                    MATHEMATICAL PROOF                         │
    │                                                               │
    │  Total Deposits:    3 APT                                    │
    │  Total Withdrawals: 1.5 APT (Alice) + 1.5 APT (Charlie)     │
    │                   = 3 APT ✅                                 │
    │                                                               │
    │  ════════════════════════════════════════════════════        │
    │                                                               │
    │  Protocol Balance:  3 APT - 3 APT = 0 APT ✅                │
    │                                                               │
    │  No insolvency risk! Payouts always equal treasury.         │
    └──────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────────┐
    │                    ECONOMIC INCENTIVES                        │
    │                                                               │
    │  1. 🎯 Rewards Conviction (Alice: 77% ROI)                   │
    │     - Sold losing side early                                 │
    │     - Reduced winning token supply                           │
    │     - Got larger share of treasury                           │
    │                                                               │
    │  2. 💧 Incentivizes Liquidity (Bob provided exit)           │
    │     - Allowed Alice to sell NO tokens                        │
    │     - Created price discovery                                │
    │     - Market reflects true probabilities                     │
    │                                                               │
    │  3. 🛡️ Allows Hedging (Charlie reduced risk)                │
    │     - Kept complete set                                      │
    │     - Still profited 50%                                     │
    │     - Lower risk, lower reward                               │
    │                                                               │
    │  4. 📊 Creates Real Price Discovery                          │
    │     - AMM prices: YES 73%, NO 27%                           │
    │     - Reflected true market sentiment                        │
    │     - Guided traders' decisions                              │
    │                                                               │
    │  5. ✅ Mathematically Sound                                  │
    │     - Always pays out exactly treasury amount                │
    │     - No risk of insolvency                                  │
    │     - Fair distribution based on holdings                    │
    └──────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════╗
║                         WHY PROPORTIONAL > 1:1?                            ║
╚═══════════════════════════════════════════════════════════════════════════╝

    ❌ 1:1 Model (Augur V1 Style)
    ════════════════════════════════
    - Everyone gets 1 APT per winning token
    - No incentive to sell losing side
    - No liquidity in secondary markets
    - Poor price discovery
    - Users must hold both tokens until resolution

    ✅ Proportional Model (VeriFi)
    ════════════════════════════════
    - Winners share treasury proportionally
    - Strong incentive to sell losing side (increases your payout!)
    - Creates vibrant secondary markets
    - Real-time price discovery via AMM
    - Flexible strategies: conviction, hedging, liquidity provision

    📈 RESULT: More efficient markets, better liquidity, higher profits for informed traders

╔═══════════════════════════════════════════════════════════════════════════╗
║                          SMART CONTRACT CODE                               ║
╚═══════════════════════════════════════════════════════════════════════════╝

```move
// verifi_protocol.move:541-599
public entry fun redeem_winnings(
    redeemer: &signer,
    market_object: Object<Market>,
    amount_to_redeem: u64,
) acquires Market, MarketFactory {
    let market_address = object::object_address(&market_object);
    let market = borrow_global_mut<Market>(market_address);

    // 1. Verify market is resolved
    assert!(
        market.status == STATUS_RESOLVED_YES ||
        market.status == STATUS_RESOLVED_NO,
        E_MARKET_NOT_RESOLVED
    );

    // 2. Get total treasury balance
    let treasury_address = account::get_signer_capability_address(&market.treasury_cap);
    let total_pool_balance = coin::balance<AptosCoin>(treasury_address);

    // 3. Determine winning token and supply
    let (winning_token_metadata, winning_token_burn_ref, winning_token_supply) =
        if (market.status == STATUS_RESOLVED_YES) {
            (market.yes_token_metadata, &market.yes_token_burn_ref, market.total_supply_yes)
        } else {
            (market.no_token_metadata, &market.no_token_burn_ref, market.total_supply_no)
        };

    // 4. PROPORTIONAL PAYOUT CALCULATION
    // ══════════════════════════════════════════════════════════════
    // Formula: (amount_to_redeem × treasury) / winning_supply
    // ══════════════════════════════════════════════════════════════
    let payout_amount = (amount_to_redeem as u128) *
                       (total_pool_balance as u128) /
                       (winning_token_supply as u128);

    // 5. Apply protocol fee (2%)
    let protocol_fee = (payout_amount * (PROTOCOL_FEE_BASIS_POINTS as u128) / 10000) as u64;
    let final_payout_to_user = (payout_amount as u64) - protocol_fee;

    // 6. Burn winning tokens
    let tokens_to_redeem = fungible_asset::withdraw(redeemer, store_obj, amount_to_redeem);
    fungible_asset::burn(winning_token_burn_ref, tokens_to_redeem);

    // 7. Transfer APT to winner
    let treasury_signer = account::create_signer_with_capability(&market.treasury_cap);
    let fee_apt = coin::withdraw<AptosCoin>(&treasury_signer, protocol_fee);
    let apt_to_return = coin::withdraw<AptosCoin>(&treasury_signer, final_payout_to_user);

    coin::deposit(protocol_treasury_address, fee_apt);
    coin::deposit(redeemer_address, apt_to_return);
}
```

╔═══════════════════════════════════════════════════════════════════════════╗
║                              KEY TAKEAWAYS                                 ║
╚═══════════════════════════════════════════════════════════════════════════╝

    1. 🔄 3-Phase System
       ├─ Primary: 1 APT → 1 YES + 1 NO (guaranteed minting)
       ├─ Secondary: AMM trading (price discovery)
       └─ Resolution: Proportional payout (incentivized strategy)

    2. 💡 Economic Genius
       ├─ Selling losing side → Increases your payout
       ├─ Creates natural liquidity incentives
       └─ Rewards informed conviction

    3. 🔒 Security Guarantees
       ├─ Total payouts = Total treasury (always)
       ├─ No insolvency risk
       └─ Isolated per-market treasuries (resource accounts)

    4. 📊 Superior to Alternatives
       ├─ More liquidity than pure 1:1
       ├─ Better UX than pure AMM (no cold start)
       └─ Real price discovery + guaranteed redemption

    5. 🎯 Perfect for Prediction Markets
       ├─ Binary outcomes (YES/NO)
       ├─ Trustless resolution (on-chain data)
       └─ Fair, proportional distribution

═══════════════════════════════════════════════════════════════════════════
                    Built on Aptos | Powered by Nodit | Integrated with Tapp
═══════════════════════════════════════════════════════════════════════════
```
