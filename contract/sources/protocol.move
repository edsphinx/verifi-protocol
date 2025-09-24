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
    use aptos_framework::object::{Self, Object, ExtendRef};
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::fungible_asset::{Self, Metadata};

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

        let yes_meta_constructor_ref = object::create_sticky_object(signer::address_of(&factory_signer));
        let no_meta_constructor_ref = object::create_sticky_object(signer::address_of(&factory_signer));

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
}
