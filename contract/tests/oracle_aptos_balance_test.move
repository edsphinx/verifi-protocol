#[test_only]
module VeriFiPublisher::oracle_aptos_balance_test {
    use VeriFiPublisher::oracle_aptos_balance;

    #[test]
    fun test_get_balance_of_nonexistent_account() {
        // An address that is guaranteed not to exist or have funds in the test environment.
        let addr = @0xDEADBEEF;

        // Call the test wrapper function
        let balance = oracle_aptos_balance::get_value_for_test(addr);

        // Assert that the balance is exactly zero
        assert!(balance == 0, 1);
    }
}
