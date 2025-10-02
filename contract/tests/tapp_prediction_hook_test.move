#[test_only]
module VeriFiPublisher::tapp_prediction_hook_test {
    use std::signer;
    use std::vector;
    use std::option;
    use std::string;

    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::aptos_coin;
    use aptos_framework::coin::{BurnCapability, MintCapability};
    use aptos_std::bcs_stream;
    use aptos_std::bcs;

    use VeriFiPublisher::verifi_protocol::{Self, Market};
    use VeriFiPublisher::tapp_prediction_hook;
    use VeriFiPublisher::access_control;
    use VeriFiPublisher::oracle_registry;

    // Test capabilities storage
    struct TestCaps has key {
        burn_cap: BurnCapability<aptos_coin::AptosCoin>,
        mint_cap: MintCapability<aptos_coin::AptosCoin>,
    }

    // Test constants
    const OCTAS_PER_APT: u64 = 100000000;
    const OPERATOR_GREATER_THAN: u8 = 0;

    // Error codes
    const E_TRADING_DISABLED: u64 = 2;
    const E_SLIPPAGE_EXCEEDED: u64 = 4;

    // Helper function to setup protocol
    fun setup_protocol(admin: &signer) {
        // Initialize AptosCoin
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(&account::create_signer_for_test(@0x1));

        // Initialize modules
        access_control::init_for_test(admin);
        oracle_registry::init_for_test(admin);
        verifi_protocol::init_for_test(admin);

        // Store capabilities
        move_to(admin, TestCaps { burn_cap, mint_cap });

        // Initialize timestamp
        timestamp::set_time_has_started_for_testing(&account::create_signer_for_test(@0x1));
        timestamp::fast_forward_seconds(1000);
    }

    // Helper to create a test market
    fun create_test_market(admin: &signer, creator: &signer): Object<Market> {
        // Register oracle
        let oracle_id = string::utf8(b"test_oracle");
        oracle_registry::register_oracle(admin, oracle_id, string::utf8(b"Test Oracle"));

        // Create market with 1 hour until resolution
        let resolution_time = timestamp::now_seconds() + 3600;

        verifi_protocol::create_market(
            creator,
            string::utf8(b"Test Market"),
            resolution_time,
            signer::address_of(admin),
            oracle_id,
            @0x1234,
            string::utf8(b"balance"),
            100,
            OPERATOR_GREATER_THAN,
        );

        // Get created market
        let all_markets = verifi_protocol::get_all_markets();
        *vector::borrow(&all_markets, 0)
    }

    // Helper to create BCS stream for add_liquidity
    fun create_add_liquidity_stream(
        amount_yes: u64,
        amount_no: u64,
        min_lp_tokens: u64
    ): vector<u8> {
        let stream_data = vector::empty<u8>();
        vector::append(&mut stream_data, bcs::to_bytes(&amount_yes));
        vector::append(&mut stream_data, bcs::to_bytes(&amount_no));
        vector::append(&mut stream_data, bcs::to_bytes(&min_lp_tokens));
        stream_data
    }

    // Helper to create BCS stream for swap
    fun create_swap_stream(
        amount_in: u64,
        yes_to_no: bool,
        min_amount_out: u64
    ): vector<u8> {
        let stream_data = vector::empty<u8>();
        vector::append(&mut stream_data, bcs::to_bytes(&amount_in));
        vector::append(&mut stream_data, bcs::to_bytes(&yes_to_no));
        vector::append(&mut stream_data, bcs::to_bytes(&min_amount_out));
        stream_data
    }

    // ===== CORE TESTS =====

