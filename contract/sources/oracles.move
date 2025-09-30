/**
 * @title VeriFi Oracles Router
 * @author edsphinx
 * @notice Acts as a central router to dispatch calls to the appropriate on-chain oracle plugins.
 * @dev This module provides a single, secure entry point (`fetch_data`) for the protocol to
 * query different on-chain data sources. Access is restricted via a `friend` declaration
 * to trusted modules like `verifi_protocol` and `verifi_resolvers`.
 */
module VeriFiPublisher::oracles {
  
    // === Imports ===
    use std::string::{Self, String};
    use VeriFiPublisher::oracle_registry;
    use VeriFiPublisher::oracle_aptos_balance;
    use VeriFiPublisher::oracle_usdc;
    
    // === Friends ===
    friend VeriFiPublisher::verifi_protocol;
    friend VeriFiPublisher::verifi_resolvers;

    // === Errors ===
    const E_ORACLE_INACTIVE: u64 = 301;
    const E_ORACLE_NOT_FOUND: u64 = 302;

    // === Public(friend) Functions ===

    #[view]
    /**
     * @notice Fetches a value from a registered on-chain oracle.
     * @dev This is the main routing function, callable only by `friend` modules. It checks
     * if the requested `oracle_id` is active in the `OracleRegistry` and then dispatches
     * the call to the corresponding plugin module. The function is marked `#[view]` as it is
     * intended for read-only queries.
     * @param oracle_id The unique string identifier of the oracle to query.
     * @param target_address The specific address to check (e.g., a user's wallet).
     * @return The `u64` value read from the external protocol.
     */
    public(friend) fun fetch_data(oracle_id: String, target_address: address): u64 {
        // SECURY VERIFICATION
        assert!(oracle_registry::is_oracle_active(oracle_id), E_ORACLE_INACTIVE);

        // (ROUTING)
        if (oracle_id == string::utf8(b"aptos-balance")) {
            oracle_aptos_balance::get_value(target_address)
        } else if (oracle_id == string::utf8(b"usdc-total-supply")) {
          oracle_usdc::get_total_supply()
        } 
        else {
            abort E_ORACLE_NOT_FOUND
        }
    }
}