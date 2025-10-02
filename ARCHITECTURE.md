# VeriFi Protocol: Architecture Overview

This document provides a comprehensive overview of the full-stack architecture for the VeriFi Protocol, a decentralized, oracle-less prediction market platform built on the Aptos blockchain.

## High-Level Diagram

The system is designed with a clear separation of concerns, comprising four main layers: a reactive frontend, a proxy backend for data orchestration, a relational database for indexed data, and the on-chain smart contracts.

┌──────────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│   Frontend UI    │◀───▶│  Next.js Backend │◀───▶│  Prisma / PostgreSQL│
│ (Next.js/React)  │      │    (API Routes)    │      │ (Database Service)  │
└──────────────────┘      └─────────┬────────┘      └──────────┬──────────┘
       ▲                          │                           │
       │(Sign/Submit Txns)         │(View Calls)                │(Indexed by...)
       ▼                          ▼                           │
┌──────────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│  Aptos Wallets   │      │   Aptos On-Chain   │      │    Nodit Webhooks   │
│ (Petra, Martian) │      │(Smart Contracts) │◀─────┤   (Event Indexer)   │
└──────────────────┘      └──────────────────┘      └─────────────────────┘

---

## 1. Frontend Layer (Next.js App Router)

The frontend is a modern, type-safe, and reactive web application built for a smooth user experience.

-   **Framework:** Next.js 15 (App Router)
-   **Language:** TypeScript
-   **UI:** React, Tailwind CSS, shadcn/ui
-   **Animation:** Framer Motion
-   **State Management:** `@tanstack/react-query` (React Query) is used for all server state management, including data fetching, caching, and automatic refetching (polling) to keep the UI synchronized with the backend.

### Key Components:
-   **`app/page.tsx` & `components/views/MarketsHub.tsx`**: The main dashboard. It fetches and displays a list of active, resolving, and resolved markets. It uses polling via `useQuery` for a live feel.
-   **`app/market/[id]/page.tsx` & `components/MarketView.tsx`**: The detailed view for a single market. It's composed of:
    -   `MarketDetails.tsx`: Displays static and dynamic on-chain data about the market.
    -   `ActionPanel.tsx`: The main user interaction panel for buying and selling shares.
-   **`app/create/page.tsx` & `components/CreateMarketForm.tsx`**: A form that allows users to create new prediction markets by submitting an on-chain transaction.

---

## 2. Backend Layer (Next.js API & Services)

The Next.js backend acts as a **secure proxy and orchestrator**. The frontend never directly queries the blockchain for complex data or builds transaction payloads itself. This is a deliberate architectural choice for security, performance, and maintainability.

### API Routes (`app/api/...`)
-   **`GET /api/markets`**: The primary endpoint for the homepage. It orchestrates calls to the database service and the on-chain query functions to return a fully enriched list of markets.
-   **`POST /api/markets/create`**: Receives data from the `CreateMarketForm`, builds the `create_market` transaction payload using a server-side builder, and returns it to the frontend for signing.
-   **`POST /api/markets/buy-shares`**: Builds the `buy_shares` payload.
-   **`POST /api/indexer/new-market`**: A dedicated webhook receiver endpoint for the Nodit indexer.

### Service & Database Layer
-   **`services/market.service.ts`**: A dedicated service layer that abstracts all database interactions. It is the only part of the application that directly interacts with the Prisma client.
-   **`lib/clients/prisma.ts`**: Implements a singleton pattern for the Prisma client, ensuring efficient database connections.
-   **Database**: PostgreSQL, managed via Prisma ORM. It stores indexed on-chain data (like market details) to provide fast data retrieval for the frontend.

---

## 3. On-Chain Program (Aptos Move)

The core logic of the protocol is implemented as a suite of modular smart contracts written in Move.

-   **`verifi_protocol.move`**: The main contract.
    -   Manages the state of the `MarketFactory` and individual `Market` objects.
    -   Contains the core business logic for `create_market`, `buy_shares`, `sell_shares`, and `redeem_winnings`.
    -   Exposes secure `public(friend)` functions (`get_resolution_data`, `update_market_status_from_resolver`) for the resolver contract to interact with.

-   **`access_control.move`**: A simple and secure `Ownable` pattern contract that defines a single protocol administrator.

-   **`oracle_registry.move`**: A whitelisting contract where the admin can register and manage trusted on-chain oracles.

-   **`oracles.move`**: A secure `public(friend)` router module. It receives data requests from the resolver, checks the registry, and dispatches the call to the appropriate oracle plugin.

-   **`oracle_*.move` Plugins** (`oracle_aptos_balance.move`, `oracle_usdc.move`): Single-responsibility modules that contain the specific logic for fetching one type of on-chain data. They expose a `public(friend)` interface to be called only by the `oracles` router.

-   **`verifi_resolvers.move`**: A dedicated **Resolver Contract**.
    -   This is the only contract with a complex `acquires` list, allowing it to read various on-chain resources.
    -   Its `resolve_market` entry function is called by off-chain keepers.
    -   It performs the entire "read oracle data -> call `verifi_protocol` to write state" flow in a single, atomic, and trustless on-chain transaction.
    -   This architecture makes the protocol **scalable and upgradeable**, as new oracle types only require updating the resolver contract, not the core protocol.

---

## 4. Data & Indexing Pipeline (Nodit Integration)

To provide a smooth and real-time user experience, the dApp relies on an off-chain indexing pipeline powered by **Nodit**.

-   **Event Emission:** All significant state changes in the `verifi_protocol` contract (e.g., `MarketCreatedEvent`, `SharesMintedEvent`) emit on-chain events.
-   **Nodit Webhooks:** A Nodit webhook is configured to listen for these specific events on the deployed contract address.
-   **Backend Indexer:** When an event is detected, Nodit sends a POST request with the event data to our `/api/indexer/new-market` endpoint.
-   **Database Update:** The API route validates the data and uses the `market.service` to save the new market's information into the PostgreSQL database.
-   **Frontend Polling:** The `MarketsHub` component on the frontend uses `useQuery` with `refetchInterval` to periodically poll the `/api/markets` endpoint. When new data is found in the database, the UI updates automatically, creating a "live" feel for the user.
