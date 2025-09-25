/**
 * @title VeriFi Protocol
 * @author edsphinx
 * @notice This module contains the core logic for the VeriFi oracle-less derivatives protocol.
 * @dev Implements a MarketFactory singleton and individual Market objects on the Aptos blockchain using the Object model.
 */
module VeriFiPublisher::verifi_protocol {

    // === Imports ===
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use std::option::{Self};
    use aptos_framework::account;
    use aptos_framework::object::{Self, Object, ExtendRef};
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::fungible_asset::{Self, Metadata};
    use aptos_framework::coin::{Self};
    use aptos_framework::aptos_coin::{AptosCoin};
    use aptos_framework::primary_fungible_store;

    // === Errors ===
    const E_MARKET_ALREADY_RESOLVED: u64 = 1;
    const E_MARKET_NOT_READY_FOR_RESOLUTION: u64 = 2;
    const E_MARKET_CLOSED_FOR_TRADING: u64 = 3;
    const E_NOT_AUTHORIZED: u64 = 4;
    const E_FACTORY_NOT_FOUND: u64 = 5;

    // === Constants ===
    /// @dev Seed used to create the deterministic address for the MarketFactory object.
    const MARKET_FACTORY_SEED: vector<u8> = b"verifi_market_factory";

    // === Events ===
    struct MarketCreatedEvent has drop, store {
        market_address: address,
        creator: address,
        description: String,
        resolution_timestamp: u64,
    }

    // === Data Structures ===
    struct Market has key {
        description: String,
        resolver: address,
        resolution_timestamp: u64,
        status: u8,
        target_address: address,
        target_function: String,
        target_value: u64,
        operator: u8,
        pool_yes_tokens: u64,
        pool_no_tokens: u64,
        yes_token_metadata: Object<Metadata>,
        no_token_metadata: Object<Metadata>,

        /// @dev Capability to mint new YES tokens.
        yes_token_mint_ref: fungible_asset::MintRef,
        /// @dev Capability to burn YES tokens.
        yes_token_burn_ref: fungible_asset::BurnRef,
        /// @dev Capability to mint new NO tokens.
        no_token_mint_ref: fungible_asset::MintRef,
        /// @dev Capability to burn NO tokens.
        no_token_burn_ref: fungible_asset::BurnRef,

        /// @dev The signing capability for the market's treasury (a resource account).
        treasury_cap: account::SignerCapability,
    }

    /// @dev Controller resource to hold the factory's capability to create new objects.
    struct MarketFactoryController has key {
        extend_ref: ExtendRef,
    }

    struct MarketFactory has key {
        market_count: u64,
        markets: vector<Object<Market>>,
        creation_events: EventHandle<MarketCreatedEvent>,
    }

    // === Initialization Function ===
    /**
     * @notice Initializes the module by creating a named, singleton MarketFactory object.
     * @dev This is called once upon publish. It creates an object with a predictable address
     * and stores the factory and its controller under that object's account.
     * @param sender The signer of the account publishing the module.
     */
    fun init_module(sender: &signer) {
        let constructor_ref = object::create_named_object(sender, MARKET_FACTORY_SEED);
        let factory_signer = object::generate_signer(&constructor_ref);

        move_to(&factory_signer, MarketFactoryController {
            extend_ref: object::generate_extend_ref(&constructor_ref),
        });

        let creation_events = object::new_event_handle<MarketCreatedEvent>(&factory_signer);

        move_to(&factory_signer, MarketFactory {
            market_count: 0,
            markets: vector::empty(),
            creation_events,
        });
    }

    // === Helper Functions ===
    /// @dev Gets the deterministic address of the singleton MarketFactory object.
    fun get_factory_address(): address {
        object::create_object_address(&@VeriFiPublisher, MARKET_FACTORY_SEED)
    }

    /// @dev Gets the signer for the MarketFactory, allowing it to own other objects.
    fun get_factory_signer(): signer acquires MarketFactoryController {
        let controller = borrow_global<MarketFactoryController>(get_factory_address());
        object::generate_signer_for_extending(&controller.extend_ref)
    }


