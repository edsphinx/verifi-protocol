# Move Scripts Documentation

This directory contains all scripts for interacting with Aptos Move contracts.

## 📁 Directory Structure

```
scripts/move/
├── _archive/           # Deprecated/obsolete scripts
├── _config.ts          # Shared configuration
├── _test-accounts.ts   # Test account management
├── publish-*.ts        # Module publishing scripts
├── test-*.ts          # Testing scripts
├── setup-*.ts         # Initial setup/configuration
├── util-*.ts          # Utility scripts
└── debug-*.ts         # Debugging utilities
```

## 📝 Naming Conventions

All scripts follow a strict naming convention using **kebab-case** format:

### Format: `[category]-[action]-[target].ts`

### Categories:

- **`publish-`** - Publishing Move modules (Aptos-specific terminology)
- **`test-`** - Testing and integration tests
- **`setup-`** - Initial setup and configuration
- **`util-`** - General utilities and helpers
- **`debug-`** - Debugging and troubleshooting tools

### Examples:

```
✅ Correct:
publish-verifi.ts        # Publish VeriFi core modules
test-full-flow.ts        # Full E2E test
setup-register-oracles.ts # Setup oracle registry
util-generate-abis.ts    # Generate TypeScript ABIs
debug-market-registry.ts # Debug market registry

❌ Incorrect:
publishVerifi.ts         # camelCase
publish_verifi.ts        # snake_case
deploy-verifi.ts         # Wrong term (use 'publish' for Aptos)
```

## 🚀 Available Commands

### Publishing (Move Modules)

```bash
pnpm move:compile              # Compile VeriFi contracts
pnpm move:publish              # Compile + publish VeriFi core
pnpm move:publish-tapp         # Publish Tapp.Exchange contracts
pnpm move:publish-hooks        # Publish prediction hooks
pnpm move:publish-all          # Publish all contracts
```

### Testing

```bash
pnpm test:full-flow            # Full end-to-end flow test
pnpm test:trade-flow           # Trading functionality test
pnpm test:oracle-flow          # Oracle integration test
pnpm test:oracle-integration   # Oracle integration suite
pnpm test:tapp-amm             # Tapp AMM functionality
pnpm test:tapp-integration     # Full Tapp integration test
```

### Setup & Configuration

```bash
pnpm setup:oracles             # Register common oracles
pnpm setup:tapp-oracle         # Register Tapp oracle
```

### Utilities

```bash
pnpm util:generate-abis        # Generate TypeScript ABIs from deployed contracts
pnpm util:generate-abis-tapp   # Generate Tapp ABIs
pnpm util:populate-markets     # Populate test markets
pnpm util:cleanup-balances     # Cleanup test account balances
```

### Debugging

```bash
pnpm debug:advanced            # Advanced debugging script
pnpm debug:market-registry     # Debug market registry
pnpm debug:usdc-oracle         # Debug USDC oracle
pnpm debug:resolution          # Debug market resolution
```

## 📋 Script Categories Explained

### 1. Publishing Scripts (`publish-*.ts`)

Scripts that compile and publish Move modules to Aptos blockchain.

**Key Scripts:**
- `publish-verifi.ts` - Publishes core VeriFi protocol modules
- `publish-tapp.ts` - Publishes Tapp.Exchange contracts (from hook-documentation)
- `publish-hooks.ts` - Publishes prediction market hooks
- `publish-all.ts` - Orchestrates publishing all modules

**Usage:**
```bash
# Typical workflow
pnpm move:compile         # Compile first
pnpm move:publish         # Then publish
pnpm util:generate-abis   # Finally, generate ABIs
```

### 2. Testing Scripts (`test-*.ts`)

End-to-end and integration tests for all protocol functionality.

**Test Types:**
- **Flow Tests** - Complete user journeys (create market → trade → resolve)
- **Integration Tests** - Cross-module functionality
- **Component Tests** - Specific feature testing

**Key Tests:**
- `test-full-flow.ts` - Complete protocol flow
- `test-trade-flow.ts` - Buy/sell share functionality
- `test-tapp-integration.ts` - Full Tapp AMM integration

### 3. Setup Scripts (`setup-*.ts`)

Initial configuration and registration scripts.

**Purpose:**
- Register oracles in the oracle registry
- Configure protocol parameters
- Initialize system state

**Run Once:**
These scripts are typically run once after deployment.

### 4. Utility Scripts (`util-*.ts`)

