#[test_only]
module VeriFiPublisher::oracle_registry_test {
    use std::string;

    use VeriFiPublisher::oracle_registry;
    use VeriFiPublisher::access_control;

    #[test(admin = @VeriFiPublisher)]
    fun test_register_and_check_status(admin: &signer) {
        access_control::init_for_test(admin);
        oracle_registry::init_for_test(admin);

        let oracle_id = string::utf8(b"test_oracle");
        let oracle_name = string::utf8(b"Test Oracle");

        oracle_registry::register_oracle(admin, oracle_id, oracle_name);

        assert!(oracle_registry::oracle_exists(oracle_id), 1);
        assert!(oracle_registry::is_oracle_active(oracle_id), 2);
    }

    #[test(admin = @VeriFiPublisher)]
    fun test_register_multiple_oracles(admin: &signer) {
        access_control::init_for_test(admin);
        oracle_registry::init_for_test(admin);

        oracle_registry::register_oracle(
            admin,
            string::utf8(b"oracle_1"),
            string::utf8(b"Oracle 1")
        );

        oracle_registry::register_oracle(
            admin,
            string::utf8(b"oracle_2"),
            string::utf8(b"Oracle 2")
        );

        oracle_registry::register_oracle(
            admin,
            string::utf8(b"oracle_3"),
            string::utf8(b"Oracle 3")
        );

        assert!(oracle_registry::oracle_exists(string::utf8(b"oracle_1")), 1);
        assert!(oracle_registry::oracle_exists(string::utf8(b"oracle_2")), 2);
        assert!(oracle_registry::oracle_exists(string::utf8(b"oracle_3")), 3);
    }

    #[test(admin = @VeriFiPublisher)]
    #[expected_failure(abort_code = 524490, location = VeriFiPublisher::oracle_registry)]
    fun test_cannot_register_duplicate_oracle(admin: &signer) {
        access_control::init_for_test(admin);
        oracle_registry::init_for_test(admin);

        let oracle_id = string::utf8(b"duplicate_oracle");
        oracle_registry::register_oracle(admin, oracle_id, string::utf8(b"First"));
        
        oracle_registry::register_oracle(admin, oracle_id, string::utf8(b"Second"));
    }

    #[test(admin = @VeriFiPublisher, non_admin = @0x123)]
    #[expected_failure(abort_code = 327781, location = VeriFiPublisher::access_control)]
    fun test_non_admin_cannot_register_oracle(admin: &signer, non_admin: &signer) {
        access_control::init_for_test(admin);
        oracle_registry::init_for_test(admin);

        oracle_registry::register_oracle(non_admin, string::utf8(b"test_oracle"), string::utf8(b"Test Oracle"));
    }

    #[test(admin = @VeriFiPublisher)]
    fun test_set_oracle_status(admin: &signer) {
        access_control::init_for_test(admin);
        oracle_registry::init_for_test(admin);

        let oracle_id = string::utf8(b"status_test_oracle");
        oracle_registry::register_oracle(admin, oracle_id, string::utf8(b"Status Test"));
        assert!(oracle_registry::is_oracle_active(oracle_id), 1);

        oracle_registry::set_oracle_status(admin, oracle_id, false);
        assert!(!oracle_registry::is_oracle_active(oracle_id), 2);

        oracle_registry::set_oracle_status(admin, oracle_id, true);
        assert!(oracle_registry::is_oracle_active(oracle_id), 3);
    }

    #[test(admin = @VeriFiPublisher)]
    #[expected_failure(abort_code = 201, location = VeriFiPublisher::oracle_registry)]
    fun test_set_status_of_nonexistent_oracle_fails(admin: &signer) {
        access_control::init_for_test(admin);
        oracle_registry::init_for_test(admin);
        
        oracle_registry::set_oracle_status(admin, string::utf8(b"nonexistent"), false);
    }

    #[test(admin = @VeriFiPublisher, non_admin = @0x456)]
    #[expected_failure(abort_code = 327781, location = VeriFiPublisher::access_control)]
    fun test_non_admin_cannot_set_status(admin: &signer, non_admin: &signer) {
        access_control::init_for_test(admin);
        oracle_registry::init_for_test(admin);
        
        let oracle_id = string::utf8(b"test_oracle");
        oracle_registry::register_oracle(admin, oracle_id, string::utf8(b"Test"));

        oracle_registry::set_oracle_status(non_admin, oracle_id, false);
    }

    #[test(admin = @VeriFiPublisher)]
    fun test_global_pause_and_unpause(admin: &signer) {
        access_control::init_for_test(admin);
        oracle_registry::init_for_test(admin);

        let oracle_id = string::utf8(b"global_pause_test");
        oracle_registry::register_oracle(admin, oracle_id, string::utf8(b"Test"));
        assert!(oracle_registry::is_oracle_active(oracle_id), 1);

        oracle_registry::set_global_pause(admin, true);
        assert!(!oracle_registry::is_oracle_active(oracle_id), 2);

        oracle_registry::set_global_pause(admin, false);
        assert!(oracle_registry::is_oracle_active(oracle_id), 3);
    }

    #[test(admin = @VeriFiPublisher, non_admin = @0x789)]
    #[expected_failure(abort_code = 327781, location = VeriFiPublisher::access_control)]
    fun test_non_admin_cannot_global_pause(admin: &signer, non_admin: &signer) {
        access_control::init_for_test(admin);
        oracle_registry::init_for_test(admin);
        
        oracle_registry::set_global_pause(non_admin, true);
    }

    #[test(admin = @VeriFiPublisher)]
    fun test_individually_paused_stays_paused_after_global_unpause(admin: &signer) {
        access_control::init_for_test(admin);
        oracle_registry::init_for_test(admin);

        let oracle_id = string::utf8(b"individual_pause_test");
        oracle_registry::register_oracle(admin, oracle_id, string::utf8(b"Test"));

        oracle_registry::set_oracle_status(admin, oracle_id, false);
        assert!(!oracle_registry::is_oracle_active(oracle_id), 1);

        oracle_registry::set_global_pause(admin, true);
        oracle_registry::set_global_pause(admin, false);

        assert!(!oracle_registry::is_oracle_active(oracle_id), 2);
    }

    #[test(admin = @VeriFiPublisher)]
    fun test_oracle_exists_returns_false_for_nonexistent(admin: &signer) {
        access_control::init_for_test(admin);
        oracle_registry::init_for_test(admin);
        
        assert!(!oracle_registry::oracle_exists(string::utf8(b"does_not_exist")), 1);
    }

    #[test(admin = @VeriFiPublisher)]
    fun test_is_oracle_active_returns_false_for_nonexistent(admin: &signer) {
        access_control::init_for_test(admin);
        oracle_registry::init_for_test(admin);
        
        assert!(!oracle_registry::is_oracle_active(string::utf8(b"does_not_exist")), 1);
    }
}