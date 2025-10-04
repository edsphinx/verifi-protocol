#[test_only]
module VeriFiPublisher::protocol_integration_test {
    use std::string;
    use std::signer;
    use std::vector;

    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::aptos_coin;
    use aptos_framework::coin::{BurnCapability, MintCapability};

    use VeriFiPublisher::verifi_protocol;
    use VeriFiPublisher::oracle_registry;
    use VeriFiPublisher::access_control;

    // Test capabilities storage
    struct TestCaps has key {
        burn_cap: BurnCapability<aptos_coin::AptosCoin>,
        mint_cap: MintCapability<aptos_coin::AptosCoin>,
    }

    const STATUS_OPEN: u8 = 0;
    const STATUS_RESOLVED_YES: u8 = 2;
    const STATUS_RESOLVED_NO: u8 = 3;
    const OPERATOR_GREATER_THAN: u8 = 0;

    fun setup_protocol(admin: &signer) {
        // Initialize AptosCoin for test
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

    #[test(admin = @VeriFiPublisher, creator = @0x247058d0fa4d63683376116b11ab90bea4a9582141794d83ddbcce5a75b3578c)]
    fun test_create_market_and_check_status(admin: &signer, creator: &signer) {
        setup_protocol(admin);

        // Register oracle
        let oracle_id = string::utf8(b"test-oracle");
        oracle_registry::register_oracle(admin, oracle_id, string::utf8(b"Test Oracle"));

        // Create market (using Market Creator account address)
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
        assert!(vector::length(&all_markets) == 1, 1);

        let market = *vector::borrow(&all_markets, 0);

        // Check initial status
        let status = verifi_protocol::get_market_status(market);
        assert!(status == STATUS_OPEN, 2);
    }

    #[test(admin = @VeriFiPublisher, creator = @0x247058d0fa4d63683376116b11ab90bea4a9582141794d83ddbcce5a75b3578c)]
    fun test_create_multiple_markets(admin: &signer, creator: &signer) {
        setup_protocol(admin);

        // Register oracles
        oracle_registry::register_oracle(admin, string::utf8(b"oracle-1"), string::utf8(b"Oracle 1"));
        oracle_registry::register_oracle(admin, string::utf8(b"oracle-2"), string::utf8(b"Oracle 2"));
        oracle_registry::register_oracle(admin, string::utf8(b"oracle-3"), string::utf8(b"Oracle 3"));

        let resolution_time = timestamp::now_seconds() + 3600;

        // Create multiple markets
        verifi_protocol::create_market(
            creator,
            string::utf8(b"Market 1"),
            resolution_time,
            signer::address_of(admin),
            string::utf8(b"oracle-1"),
            @0x1,
            string::utf8(b"balance"),
            100,
            OPERATOR_GREATER_THAN,
        );

        verifi_protocol::create_market(
            creator,
            string::utf8(b"Market 2"),
            resolution_time,
            signer::address_of(admin),
            string::utf8(b"oracle-2"),
            @0x2,
            string::utf8(b"balance"),
            200,
            OPERATOR_GREATER_THAN,
        );

        verifi_protocol::create_market(
            creator,
            string::utf8(b"Market 3"),
            resolution_time,
            signer::address_of(admin),
            string::utf8(b"oracle-3"),
            @0x3,
            string::utf8(b"balance"),
            300,
            OPERATOR_GREATER_THAN,
        );

        // Verify all markets created
        let all_markets = verifi_protocol::get_all_markets();
        assert!(vector::length(&all_markets) == 3, 1);
    }

    #[test(admin = @VeriFiPublisher, creator = @0x247058d0fa4d63683376116b11ab90bea4a9582141794d83ddbcce5a75b3578c, resolver = @0x55ba2b4d7be676e77bbfef29c27401c9862eb6682e66b45e5924da34324c55cd)]
    fun test_manual_market_resolution(admin: &signer, creator: &signer, resolver: &signer) {
        setup_protocol(admin);

        // Register oracle
        let oracle_id = string::utf8(b"manual-oracle");
        oracle_registry::register_oracle(admin, oracle_id, string::utf8(b"Manual Oracle"));

        // Create market with resolver as the authorized resolver
        let resolution_time = timestamp::now_seconds() + 100;
        verifi_protocol::create_market(
            creator,
            string::utf8(b"Manual Resolution Market"),
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

        // Fast forward past resolution time
        timestamp::fast_forward_seconds(101);

        // Manually resolve market to YES
        verifi_protocol::resolve_market(resolver, market, true);

        // Verify resolution
        let status = verifi_protocol::get_market_status(market);
        assert!(status == STATUS_RESOLVED_YES, 1);
    }

    #[test(admin = @VeriFiPublisher, creator = @0x247058d0fa4d63683376116b11ab90bea4a9582141794d83ddbcce5a75b3578c, resolver = @0x55ba2b4d7be676e77bbfef29c27401c9862eb6682e66b45e5924da34324c55cd)]
    fun test_manual_market_resolution_to_no(admin: &signer, creator: &signer, resolver: &signer) {
        setup_protocol(admin);

        // Register oracle
        let oracle_id = string::utf8(b"manual-oracle-no");
        oracle_registry::register_oracle(admin, oracle_id, string::utf8(b"Manual Oracle NO"));

        // Create market
        let resolution_time = timestamp::now_seconds() + 100;
        verifi_protocol::create_market(
            creator,
            string::utf8(b"Manual Resolution Market NO"),
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

        // Fast forward past resolution time
        timestamp::fast_forward_seconds(101);

        // Manually resolve market to NO
        verifi_protocol::resolve_market(resolver, market, false);

        // Verify resolution
        let status = verifi_protocol::get_market_status(market);
        assert!(status == STATUS_RESOLVED_NO, 1);
    }

    #[test(admin = @VeriFiPublisher, creator = @0x247058d0fa4d63683376116b11ab90bea4a9582141794d83ddbcce5a75b3578c, non_resolver = @0xd3b36c7fea14a6939ec4a8bebb422459e85b65f523b3babffd31ddf2f1479c1d)]
    #[expected_failure(abort_code = 4, location = VeriFiPublisher::verifi_protocol)]
    fun test_non_resolver_cannot_resolve(admin: &signer, creator: &signer, non_resolver: &signer) {
        setup_protocol(admin);

        // Register oracle
        let oracle_id = string::utf8(b"protected-oracle");
        oracle_registry::register_oracle(admin, oracle_id, string::utf8(b"Protected Oracle"));

        // Create market with admin as resolver
        let resolution_time = timestamp::now_seconds() + 100;
        verifi_protocol::create_market(
            creator,
            string::utf8(b"Protected Market"),
            resolution_time,
            signer::address_of(admin), // admin is the resolver
            oracle_id,
            @0x1234,
            string::utf8(b"balance"),
            100,
            OPERATOR_GREATER_THAN,
        );

        let all_markets = verifi_protocol::get_all_markets();
        let market = *vector::borrow(&all_markets, 0);

        timestamp::fast_forward_seconds(101);

        // Non-resolver tries to resolve - should fail
        verifi_protocol::resolve_market(non_resolver, market, true);
    }

    #[test(admin = @VeriFiPublisher, creator = @0x247058d0fa4d63683376116b11ab90bea4a9582141794d83ddbcce5a75b3578c)]
    fun test_get_market_info(admin: &signer, creator: &signer) {
        setup_protocol(admin);

        // Register oracle
        let oracle_id = string::utf8(b"info-oracle");
        oracle_registry::register_oracle(admin, oracle_id, string::utf8(b"Info Oracle"));

        // Create market
        let description = string::utf8(b"Info Test Market");
        let resolution_time = timestamp::now_seconds() + 3600;
        let resolver_addr = signer::address_of(admin);

        verifi_protocol::create_market(
            creator,
            description,
            resolution_time,
            resolver_addr,
            oracle_id,
            @0x1234,
            string::utf8(b"balance"),
            100,
            OPERATOR_GREATER_THAN,
        );

        let all_markets = verifi_protocol::get_all_markets();
        let market = *vector::borrow(&all_markets, 0);

        // Get market info
        let (desc, resolver, res_time, status, oid) = verifi_protocol::get_market_info(market);

        // Verify info
        assert!(desc == description, 1);
        assert!(resolver == resolver_addr, 2);
        assert!(res_time == resolution_time, 3);
        assert!(status == STATUS_OPEN, 4);
        assert!(oid == oracle_id, 5);
    }
}