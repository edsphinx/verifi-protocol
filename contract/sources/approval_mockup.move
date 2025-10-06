/**
 * @title Approval Mockup
 * @notice Mockup contract to test approval-based trading flow
 * @dev Demonstrates how users can approve the protocol once, then execute trades without signing each time
 *
 * Flow:
 * 1. User calls approve() - signs ONCE to allow protocol to trade on their behalf
 * 2. User calls execute_trade() - trades happen WITHOUT additional signature (uses approved allowance)
 * 3. User can revoke() approval at any time
 */
module VeriFiPublisher::approval_mockup {
    use std::signer;
    use aptos_framework::event;
    use aptos_framework::timestamp;

    // === Errors ===
    const E_NOT_APPROVED: u64 = 1;
    const E_APPROVAL_EXPIRED: u64 = 2;
    const E_INSUFFICIENT_ALLOWANCE: u64 = 3;
    const E_ALREADY_APPROVED: u64 = 4;

    // === Constants ===
    const DEFAULT_APPROVAL_DURATION: u64 = 86400; // 24 hours in seconds
    const MAX_TRADE_AMOUNT: u64 = 1000000000; // 10 APT max per trade (in octas)

    // === Events ===
    #[event]
    struct ApprovalGrantedEvent has drop, store {
        user: address,
        max_amount: u64,
        expires_at: u64,
    }

    #[event]
    struct ApprovalRevokedEvent has drop, store {
        user: address,
    }

    #[event]
    struct TradeExecutedEvent has drop, store {
        user: address,
        amount: u64,
        action: vector<u8>, // "BUY" or "SELL"
    }

    // === Data Structures ===

    /**
     * @dev Stores user's approval to let the protocol execute trades on their behalf
     */
    struct UserApproval has key {
        // Maximum APT amount the protocol can spend per trade
        max_amount_per_trade: u64,
        // Timestamp when approval expires
        expires_at: u64,
        // Total amount already spent under this approval
        total_spent: u64,
        // Whether approval is active
        is_active: bool,
    }

    // === Public Functions ===

    /**
     * @notice User approves the protocol to execute trades on their behalf
     * @dev Creates a UserApproval resource that allows gasless trades (from user perspective)
     * @param user The user granting approval
     * @param max_amount_per_trade Maximum APT per individual trade
     * @param duration_seconds How long the approval lasts (default 24h)
     */
    public entry fun approve(
        user: &signer,
        max_amount_per_trade: u64,
        duration_seconds: u64,
    ) {
        let user_addr = signer::address_of(user);

        // Check if user already has an active approval
        assert!(!exists<UserApproval>(user_addr), E_ALREADY_APPROVED);

        let expires_at = timestamp::now_seconds() + duration_seconds;

        // Create approval
        move_to(user, UserApproval {
            max_amount_per_trade,
            expires_at,
            total_spent: 0,
            is_active: true,
        });

        // Emit event
        event::emit(ApprovalGrantedEvent {
            user: user_addr,
            max_amount: max_amount_per_trade,
            expires_at,
        });
    }

    /**
     * @notice Execute a trade using pre-approved allowance (NO signature needed from user)
     * @dev This simulates a trade without requiring user to sign the transaction
     * @param executor Can be anyone (backend, relayer, user themselves)
     * @param user_address The user whose approval is being used
     * @param amount Amount of APT for the trade
     * @param is_buy Whether buying (true) or selling (false)
     */
    public entry fun execute_approved_trade(
        executor: &signer,
        user_address: address,
        amount: u64,
        is_buy: bool,
    ) acquires UserApproval {
        // Check approval exists and is valid
        assert!(exists<UserApproval>(user_address), E_NOT_APPROVED);

        let approval = borrow_global_mut<UserApproval>(user_address);

        // Validate approval
        assert!(approval.is_active, E_NOT_APPROVED);
        assert!(timestamp::now_seconds() <= approval.expires_at, E_APPROVAL_EXPIRED);
        assert!(amount <= approval.max_amount_per_trade, E_INSUFFICIENT_ALLOWANCE);

        // Update spent amount
        approval.total_spent = approval.total_spent + amount;

        // Simulate trade execution
        // In real implementation, this would:
        // 1. Transfer APT from user to market
        // 2. Mint YES/NO shares to user
        // 3. Update market state

        // For mockup, we just emit event
        let action = if (is_buy) { b"BUY" } else { b"SELL" };

        event::emit(TradeExecutedEvent {
            user: user_address,
            amount,
            action,
        });
    }

