/**
 * @file Service layer for authentication operations using @verifi-sdk/auth-aptos
 * @dev This module handles all database operations for SIWA authentication
 * and session management using Prisma.
 */

import {
  generateNonce,
  initJWE,
  encryptSession,
  verifyEd25519,
  deriveAptosAddress,
  ed25519HexToPublicKey,
} from "@verifi-sdk/auth-aptos";
import client from "@/lib/clients/prisma";
import type { User, Session, Nonce } from "@/lib/types/auth";

// Initialize JWE encryption
// Convert hex string to bytes (32 bytes = 256 bits)
const jweSecret = process.env.JWE_SECRET;

// Defensive validation
if (!jweSecret || jweSecret.trim() === "") {
  throw new Error(
    "JWE_SECRET environment variable is required and cannot be empty",
  );
}

if (jweSecret.length !== 64) {
  throw new Error(
    `JWE_SECRET must be 64 hex characters (32 bytes), got ${jweSecret.length} characters`,
  );
}

if (!/^[0-9a-fA-F]{64}$/.test(jweSecret)) {
  throw new Error("JWE_SECRET must be a valid 64-character hexadecimal string");
}

const secretBytes = Buffer.from(jweSecret, "hex");

if (secretBytes.length !== 32) {
  throw new Error(
    `JWE_SECRET decoded to ${secretBytes.length} bytes, expected 32 bytes`,
  );
}

initJWE({
  secret: secretBytes,
});

// ============================================================================
// Nonce Management
// ============================================================================

/**
 * @notice Generates a new cryptographic nonce for SIWA
 * @dev Uses @verifi-sdk/auth-aptos for secure nonce generation
 * @returns Object containing nonce and expiration metadata
 * @todo Add Nonce model to Prisma schema before using this function
 */
export async function createNonce(): Promise<{
  nonce: string;
  expiresAt: Date;
}> {
  throw new Error("Nonce model not implemented in schema. Add User, Session, and Nonce models to prisma/schema.prisma");

  // TODO: Uncomment when schema is updated
  // const nonce = generateNonce();
  // const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  //
  // await client.nonce.create({
  //   data: {
  //     nonce,
  //     expiresAt,
  //     used: false,
  //   },
  // });
  //
  // return { nonce, expiresAt };
}

/**
 * @notice Validates a nonce before use
 * @param nonce The nonce string to validate
 * @returns The nonce record if valid, null if invalid/expired/used
 * @todo Add Nonce model to Prisma schema before using this function
 */
export async function validateNonce(nonce: string): Promise<Nonce | null> {
  throw new Error("Nonce model not implemented in schema. Add User, Session, and Nonce models to prisma/schema.prisma");

  // TODO: Uncomment when schema is updated
  // const nonceRecord = await client.nonce.findUnique({
  //   where: { nonce },
  // });
  //
  // if (!nonceRecord) return null;
  // if (nonceRecord.used) return null;
  // if (new Date() > nonceRecord.expiresAt) return null;
  //
  // return nonceRecord;
}

/**
 * @notice Marks a nonce as used
 * @param nonce The nonce to mark as used
 * @todo Add Nonce model to Prisma schema before using this function
 */
export async function markNonceAsUsed(nonce: string): Promise<void> {
  throw new Error("Nonce model not implemented in schema. Add User, Session, and Nonce models to prisma/schema.prisma");

  // TODO: Uncomment when schema is updated
  // await client.nonce.update({
  //   where: { nonce },
  //   data: { used: true },
  // });
}

// ============================================================================
// User Management
// ============================================================================

/**
 * @notice Gets or creates a user by address
 * @param address The Aptos address
 * @returns The user record
 * @todo Add User model to Prisma schema before using this function
 */
export async function getOrCreateUser(address: string): Promise<User> {
  throw new Error("User model not implemented in schema. Add User, Session, and Nonce models to prisma/schema.prisma");

  // TODO: Uncomment when schema is updated
  // let user = await client.user.findUnique({
  //   where: { address },
  // });
  //
  // if (!user) {
  //   user = await client.user.create({
  //     data: {
  //       address,
  //       lastLogin: new Date(),
  //     },
  //   });
  // } else {
  //   await client.user.update({
  //     where: { address },
  //     data: { lastLogin: new Date() },
  //   });
  // }
  //
  // return user;
}

// ============================================================================
// Session Management
// ============================================================================

interface VerifySIWAParams {
  fullMessage: string;
  signature: string;
  address: string;
  publicKey: string;
  nonce: string;
}

interface AuthResult {
  success: boolean;
  token?: string;
  address?: string;
  userId?: string;
  error?: string;
}

/**
 * @notice Verifies SIWA signature and creates session
 * @dev Main authentication flow using @verifi-sdk/auth-aptos
 * @param params SIWA verification parameters
 * @returns Authentication result with token or error
 */