    #[test(admin = @VeriFiPublisher, creator = @0x247058d0fa4d63683376116b11ab90bea4a9582141794d83ddbcce5a75b3578c)]
    fun test_pool_seed_deterministic(admin: &signer, creator: &signer) {
        setup_protocol(admin);
        let market = create_test_market(admin, creator);

        let (yes_token, no_token) = verifi_protocol::get_market_tokens(market);
        let yes_addr = object::object_address(&yes_token);
        let no_addr = object::object_address(&no_token);

        let assets = vector::empty<address>();
        vector::push_back(&mut assets, yes_addr);
        vector::push_back(&mut assets, no_addr);

        // Generate seed multiple times - should be deterministic
        let seed1 = tapp_prediction_hook::pool_seed(assets, 0);
        let seed2 = tapp_prediction_hook::pool_seed(assets, 0);

        assert!(seed1 == seed2, 1);
    }

    #[test(admin = @VeriFiPublisher, creator = @0x247058d0fa4d63683376116b11ab90bea4a9582141794d83ddbcce5a75b3578c, pool_signer = @0x55ba2b4d7be676e77bbfef29c27401c9862eb6682e66b45e5924da34324c55cd)]
    fun test_create_pool_initializes_correctly(admin: &signer, creator: &signer, pool_signer: &signer) {
        setup_protocol(admin);
        account::create_account_for_test(signer::address_of(pool_signer));
        let market = create_test_market(admin, creator);

        let (yes_token, no_token) = verifi_protocol::get_market_tokens(market);
        let yes_addr = object::object_address(&yes_token);
        let no_addr = object::object_address(&no_token);

        let assets = vector::empty<address>();
        vector::push_back(&mut assets, yes_addr);
        vector::push_back(&mut assets, no_addr);

        // Create pool
        tapp_prediction_hook::create_pool(
            pool_signer,
            assets,
            0,
            signer::address_of(admin)
        );

        // Verify initial state
        let pool_addr = signer::address_of(pool_signer);
        let (reserve_yes, reserve_no) = tapp_prediction_hook::get_reserves(pool_addr);

        assert!(reserve_yes == 0, 1);
        assert!(reserve_no == 0, 2);
        assert!(tapp_prediction_hook::is_trading_enabled(pool_addr), 3);
    }

    #[test(admin = @VeriFiPublisher, creator = @0x247058d0fa4d63683376116b11ab90bea4a9582141794d83ddbcce5a75b3578c, pool_signer = @0x55ba2b4d7be676e77bbfef29c27401c9862eb6682e66b45e5924da34324c55cd)]
    fun test_get_current_fee_returns_base_fee(admin: &signer, creator: &signer, pool_signer: &signer) {
        account::create_account_for_test(signer::address_of(pool_signer));
        setup_protocol(admin);
        let market = create_test_market(admin, creator);

        let (yes_token, no_token) = verifi_protocol::get_market_tokens(market);
        let yes_addr = object::object_address(&yes_token);
        let no_addr = object::object_address(&no_token);

        let assets = vector::empty<address>();
        vector::push_back(&mut assets, yes_addr);
        vector::push_back(&mut assets, no_addr);

        tapp_prediction_hook::create_pool(pool_signer, assets, 0, signer::address_of(admin));

        // Check fee (should be 30 basis points = 0.3%)
        let pool_addr = signer::address_of(pool_signer);
        let current_fee = tapp_prediction_hook::get_current_fee(pool_addr);

        assert!(current_fee == 30, 1); // BASE_FEE = 30 basis points
    }

    #[test(admin = @VeriFiPublisher, creator = @0x247058d0fa4d63683376116b11ab90bea4a9582141794d83ddbcce5a75b3578c, pool_signer = @0x55ba2b4d7be676e77bbfef29c27401c9862eb6682e66b45e5924da34324c55cd)]
    fun test_get_current_fee_increases_near_resolution(admin: &signer, creator: &signer, pool_signer: &signer) {
        account::create_account_for_test(signer::address_of(pool_signer));
        setup_protocol(admin);
        let market = create_test_market(admin, creator);

        let (yes_token, no_token) = verifi_protocol::get_market_tokens(market);
        let yes_addr = object::object_address(&yes_token);
        let no_addr = object::object_address(&no_token);

        let assets = vector::empty<address>();
        vector::push_back(&mut assets, yes_addr);
        vector::push_back(&mut assets, no_addr);

        tapp_prediction_hook::create_pool(pool_signer, assets, 0, signer::address_of(admin));

        // Fast forward to 30 minutes before resolution (< 1 hour = volatility window)
        timestamp::fast_forward_seconds(1800);

        // Check fee (should be 50 basis points = 0.5%)
        let pool_addr = signer::address_of(pool_signer);
        let current_fee = tapp_prediction_hook::get_current_fee(pool_addr);

        assert!(current_fee == 50, 1); // VOLATILITY_FEE = 50 basis points
    }

