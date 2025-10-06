# Zero-Knowledge Integration Strategy

## Current Architecture (JWE-based)

```
User Wallet → Sign SIWA Message → Backend Verifies → Issues JWE Token
                                                            ↓
                                              Encrypted session with address
```

## Future ZK Architecture

### Phase 1: ZK Proof of Wallet Ownership (Current JWE foundation)

```
User Wallet → Generate ZK Proof of Address → Backend Verifies Proof → Issues JWE Token
                                                                              ↓
                                                        Encrypted session WITHOUT revealing address
```

**Why JWE is perfect for this:**
- ✅ Already encrypts payload (address hidden from network inspection)
- ✅ Can include ZK proof verification timestamp
- ✅ No need to change cookie/session infrastructure

### Phase 2: Privacy-Preserving DeFi Actions

```
User wants to trade → Generate ZK Proof of:
                      • Has sufficient balance
                      • Owns the position
                      • Meets minimum requirements
                      ↓
                Backend verifies proof WITHOUT knowing:
                      • Exact balance
                      • Position size
                      • User identity
                      ↓
                Execute trade with privacy guarantees
```

### Phase 3: ZK-Rollup Integration

```
User Position State (on ZK-Rollup)
        ↓
JWE Session contains:
• ZK proof of state inclusion
• Merkle path (encrypted)
• Rollup batch number
        ↓
Frontend verifies locally
Backend verifies on-chain
```

## Technical Integration Points

### 1. JWE Payload Extensions for ZK

Current payload:
```typescript
{
  address: string;
  userId: string;
  loginTime: number;
}
```

Future ZK-enabled payload:
```typescript
{
  // Option A: Privacy-preserving (address not stored)
  addressCommitment: string;  // Hash of address
  zkProof: string;            // Proof of wallet ownership
  proofTimestamp: number;

  // Option B: Hybrid (address encrypted, proof included)
  address: string;            // Still encrypted in JWE
  zkProofHash: string;        // Proof verification hash
  privacyLevel: 'full' | 'partial' | 'none';
}
```

### 2. ZK Proof Types to Support

**Authentication Proofs:**
- `ProofOfWalletOwnership`: User owns private key for address
- `ProofOfNonceValidity`: Nonce is fresh and unused
- `ProofOfSignatureValidity`: Signature is valid without revealing pubkey

**DeFi Action Proofs:**
- `ProofOfSufficientBalance`: User has ≥X APT without revealing exact amount
- `ProofOfPositionOwnership`: User owns position in market Y
- `ProofOfEligibility`: User meets criteria (balance, activity, etc.)

**Privacy Proofs:**
- `ProofOfMembership`: User is in allowlist without revealing identity
- `ProofOfReputation`: User has X volume without revealing address
- `ProofOfUniqueness`: User hasn't registered before (anti-sybil)

### 3. Libraries to Use

**ZK Proof Generation (Frontend):**
```typescript
// Example with Aptos ZK SDK (when available)
import { generateZKProof } from '@aptos-labs/zk-sdk';

const proof = await generateZKProof({
  type: 'ProofOfWalletOwnership',
  witness: {
    privateKey: userPrivateKey,
    address: userAddress,
  },
  publicInputs: {
    addressCommitment: hash(userAddress),
  }
});
```

**ZK Proof Verification (Backend):**
```typescript
// In verify endpoint
import { verifyZKProof } from '@aptos-labs/zk-sdk';

const isValid = await verifyZKProof({
  proof: zkProof,
  publicInputs: {
    addressCommitment: commitment,
  },
  verificationKey: VERIFI_VK,
});

if (isValid) {
  // Issue JWE token WITHOUT storing actual address
  const jwe = await new EncryptJWT({
    addressCommitment: commitment,
    zkProofHash: hash(zkProof),
    privacyLevel: 'full',
  })
  .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
  .setExpirationTime("24h")
  .encrypt(JWE_SECRET);
}
```

### 4. Database Schema Changes (Future)

