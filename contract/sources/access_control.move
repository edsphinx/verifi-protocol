/**
 * @title VeriFi Protocol Access Control
 * @author edsphinx
 * @notice Manages administrative privileges for the VeriFi Protocol.
 * @dev Implements a simple, secure Ownable pattern by storing the admin address in a resource
 * at the publisher's account address.
 */
module VeriFiPublisher::access_control {

    // === Imports ===
    use std::signer;
    use std::error;

    // === Errors ===
    const E_NOT_ADMIN: u64 = 101;
    const E_ALREADY_INITIALIZED: u64 = 102;

    // === Data Structures ===

    /**
     * @dev Stores the address of the single protocol administrator.
     * @param admin_address The account address of the current administrator.
     */
    struct AdminStore has key {
        admin_address: address,
    }

    // === Initialization Function ===

    /**
     * @notice Sets the deployer of the contract as the initial administrator.
     * @param deployer The signer account deploying the modules. This account will be the first admin.
     */
     /**
     * @notice Initializes the access control system, setting the caller as the first admin.
     * @dev This is a one-time setup function that should only be called once, during the initial contract publication.
     * It creates the `AdminStore` resource and stores it on the publisher's account.
     * @param deployer The signer of the account that will become the initial administrator.
     */
    fun init_module(deployer: &signer) {
        let publisher_address = signer::address_of(deployer);
        assert!(!exists<AdminStore>(publisher_address), E_ALREADY_INITIALIZED);
        // We move the AdminStore resource to the deployer's account.
        // The resource itself can only be created here, ensuring a single admin configuration.
        move_to(deployer, AdminStore { admin_address: publisher_address });
    }

    // === Public Functions ===

    /**
     * @notice Verifies that the transaction signer is the current protocol administrator.
     * @dev This is a helper function designed to be called as a guard at the beginning of
     * admin-only functions in other modules. It aborts with `E_NOT_ADMIN` if the check fails.
     * @param admin_signer The signer of the transaction attempting an admin action.
     */
    public fun assert_is_admin(admin_signer: &signer) acquires AdminStore {
        let publisher_address = @VeriFiPublisher;
        assert!(exists<AdminStore>(publisher_address), E_NOT_ADMIN);
        
        let stored_admin_address = borrow_global<AdminStore>(publisher_address).admin_address;
        
        assert!(signer::address_of(admin_signer) == stored_admin_address, error::permission_denied(E_NOT_ADMIN));
    }

    /**
     * @notice Transfers the administrator role to a new account.
     * @dev Only the current admin can call this function. It updates the `admin_address` field
     * in the `AdminStore` resource.
     * @param admin The signer of the current administrator, proving their authority.
     * @param new_admin_address The address of the account to be assigned the new admin role.
     */
    public entry fun transfer_admin_role(admin: &signer, new_admin_address: address) acquires AdminStore {
        assert_is_admin(admin);

        let publisher_address = @VeriFiPublisher;
        let admin_store = borrow_global_mut<AdminStore>(publisher_address);

        admin_store.admin_address = new_admin_address;
    }

    // === View Function ===

    #[view]
    /**
    * @notice Checks if a given address is the current admin.
    * @dev A public view function for off-chain queries and on-chain checks.
    * @param addr The address of the account to be verified as the admin role.
    */
    public fun is_admin(addr: address): bool acquires AdminStore {
        let publisher_address = @VeriFiPublisher;
        exists<AdminStore>(publisher_address) && borrow_global<AdminStore>(publisher_address).admin_address == addr
    }

    // === Test-Only Functions ===

    #[test_only]
    /**
     * @notice Initializes admin store for testing.
     * @dev Only available in test mode.
     * @param deployer The test account to initialize with
     */
    public fun init_for_test(deployer: &signer) {
        use aptos_framework::account;

        let publisher_address = @VeriFiPublisher;
        assert!(!exists<AdminStore>(publisher_address), E_ALREADY_INITIALIZED);
        
        let publisher_signer = account::create_signer_for_test(publisher_address);
        move_to(&publisher_signer, AdminStore { admin_address: signer::address_of(deployer) });
    }
}
