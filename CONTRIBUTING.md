# VeriFi Protocol: Coding Conventions & Standards

This document outlines the architectural patterns, naming conventions, and standards for the VeriFi Protocol frontend. Following these guidelines ensures the codebase remains clean, maintainable, and scalable.

## 1. Core Architectural Pattern: Separation of Concerns

The project follows a strict separation of concerns. Each layer of the application has a single, well-defined responsibility.

-   **UI Components (`/components`)**: Responsible only for rendering UI and handling user input events. They should contain minimal to no business logic.
-   **API Routes (`/app/api`)**: Act as **Orchestrators**. They are the only layer that should communicate with both the database services and the on-chain query functions. They fetch, combine, and format data for the frontend.
-   **Service Layer (`/services`)**: Responsible only for **database logic**. This is the single interface to the Prisma client.
-   **Blockchain Layer (`/aptos`)**: The single source of truth for all on-chain interactions, types, and configurations.

## 2. Directory Structure

To maintain clarity, all code related to the Aptos blockchain is centralized in a single top-level `/aptos` directory.


/
├── aptos/
│   ├── abis/         # Generated contract ABIs
│   ├── queries/      # Server-side functions & client-side hooks for on-chain view calls
│   ├── transactions/ # Server-side payload builders for on-chain entry functions
│   ├── types/        # Shared TypeScript types for the blockchain layer
│   ├── client.ts     # Singleton Aptos client instance
│   └── constants.ts  # Protocol constants (e.g., MODULE_ADDRESS)
│
├── app/
├── components/
├── contract/
├── lib/
│   └── clients/      # External clients (e.g., Prisma)
└── services/         # Database service layer


## 3. Naming Conventions

A consistent naming scheme is used across the project.

-   **Files**: `kebab-case.ts`
    -   *Example:* `get-market-details.ts`, `build-buy-shares-payload.ts`

-   **Functions & Variables**: `camelCase`
    -   *Example:* `getMarketDetails`, `buildBuySharesPayload`

-   **Types, Interfaces & React Components**: `PascalCase`
    -   *Example:* `MarketDetailsData`, `ActionPanel`

## 4. Import Strategy (Barrel Files)

To simplify imports and create clean entry points for each module, we use **barrel files** (`index.ts`). Each subdirectory within `/aptos` should contain an `index.ts` file that re-exports all of its public modules.

**Example:** Instead of long, specific imports, we can use a cleaner, module-level import.

-   **Before (Incorrect):**
    ```typescript
    import { getMarketDetails } from "@/aptos/queries/get-market-details";
    import { useMarketDetails } from "@/aptos/queries/use-market-details";
    ```

-   **After (Correct):**
    ```typescript
    import { getMarketDetails, useMarketDetails } from "@/aptos/queries";
    ```

**Implementation (`aptos/queries/index.ts`):**
```typescript
// aptos/queries/index.ts
export * from "./get-market-details";
export * from "./use-market-details";
// ... export all other functions and hooks in this directory