```prisma
model User {
  id                    String    @id @default(uuid())

  // Current (Phase 1)
  address               String    @unique

  // Future ZK support (Phase 2+)
  addressCommitment     String?   @unique  // Hash of address for ZK
  zkPublicKey           String?              // ZK proving key
  privacyMode           Boolean   @default(false)

  // ... rest of fields
}

model ZKProof {
  id                String   @id @default(uuid())
  userId            String
  proofType         String   // 'AUTH', 'BALANCE', 'POSITION', etc.
  proofHash         String   @unique
  publicInputs      Json
  verifiedAt        DateTime
  expiresAt         DateTime

  user              User     @relation(fields: [userId], references: [id])

  @@index([userId, proofType])
  @@index([verifiedAt])
}
```

## Migration Path (No Breaking Changes)

### Step 1: Current Implementation (Now)
- JWE with address in payload
- Standard SIWA authentication
- Address stored in plaintext (but JWE-encrypted in transit)

### Step 2: Hybrid Mode (3-6 months)
- Add `privacyMode` flag to User model
- Users can opt-in to ZK authentication
- Both modes supported simultaneously
- JWE payload adapts based on user preference

### Step 3: Full ZK (6-12 months)
- Default to ZK proofs for all new users
- Legacy users can migrate gradually
- Address only stored as commitment
- All DeFi actions use ZK proofs

## Benefits of This Architecture

1. **Privacy by Default**
   - JWE already encrypts session data
   - ZK proofs hide user identity from backend
   - Frontend can verify proofs locally

2. **Regulatory Compliance**
   - Can prove user is not sanctioned (ZK proof)
   - Without revealing user identity
   - Complies with privacy regulations

3. **Scalability**
   - ZK proofs verified off-chain (backend)
   - Only proof hash stored on-chain
   - Reduces blockchain state bloat

4. **Better UX**
   - No wallet popup for every action
   - Generate proof once, reuse for session
   - Faster than signature per transaction

## Example: Private Trading Flow

```typescript
// User wants to buy YES shares worth 100 APT
// But doesn't want to reveal their balance

// 1. Generate ZK proof of sufficient balance
const balanceProof = await generateBalanceProof({
  minRequired: 100, // Public
  actualBalance: 5000, // Private (witness)
  address: userAddress, // Private (witness)
});

// 2. Submit trade with proof
const response = await fetch('/api/market/buy', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jweToken}`, // Session (encrypted)
  },
  body: JSON.stringify({
    marketAddress: '0x123...',
    amount: 100,
    zkBalanceProof: balanceProof, // Proof of sufficient funds
  }),
});

// 3. Backend verifies proof WITHOUT knowing actual balance
// Backend only knows: user has ≥ 100 APT
// Backend does NOT know: user has 5000 APT

// 4. Execute trade with privacy preserved
```

## Security Considerations

1. **Proof Freshness**
   - Include timestamp in proof
   - Verify proof age < 5 minutes
   - Prevent proof replay attacks

2. **Proof Binding**
   - Bind proof to session (JWE token)
   - Prevent proof theft/reuse
   - Include session ID in proof inputs

3. **Trusted Setup**
   - Use universal setup (e.g., Groth16 with Powers of Tau)
   - Publish verification keys publicly
   - Allow community audit

## Resources

- [Aptos ZK Documentation](https://aptos.dev/guides/zk-proof/)
- [Groth16 on Move](https://github.com/aptos-labs/aptos-core/tree/main/aptos-move/framework/aptos-stdlib/sources/cryptography)
- [ZK-SNARK Explainer](https://z.cash/technology/zksnarks/)

## Next Steps

1. ✅ Implement JWE (current)
2. Research Aptos ZK capabilities
3. Design proof circuits for common use cases
4. Implement hybrid auth mode
5. Community feedback and testing
6. Full ZK migration

---

**Note:** This is forward-looking architecture. Current implementation uses JWE with address in payload. ZK integration will be added incrementally without breaking changes.
