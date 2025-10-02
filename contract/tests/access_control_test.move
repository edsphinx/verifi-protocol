#[test_only]
module VeriFiPublisher::access_control_test {
    use std::signer;
    use VeriFiPublisher::access_control;

    #[test(deployer = @VeriFiPublisher)]
    fun test_init_sets_deployer_as_admin(deployer: &signer) {
        access_control::init_for_test(deployer);

        assert!(access_control::is_admin(signer::address_of(deployer)), 1);
    }

    #[test(deployer = @VeriFiPublisher, other_user = @0x55ba2b4d7be676e77bbfef29c27401c9862eb6682e66b45e5924da34324c55cd)]
    fun test_other_user_is_not_admin(deployer: &signer, other_user: &signer) {
        access_control::init_for_test(deployer);

        assert!(!access_control::is_admin(signer::address_of(other_user)), 1);
    }

    #[test(admin = @VeriFiPublisher, new_admin_signer = @0xd3b36c7fea14a6939ec4a8bebb422459e85b65f523b3babffd31ddf2f1479c1d)]
    fun test_transfer_admin_role(admin: &signer, new_admin_signer: &signer) {
        access_control::init_for_test(admin);
        let new_admin_address = signer::address_of(new_admin_signer);

        access_control::transfer_admin_role(admin, new_admin_address);

        assert!(!access_control::is_admin(signer::address_of(admin)), 1);
        assert!(access_control::is_admin(new_admin_address), 2);
    }

    #[test(admin = @VeriFiPublisher, attacker = @0xdfb0a131451d31fa932201392d1118e81cb39c1f9b122e1316468076ef22d62e)]
    #[expected_failure(abort_code = 327781, location = VeriFiPublisher::access_control)]
    fun test_non_admin_cannot_transfer_role(admin: &signer, attacker: &signer) {
        access_control::init_for_test(admin);
        access_control::transfer_admin_role(attacker, signer::address_of(attacker));
    }

    #[test(admin = @VeriFiPublisher)]
    fun test_assert_is_admin_succeeds_for_admin(admin: &signer) {
        access_control::init_for_test(admin);
        access_control::assert_is_admin(admin);
    }

    #[test(admin = @VeriFiPublisher, non_admin = @0xe47a0a5de8ed36c9c1f060ca73000d07d8fbd499297d06f87f87734db6f65390)]
    #[expected_failure(abort_code = 327781, location = VeriFiPublisher::access_control)]
    fun test_assert_is_admin_fails_for_non_admin(admin: &signer, non_admin: &signer) {
        access_control::init_for_test(admin);
        access_control::assert_is_admin(non_admin);
    }

    #[test(deployer = @VeriFiPublisher)]
    #[expected_failure(abort_code = 102, location = VeriFiPublisher::access_control)]
    fun test_init_fails_if_called_twice(deployer: &signer) {
        access_control::init_for_test(deployer);
        access_control::init_for_test(deployer);
    }

    #[test(admin = @VeriFiPublisher)]
    fun test_transfer_admin_role_to_self(admin: &signer) {
        access_control::init_for_test(admin);
        
        let admin_address = signer::address_of(admin);
        access_control::transfer_admin_role(admin, admin_address);

        assert!(access_control::is_admin(admin_address), 1);
    }
}
