# VeriFi Protocol: The On-Chain Oracle

> **Transform on-chain data into tradable markets. No external oracles. Pure blockchain truth.**

[![Built on Aptos](https://img.shields.io/badge/Built%20on-Aptos-00D4AA?style=for-the-badge&logo=aptos)](https://aptoslabs.com)
[![Live Demo](https://img.shields.io/badge/Live-Demo-FF6B00?style=for-the-badge)](https://verifi-protocol.vercel.app)

VeriFi is a decentralized derivatives protocol that empowers anyone to create prediction markets on verifiable, on-chain events—directly on the Aptos blockchain, without external oracles.

---

##  The Vision

Imagine a financial ecosystem where **any on-chain truth** can become a liquid, tradable market. Where creating financial instruments isn't restricted to experts, but open to the entire community. That's VeriFi Protocol.

##  The Problem

Current prediction markets face two critical barriers:

1. **Insecure Oracle Reliance**: External oracles create single points of failure
2. **Complex Market Creation**: Technical barriers exclude non-developers and silence community insights

These limitations prevent Aptos from realizing its vision of trustless, frictionless value movement.

##  Our Solution

VeriFi solves both problems with:

###  Oracle-less Architecture
Markets resolve **100% programmatically** by directly querying other Aptos contracts. Check a protocol's TVL, a DAO proposal's outcome, or any on-chain metric—without external dependencies.

###  AI-Powered Market Creation
Our intelligent dashboard makes market creation trivial:
1. **Natural Language Input**: Describe your market in plain English
2. **AI Validation**: Claude analyzes feasibility and suggests improvements
3. **Smart Extraction**: AI fills parameters (protocol, metric, conditions, dates)
4. **One-Click Deploy**: Template engine handles all contract complexity

Example: "Will Circle USDC total supply exceed 5M by March 15th?" → Fully configured market in seconds.

###  The "Market Creator" Economy
Every user can become a market creator, monetizing their ecosystem insights and knowledge.

---

##  Technical Architecture

```mermaid
graph TB
    A[User] --> B[Next.js Frontend]
    B --> C[Aptos Blockchain]
    C --> D[VeriFi Smart Contracts]
    D --> E[Oracle Registry]
    D --> F[Market Factory]
    D --> G[Trading Engine]
    E --> H[On-Chain Data Sources]
    F --> I[Market Objects]
    G --> I
    I --> J[Treasury Management]
    B --> K[Supabase DB]
    C --> K
```

### Smart Contracts (Move)
- **Market Factory**: Creates isolated market objects with resource accounts
- **Oracle Registry**: Whitelists and manages on-chain data sources
- **Trading Engine**: Primary issuance (1 APT = 1 YES + 1 NO)
- **Resolution Module**: Programmatic settlement via on-chain queries

### Frontend Stack
- **Next.js 15 + React 19**: Modern, performant UI
- **Aptos Wallet Adapter**: Universal wallet support
- **Supabase**: Real-time event indexing
- **shadcn/ui**: Beautiful, accessible components

### Key Innovations
1. **Resource Account Architecture**: Each market has isolated treasury
2. **Template Engine**: Maps UI selections to contract calls
3. **Hybrid Trading**: Primary issuance + AMM pools (Tapp.Exchange integration ready)
4. **Real-time Indexing**: Direct blockchain event monitoring

---

##  What We've Built

###  Core Features
- [x] Oracle-less market creation and resolution
- [x] AI-powered market creation with natural language input
- [x] Buy/sell YES/NO outcome tokens
- [x] Portfolio tracking with P&L
- [x] AMM pools with liquidity provision (Tapp integration)
- [x] Swap YES/NO tokens with real-time price impact
- [x] Liquidity positions dashboard with PnL tracking
- [x] Transaction explorer links for on-chain verification
- [x] Real-time notifications with clickable transaction links
- [x] Admin control panel
- [x] Comprehensive test suite (90%+ coverage)

###  Supported Oracles
- **Aptos Balance Oracle**: Track any account's APT holdings
- **USDC Total Supply**: Monitor USDC circulation
- **Extensible**: Add custom oracles via registry

###  Tapp.Exchange AMM Integration

**VeriFi is the first prediction market to implement a custom Tapp hook + integrated AMM UI**

We've developed a complete AMM solution for YES/NO token trading:

####  Smart Contract Hook (`tapp_prediction_hook.move`)
-  **Full Hook Interface**: Implements create_pool, add_liquidity, remove_liquidity, swap, collect_fee
-  **Dynamic Fees**: 0.3% base fee, 0.5% during high volatility (< 1h to resolution)
-  **Auto-disable Trading**: Pools stop trading when market resolves
-  **NFT-based Positions**: Liquidity providers receive Tapp position NFTs
-  **Local Tests**: Integration tested with 6/7 steps successful

####  Integrated AMM UI (Production Ready)
-  **Pool Creation**: One-click pool deployment from market page
-  **Add Liquidity**: Deposit YES/NO tokens, receive LP tokens with position NFTs
-  **Swap Interface**: Trade tokens with live price impact preview
-  **Liquidity Dashboard**: View positions with real-time PnL calculations
-  **Transaction Links**: Direct links to Aptos Explorer for verification
-  **React Query Optimistic Updates**: Instant UI updates after transactions

**Current Status:**
- ✅ **UI/Frontend**: Fully functional on testnet with complete AMM flow
- ⏳ **Hook Deployment**: Submitted for review with Tapp team per [official process](https://github.com/tapp-exchange/hook-documentation#submission-process)

**Why This Matters:**
- **Composability**: YES/NO tokens tradable on any Tapp-compatible DEX
- **Liquidity**: LPs earn fees on both outcome sides
- **Best UX**: Seamless integration directly in market pages
- **Innovation**: First hook to bring prediction markets to Tapp ecosystem

See [TAPP_INTEGRATION_COMPLETE.md](./TAPP_INTEGRATION_COMPLETE.md) for technical implementation details.

---

##  Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- Aptos CLI
- PostgreSQL (via Supabase)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/verifi-protocol
cd verifi-protocol

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Add your Supabase and Aptos credentials

# Run database migrations
pnpm prisma migrate dev

# Start development server
pnpm dev
```

### Deploy Contracts

```bash
# Compile Move contracts
pnpm move:compile

# Publish to testnet
pnpm move:publish

# Generate TypeScript ABIs
pnpm move:get_abi
```

### Testing

```bash
# Run Move unit tests
pnpm move:test

# Run full E2E flow
pnpm test:full-flow
```

---

##  Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Smart Contract Guide](./contract/README.md)
- [Testing Guide](./docs/TESTING.md)
- [Deployment Guide](./docs/TAPP_DEPLOYMENT_GUIDE.md)

---

##  Hackathon Deliverables

### Aptos Ctrl+MOVE Hackathon 2025

**Track**: DeFi & Payments

**Bounties Targeted**:
-  **Best DeFi Protocol**: Novel oracle-less architecture for trustless markets
-  **Best Use of Aptos Primitives**: Resource accounts, Object model, Fungible Assets
-  **Best UX**: Guided market creation democratizes DeFi innovation

**Key Differentiators**:
1. **First oracle-less prediction market on Aptos** - Programmatic resolution eliminates trust assumptions
2. **First prediction market with Tapp AMM integration** - Full UI/UX for swap and liquidity provision
3. **AI-powered market creation** - Natural language input with Claude validation and smart parameter extraction
4. **Production-ready architecture** - Comprehensive testing, proper error handling, event-driven indexing
5. **Best-in-class UX** - Real-time updates, transaction explorer links, liquidity position tracking
6. **Composable by design** - YES/NO tokens are standard Fungible Assets, work with any DEX

---

##  Roadmap

### Phase 1: Foundation (✅ Complete)
- Core protocol implementation
- Primary market trading
- Basic oracle registry
- AI-powered market creation
- Full Tapp AMM integration (UI)

### Phase 2: Enhanced Trading (🚧 In Progress)
- Tapp hook testnet deployment
- Advanced portfolio analytics
- Multi-oracle market conditions
- Cross-DEX liquidity aggregation

### Phase 3: Ecosystem Growth (📋 Planned)
- Multi-language AI support (Spanish, Chinese)
- Cross-protocol oracle integrations (Thala, PancakeSwap, etc.)
- Governance token and DAO
- Mobile app with push notifications

---

##  The Team

**EdSphinx** - Full-stack Web3 Developer
-  Winner: Veritas Protocol (Infinita DeSci Hackathon)
-  Winner: SocialDrop (Base MiniApp Hackathon)
-  5+ years blockchain development
-  [GitHub](https://github.com/edsphinx) | [Twitter](https://twitter.com/edsphinx)

---

##  License

MIT License - see [LICENSE](./LICENSE) for details

---

##  Links

- **Live Demo**: [verifi-protocol.vercel.app](https://verifi-protocol.vercel.app)
- **Demo Video**: [Coming Soon]
- **Hackathon Submission**: [DoraHacks](https://dorahacks.io)
- **Documentation**: [GitHub Wiki](https://github.com/yourusername/verifi-protocol/wiki)

---

<p align="center">Built with ❤️ in Honduras and deployed on Aptos Testnet</p>
