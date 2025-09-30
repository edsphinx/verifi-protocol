#[test_only]
module VeriFiPublisher::access_control_test {
    use std::signer;
    use VeriFiPublisher::access_control;

    #[test(deployer = @VeriFiPublisher)]
    fun test_init_sets_deployer_as_admin(deployer: &signer) {
        // Initialize the module
        access_control::init_for_test(deployer);

        // Verify that the deployer's address is now the admin
        assert!(access_control::is_admin(signer::address_of(deployer)), 1);
    }

    #[test(deployer = @VeriFiPublisher, other_user = @0x123)]
    fun test_other_user_is_not_admin(deployer: &signer, other_user: &signer) {
        // Initialize the module
        access_control::init_for_test(deployer);

        // Verify that another user is not the admin
        assert!(!access_control::is_admin(signer::address_of(other_user)), 1);
    }

    #[test(admin = @VeriFiPublisher, new_admin_signer = @0x456)]
    fun test_transfer_admin_role(admin: &signer, new_admin_signer: &signer) {
        // Initialize the module with the initial admin
        access_control::init_for_test(admin);
        let new_admin_address = signer::address_of(new_admin_signer);

        // Transfer the admin role
        access_control::transfer_admin_role(admin, new_admin_address);

        // Verify the old admin is no longer admin and the new one is
        assert!(!access_control::is_admin(signer::address_of(admin)), 1);
        assert!(access_control::is_admin(new_admin_address), 2);
    }

    #[test(admin = @VeriFiPublisher, attacker = @0x789)]
    // The expected abort code for `error::permission_denied(101)` is (5 << 16) + 101 = 327781
    #[expected_failure(abort_code = 327781, location = VeriFiPublisher::access_control)]
    fun test_non_admin_cannot_transfer_role(admin: &signer, attacker: &signer) {
        // Initialize the module
        access_control::init_for_test(admin);

        // The attacker tries to transfer the role to themselves, which should fail
        access_control::transfer_admin_role(attacker, signer::address_of(attacker));
    }

    #[test(admin = @VeriFiPublisher)]
    fun test_assert_is_admin_succeeds_for_admin(admin: &signer) {
        // Initialize the module
        access_control::init_for_test(admin);

        // This call should succeed and not abort
        access_control::assert_is_admin(admin);
    }

    #[test(admin = @VeriFiPublisher, non_admin = @0xABC)]
    #[expected_failure(abort_code = 327781, location = VeriFiPublisher::access_control)]
    fun test_assert_is_admin_fails_for_non_admin(admin: &signer, non_admin: &signer) {
        // Initialize the module
        access_control::init_for_test(admin);

        // This call should abort because the signer is not the admin
        access_control::assert_is_admin(non_admin);
    }

    #[test(deployer = @VeriFiPublisher)]
    #[expected_failure(abort_code = 102, location = VeriFiPublisher::access_control)]
    fun test_init_fails_if_called_twice(deployer: &signer) {
        access_control::init_for_test(deployer);
        // Llamar a la inicialización por segunda vez debe fallar con E_ALREADY_INITIALIZED
        access_control::init_for_test(deployer);
    }

    #[test(admin = @VeriFiPublisher)]
    fun test_transfer_admin_role_to_self(admin: &signer) {
        access_control::init_for_test(admin);
        let admin_address = signer::address_of(admin);

        // Transferir el rol a uno mismo debe ser una operación segura y no debe cambiar nada
        access_control::transfer_admin_role(admin, admin_address);

        // Verificar que el administrador sigue siendo el administrador
        assert!(access_control::is_admin(admin_address), 1);
    }
}
