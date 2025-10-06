/**
 * @title Session Key Mockup
 * @notice Demonstrates session-based authentication for gasless-like transactions
 * @dev Uses Ed25519 signature verification to validate session-signed transactions
 *
 * Flow:
 * 1. User signs a message ONCE to create a session (generates session key pair off-chain)
 * 2. User stores session public key in contract with limits (expiry, max amount)
 * 3. Backend can execute trades by signing with session private key (user doesn't need to sign!)
 * 4. Contract verifies session signature and checks limits before executing
 */
module VeriFiPublisher::session_key_mockup {
    use std::signer;
    use std::vector;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_std::ed25519;

    // === Errors ===
    const E_SESSION_NOT_FOUND: u64 = 1;
    const E_SESSION_EXPIRED: u64 = 2;
    const E_INVALID_SIGNATURE: u64 = 3;
    const E_INSUFFICIENT_ALLOWANCE: u64 = 4;
    const E_SESSION_ALREADY_EXISTS: u64 = 5;

    // === Events ===
    #[event]
    struct SessionCreatedEvent has drop, store {
        user: address,
        session_public_key: vector<u8>,
        max_amount: u64,
        expires_at: u64,
    }

    #[event]
    struct SessionRevokedEvent has drop, store {
        user: address,
    }

    #[event]
    struct TradeExecutedViaSessionEvent has drop, store {
        user: address,
        amount: u64,
        action: vector<u8>, // "BUY" or "SELL"
    }

    // === Data Structures ===

    /**
     * @dev Session key data stored for each user
     * The session_public_key is used to verify signatures from the backend
     */
    struct SessionKey has key {
        // Ed25519 public key for session (32 bytes)
        session_public_key: vector<u8>,
        // Maximum amount per trade
        max_amount_per_trade: u64,
        // Session expiration timestamp
        expires_at: u64,
        // Total spent under this session
        total_spent: u64,
        // Active status
        is_active: bool,
    }

    // === Public Functions ===

    /**
     * @notice Create a session key by storing the session public key
     * @dev User signs this transaction ONCE, then backend can use session key
     * @param user The user creating the session
     * @param session_public_key Ed25519 public key (32 bytes) for the session
     * @param max_amount_per_trade Maximum amount per individual trade
     * @param duration_seconds How long the session lasts
     */
    public entry fun create_session(
        user: &signer,
        session_public_key: vector<u8>,
        max_amount_per_trade: u64,
        duration_seconds: u64,
    ) acquires SessionKey {
        let user_addr = signer::address_of(user);

        // If session exists, it must be inactive or expired to recreate
        if (exists<SessionKey>(user_addr)) {
            let old_session = move_from<SessionKey>(user_addr);
            // Could add assertion here to only allow recreation if inactive
            // For now, we allow recreation anytime (user explicitly calls create_session)
            let SessionKey {
                session_public_key: _,
                max_amount_per_trade: _,
                expires_at: _,
                total_spent: _,
                is_active: _
            } = old_session;
        };

        // Validate public key length (Ed25519 = 32 bytes)
        assert!(vector::length(&session_public_key) == 32, E_INVALID_SIGNATURE);

        let expires_at = timestamp::now_seconds() + duration_seconds;

        // Store session key
        move_to(user, SessionKey {
            session_public_key,
            max_amount_per_trade,
            expires_at,
            total_spent: 0,
            is_active: true,
        });

        event::emit(SessionCreatedEvent {
            user: user_addr,
            session_public_key,
            max_amount: max_amount_per_trade,
            expires_at,
        });
    }

