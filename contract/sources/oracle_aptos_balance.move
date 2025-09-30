/**
 * @title VeriFi Oracle: Aptos Balance
 * @author edsphinx
 * @notice Provides on-chain access to the native APT balance of any account.
 * @dev This is a single-responsibility 'plugin' module for the VeriFi oracle system.
 * It is designed to be called exclusively by the `oracles` router module via a `friend` declaration.
 */
module VeriFiPublisher::oracle_aptos_balance {
    
    // === Imports ===
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;

    // === Friends ===
    // Grants the central router module permission to call the functions in this module.
    friend VeriFiPublisher::oracles;

    // === Public(friend) Functions ===

    #[view]
    /**
     * @notice Fetches the native APT balance (in Octas) for a given account address.
     * @dev This function is `public(friend)` and can only be called by the `oracles` module.
     * It's a simple wrapper around the core framework's `coin::balance` function.
     * The function is marked as `#[view]` to indicate it is a read-only operation.
     * @param addr The account address whose APT balance is to be queried.
     * @return The account's total APT balance in Octas as a `u64`.
     */
    public(friend) fun get_value(addr: address): u64 {
        coin::balance<AptosCoin>(addr)
    }
}
