# VeriFi Protocol: The On-Chain Oracle

VeriFi is a decentralized derivatives protocol that empowers anyone to create markets on verifiable, on-chain events directly on the Aptos blockchain, without relying on external oracles.

## Table of Contents
* [🚀 The Vision](#-the-vision)
* [⛓️ The Problem](#️-the-problem)
* [✨ Our Solution](#-our-solution)
* [🎯 Core Features (MVP Scope)](#-core-features-mvp-scope)
* [🛠️ Technical Architecture](#️-technical-architecture)
* [🏁 Getting Started](#-getting-started)
* [🏆 Hackathon Bounties & Sponsor Synergies](#-hackathon-bounties--sponsor-synergies)
* [🧠 From MVP to Mainnet: Our Roadmap](#-from-mvp-to-mainnet-our-roadmap)
* [👥 The Team](#-the-team)

## 🚀 The Vision
Imagine a financial ecosystem where any on-chain truth can become a liquid, tradable market. Where the creation of financial instruments isn't restricted to experts, but is open to the entire community through a simple, guided experience. That is the vision of VeriFi Protocol.

## ⛓️ The Problem
DeFi's potential is limited by its reliance on insecure oracles and a market creation process so complex it excludes non-developers, silencing the valuable insights of the broader community. This creates two critical barriers: a single point of failure and a bottleneck for innovation.

## ✨ Our Solution
VeriFi solves these problems with an elegant architecture and a radically simple user experience. We have built a protocol that allows markets to be resolved 100% programmatically and trustlessly by directly querying the state of other contracts on Aptos. Zero external dependencies.

## 🎯 Core Features (MVP Scope)
For this hackathon, we focused on delivering the core innovations of our protocol:

* ✅ **Oracle-less Markets:** The smart contract `protocol.move` can create, manage, and resolve markets without any external data feeds. The resolution is handled by a public function (`resolve_market_programmatically`) that anyone can call after the expiration date.
* ✅ **Guided Market Creation:** A clean and intuitive UI/UX where users can create a complex financial derivative in a few clicks. The user selects a protocol, a verifiable metric, and the conditions, and our Template Engine handles the on-chain complexity.
* ✅ **End-to-End Fund Management:** Users can buy and sell shares using APT. The protocol's treasury, managed by a Resource Account, securely handles all funds. Winning users can redeem their shares for their portion of the prize pool.

## 🛠️ Technical Architecture
The protocol is composed of three main blocks:

### Smart Contracts (Move on Aptos):
* **MarketFactory:** A singleton object that acts as the central registry and factory for all markets.
* **Market:** An independent object for each market, containing all its logic, its own treasury (`SignerCapability`), and the Fungible Asset refs for its YES/NO outcome tokens.
* **Key Innovation:** The contract stores the target contract address and conditions on-chain. The `resolve_market_programmatically` function contains the logic to verify these conditions, making the protocol truly trustless.

### Frontend (Next.js & TypeScript):
* A responsive and fast dApp for interacting with the protocol.
* Integrates with Aptos wallets (Petra, Martian, etc.) via the Aptos Wallet Adapter.
* Uses the Aptos TS SDK for all blockchain interactions.

### Off-Chain Services (Supabase & Nodit):
* **Curated Template Engine:** A database (managed in Supabase) that maps user-friendly selections (e.g., "Amnis Finance TVL") to the technical on-chain data (contract addresses, function names) needed to create a market.
* **Data Indexer:** We use Nodit's Webhooks to listen for `MarketCreatedEvent` on our contract. This allows our frontend to display a list of all markets almost instantly without slow RPC calls.

### Tech Stack
* **Blockchain:** Aptos
* **Smart Contracts:** Move
* **Frontend:** Next.js, React, TypeScript, Tailwind CSS
* **Backend & Indexing:** Supabase, Nodit
* **Wallet Integration:** Aptos Wallet Adapter

## 🏁 Getting Started

### Prerequisites
* Node.js (v18+) and pnpm
* Aptos CLI

### Installation & Running
1.  Clone the repository:
    ```bash
    git clone [https://github.com/edsphinx/verifi-protocol.git](https://github.com/edsphinx/verifi-protocol.git)
    cd verifi-protocol
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Setup environment variables:
    Create a `.env.local` file in the `frontend` directory and configure your Supabase and Nodit API keys.

4.  Run the development server:
    ```bash
    pnpm dev
    ```
5.  Compile & Deploy the Smart Contract:
    The contract is located in the `contract` directory.
    ```bash
    # Navigate to the contract directory
    cd contract
    
    # Compile the contract
    aptos move compile --named-addresses VeriFiPublisher=[YOUR_ACCOUNT_ADDRESS]
    
    # Publish the contract
    aptos move publish --named-addresses VeriFiPublisher=[YOUR_ACCOUNT_ADDRESS]
    ```

## 🏆 Hackathon Bounties & Sponsor Synergies
We have carefully analyzed the bounties offered and designed VeriFi not only to compete directly for one of them but also to establish future synergies with the other ecosystem sponsors.

### 🎯 Main Target: Build with Nodit: Aptos Infrastructure Challenge
VeriFi was designed from the ground up with Nodit's infrastructure in mind, making it an ideal candidate for this bounty. We have integrated multiple Nodit features to meet and exceed the evaluation criteria:

1.  **Integration 1: Real-Time Indexing with Webhooks (Technical Excellence):**
    We configured Nodit's Webhooks to monitor our `MarketFactory` contract. When a new market is created, Nodit instantly sends a notification to a Next.js API route, which updates our Supabase database. This makes our application incredibly fast and scalable.
2.  **Integration 2: Data Verification with the Web3 Data API (Creativity & Usefulness):**
    The "Live Value Checker" in our market creation dashboard uses the Nodit API to get the current state of an on-chain metric. This provides instant and valuable feedback to the user, radically improving the experience.

### 🌱 Future Synergies: A Primitive for the DeFi Ecosystem
VeriFi does not seek to compete with existing AMMs, but to empower them. Our vision is for VeriFi to function as a base layer that creates new tradable assets, and the hackathon sponsors are the ideal liquidity layer for these assets.

* **Tapp.Exchange & Hyperion - Liquidity & Capital Efficiency:**
    The outcome tokens (YES/NO) from each VeriFi market are standard Fungible Assets. Our post-hackathon roadmap includes creating liquidity pools on leading DEXs like Tapp.Exchange and Hyperion. This will create vibrant secondary markets to speculate on outcomes, allowing users to efficiently enter and exit positions and connecting VeriFi with the entire Aptos DeFi ecosystem.
* **Kana Perps - Leveraged Prediction Markets:**
    Once our markets have liquidity on a DEX, the next step is capital efficiency. The "Leveraged Prediction Markets" idea from the Kana Perps bounty is a perfect synergy. We can build a layer of vaults on top of the YES/NO pools that allows traders to take leveraged positions, turning VeriFi into a sophisticated trading tool.

## 🧠 From MVP to Mainnet: Our Roadmap
We are fully aware that certain features were simplified to focus on the core innovation for this hackathon. This demonstrates our ability to deliver a functional proof-of-concept while having a clear vision for a production-ready product.

### MVP Simplifications (for the Hackathon)
* **AMM & Pricing Logic:**
    * **Current State:** The protocol uses a primary issuance model (1 APT mints 1 YES + 1 NO). It's not a swap-based AMM.
    * **Future State:** Implement a true Constant Product AMM (X * Y = K) within the protocol for initial price discovery, and more importantly, bootstrap liquidity pools on external DEXs like Tapp.Exchange and Hyperion.
* **On-Chain Data Call:**
    * **Current State:** The `resolve_market_programmatically` function currently simulates the on-chain data check to demonstrate the contract's resolution flow.
    * **Future State:** Implement a robust and generalized on-chain data-calling mechanism to securely call `view` functions on any whitelisted protocol.

### Future Features
* **Liquidity Pool Integration:** Our top priority. Bootstrap pools for YES/NO tokens on major Aptos DEXs.
* **AI-Powered Market Creation:** Expand our "Guided Creation" engine to include a Natural Language Processing model.
* **Leveraged Markets:** Build integrations to offer leveraged trading on outcomes.
* **Governance and Fee Structure:** Introduce a protocol fee on trades managed by a DAO.

## 👥 The Team
* **edsphinx** - Lead Move & Fullstack Developer