    // === Public Functions ===
    /**
     * @notice Creates a new prediction market object.
     * @dev The new Market object is owned by the MarketFactory itself.
     */
    public entry fun create_market(
        creator: &signer,
        description: String,
        resolution_timestamp: u64,
        resolver: address,
        target_address: address,
        target_function: String,
        target_value: u64,
        operator: u8,
    ) acquires MarketFactory, MarketFactoryController {
        let creator_address = signer::address_of(creator);
        let factory = borrow_global_mut<MarketFactory>(get_factory_address());
        let factory_signer = get_factory_signer();

        // We create the account first, then we will fund it.
        let (resource_signer, treasury_cap) = account::create_resource_account(
            &factory_signer,
            b"verifi_market_treasury", // seed
        );

        // Fund the new resource account with a minimal amount to exist on-chain and register it for AptosCoin.
        // NOTE: The `factory_signer` needs to have APT to pay for this.
        coin::register<AptosCoin>(&resource_signer);

        let yes_meta_constructor_ref = object::create_sticky_object(signer::address_of(&factory_signer));
        let no_meta_constructor_ref = object::create_sticky_object(signer::address_of(&factory_signer));

        let yes_token_mint_ref = fungible_asset::generate_mint_ref(&yes_meta_constructor_ref);
        let yes_token_burn_ref = fungible_asset::generate_burn_ref(&yes_meta_constructor_ref);
        let no_token_mint_ref = fungible_asset::generate_mint_ref(&no_meta_constructor_ref);
        let no_token_burn_ref = fungible_asset::generate_burn_ref(&no_meta_constructor_ref);

        let yes_token_metadata_obj = fungible_asset::add_fungibility(
            &yes_meta_constructor_ref,
            option::none<u128>(), // Unlimited supply for now
            string::utf8(b"VeriFi YES Token"),
            string::utf8(b"vYES"),
            6, // decimals
            string::utf8(b""), // icon_uri
            string::utf8(b""), // project_uri
        );

        let no_token_metadata_obj = fungible_asset::add_fungibility(
            &no_meta_constructor_ref,
            option::none<u128>(), // Unlimited supply for now
            string::utf8(b"VeriFi NO Token"),
            string::utf8(b"vNO"),
            6, // decimals
            string::utf8(b""), // icon_uri
            string::utf8(b""), // project_uri
        );

        let market_constructor_ref = object::create_object_from_account(&factory_signer);
        
        let new_market = Market {
            description,
            resolver,
            resolution_timestamp,
            status: 0,
            target_address,
            target_function,
            target_value,
            operator,
            pool_yes_tokens: 0,
            pool_no_tokens: 0,
            yes_token_metadata: yes_token_metadata_obj,
            no_token_metadata: no_token_metadata_obj,
            yes_token_mint_ref,
            yes_token_burn_ref,
            no_token_mint_ref,
            no_token_burn_ref,
            treasury_cap,
        };

        let market_object = object::object_from_constructor_ref<Market>(&market_constructor_ref);
        let market_address = object::object_address(&market_object);

        event::emit_event(
            &mut factory.creation_events,
            MarketCreatedEvent {
                market_address,
                creator: creator_address,
                description,
                resolution_timestamp,
            }
        );

        factory.market_count = factory.market_count + 1;
        vector::push_back(&mut factory.markets, market_object);

        let new_market_signer = object::generate_signer(&market_constructor_ref);
        move_to(&new_market_signer, new_market);
    }

    /**
    * @notice Allows a user to buy outcome shares by paying with APT.
    * @dev For the MVP, 1 APT mints one pair of shares (1 YES + 1 NO).
    * The chosen outcome share is sent to the buyer, and the other is sent to the AMM pool.
    * @param buyer The signer of the account buying the shares.
    * @param market_object The specific market object to buy shares from.
    * @param amount_apt The amount of APT coin to be paid.
    * @param buys_yes_shares A boolean indicating the desired outcome (true for YES, false for NO).
    */
    public entry fun buy_shares(
        buyer: &signer,
        market_object: Object<Market>,
        amount_octas: u64,
        buys_yes_shares: bool,
    ) acquires Market {
        let market_address = object::object_address(&market_object);
        let market = borrow_global_mut<Market>(market_address);

        // Get the resource account address from its stored capability
        let treasury_address = account::get_signer_capability_address(&market.treasury_cap);

        // Manually withdraw the APT from the buyer's account.
        let paid_apt = coin::withdraw<AptosCoin>(buyer, amount_octas);
        
        // Deposit the user's APT into the market's treasury account
        coin::deposit(treasury_address, paid_apt);

        // The amount to mint is now directly the amount paid.
        let amount_to_mint = amount_octas;

        // Mint a pair of shares (1 YES and 1 NO for each APT octas).
        let yes_shares = fungible_asset::mint(&market.yes_token_mint_ref, amount_to_mint);
        let no_shares = fungible_asset::mint(&market.no_token_mint_ref, amount_to_mint);

        let buyer_address = signer::address_of(buyer);

        if (buys_yes_shares) {
            // Send YES shares to the buyer, deposit NO shares into the AMM pool.
            let yes_store_addr = primary_fungible_store::primary_store_address(buyer_address, market.yes_token_metadata);
            let yes_store_obj = object::address_to_object<fungible_asset::FungibleStore>(yes_store_addr);
            fungible_asset::deposit(yes_store_obj, yes_shares);

            market.pool_no_tokens = market.pool_no_tokens + amount_to_mint;
            // For simplicity, we "deposit" the NO shares by just adding to the pool count.
            // We'll burn the object `no_shares` to remove it from scope.
            fungible_asset::destroy_zero(no_shares);
        } else {
            // Send NO shares to the buyer, deposit YES shares into the AMM pool.
            let no_store_addr = primary_fungible_store::primary_store_address(buyer_address, market.no_token_metadata);
            let no_store_obj = object::address_to_object<fungible_asset::FungibleStore>(no_store_addr);
            fungible_asset::deposit(no_store_obj, no_shares);

            // Deposit YES shares into the AMM pool.
            market.pool_yes_tokens = market.pool_yes_tokens + amount_to_mint;
            fungible_asset::destroy_zero(yes_shares);
        };
//         💡 Important Note for Your Frontend
// This change means your frontend application now has a new responsibility. Before a user can buy shares in a market for the first time, you must give them a button to execute a one-time transaction that calls primary_fungible_store::create_store for both the YES and NO tokens of that market. This initializes their "bank accounts" so they can receive the tokens.

// After updating the function, compile the contract again.
    }
}