    #[test(admin = @VeriFiPublisher, creator = @0x247058d0fa4d63683376116b11ab90bea4a9582141794d83ddbcce5a75b3578c, pool_signer = @0x55ba2b4d7be676e77bbfef29c27401c9862eb6682e66b45e5924da34324c55cd, resolver = @0xd3b36c7fea14a6939ec4a8bebb422459e85b65f523b3babffd31ddf2f1479c1d)]
    fun test_trading_disabled_after_resolution(admin: &signer, creator: &signer, pool_signer: &signer, resolver: &signer) {
        account::create_account_for_test(signer::address_of(pool_signer));
        setup_protocol(admin);

        // Register oracle
        let oracle_id = string::utf8(b"resolvable_oracle");
        oracle_registry::register_oracle(admin, oracle_id, string::utf8(b"Resolvable Oracle"));

        // Create market with resolver
        let resolution_time = timestamp::now_seconds() + 100;
        verifi_protocol::create_market(
            creator,
            string::utf8(b"Resolvable Market"),
            resolution_time,
            signer::address_of(resolver),
            oracle_id,
            @0x1234,
            string::utf8(b"balance"),
            100,
            OPERATOR_GREATER_THAN,
        );

        let all_markets = verifi_protocol::get_all_markets();
        let market = *vector::borrow(&all_markets, 0);

        let (yes_token, no_token) = verifi_protocol::get_market_tokens(market);
        let yes_addr = object::object_address(&yes_token);
        let no_addr = object::object_address(&no_token);

        let assets = vector::empty<address>();
        vector::push_back(&mut assets, yes_addr);
        vector::push_back(&mut assets, no_addr);

        tapp_prediction_hook::create_pool(pool_signer, assets, 0, signer::address_of(admin));

        let pool_addr = signer::address_of(pool_signer);

        // Trading should be enabled initially
        assert!(tapp_prediction_hook::is_trading_enabled(pool_addr), 1);

        // Fast forward and resolve market
        timestamp::fast_forward_seconds(101);
        verifi_protocol::resolve_market(resolver, market, true);

        // Trading should be disabled after resolution
        assert!(!tapp_prediction_hook::is_trading_enabled(pool_addr), 2);
    }

    #[test(admin = @VeriFiPublisher, creator = @0x247058d0fa4d63683376116b11ab90bea4a9582141794d83ddbcce5a75b3578c, pool_signer = @0x55ba2b4d7be676e77bbfef29c27401c9862eb6682e66b45e5924da34324c55cd)]
    fun test_calculate_swap_output_view_function(admin: &signer, creator: &signer, pool_signer: &signer) {
        setup_protocol(admin);

        // Create account for pool_signer to initialize ObjectCore
        account::create_account_for_test(signer::address_of(pool_signer));

        let market = create_test_market(admin, creator);

        let (yes_token, no_token) = verifi_protocol::get_market_tokens(market);
        let yes_addr = object::object_address(&yes_token);
        let no_addr = object::object_address(&no_token);

        let assets = vector::empty<address>();
        vector::push_back(&mut assets, yes_addr);
        vector::push_back(&mut assets, no_addr);

        tapp_prediction_hook::create_pool(pool_signer, assets, 0, signer::address_of(admin));

        let pool_addr = signer::address_of(pool_signer);

        // With zero reserves, output should be 0
        let output = tapp_prediction_hook::calculate_swap_output(pool_addr, 10 * OCTAS_PER_APT, true);
        assert!(output == 0, 1);
    }