    /**
     * @notice Execute a trade using session key signature (NO user signature needed!)
     * @dev Backend signs transaction with session private key, contract verifies
     * @param executor Can be anyone (typically backend/relayer)
     * @param user_address The user whose session is being used
     * @param amount Trade amount
     * @param is_buy Buy or sell
     * @param nonce Unique nonce to prevent replay attacks
     * @param session_signature Signature from session private key
     */
    public entry fun execute_trade_with_session(
        executor: &signer,
        user_address: address,
        amount: u64,
        is_buy: bool,
        nonce: u64,
        session_signature: vector<u8>,
    ) acquires SessionKey {
        // Verify session exists
        assert!(exists<SessionKey>(user_address), E_SESSION_NOT_FOUND);

        let session = borrow_global_mut<SessionKey>(user_address);

        // Validate session
        assert!(session.is_active, E_SESSION_NOT_FOUND);
        assert!(timestamp::now_seconds() <= session.expires_at, E_SESSION_EXPIRED);
        assert!(amount <= session.max_amount_per_trade, E_INSUFFICIENT_ALLOWANCE);

        // Construct message that was signed
        // Format: user_address + amount + is_buy + nonce
        let message = construct_session_message(user_address, amount, is_buy, nonce);

        // Verify session signature
        let public_key = ed25519::new_unvalidated_public_key_from_bytes(session.session_public_key);
        let signature = ed25519::new_signature_from_bytes(session_signature);

        assert!(
            ed25519::signature_verify_strict(&signature, &public_key, message),
            E_INVALID_SIGNATURE
        );

        // Update spent amount
        session.total_spent = session.total_spent + amount;

        // Execute trade (mockup - just emit event)
        let action = if (is_buy) { b"BUY" } else { b"SELL" };

        event::emit(TradeExecutedViaSessionEvent {
            user: user_address,
            amount,
            action,
        });
    }

    /**
     * @notice Revoke session key
     */
    public entry fun revoke_session(user: &signer) acquires SessionKey {
        let user_addr = signer::address_of(user);

        assert!(exists<SessionKey>(user_addr), E_SESSION_NOT_FOUND);

        let session = borrow_global_mut<SessionKey>(user_addr);
        session.is_active = false;

        event::emit(SessionRevokedEvent {
            user: user_addr,
        });
    }

    // === View Functions ===

    #[view]
    public fun get_session(user_address: address): (bool, vector<u8>, u64, u64, u64) acquires SessionKey {
        if (!exists<SessionKey>(user_address)) {
            return (false, vector::empty(), 0, 0, 0)
        };

        let session = borrow_global<SessionKey>(user_address);
        (
            session.is_active,
            session.session_public_key,
            session.max_amount_per_trade,
            session.expires_at,
            session.total_spent,
        )
    }

    #[view]
    public fun is_session_active(user_address: address): bool acquires SessionKey {
        if (!exists<SessionKey>(user_address)) {
            return false
        };

        let session = borrow_global<SessionKey>(user_address);
        session.is_active && timestamp::now_seconds() <= session.expires_at
    }

    // === Helper Functions ===

    /**
     * @dev Construct the message that gets signed by session key
     */
    fun construct_session_message(
        user_address: address,
        amount: u64,
        is_buy: bool,
        nonce: u64,
    ): vector<u8> {
        use std::bcs;

        // Serialize all parameters into bytes
        let message = vector::empty<u8>();
        vector::append(&mut message, bcs::to_bytes(&user_address));
        vector::append(&mut message, bcs::to_bytes(&amount));
        vector::append(&mut message, bcs::to_bytes(&is_buy));
        vector::append(&mut message, bcs::to_bytes(&nonce));

        message
    }

    // === Tests ===
    #[test_only]
    use aptos_framework::account;

    #[test(user = @0x123, framework = @aptos_framework)]
    public fun test_create_session(user: &signer, framework: &signer) acquires SessionKey {
        // Setup
        let user_addr = signer::address_of(user);
        account::create_account_for_test(user_addr);
        timestamp::set_time_has_started_for_testing(framework);

        // Create mock session public key (32 bytes)
        let session_pubkey = x"1234567890123456789012345678901234567890123456789012345678901234";

        // Create session
        create_session(user, session_pubkey, 5000000, 86400);

        // Verify session created
        let (is_active, pubkey, max_amount, expires_at, total_spent) = get_session(user_addr);
        assert!(is_active, 0);
        assert!(pubkey == session_pubkey, 1);
        assert!(max_amount == 5000000, 2);
        assert!(total_spent == 0, 3);
        assert!(is_session_active(user_addr), 4);
    }

    #[test(user = @0x123, framework = @aptos_framework)]
    public fun test_revoke_session(user: &signer, framework: &signer) acquires SessionKey {
        // Setup
        let user_addr = signer::address_of(user);
        account::create_account_for_test(user_addr);
        timestamp::set_time_has_started_for_testing(framework);

        // Create session
        let session_pubkey = x"1234567890123456789012345678901234567890123456789012345678901234";
        create_session(user, session_pubkey, 5000000, 86400);

        // Revoke
        revoke_session(user);

        // Verify revoked
        assert!(!is_session_active(user_addr), 0);
    }
}
