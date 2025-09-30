/**
 * @title VeriFi Oracle Registry
 * @author edsphinx
 * @notice An on-chain registry for whitelisting and managing on-chain data sources (oracles).
 * @dev This contract acts as a security layer for the oracle system. It is controlled by the
 * `access_control` module and stores its state resource at the publisher's address.
 */
module VeriFiPublisher::oracle_registry {

    // === Imports ===
    use std::error;
    use std::string::{String};
    use aptos_framework::table::{Self, Table};
    use VeriFiPublisher::access_control;

    // === Errors ===
    const E_ORACLE_NOT_FOUND: u64 = 201;
    const E_ORACLE_ALREADY_EXISTS: u64 = 202;

    // === Data Structures ===

    /**
     * @dev Holds metadata about a registered on-chain oracle source.
     * @param id The unique string identifier for the oracle (e.g., "usdc-total-supply").
     * @param protocol_name A human-readable name for the oracle.
     * @param is_active A flag to enable or disable the oracle individually.
     */
    struct OracleInfo has store, drop, copy {
        id: String,
        protocol_name: String,
        is_active: bool,
    }

    /**
     * @dev The main resource that stores the table of registered oracles and a global pause flag.
     * This resource is stored at the module publisher's account address (@VeriFiPublisher).
     * @param oracles A `Table` mapping oracle IDs to their `OracleInfo`.
     * @param is_globally_paused An emergency switch to disable all oracles at once.
     */
    struct OracleRegistry has key {
        oracles: Table<String, OracleInfo>,
        is_globally_paused: bool,
    }

    // === Initialization Function ===

    /**
     * @notice Initializes the OracleRegistry resource on the publisher's account.
     * @dev This is a one-time setup function that should only be called once, during
     * the initial contract publication.
     * @param sender The signer of the account deploying the module, which will hold the `OracleRegistry` resource.
     */
    fun init_module(sender: &signer) {
        move_to(sender, OracleRegistry {
            oracles: table::new(),
            is_globally_paused: false,
        });
    }

    // === Admin Functions ===

    /**
     * @notice Registers a new on-chain data source as an oracle.
     * @dev Admin-only. Adds a new `OracleInfo` entry to the `oracles` table.
     * Aborts if the caller is not the admin.
     * @param admin The signer of the protocol administrator account.
     * @param id The unique string identifier for the new oracle.
     * @param protocol_name A human-readable name for the oracle.
     */
    public entry fun register_oracle(admin: &signer, id: String, protocol_name: String) acquires OracleRegistry {
        access_control::assert_is_admin(admin);
        let registry = borrow_global_mut<OracleRegistry>(@VeriFiPublisher);
        assert!(!table::contains(&registry.oracles, id), error::already_exists(E_ORACLE_ALREADY_EXISTS));

        let info = OracleInfo { id, protocol_name, is_active: true };
        table::add(&mut registry.oracles, info.id, info);
    }

    /**
     * @notice Activates or deactivates a specific oracle.
     * @dev Admin-only. Allows pausing individual oracles without a global pause.
     * @param admin The signer of the protocol administrator account.
     * @param id The identifier of the oracle to modify.
     * @param is_active The new status for the oracle (`true` for active, `false` for paused).
     */
    public entry fun set_oracle_status(admin: &signer, id: String, is_active: bool) acquires OracleRegistry {
        access_control::assert_is_admin(admin);
        let registry = borrow_global_mut<OracleRegistry>(@VeriFiPublisher);
        assert!(table::contains(&registry.oracles, id), E_ORACLE_NOT_FOUND);
        let info = table::borrow_mut(&mut registry.oracles, id);
        info.is_active = is_active;
    }

    /**
     * @notice Activates or deactivates the emergency pause for the entire oracle system.
     * @dev Admin-only. If `paused` is true, all oracle checks via `is_oracle_active` will fail.
     * @param admin The signer of the protocol administrator account.
     * @param paused The new global pause status (`true` to pause, `false` to unpause).
     */
    public entry fun set_global_pause(admin: &signer, paused: bool) acquires OracleRegistry {
        access_control::assert_is_admin(admin);
        let registry = borrow_global_mut<OracleRegistry>(@VeriFiPublisher);
        registry.is_globally_paused = paused;
    }

    // === Public View Functions ===

    #[view]
    /**
     * @notice Checks if a specific oracle is currently active and usable.
     * @dev This is a `#[view]` function. It checks both the global pause status and the
     * individual oracle's active flag.
     * @param id The identifier of the oracle to check.
     * @return Returns `true` if the oracle is active and the system is not globally paused, otherwise `false`.
     */
    public fun is_oracle_active(id: String): bool acquires OracleRegistry {
        let registry = borrow_global<OracleRegistry>(@VeriFiPublisher);
        if (registry.is_globally_paused) { return false };
        if (table::contains(&registry.oracles, id)) {
            table::borrow(&registry.oracles, id).is_active
        } else {
            false
        }
    }

    #[view]
    public fun oracle_exists(id: String): bool acquires OracleRegistry {
        let registry = borrow_global<OracleRegistry>(@VeriFiPublisher);
        table::contains(&registry.oracles, id)
    }

    // === Test-Only Functions ===

    #[test_only]
    /**
     * @notice Initializes oracle registry for testing.
     * @dev Only available in test mode.
     * @param admin The test account to initialize with
     */
    public fun init_for_test(admin: &signer) {
        init_module(admin);
    }
}