export async function verifySIWAAndCreateSession(
  params: VerifySIWAParams,
): Promise<AuthResult> {
  try {
    const { fullMessage, signature, address, publicKey, nonce } = params;

    // 1. Validate nonce
    const nonceRecord = await validateNonce(nonce);
    if (!nonceRecord) {
      return { success: false, error: "Invalid or expired nonce" };
    }

    // 2. Verify signature using @verifi-sdk/auth-aptos
    // The fullMessage from wallet already contains: APTOS\naddress:...\nchain_id:...\napplication:...\nnonce:...\nmessage:...
    try {
      console.log("=== SIWA Verification Debug ===");
      console.log("Address:", address);
      console.log("PublicKey:", publicKey);
      console.log("Signature:", signature);
      console.log("FullMessage:", fullMessage);

      // Verify the signature with our SDK
      const isValid = await verifyEd25519(signature, fullMessage, publicKey);
      console.log("Signature valid:", isValid);

      if (!isValid) {
        console.error("❌ Signature verification FAILED");
        console.error("This usually means:");
        console.error("1. PublicKey doesn't match the signature");
        console.error("2. Message was modified");
        console.error("3. Wrong signing algorithm");
        return { success: false, error: "Invalid signature" };
      }

      console.log("✅ Signature verification PASSED");

      // Verify that the public key derives to the correct address
      const pubKeyBytes = ed25519HexToPublicKey(publicKey);
      const derivedAddress = deriveAptosAddress(pubKeyBytes);
      console.log("Derived address:", derivedAddress);
      console.log("Expected address:", address);

      if (derivedAddress.toLowerCase() !== address.toLowerCase()) {
        return { success: false, error: "Address mismatch" };
      }
    } catch (error) {
      console.error("Signature verification error:", error);
      return { success: false, error: "Signature verification failed" };
    }

    // NOTE: The following code requires User, Session, and Nonce models in the Prisma schema
    // TODO: Add these models to prisma/schema.prisma and uncomment the code below

    return { success: false, error: "Auth service not fully implemented - schema models required" };

    // 3. Mark nonce as used
    // await markNonceAsUsed(nonce);
    //
    // // 4. Get or create user
    // const user = await getOrCreateUser(address);
    //
    // // 5. Create encrypted session token using @verifi-sdk/auth-core
    // const jwe = await encryptSession(
    //   {
    //     address,
    //     publicKey,
    //     loginTime: Date.now(),
    //     userId: user.id,
    //   },
    //   {
    //     expiresIn: "24h",
    //   },
    // );
    //
    // // 6. Store session in database
    // await client.session.create({
    //   data: {
    //     userId: user.id,
    //     token: jwe,
    //     expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    //   },
    // });
    //
    // return {
    //   success: true,
    //   token: jwe,
    //   address,
    //   userId: user.id,
    // };
  } catch (error) {
    console.error("SIWA verification failed:", error);
    return { success: false, error: "Verification failed" };
  }
}

/**
 * @notice Retrieves active sessions for a user
 * @param userId The user ID
 * @returns Array of active sessions
 * @todo Add Session model to Prisma schema before using this function
 */
export async function getUserSessions(userId: string): Promise<Session[]> {
  throw new Error("Session model not implemented in schema. Add User, Session, and Nonce models to prisma/schema.prisma");

  // TODO: Uncomment when schema is updated
  // return await client.session.findMany({
  //   where: {
  //     userId,
  //     expiresAt: {
  //       gt: new Date(),
  //     },
  //   },
  //   orderBy: {
  //     createdAt: "desc",
  //   },
  // });
}

/**
 * @notice Invalidates a session
 * @param sessionId The session ID to invalidate
 * @todo Add Session model to Prisma schema before using this function
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  throw new Error("Session model not implemented in schema. Add User, Session, and Nonce models to prisma/schema.prisma");

  // TODO: Uncomment when schema is updated
  // await client.session.delete({
  //   where: { id: sessionId },
  // });
}

/**
 * @notice Invalidates all sessions for a user
 * @param userId The user ID
 * @todo Add Session model to Prisma schema before using this function
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  throw new Error("Session model not implemented in schema. Add User, Session, and Nonce models to prisma/schema.prisma");

  // TODO: Uncomment when schema is updated
  // await client.session.deleteMany({
  //   where: { userId },
  // });
}

// ============================================================================
// Wallet Adapter signIn() Support
// ============================================================================

interface AptosSignInOutput {
  version: "2";
  type: "ed25519" | "multi_ed25519" | "single_key" | "multi_key";
  signature: string;
  publicKey: string;
  input: {
    address: string;
    nonce: string;
    domain: string;
    uri: string;
    statement: string;
    version: string;
    chainId: string;
  };
}

interface AptosSignInInput {
  nonce: string;
  domain: string;
  statement?: string;
  uri?: string;
  version?: string;
  chainId?: string;
}

/**
 * @notice Verifies wallet adapter signIn() output and creates session
 * @dev Handles the official Aptos Wallet Standard signIn() method
 * @param output The AptosSignInOutput from wallet.signIn()
 * @param expectedInput The original AptosSignInInput that was sent to the wallet
 * @returns Authentication result with token or error
 */
