#[test_only]
module VeriFiPublisher::oracle_usdc_test {
    use VeriFiPublisher::oracle_usdc;

    // USDC metadata address doesn't exist in test environment, so this test
    // expects failure with EOBJECT_DOES_NOT_EXIST error
    #[test]
    #[expected_failure(abort_code = 393218, location = aptos_framework::object)]
    fun test_get_total_supply_fails_in_test_env() {
        // In test environment, the USDC metadata object doesn't exist,
        // so this should fail with EOBJECT_DOES_NOT_EXIST error
        let _supply = oracle_usdc::get_total_supply_for_test();
    }
}