Helper scripts for development and maintenance.

**Common Tasks:**
- Generate TypeScript ABIs from deployed contracts
- Populate test data
- Cleanup test accounts
- Compile contracts

**Most Used:**
```bash
pnpm util:generate-abis    # After every contract update
pnpm util:populate-markets # To create test markets
```

### 5. Debug Scripts (`debug-*.ts`)

Troubleshooting and diagnostic tools.

**When to Use:**
- Contract state inspection
- Transaction debugging
- Oracle data verification
- Market resolution issues

## 🔧 Configuration

### Shared Config (`_config.ts`)

All scripts use shared configuration from `_config.ts`:

```typescript
export const APTOS_CONFIG = {
  network: process.env.NEXT_PUBLIC_APTOS_NETWORK,
  moduleAddress: process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS,
  // ... other config
};
```

### Test Accounts (`_test-accounts.ts`)

Predefined test accounts for consistent testing:

```typescript
export const TEST_ACCOUNTS = {
  deployer: Account.fromPrivateKey(...),
  trader1: Account.fromPrivateKey(...),
  // ... other accounts
};
```

## 📦 Dependencies

All scripts require:

```json
{
  "tsconfig.scripts.json": "TypeScript config for scripts",
  "@aptos-labs/ts-sdk": "Aptos TypeScript SDK",
  "dotenv": "Environment variables"
}
```

## 🔄 Workflow Examples

### New Contract Deployment

```bash
# 1. Compile contracts
pnpm move:compile

# 2. Publish to network
pnpm move:publish

# 3. Generate TypeScript ABIs
pnpm util:generate-abis

# 4. Setup oracles (if needed)
pnpm setup:oracles

# 5. Run tests
pnpm test:full-flow
```

### Tapp Integration Deployment

```bash
# 1. Publish Tapp contracts
pnpm move:publish-tapp

# 2. Publish custom hooks
pnpm move:publish-hooks

# 3. Generate ABIs
pnpm util:generate-abis-tapp

# 4. Test integration
pnpm test:tapp-integration
```

### Daily Development

```bash
# Make changes to contracts
# Then:
pnpm move:publish           # Re-publish
pnpm util:generate-abis     # Update ABIs
pnpm test:trade-flow        # Test changes
```

## ⚠️ Important Notes

### Aptos-Specific Terminology

- ✅ Use **"publish"** not "deploy" (Aptos native term)
- ✅ Use **"module"** not "contract" (Move terminology)
- ✅ Use **"view functions"** not "read functions"

### Best Practices

1. **Always use kebab-case** for new scripts
2. **Add proper JSDoc comments** to all functions
3. **Use TypeScript** with strict types
4. **Follow the category prefix** convention
5. **Keep English only** - no Spanish or other languages
6. **Add error handling** for all blockchain interactions
7. **Log important actions** with clear messages

### Adding New Scripts

When creating a new script:

1. Choose the appropriate category prefix
2. Use kebab-case naming
3. Add to package.json under the correct section
4. Document in this README
5. Add proper error handling and logging

Example:
```typescript
// scripts/move/test-new-feature.ts

/**
 * Tests the new feature functionality
 */

import { aptosClient } from "./_config";

async function main() {
  try {
    console.log("🧪 Testing new feature...");
    // Your test logic
    console.log("✅ Test completed successfully");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

main();
```

Then add to package.json:
```json
{
  "scripts": {
    "test:new-feature": "ts-node --project tsconfig.scripts.json scripts/move/test-new-feature.ts"
  }
}
```

## 📚 Related Documentation

- [Aptos Move Documentation](https://aptos.dev/move/move-on-aptos/)
- [Aptos TypeScript SDK](https://aptos.dev/sdks/ts-sdk/)
- [Tapp.Exchange Hooks](https://github.com/tapp-exchange/hook-documentation)
- [Project CLAUDE.md](../../CLAUDE.md) - Main project documentation

## 🗑️ Archive

Deprecated scripts are moved to `_archive/` directory. These are kept for reference but should not be used in production.

Current archived scripts:
- `test.ts` - Replaced by specific test scripts
- `test_usdc_view.ts` - Replaced by debug-usdc-oracle.ts
- `fund_trader5.ts` - One-off utility script
- `update-addresses.ts` - Deprecated address management

---

**Last Updated:** 2025-01-02

For questions or improvements, please update this documentation when making changes to the scripts directory.
