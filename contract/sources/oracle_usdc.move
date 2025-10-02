/**
 * @title VeriFi Oracle: USDC Total Supply
 * @author edsphinx
 * @notice Provides on-chain access to the total supply of the official Circle USDC token.
 * @dev This is a single-responsibility 'plugin' for the VeriFi oracle system. It reads the
 * on-chain supply of a specific Fungible Asset by its metadata address. It is designed
 * to be called exclusively by the `oracles` router module.
 */
module VeriFiPublisher::oracle_usdc {

    // === Imports ===
    use std::option;
    use aptos_framework::fungible_asset;
    use aptos_framework::object;

    // === Friends ===
    // Grants the central router module permission to call the functions in this module.
    friend VeriFiPublisher::oracles;

    // === Errors ===
    const E_SUPPLY_NOT_AVAILABLE: u64 = 401;

    // === Constants ===
    /// @dev The official Circle USDC metadata object address on Aptos Testnet.
    const USDC_METADATA_ADDRESS: address = @0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832;

    // === Public(friend) Functions ===
    #[view]
    /**
     * @notice Fetches the current total supply of the official Circle USDC token.
     * @dev This function is `public(friend)` and marked `#[view]` for read-only access.
     * It requires `acquires` permissions for `Supply` and `ConcurrentSupply` because it
     * calls the underlying `fungible_asset::supply` function, which reads global storage.
     * @return The total supply of USDC, scaled to its native decimals, as a `u64`.
     */
    public(friend) fun get_total_supply(): u64 {
        let usdc_metadata_object = object::address_to_object<fungible_asset::Metadata>(USDC_METADATA_ADDRESS);

        // `fungible_asset::supply` returns an `option<u128>`, so we must handle it.
        let supply_option = fungible_asset::supply(usdc_metadata_object);

        // Abort if for some reason the supply is not available.
        assert!(option::is_some(&supply_option), E_SUPPLY_NOT_AVAILABLE);

        // Extract the value and cast it to `u64` for compatibility with the VeriFi protocol.
        (option::extract(&mut supply_option) as u64)
    }

    // === Test-Only Functions ===

    #[test_only]
    /**
     * @notice Test wrapper for get_total_supply.
     * @dev Only available in test mode.
     * @return The total supply of USDC
     */
    public fun get_total_supply_for_test(): u64 {
        get_total_supply()
    }
}
