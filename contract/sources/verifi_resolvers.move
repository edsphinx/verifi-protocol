/**
 * @title VeriFi Protocol Resolvers
 * @author edsphinx
 * @notice A dedicated, upgradeable contract for executing the programmatic resolution of VeriFi markets.
 * @dev This contract acts as an on-chain keeper. It has a permissive `acquires` list,
 * allowing it to read various on-chain states via the `oracles` module. It then calls a
 * `friend` function on the main `verifi_protocol` contract to securely update the market's
 * final state. This separation of concerns allows for future oracle types to be added
 * by only upgrading this resolver contract.
 */
module VeriFiPublisher::verifi_resolvers {
    
    // === Imports ===
    use aptos_framework::object::{Object};
    use VeriFiPublisher::verifi_protocol::{Self, Market};
    use VeriFiPublisher::oracles;

    // === Public Functions ===

    /**
     * @notice Executes the programmatic resolution for a given market.
     * @dev This is a permissionless `entry` function that can be called by anyone (typically a
     * keeper bot) after a market's resolution time has passed. It follows a 'read-then-write'
     * pattern: it reads necessary data from the main protocol via a `friend` getter, fetches
     * the live oracle value, and then calls back to the main protocol's `friend` setter to
     * update the state. The full `acquires` list is necessary to support all potential oracle plugins.
     * @param _caller The signer of the account initiating the resolution transaction. Not used.
     * @param market_object The `Object<Market>` to be resolved.
     */
    public entry fun resolve_market(
        _caller: &signer, // Anyone can call this function to resolve a market
        market_object: Object<Market>,
    ) {
        // READ: Securely get the market's resolution data via the `friend` getter function.
        let (oracle_id, target_address, target_value, operator, _resolution_timestamp) =
            verifi_protocol::get_market_resolution_data(market_object);

        // FETCH: Read the live on-chain value from the oracle system.
        let current_on_chain_value = oracles::fetch_data(oracle_id, target_address);

        // WRITE: Call the `friend` setter function on the main protocol to update the state.
        verifi_protocol::update_market_status_from_resolver(
            market_object,
            current_on_chain_value,
            target_value,
            operator
        );
    }
}