    /**
     * @notice User revokes their approval
     * @dev Sets approval to inactive, preventing further trades
     */
    public entry fun revoke_approval(user: &signer) acquires UserApproval {
        let user_addr = signer::address_of(user);

        assert!(exists<UserApproval>(user_addr), E_NOT_APPROVED);

        let approval = borrow_global_mut<UserApproval>(user_addr);
        approval.is_active = false;

        event::emit(ApprovalRevokedEvent {
            user: user_addr,
        });
    }

    // === View Functions ===

    #[view]
    public fun get_approval(user_address: address): (bool, u64, u64, u64) acquires UserApproval {
        if (!exists<UserApproval>(user_address)) {
            return (false, 0, 0, 0)
        };

        let approval = borrow_global<UserApproval>(user_address);
        (
            approval.is_active,
            approval.max_amount_per_trade,
            approval.expires_at,
            approval.total_spent,
        )
    }

    #[view]
    public fun is_approved(user_address: address): bool acquires UserApproval {
        if (!exists<UserApproval>(user_address)) {
            return false
        };

        let approval = borrow_global<UserApproval>(user_address);
        approval.is_active && timestamp::now_seconds() <= approval.expires_at
    }

    #[view]
    public fun get_remaining_allowance(user_address: address): u64 acquires UserApproval {
        if (!exists<UserApproval>(user_address)) {
            return 0
        };

        let approval = borrow_global<UserApproval>(user_address);
        if (!approval.is_active || timestamp::now_seconds() > approval.expires_at) {
            return 0
        };

        approval.max_amount_per_trade
    }

    // === Tests ===
    #[test_only]
    use aptos_framework::account;

    #[test(user = @0x123, framework = @aptos_framework)]
    public fun test_approval_flow(user: &signer, framework: &signer) acquires UserApproval {
        // Setup
        let user_addr = signer::address_of(user);
        account::create_account_for_test(user_addr);
        timestamp::set_time_has_started_for_testing(framework);

        // Test approve
        approve(user, 5000000, DEFAULT_APPROVAL_DURATION);

        let (is_active, max_amount, expires_at, total_spent) = get_approval(user_addr);
        assert!(is_active, 0);
        assert!(max_amount == 5000000, 1);
        assert!(total_spent == 0, 2);

        // Test is_approved
        assert!(is_approved(user_addr), 3);

        // Test revoke
        revoke_approval(user);
        assert!(!is_approved(user_addr), 4);
    }

    #[test(user = @0x123, executor = @0x456, framework = @aptos_framework)]
    public fun test_execute_trade(user: &signer, executor: &signer, framework: &signer) acquires UserApproval {
        // Setup
        let user_addr = signer::address_of(user);
        account::create_account_for_test(user_addr);
        account::create_account_for_test(signer::address_of(executor));
        timestamp::set_time_has_started_for_testing(framework);

        // Approve
        approve(user, 5000000, DEFAULT_APPROVAL_DURATION);

        // Execute trade (anyone can call this)
        execute_approved_trade(executor, user_addr, 1000000, true);

        // Check total spent updated
        let (_, _, _, total_spent) = get_approval(user_addr);
        assert!(total_spent == 1000000, 0);
    }

    #[test(user = @0x123, executor = @0x456, framework = @aptos_framework)]
    #[expected_failure(abort_code = E_NOT_APPROVED)]
    public fun test_execute_trade_without_approval(user: &signer, executor: &signer, framework: &signer) acquires UserApproval {
        // Setup
        let user_addr = signer::address_of(user);
        account::create_account_for_test(user_addr);
        account::create_account_for_test(signer::address_of(executor));
        timestamp::set_time_has_started_for_testing(framework);

        // Try to execute without approval - should fail
        execute_approved_trade(executor, user_addr, 1000000, true);
    }
}