    #[test(admin = @VeriFiPublisher, creator = @0x247058d0fa4d63683376116b11ab90bea4a9582141794d83ddbcce5a75b3578c, pool_signer = @0x55ba2b4d7be676e77bbfef29c27401c9862eb6682e66b45e5924da34324c55cd)]
    fun test_get_pool_stats_returns_correct_data(admin: &signer, creator: &signer, pool_signer: &signer) {
        setup_protocol(admin);
        account::create_account_for_test(signer::address_of(pool_signer));
        let market = create_test_market(admin, creator);

        let (yes_token, no_token) = verifi_protocol::get_market_tokens(market);
        let yes_addr = object::object_address(&yes_token);
        let no_addr = object::object_address(&no_token);

        let assets = vector::empty<address>();
        vector::push_back(&mut assets, yes_addr);
        vector::push_back(&mut assets, no_addr);

        tapp_prediction_hook::create_pool(pool_signer, assets, 0, signer::address_of(admin));

        let pool_addr = signer::address_of(pool_signer);
        let (
            reserve_yes,
            reserve_no,
            fee_yes,
            fee_no,
            positions_count,
            trading_enabled
        ) = tapp_prediction_hook::get_pool_stats(pool_addr);

        // Verify initial stats
        assert!(reserve_yes == 0, 1);
        assert!(reserve_no == 0, 2);
        assert!(fee_yes == 0, 3);
        assert!(fee_no == 0, 4);
        assert!(positions_count == 0, 5);
        assert!(trading_enabled == true, 6);
    }

    #[test(admin = @VeriFiPublisher, creator = @0x247058d0fa4d63683376116b11ab90bea4a9582141794d83ddbcce5a75b3578c, pool_signer = @0x55ba2b4d7be676e77bbfef29c27401c9862eb6682e66b45e5924da34324c55cd)]
    fun test_pool_seed_changes_with_different_assets(admin: &signer, creator: &signer, pool_signer: &signer) {
        // This test doesn't need pool_signer account creation since it only calls pool_seed (pure function)
        setup_protocol(admin);
        let market = create_test_market(admin, creator);

        let (yes_token, no_token) = verifi_protocol::get_market_tokens(market);
        let yes_addr = object::object_address(&yes_token);
        let no_addr = object::object_address(&no_token);

        let assets1 = vector::empty<address>();
        vector::push_back(&mut assets1, yes_addr);
        vector::push_back(&mut assets1, no_addr);

        let assets2 = vector::empty<address>();
        vector::push_back(&mut assets2, no_addr);
        vector::push_back(&mut assets2, yes_addr);

        // Different order should produce different seed
        let seed1 = tapp_prediction_hook::pool_seed(assets1, 0);
        let seed2 = tapp_prediction_hook::pool_seed(assets2, 0);

        assert!(seed1 != seed2, 1);
    }

    #[test(admin = @VeriFiPublisher, creator = @0x247058d0fa4d63683376116b11ab90bea4a9582141794d83ddbcce5a75b3578c, pool_signer = @0x55ba2b4d7be676e77bbfef29c27401c9862eb6682e66b45e5924da34324c55cd)]
    fun test_get_reserves_empty_pool(admin: &signer, creator: &signer, pool_signer: &signer) {
        account::create_account_for_test(signer::address_of(pool_signer));
        setup_protocol(admin);
        let market = create_test_market(admin, creator);

        let (yes_token, no_token) = verifi_protocol::get_market_tokens(market);
        let yes_addr = object::object_address(&yes_token);
        let no_addr = object::object_address(&no_token);

        let assets = vector::empty<address>();
        vector::push_back(&mut assets, yes_addr);
        vector::push_back(&mut assets, no_addr);

        tapp_prediction_hook::create_pool(pool_signer, assets, 0, signer::address_of(admin));

        let pool_addr = signer::address_of(pool_signer);
        let (reserve_yes, reserve_no) = tapp_prediction_hook::get_reserves(pool_addr);

        assert!(reserve_yes == 0, 1);
        assert!(reserve_no == 0, 2);
    }
}