export async function verifySIWASignInOutput(
  output: AptosSignInOutput,
  expectedInput: AptosSignInInput,
): Promise<AuthResult> {
  try {
    console.log("=== Wallet Adapter signIn() Verification ===");
    console.log("Output:", JSON.stringify(output, null, 2));

    // 1. Validate nonce
    const nonceRecord = await validateNonce(output.input.nonce);
    if (!nonceRecord) {
      return { success: false, error: "Invalid or expired nonce" };
    }

    // 2. Verify input matches expected (prevent replay attacks)
    if (
      output.input.nonce !== expectedInput.nonce ||
      output.input.domain !== expectedInput.domain
    ) {
      return { success: false, error: "Input mismatch" };
    }

    // 3. Reconstruct the message that was signed
    // Format follows official Aptos SIWA standard:
    // {domain} wants you to sign in with your Aptos account:
    // {address}
    //
    // {statement}
    //
    // URI: {uri}
    // Version: {version}
    // Nonce: {nonce}
    // [Issued At: {issuedAt}]
    // [Expiration Time: {expirationTime}]
    // Chain ID: {chainId}

    let fullMessage = `${output.input.domain} wants you to sign in with your Aptos account:\n`;
    fullMessage += `${output.input.address}`;

    if (output.input.statement) {
      fullMessage += `\n\n${output.input.statement}`;
    }

    const fields: string[] = [];
    if (output.input.uri) fields.push(`URI: ${output.input.uri}`);
    if (output.input.version) fields.push(`Version: ${output.input.version}`);
    if (output.input.nonce) fields.push(`Nonce: ${output.input.nonce}`);
    if ((output.input as any).issuedAt) fields.push(`Issued At: ${(output.input as any).issuedAt}`);
    if ((output.input as any).expirationTime) fields.push(`Expiration Time: ${(output.input as any).expirationTime}`);
    if (output.input.chainId) fields.push(`Chain ID: ${output.input.chainId}`);

    if (fields.length) {
      fullMessage += `\n\n${fields.join("\n")}`;
    }

    console.log("Reconstructed message:", fullMessage);

    // 4. Verify signature with SIWA domain separator
    // The wallet signs: sha3_256("SIGN_IN_WITH_APTOS::") || message_bytes
    // We need to apply the same domain separator for verification
    const { sha3_256 } = await import("@noble/hashes/sha3");
    const domainSeparator = "SIGN_IN_WITH_APTOS::";
    const domainSeparatorHash = sha3_256(domainSeparator);
    const messageBytes = new TextEncoder().encode(fullMessage);
    const signingBytes = new Uint8Array([...domainSeparatorHash, ...messageBytes]);

    // verifyEd25519 expects the message parameter to be what was actually signed
    // For SIWA, that's the domain separator hash concatenated with the message
    const isValid = await verifyEd25519(
      output.signature,
      signingBytes as any, // Pass the bytes directly
      output.publicKey,
    );

    if (!isValid) {
      console.error("❌ Signature verification FAILED");
      return { success: false, error: "Invalid signature" };
    }

    console.log("✅ Signature verification PASSED");

    // 5. Verify address derivation
    const pubKeyBytes = ed25519HexToPublicKey(output.publicKey);
    const derivedAddress = deriveAptosAddress(pubKeyBytes);
    console.log("Derived address:", derivedAddress);
    console.log("Expected address:", output.input.address);

    if (derivedAddress.toLowerCase() !== output.input.address.toLowerCase()) {
      return { success: false, error: "Address mismatch" };
    }

    // NOTE: The following code requires User, Session, and Nonce models in the Prisma schema
    // TODO: Add these models to prisma/schema.prisma and uncomment the code below

    return { success: false, error: "Auth service not fully implemented - schema models required" };

    // 6. Mark nonce as used
    // await markNonceAsUsed(output.input.nonce);
    //
    // // 7. Get or create user
    // const user = await getOrCreateUser(output.input.address);
    //
    // // 8. Create encrypted session token
    // const jwe = await encryptSession(
    //   {
    //     address: output.input.address,
    //     publicKey: output.publicKey,
    //     loginTime: Date.now(),
    //     userId: user.id,
    //   },
    //   {
    //     expiresIn: "24h",
    //   },
    // );
    //
    // // 9. Store session in database
    // await client.session.create({
    //   data: {
    //     userId: user.id,
    //     token: jwe,
    //     expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    //   },
    // });
    //
    // return {
    //   success: true,
    //   token: jwe,
    //   address: output.input.address,
    //   userId: user.id,
    // };
  } catch (error) {
    console.error("signIn() verification failed:", error);
    return { success: false, error: "Verification failed" };
  }
}
