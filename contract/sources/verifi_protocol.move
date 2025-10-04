/**
 * @title VeriFi Protocol
 * @author edsphinx
 * @notice This module contains the core logic for the VeriFi oracle-less derivatives protocol.
 * @dev Implements a MarketFactory singleton using the Aptos Object model. It manages the lifecycle
 * of individual prediction markets, from creation to resolution and payout.
 */
module VeriFiPublisher::verifi_protocol {

    // === Imports ===
    use std::bcs;
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
    use aptos_framework::timestamp;
    use VeriFiPublisher::oracle_registry;
    use VeriFiPublisher::oracles;

    // === Friends ===
    friend VeriFiPublisher::verifi_resolvers;

    // === Errors ===
    const E_MARKET_ALREADY_RESOLVED: u64 = 1;
    const E_MARKET_NOT_READY_FOR_RESOLUTION: u64 = 2;
    const E_MARKET_CLOSED_FOR_TRADING: u64 = 3;
    const E_NOT_AUTHORIZED: u64 = 4;
    const E_FACTORY_NOT_FOUND: u64 = 5;
    const E_MARKET_NOT_RESOLVED: u64 = 6;
    const E_NO_WINNERS: u64 = 7;
    const E_INSUFFICIENT_TREASURY_FUNDS: u64 = 8;
    const E_STORE_NOT_CREATED: u64 = 9;
    const E_FACTORY_SIGNER_NOT_FOUND: u64 = 10;
    const E_INVALID_TOKEN_FOR_MARKET: u64 = 11;
    const E_ORACLE_NOT_ACTIVE: u64 = 12;

    // === Constants ===
    const PROTOCOL_FEE_BASIS_POINTS: u64 = 200; // 2%
    const MARKET_FACTORY_SEED: vector<u8> = b"verifi_protocol_market_factory";
    const STATUS_OPEN: u8 = 0;
    const STATUS_CLOSED: u8 = 1; // for markets closed before resolution
    const STATUS_RESOLVED_YES: u8 = 2;
    const STATUS_RESOLVED_NO: u8 = 3;
    const OPERATOR_GREATER_THAN: u8 = 0;
    const OPERATOR_LESS_THAN: u8 = 1;

    // === Events ===
    #[event]
    struct MarketCreatedEvent has drop, store {
        market_address: address,
        creator: address,
        description: String,
        resolution_timestamp: u64,
    }

    #[event]
    struct SharesMintedEvent has drop, store {
        market_address: address,
        buyer: address,
        is_yes_outcome: bool,
        apt_amount_in: u64,
        shares_minted: u64,
    }

    #[event]
    struct MarketResolvedEvent has drop, store {
        market_address: address,
        outcome_is_yes: bool,
    }

    #[event]
    struct WinningsRedeemedEvent has drop, store {
        market_address: address,
        redeemer: address,
        shares_burned: u64,
        apt_payout: u64,
    }

    #[event]
    struct SharesSoldEvent has drop, store {
        market_address: address,
        seller: address,
        is_yes_outcome: bool,
        shares_burned: u64,
        apt_amount_out: u64,
    }

    // === Data Structures ===

    /**
     * @dev Represents a single prediction market. Stored as a resource within a dedicated Object.
     */
    struct Market has key {
        description: String,
        resolver: address,
        resolution_timestamp: u64,
        status: u8,
        oracle_id: String, // ID required oracle (eg. "aptos-balance")
        target_address: address,
        target_function: String,
        target_value: u64,
        operator: u8,
        pool_yes_tokens: u64,
        pool_no_tokens: u64,
        total_supply_yes: u64,
        total_supply_no: u64,
        yes_token_metadata: Object<Metadata>,
        no_token_metadata: Object<Metadata>,
        yes_token_mint_ref: fungible_asset::MintRef,
        yes_token_burn_ref: fungible_asset::BurnRef,
        no_token_mint_ref: fungible_asset::MintRef,
        no_token_burn_ref: fungible_asset::BurnRef,
        treasury_cap: account::SignerCapability,
        shares_minted_events: EventHandle<SharesMintedEvent>,
        market_resolved_events: EventHandle<MarketResolvedEvent>,
        winnings_redeemed_events: EventHandle<WinningsRedeemedEvent>,
        shares_sold_events: EventHandle<SharesSoldEvent>,
    }

    /**
     * @dev A controller resource stored within the singleton factory object.
     * It holds the `ExtendRef` capability, which allows the factory to generate a signer
     * for itself to create and own other objects (the markets).
     */
    struct MarketFactoryController has key {
        extend_ref: ExtendRef,
    }

    /**
     * @dev The main singleton resource for the protocol.
     * It tracks all created markets and holds the capability for the protocol's fee treasury.
     */
    struct MarketFactory has key {
        market_count: u64,
        markets: vector<Object<Market>>,
        creation_events: EventHandle<MarketCreatedEvent>,
        protocol_treasury_cap: account::SignerCapability,
    }

    /**
     * @dev A data-transfer-object (DTO) for efficiently fetching market display data for the UI.
     * This struct is not a resource and is designed to be returned by `#[view]` functions.
     */
    struct MarketView has store, drop {
        description: String,
        resolution_timestamp: u64,
        status: u8,
        pool_yes_tokens: u64,
        pool_no_tokens: u64,
        total_supply_yes: u64,
        total_supply_no: u64,
    }

    /**
     * @dev Enhanced market summary with calculated prices and analytics data.
     */
    struct MarketSummary has drop {
        market_address: address,
        description: String,
        status: u8,
        resolution_timestamp: u64,
        yes_price: u64,          // Price in basis points (1000000 = 100%)
        no_price: u64,           // Price in basis points
        yes_supply: u64,
        no_supply: u64,
        total_supply: u64,
        pool_yes_tokens: u64,
        pool_no_tokens: u64,
    }

    /**
     * @dev User position in a specific market.
     */
    struct UserPosition has drop {
        market_address: address,
        yes_balance: u64,
        no_balance: u64,
        yes_value: u64,          // Current value in octas
        no_value: u64,           // Current value in octas
        total_value: u64,        // Total portfolio value
    }

    /**
     * @dev Portfolio summary for a user across all markets.
     */
    struct PortfolioValue has drop {
        total_positions: u64,
        total_value_yes: u64,
        total_value_no: u64,
        total_value: u64,
        market_count: u64,
    }

    /**
     * @dev High-level protocol statistics.
     */
    struct ProtocolStats has drop {
        total_markets: u64,
        active_markets: u64,
        resolved_markets: u64,
        total_yes_supply: u64,
        total_no_supply: u64,
        total_supply: u64,
    }

    // === Initialization Function ===

    /**
     * @notice Initializes the protocol by creating the singleton `MarketFactory` object.
     * @dev Is called automatically when the contract is deployed
     * It creates a named object at a deterministic address to house the
     * factory resources, ensuring a single, discoverable entry point for the protocol.
     * @param sender The signer of the account that will own the protocol's treasury.
     */
    fun init_module(sender: &signer) {
        let constructor_ref = object::create_named_object(sender, MARKET_FACTORY_SEED);
        let factory_signer = object::generate_signer(&constructor_ref);

        let (protocol_treasury_signer, protocol_treasury_cap) = account::create_resource_account(sender, b"verifi_protocol_treasury");
        coin::register<AptosCoin>(&protocol_treasury_signer);

        move_to(&factory_signer, MarketFactoryController {
            extend_ref: object::generate_extend_ref(&constructor_ref),
        });

        let creation_events = object::new_event_handle<MarketCreatedEvent>(&factory_signer);

        move_to(&factory_signer, MarketFactory {
            market_count: 0,
            markets: vector::empty(),
            creation_events,
            protocol_treasury_cap,
        });
    }

    // === Helper Functions ===

    /**
     * @dev Gets the deterministic address of the singleton `MarketFactory` object.
     * @return The address of the factory object.
     */
    fun get_factory_address(): address {
        object::create_object_address(&@VeriFiPublisher, MARKET_FACTORY_SEED)
    }

    /**
     * @dev Gets the signer for the `MarketFactory` object.
     * @dev This allows the factory to act as an account, owning the market objects it creates.
     * @return A `signer` capability for the factory object's account.
     */
    fun get_factory_signer(): signer acquires MarketFactoryController {
        let controller = borrow_global<MarketFactoryController>(get_factory_address());
        object::generate_signer_for_extending(&controller.extend_ref)
    }

    // === Entry Functions ===

    /**
     * @notice Creates a new prediction market.
     * @dev The new `Market` object is created and owned by the `MarketFactory`. This function
     * also creates the two fungible assets (YES/NO tokens) specific to this market.
     * @param creator The signer of the account creating the market.
     * @param description The question of the prediction market.
     * @param resolution_timestamp The Unix timestamp when the market can be resolved.
     * @param resolver The address authorized to perform manual resolution.
     * @param oracle_id The string ID of the on-chain oracle used for programmatic resolution.
     * @param target_address The address the oracle will query.
     * @param target_function [Legacy] Not currently used in resolution logic (keep for backwards compatibility).
     * @param target_value The value to compare the oracle's result against.
     * @param operator The comparison operator to use (0 for >, 1 for <).
     */
    public entry fun create_market(
        creator: &signer,
        description: String,
        resolution_timestamp: u64,
        resolver: address,
        oracle_id: String,
        target_address: address,
        target_function: String,
        target_value: u64,
        operator: u8,
    ) acquires MarketFactory, MarketFactoryController {
        assert!(oracle_registry::is_oracle_active(oracle_id), E_ORACLE_NOT_ACTIVE);

        let creator_address = signer::address_of(creator);
        let factory_address = get_factory_address();
        let factory_signer = get_factory_signer();
        let factory = borrow_global_mut<MarketFactory>(factory_address);
        
        let market_constructor_ref = object::create_object(factory_address);
        let new_market_signer = object::generate_signer(&market_constructor_ref);

        let (resource_signer, treasury_cap) = account::create_resource_account(
          &factory_signer, 
          bcs::to_bytes(&object::address_from_constructor_ref(&market_constructor_ref))
        );
        coin::register<AptosCoin>(&resource_signer);

        let yes_meta_constructor_ref = object::create_sticky_object(factory_address);
        let no_meta_constructor_ref = object::create_sticky_object(factory_address);

        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            &yes_meta_constructor_ref,
            option::none<u128>(), // Unlimited supply for now
            string::utf8(b"VeriFi YES Token"),
            string::utf8(b"vYES"),
            6, // decimals
            string::utf8(b""), // icon_uri
            string::utf8(b""), // project_uri
        );

        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            &no_meta_constructor_ref,
            option::none<u128>(), // Unlimited supply for now
            string::utf8(b"VeriFi NO Token"),
            string::utf8(b"vNO"),
            6, // decimals
            string::utf8(b""), // icon_uri
            string::utf8(b""), // project_uri
        );

        let yes_token_metadata_obj = object::object_from_constructor_ref<Metadata>(&yes_meta_constructor_ref);
        let no_token_metadata_obj = object::object_from_constructor_ref<Metadata>(&no_meta_constructor_ref);

        let yes_token_mint_ref = fungible_asset::generate_mint_ref(&yes_meta_constructor_ref);
        let yes_token_burn_ref = fungible_asset::generate_burn_ref(&yes_meta_constructor_ref);
        let no_token_mint_ref = fungible_asset::generate_mint_ref(&no_meta_constructor_ref);
        let no_token_burn_ref = fungible_asset::generate_burn_ref(&no_meta_constructor_ref);

        let shares_minted_events = object::new_event_handle<SharesMintedEvent>(&new_market_signer);
        let market_resolved_events = object::new_event_handle<MarketResolvedEvent>(&new_market_signer);
        let winnings_redeemed_events = object::new_event_handle<WinningsRedeemedEvent>(&new_market_signer);
        let shares_sold_events = object::new_event_handle<SharesSoldEvent>(&new_market_signer);

        let new_market = Market {
            description,
            resolver,
            resolution_timestamp,
            status: 0,
            oracle_id, // <-- ID required oracle
            target_address,
            target_function,
            target_value,
            operator,
            pool_yes_tokens: 0,
            pool_no_tokens: 0,
            total_supply_yes: 0,
            total_supply_no: 0,
            yes_token_metadata: yes_token_metadata_obj,
            no_token_metadata: no_token_metadata_obj,
            yes_token_mint_ref,
            yes_token_burn_ref,
            no_token_mint_ref,
            no_token_burn_ref,
            treasury_cap,
            shares_minted_events,
            market_resolved_events,
            winnings_redeemed_events,
            shares_sold_events
        };
        
        move_to(&new_market_signer, new_market);

        let market_object = object::object_from_constructor_ref<Market>(&market_constructor_ref);
        let market_address = object::object_address(&market_object);
        vector::push_back(&mut factory.markets, market_object);
        factory.market_count = factory.market_count + 1;
        
        event::emit_event(
            &mut factory.creation_events,
            MarketCreatedEvent {
                market_address,
                creator: creator_address,
                description,
                resolution_timestamp,
            }
        );
        
    }

    /**
     * @notice Buy outcome shares for a market using APT.
     * @dev Implements a 1:1 minting model for the MVP. A pair of 1 YES and 1 NO share is
     * minted for each Octa of APT deposited. The chosen share is sent to the buyer, and
     * the opposing share is burned after its value is added to the internal AMM pool counter.
     * This function will automatically create a `FungibleStore` for the user if it doesn't exist.
     * @param buyer The signer of the account buying the shares.
     * @param market_object The market to buy shares from.
     * @param amount_octas The amount of APT (in Octas) to spend.
     * @param buys_yes_shares `true` to buy YES shares, `false` to buy NO shares.
     */
    public entry fun buy_shares(
        buyer: &signer,
        market_object: Object<Market>,
        amount_octas: u64,
        buys_yes_shares: bool,
    ) acquires Market {
        let market_address = object::object_address(&market_object);
        let market = borrow_global_mut<Market>(market_address);

        assert!(market.status == STATUS_OPEN, E_MARKET_CLOSED_FOR_TRADING);
        assert!(timestamp::now_seconds() < market.resolution_timestamp, E_MARKET_CLOSED_FOR_TRADING);

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

        market.total_supply_yes = market.total_supply_yes + amount_to_mint;
        market.total_supply_no = market.total_supply_no + amount_to_mint;

        // --- SECURITY CHECKS ---
        let buyer_address = signer::address_of(buyer);

        if (buys_yes_shares) {
            primary_fungible_store::ensure_primary_store_exists(buyer_address, market.yes_token_metadata);

            // Send YES shares to the buyer, deposit NO shares into the AMM pool.
            let yes_store_addr = primary_fungible_store::primary_store_address(buyer_address, market.yes_token_metadata);
            let yes_store_obj = object::address_to_object<fungible_asset::FungibleStore>(yes_store_addr);
            fungible_asset::deposit(yes_store_obj, yes_shares);

            market.pool_no_tokens = market.pool_no_tokens + amount_to_mint;
            // For simplicity, we "deposit" the NO shares by just adding to the pool count.
            // We'll burn the object `no_shares` to remove it from scope.
            fungible_asset::burn(&market.no_token_burn_ref, no_shares);
        } else {
            primary_fungible_store::ensure_primary_store_exists(buyer_address, market.no_token_metadata);
            
            // Send NO shares to the buyer, deposit YES shares into the AMM pool.
            let no_store_addr = primary_fungible_store::primary_store_address(buyer_address, market.no_token_metadata);
            let no_store_obj = object::address_to_object<fungible_asset::FungibleStore>(no_store_addr);
            fungible_asset::deposit(no_store_obj, no_shares);

            // Deposit YES shares into the AMM pool.
            market.pool_yes_tokens = market.pool_yes_tokens + amount_to_mint;
            fungible_asset::burn(&market.yes_token_burn_ref, yes_shares);
        };
        event::emit_event(
            &mut market.shares_minted_events,
            SharesMintedEvent {
                market_address,
                buyer: signer::address_of(buyer),
                is_yes_outcome: buys_yes_shares,
                apt_amount_in: amount_octas,
                shares_minted: amount_to_mint,
            }
        );
    }
    
    /**
     * @notice Sell outcome shares back to the market for APT before resolution.
     * @dev Implements a 1:1 redemption model for the MVP. This function is not a true AMM swap.
     * The user's shares are burned, and an equivalent amount of APT is returned from the treasury.
     * @param seller The signer of the account selling the shares.
     * @param market_object The market to sell shares to.
     * @param amount_to_sell The number of shares to sell.
     * @param sells_yes_shares `true` if selling YES shares, `false` if selling NO shares.
     */
    public entry fun sell_shares(
        seller: &signer,
        market_object: Object<Market>,
        amount_to_sell: u64,
        sells_yes_shares: bool,
    ) acquires Market {
        let market_address = object::object_address(&market_object);
        let market = borrow_global_mut<Market>(market_address);
        
        assert!(market.status == STATUS_OPEN, E_MARKET_CLOSED_FOR_TRADING);
        assert!(timestamp::now_seconds() < market.resolution_timestamp, E_MARKET_CLOSED_FOR_TRADING);

        let seller_address = signer::address_of(seller);

        if (sells_yes_shares) {
            // <<< SECURITY CHECK >>>
            // Get the seller's primary store for the YES token.
            let yes_store_addr = primary_fungible_store::primary_store_address(seller_address, market.yes_token_metadata);
            let yes_store_obj = object::address_to_object<fungible_asset::FungibleStore>(yes_store_addr);
            
            // Withdraw the tokens from the user's store.
            let tokens_to_sell = fungible_asset::withdraw(seller, yes_store_obj, amount_to_sell);

            // Update the pool and burn the tokens.
            market.total_supply_yes = market.total_supply_yes - amount_to_sell;
            fungible_asset::burn(&market.yes_token_burn_ref, tokens_to_sell);
        } else {
            // <<< SECURITY CHECK >>>
            // Get the seller's primary store for the NO token.
            let no_store_addr = primary_fungible_store::primary_store_address(seller_address, market.no_token_metadata);
            let no_store_obj = object::address_to_object<fungible_asset::FungibleStore>(no_store_addr);

            // Withdraw the tokens from the user's store.
            let tokens_to_sell = fungible_asset::withdraw(seller, no_store_obj, amount_to_sell);

            // Update the pool and burn the tokens.
            market.total_supply_no = market.total_supply_no - amount_to_sell;
            fungible_asset::burn(&market.no_token_burn_ref, tokens_to_sell);
        };

        // Calculate the payout amount (MVP: 1:1 price).
        let payout_amount = amount_to_sell;

        let treasury_address = account::get_signer_capability_address(&market.treasury_cap);
        let treasury_balance = coin::balance<AptosCoin>(treasury_address);
        assert!(treasury_balance >= payout_amount, E_INSUFFICIENT_TREASURY_FUNDS);

        // Withdraw APT from the market's treasury and pay the user. 🏦
        // This is the step that the Resource Account enables.
        let treasury_signer = account::create_signer_with_capability(&market.treasury_cap);
        let apt_to_return = coin::withdraw<AptosCoin>(&treasury_signer, payout_amount);
        coin::deposit(seller_address, apt_to_return);

        event::emit_event(
        &mut market.shares_sold_events,
        SharesSoldEvent {
            market_address,
            seller: seller_address,
            is_yes_outcome: sells_yes_shares,
            shares_burned: amount_to_sell,
            apt_amount_out: payout_amount,
        }
    );
    }

    /**
     * @notice Manually resolve a market.
     * @dev This is a fallback resolution method. Can only be called by the designated `resolver`
     * for the market and only after the `resolution_timestamp` has passed.
     * @param resolver The signer of the designated resolver account.
     * @param market_object The market to resolve.
     * @param outcome_is_yes The final boolean outcome of the market.
     */
    public entry fun resolve_market(
        resolver: &signer,
        market_object: Object<Market>,
        outcome_is_yes: bool,
    ) acquires Market {
        let market_address = object::object_address(&market_object);
        let market = borrow_global_mut<Market>(market_address);

        // --- SECURITY CHECKS ---
        // Check if the caller is the authorized resolver for this market.
        assert!(signer::address_of(resolver) == market.resolver, E_NOT_AUTHORIZED);

        // Check if the market's resolution time has passed.
        assert!(timestamp::now_seconds() >= market.resolution_timestamp, E_MARKET_NOT_READY_FOR_RESOLUTION);

        // Check if the market is still open and has not been resolved yet.
        assert!(market.status == STATUS_OPEN, E_MARKET_ALREADY_RESOLVED);

        // --- SET FINAL OUTCOME ---
        if (outcome_is_yes) {
            market.status = STATUS_RESOLVED_YES; // 2 = Resolved-Yes
        } else {
            market.status = STATUS_RESOLVED_NO; // 3 = Resolved-No
        };

        event::emit_event(
            &mut market.market_resolved_events,
            MarketResolvedEvent {
                market_address,
                outcome_is_yes,
            }
        );
    }

    /**
     * @notice Redeem winning shares for a proportional cut of the total prize pool (APT).
     * @dev Can only be called after a market has been resolved. Calculates the user's payout,
     * subtracts the protocol fee, and transfers the final APT amount.
     * @param redeemer The signer of the account redeeming their winning shares.
     * @param market_object The resolved market.
     * @param amount_to_redeem The number of winning shares to redeem.
     */
    public entry fun redeem_winnings(
        redeemer: &signer,
        market_object: Object<Market>,
        amount_to_redeem: u64,
    ) acquires Market, MarketFactory {
        let market_address = object::object_address(&market_object);
        let market = borrow_global_mut<Market>(market_address);
        let redeemer_address = signer::address_of(redeemer);

        // Check that the market is actually resolved.
        assert!(market.status == STATUS_RESOLVED_YES || market.status == STATUS_RESOLVED_NO, E_MARKET_NOT_RESOLVED);

        let treasury_address = account::get_signer_capability_address(&market.treasury_cap);
        let total_pool_balance = coin::balance<AptosCoin>(treasury_address);

        // Determine which token is the winning one based on market status.
        let (winning_token_metadata, winning_token_burn_ref, winning_token_supply) = if (market.status == STATUS_RESOLVED_YES) { // Market resolved YES
            (market.yes_token_metadata, &market.yes_token_burn_ref, market.total_supply_yes)
        } else { // Market resolved NO
            (market.no_token_metadata, &market.no_token_burn_ref, market.total_supply_no)
        };

        assert!(winning_token_supply > 0, E_NO_WINNERS);

        let payout_amount = (amount_to_redeem as u128) * (total_pool_balance as u128) / (winning_token_supply as u128);

        let protocol_fee = (payout_amount * (PROTOCOL_FEE_BASIS_POINTS as u128) / 10000) as u64;
        let final_payout_to_user = (payout_amount as u64) - protocol_fee;

        // Withdraw the winning tokens from the redeemer's primary store.
        let store_addr = primary_fungible_store::primary_store_address(redeemer_address, winning_token_metadata);
        let store_obj = object::address_to_object<fungible_asset::FungibleStore>(store_addr);
        let tokens_to_redeem = fungible_asset::withdraw(redeemer, store_obj, amount_to_redeem);

        // Burn the redeemed tokens.
        fungible_asset::burn(winning_token_burn_ref, tokens_to_redeem);

        // PAY USER & PROTOCOL FEE WITH APT
        let treasury_signer = account::create_signer_with_capability(&market.treasury_cap);

        // Pay out the protocolfee with the corresponding amount calculated of APT
        let factory = borrow_global<MarketFactory>(get_factory_address());
        let protocol_treasury_address = account::get_signer_capability_address(&factory.protocol_treasury_cap);
        let fee_apt = coin::withdraw<AptosCoin>(&treasury_signer, protocol_fee);
        coin::deposit(protocol_treasury_address, fee_apt);

        // Pay out the user with the corresponding amount calculated of APT
        let apt_to_return = coin::withdraw<AptosCoin>(&treasury_signer, (final_payout_to_user));
        coin::deposit(redeemer_address, apt_to_return);

        event::emit_event(
            &mut market.winnings_redeemed_events,
            WinningsRedeemedEvent {
                market_address,
                redeemer: redeemer_address,
                shares_burned: amount_to_redeem,
                apt_payout: final_payout_to_user,
            }
        );
    }

    // === Friend Functions ===

    /**
     * @notice Securely exposes necessary market data to the trusted resolver contract.
     * @dev This is a `public(friend)` function, only callable by modules declared as friends
     * (i.e., `verifi_resolvers`). It provides the data needed for programmatic resolution.
     * @param market_object The market to query.
     * @return A tuple containing the oracle configuration data.
     */
    public(friend) fun get_market_resolution_data(
        market_object: Object<Market>
    ): (String, address, u64, u8, u64) acquires Market {
        let market = borrow_global<Market>(object::object_address(&market_object));
        (
            market.oracle_id,
            market.target_address,
            market.target_value,
            market.operator,
            market.resolution_timestamp
        )
    }

    /**
     * @notice Updates a market's status based on a programmatic resolution.
     * @dev This is a `public(friend)` function, only callable by the trusted resolver contract.
     * It performs the final checks and updates the market's `status` field.
     * @param market_object The market to update.
     * @param oracle_value The value read from the on-chain oracle.
     * @param target_value The market's original target value.
     * @param operator The market's comparison operator.
     */
    public(friend) fun update_market_status_from_resolver(
        market_object: Object<Market>,
        oracle_value: u64,
        target_value: u64,
        operator: u8,
    ) acquires Market {
        let market_address = object::object_address(&market_object);
        let market = borrow_global_mut<Market>(market_address);

        assert!(timestamp::now_seconds() >= market.resolution_timestamp, E_MARKET_NOT_READY_FOR_RESOLUTION);
        assert!(market.status == STATUS_OPEN, E_MARKET_ALREADY_RESOLVED);

        let outcome_is_yes = if (operator == OPERATOR_GREATER_THAN) {
            oracle_value > target_value
        } else if (operator == OPERATOR_LESS_THAN) {
            oracle_value < target_value
        } else {
            false
        };

        if (outcome_is_yes) {
            market.status = STATUS_RESOLVED_YES;
        } else {
            market.status = STATUS_RESOLVED_NO;
        };

        event::emit_event(
            &mut market.market_resolved_events,
            MarketResolvedEvent {
                market_address,
                outcome_is_yes,
            }
        );
    }

    // === View Functions ===

    #[view]
    /**
     * @notice Gets the balance of a specific fungible asset store if it belongs to a VeriFi market.
     * @dev A `#[view]` function primarily for off-chain services.
     */
    public fun get_fa_balance(
        store_address: address,
        market_address: address
    ): u64 acquires Market {
        if (!fungible_asset::store_exists(store_address)) {
            return 0
        };

        let store_object = object::address_to_object<fungible_asset::FungibleStore>(store_address);

        let market = borrow_global<Market>(market_address);
        let store_metadata = fungible_asset::store_metadata(store_object);
        let store_metadata_addr = object::object_address(&store_metadata);

        assert!(
            store_metadata_addr == object::object_address(&market.yes_token_metadata) ||
            store_metadata_addr == object::object_address(&market.no_token_metadata),
            E_INVALID_TOKEN_FOR_MARKET
        );

        fungible_asset::balance(store_object)
    }

    #[view]
    /**
     * @notice Gets the YES and NO share balances for a specific owner in a given market.
     * @dev A `#[view]` function that gracefully returns 0 if the user does not have a store for a token.
     */
    public fun get_balances(owner: address, market_object: Object<Market>): (u64, u64) acquires Market {
        let market = borrow_global<Market>(object::object_address(&market_object));
        
        let yes_balance = primary_fungible_store::balance(owner, market.yes_token_metadata);
        let no_balance = primary_fungible_store::balance(owner, market.no_token_metadata);
        
        (yes_balance, no_balance)
    }

    #[view]
    /**
     * @notice Gets all necessary UI data for a single market in one call.
     * @dev A `#[view]` function that aggregates static and dynamic data into a `MarketView` struct
     * for efficient frontend rendering.
     */
    public fun get_market_view(market_object: Object<Market>): MarketView acquires Market {
        let market = borrow_global<Market>(object::object_address(&market_object));
        MarketView {
            description: market.description,
            resolution_timestamp: market.resolution_timestamp,
            status: market.status,
            pool_yes_tokens: market.pool_yes_tokens,
            pool_no_tokens: market.pool_no_tokens,
            total_supply_yes: market.total_supply_yes,
            total_supply_no: market.total_supply_no,
        }
    }

    #[view]
    /**
     * @notice Gets the aggregate numerical state of a market.
     * @dev A `#[view]` function for efficiently fetching dynamic data for the UI.
     */
    public fun get_market_state(market_object: Object<Market>): (u8, u64, u64, u64, u64) acquires Market {
        let market = borrow_global<Market>(object::object_address(&market_object));
        (
            market.status,
            market.total_supply_yes,
            market.total_supply_no,
            market.pool_yes_tokens,
            market.pool_no_tokens
        )
    }

    #[view]
    /**
     * @notice Gets the token metadata addresses for YES and NO tokens
     * @dev Returns the addresses of the YES and NO token metadata objects
     * @param market_object The market object
     * @return (yes_token_address, no_token_address)
     */
    public fun get_token_addresses(market_object: Object<Market>): (address, address) acquires Market {
        let market = borrow_global<Market>(object::object_address(&market_object));
        (
            object::object_address(&market.yes_token_metadata),
            object::object_address(&market.no_token_metadata)
        )
    }

    #[view]
    /**
     * @notice A diagnostic `#[view]` function to check if the `MarketFactoryController` has been initialized.
     */
    public fun is_factory_initialized(): bool {
        exists<MarketFactoryController>(get_factory_address())
    }

    #[view]
    /**
     * @notice A comprehensive diagnostic `#[view]` function to check the initialization status of all factory resources.
     */
    public fun get_factory_status(): (bool, bool) {
        let factory_addr = get_factory_address();
        let controller_exists = exists<MarketFactoryController>(factory_addr);
        let factory_exists = exists<MarketFactory>(factory_addr);
        (controller_exists, factory_exists)
    }

    /*
    * @notice (FOR AMM) Calculates the current price of a YES share based on pool reserves.
    * @dev Returns the price as a scaled fixed-point number (e.g., with 8 decimals).
    * @param market_object The market to query.
    * @return u128 The price of one YES share.
    *
    // public fun get_market_price(market_object: Object<Market>): u128 acquires Market {
    //     let market = borrow_global<Market>(object::object_address(&market_object));
    //     
    //     // Evitar división por cero si el pool de YES está vacío
    //     if (market.pool_yes_tokens == 0) {
    //         return 0; // O un precio inicial, ej. 0.5 * 10^8
    //     };
    //
    //     // Fórmula de precio: (reserva del token opuesto) / (reserva de este token)
    //     // Se escala para manejar decimales (ej. 10^8)
    //     let price = ((market.pool_no_tokens as u128) * 100_000_000) / (market.pool_yes_tokens as u128);
    //     price
    // }
    */

    #[view]
    /**
     * @notice A diagnostic `#[view]` function to confirm the factory's signer address can be generated.
     */
    public fun get_factory_signer_address(): address acquires MarketFactoryController {
        let factory_signer = get_factory_signer();
        let factory_address = signer::address_of(&factory_signer);
        
        if (!account::exists_at(factory_address)) {
            @0x0
        } else {
            factory_address
        }
    }

    #[view]
    /**
     * @notice A diagnostic view function to check the programmatic resolution outcome without changing state.
     * @dev Replicates the read and comparison logic of `resolve_market_programmatically`.
     * @param market_object The market to check.
     * @return bool The calculated outcome (true if YES, false if NO).
     */
    public fun debug_check_outcome(market_object: Object<Market>): bool
        acquires Market {

        let market = borrow_global<Market>(object::object_address(&market_object));

        let current_on_chain_value = oracles::fetch_data(market.oracle_id, market.target_address);

        let outcome_is_yes = if (market.operator == OPERATOR_GREATER_THAN) {
            current_on_chain_value > market.target_value
        } else if (market.operator == OPERATOR_LESS_THAN) {
            current_on_chain_value < market.target_value
        } else {
            false
        };

        outcome_is_yes
    }

    #[view]
    /**
     * @notice Debugging function to check oracle value and market data
     * @dev Returns (oracle_value, target_value, operator, resolution_timestamp, current_timestamp, status)
     */
    public fun debug_market_resolution_data(market_object: Object<Market>): (u64, u64, u8, u64, u64, u8)
        acquires Market {
        let market = borrow_global<Market>(object::object_address(&market_object));
        let oracle_value = oracles::fetch_data(market.oracle_id, market.target_address);
        (
            oracle_value,
            market.target_value,
            market.operator,
            market.resolution_timestamp,
            timestamp::now_seconds(),
            market.status
        )
    }

    // === DeFi Dashboard Analytics View Functions ===

    #[view]
    /**
     * @notice Gets comprehensive market summary with calculated prices.
     * @dev Priority 1: Essential for market cards and analytics dashboard.
     * Calculates YES/NO prices based on supply ratio (1:1 pricing model for MVP).
     * @param market_address The address of the market
     * @return MarketSummary struct with all relevant data
     */
    public fun get_market_summary(market_address: address): MarketSummary acquires Market {
        let market = borrow_global<Market>(market_address);

        let total_supply = market.total_supply_yes + market.total_supply_no;

        // Calculate prices based on supply ratio (basis points: 1000000 = 100%)
        let (yes_price, no_price) = if (total_supply > 0) {
            let yes_ratio = ((market.total_supply_yes as u128) * 1000000) / (total_supply as u128);
            let no_ratio = ((market.total_supply_no as u128) * 1000000) / (total_supply as u128);
            ((yes_ratio as u64), (no_ratio as u64))
        } else {
            (500000, 500000) // 50% each if no supply
        };

        MarketSummary {
            market_address,
            description: market.description,
            status: market.status,
            resolution_timestamp: market.resolution_timestamp,
            yes_price,
            no_price,
            yes_supply: market.total_supply_yes,
            no_supply: market.total_supply_no,
            total_supply,
            pool_yes_tokens: market.pool_yes_tokens,
            pool_no_tokens: market.pool_no_tokens,
        }
    }

    #[view]
    /**
     * @notice Gets market summaries for multiple markets in a single call.
     * @dev Priority 1: Gas-efficient batch operation for dashboard loading.
     * @param market_addresses Vector of market addresses to query
     * @return Vector of MarketSummary structs
     */
    public fun get_batch_market_summaries(market_addresses: vector<address>): vector<MarketSummary> acquires Market {
        let summaries = vector::empty<MarketSummary>();
        let len = vector::length(&market_addresses);
        let i = 0;

        while (i < len) {
            let addr = *vector::borrow(&market_addresses, i);
            if (exists<Market>(addr)) {
                let summary = get_market_summary(addr);
                vector::push_back(&mut summaries, summary);
            };
            i = i + 1;
        };

        summaries
    }

    #[view]
    /**
     * @notice Gets user position in a specific market with calculated values.
     * @dev Priority 2: Essential for portfolio tracking.
     * @param user The user's address
     * @param market_address The market address
     * @return UserPosition struct with balances and values
     */
    public fun get_user_position(user: address, market_address: address): UserPosition acquires Market {
        let market = borrow_global<Market>(market_address);

        let yes_balance = primary_fungible_store::balance(user, market.yes_token_metadata);
        let no_balance = primary_fungible_store::balance(user, market.no_token_metadata);

        // In MVP with 1:1 pricing, value = balance
        let yes_value = yes_balance;
        let no_value = no_balance;
        let total_value = yes_value + no_value;

        UserPosition {
            market_address,
            yes_balance,
            no_balance,
            yes_value,
            no_value,
            total_value,
        }
    }

    #[view]
    /**
     * @notice Gets user positions across multiple markets.
     * @dev Priority 2: Batch operation for complete portfolio view.
     * @param user The user's address
     * @param market_addresses Vector of market addresses
     * @return Vector of UserPosition structs
     */
    public fun get_user_positions(user: address, market_addresses: vector<address>): vector<UserPosition> acquires Market {
        let positions = vector::empty<UserPosition>();
        let len = vector::length(&market_addresses);
        let i = 0;

        while (i < len) {
            let addr = *vector::borrow(&market_addresses, i);
            if (exists<Market>(addr)) {
                let position = get_user_position(user, addr);
                // Only include if user has a position
                if (position.yes_balance > 0 || position.no_balance > 0) {
                    vector::push_back(&mut positions, position);
                };
            };
            i = i + 1;
        };

        positions
    }

    #[view]
    /**
     * @notice Gets total portfolio value for a user across all markets.
     * @dev Priority 2: Summary for portfolio dashboard header.
     * @param user The user's address
     * @return PortfolioValue struct with aggregated data
     */
    public fun get_user_portfolio_value(user: address): PortfolioValue acquires Market, MarketFactory {
        let factory = borrow_global<MarketFactory>(get_factory_address());
        let markets = &factory.markets;
        let len = vector::length(markets);

        let total_value_yes: u64 = 0;
        let total_value_no: u64 = 0;
        let market_count: u64 = 0;
        let total_positions: u64 = 0;

        let i = 0;
        while (i < len) {
            let market_obj = *vector::borrow(markets, i);
            let market_addr = object::object_address(&market_obj);
            let market = borrow_global<Market>(market_addr);

            let yes_balance = primary_fungible_store::balance(user, market.yes_token_metadata);
            let no_balance = primary_fungible_store::balance(user, market.no_token_metadata);

            if (yes_balance > 0 || no_balance > 0) {
                total_value_yes = total_value_yes + yes_balance;
                total_value_no = total_value_no + no_balance;
                market_count = market_count + 1;

                if (yes_balance > 0) total_positions = total_positions + 1;
                if (no_balance > 0) total_positions = total_positions + 1;
            };

            i = i + 1;
        };

        PortfolioValue {
            total_positions,
            total_value_yes,
            total_value_no,
            total_value: total_value_yes + total_value_no,
            market_count,
        }
    }

    #[view]
    /**
     * @notice Gets protocol-wide statistics.
     * @dev Priority 3: High-level metrics for protocol dashboard.
     * @return ProtocolStats struct with aggregated protocol data
     */
    public fun get_protocol_stats(): ProtocolStats acquires MarketFactory, Market {
        let factory = borrow_global<MarketFactory>(get_factory_address());
        let markets = &factory.markets;
        let total_markets = vector::length(markets);

        let active_markets: u64 = 0;
        let resolved_markets: u64 = 0;
        let total_yes_supply: u64 = 0;
        let total_no_supply: u64 = 0;

        let i = 0;
        while (i < total_markets) {
            let market_obj = *vector::borrow(markets, i);
            let market = borrow_global<Market>(object::object_address(&market_obj));

            if (market.status == STATUS_OPEN) {
                active_markets = active_markets + 1;
            } else if (market.status == STATUS_RESOLVED_YES || market.status == STATUS_RESOLVED_NO) {
                resolved_markets = resolved_markets + 1;
            };

            total_yes_supply = total_yes_supply + market.total_supply_yes;
            total_no_supply = total_no_supply + market.total_supply_no;

            i = i + 1;
        };

        ProtocolStats {
            total_markets,
            active_markets,
            resolved_markets,
            total_yes_supply,
            total_no_supply,
            total_supply: total_yes_supply + total_no_supply,
        }
    }

    #[view]
    /**
     * @notice Gets active markets for discovery/listing.
     * @dev Priority 2: Filtered view for markets hub.
     * @return Vector of active market addresses
     */
    public fun get_active_market_addresses(): vector<address> acquires MarketFactory, Market {
        let factory = borrow_global<MarketFactory>(get_factory_address());
        let markets = &factory.markets;
        let active_addresses = vector::empty<address>();
        let len = vector::length(markets);

        let i = 0;
        while (i < len) {
            let market_obj = *vector::borrow(markets, i);
            let market_addr = object::object_address(&market_obj);
            let market = borrow_global<Market>(market_addr);

            if (market.status == STATUS_OPEN) {
                vector::push_back(&mut active_addresses, market_addr);
            };
            i = i + 1;
        };

        active_addresses
    }

    #[view]
    /**
     * @notice Gets resolved markets for history view.
     * @dev Priority 3: For historical data and leaderboards.
     * @return Vector of resolved market addresses
     */
    public fun get_resolved_market_addresses(): vector<address> acquires MarketFactory, Market {
        let factory = borrow_global<MarketFactory>(get_factory_address());
        let markets = &factory.markets;
        let resolved_addresses = vector::empty<address>();
        let len = vector::length(markets);

        let i = 0;
        while (i < len) {
            let market_obj = *vector::borrow(markets, i);
            let market_addr = object::object_address(&market_obj);
            let market = borrow_global<Market>(market_addr);

            if (market.status == STATUS_RESOLVED_YES || market.status == STATUS_RESOLVED_NO) {
                vector::push_back(&mut resolved_addresses, market_addr);
            };
            i = i + 1;
        };

        resolved_addresses
    }

    #[view]
    /**
     * @notice Gets market count by status.
     * @dev Priority 3: Quick stats for analytics.
     * @return (total, active, resolved_yes, resolved_no, closed)
     */
    public fun get_market_counts(): (u64, u64, u64, u64, u64) acquires MarketFactory, Market {
        let factory = borrow_global<MarketFactory>(get_factory_address());
        let markets = &factory.markets;
        let total = vector::length(markets);

        let active: u64 = 0;
        let resolved_yes: u64 = 0;
        let resolved_no: u64 = 0;
        let closed: u64 = 0;

        let i = 0;
        while (i < total) {
            let market_obj = *vector::borrow(markets, i);
            let market = borrow_global<Market>(object::object_address(&market_obj));

            if (market.status == STATUS_OPEN) {
                active = active + 1;
            } else if (market.status == STATUS_RESOLVED_YES) {
                resolved_yes = resolved_yes + 1;
            } else if (market.status == STATUS_RESOLVED_NO) {
                resolved_no = resolved_no + 1;
            } else if (market.status == STATUS_CLOSED) {
                closed = closed + 1;
            };

            i = i + 1;
        };

        (total, active, resolved_yes, resolved_no, closed)
    }

    #[view]
    /**
     * @notice Gets user's active positions (markets where they hold shares).
     * @dev Priority 2: Quick query for "My Positions" tab.
     * @param user The user's address
     * @return Vector of market addresses where user has positions
     */
    public fun get_user_active_markets(user: address): vector<address> acquires MarketFactory, Market {
        let factory = borrow_global<MarketFactory>(get_factory_address());
        let markets = &factory.markets;
        let active_markets = vector::empty<address>();
        let len = vector::length(markets);

        let i = 0;
        while (i < len) {
            let market_obj = *vector::borrow(markets, i);
            let market_addr = object::object_address(&market_obj);
            let market = borrow_global<Market>(market_addr);

            let yes_balance = primary_fungible_store::balance(user, market.yes_token_metadata);
            let no_balance = primary_fungible_store::balance(user, market.no_token_metadata);

            if (yes_balance > 0 || no_balance > 0) {
                vector::push_back(&mut active_markets, market_addr);
            };

            i = i + 1;
        };

        active_markets
    }

    // === Tapp Hook Integration Functions ===

    #[view]
    /**
     * @notice Gets the current status of a market.
     * @dev Used by Tapp hook to check if trading should be enabled.
     * @param market_object The market to query
     * @return Market status (0=OPEN, 1=CLOSED, 2=RESOLVED_YES, 3=RESOLVED_NO)
     */
    public fun get_market_status(market_object: Object<Market>): u8 acquires Market {
        let market = borrow_global<Market>(object::object_address(&market_object));
        market.status
    }

    #[view]
    /**
     * @notice Gets the resolution timestamp for a market.
     * @dev Used by Tapp hook to calculate dynamic fees.
     * @param market_object The market to query
     * @return Unix timestamp when market can be resolved
     */
    public fun get_resolution_timestamp(market_object: Object<Market>): u64 acquires Market {
        let market = borrow_global<Market>(object::object_address(&market_object));
        market.resolution_timestamp
    }

    #[view]
    /**
     * @notice Gets the YES and NO token metadata objects for a market.
     * @dev Used by Tapp hook to identify which tokens belong to a market.
     * @param market_object The market to query
     * @return (yes_token_metadata, no_token_metadata)
     */
    public fun get_market_tokens(market_object: Object<Market>): (Object<Metadata>, Object<Metadata>) acquires Market {
        let market = borrow_global<Market>(object::object_address(&market_object));
        (market.yes_token_metadata, market.no_token_metadata)
    }

    #[view]
    /**
     * @notice Gets all markets from the factory.
     * @dev Used by Tapp hook to find markets by token addresses.
     * @return Vector of all market objects
     */
    public fun get_all_markets(): vector<Object<Market>> acquires MarketFactory {
        let factory = borrow_global<MarketFactory>(get_factory_address());
        factory.markets
    }

    #[view]
    /**
     * @notice Gets all market addresses (simplified version for iteration).
     * @dev Returns just the addresses, not the full objects, for easier iteration.
     * @return Vector of market addresses
     */
    public fun get_all_market_addresses(): vector<address> acquires MarketFactory {
        let factory = borrow_global<MarketFactory>(get_factory_address());
        let markets = &factory.markets;
        let addresses = vector::empty<address>();
        let len = vector::length(markets);
        let i = 0;
        while (i < len) {
            let market_obj = *vector::borrow(markets, i);
            vector::push_back(&mut addresses, object::object_address(&market_obj));
            i = i + 1;
        };
        addresses
    }

    #[view]
    /**
     * @notice Gets comprehensive market information.
     * @dev Useful for Tapp hook integration and frontend display.
     * @param market_object The market to query
     * @return (description, resolver, resolution_timestamp, status, oracle_id)
     */
    public fun get_market_info(market_object: Object<Market>): (String, address, u64, u8, String) acquires Market {
        let market = borrow_global<Market>(object::object_address(&market_object));
        (
            market.description,
            market.resolver,
            market.resolution_timestamp,
            market.status,
            market.oracle_id
        )
    }

    // === Test-Only Functions ===

    #[test_only]
    /**
     * @notice Initializes the market factory for testing.
     * @dev Only available in test mode. Calls the private init_module.
     * @param sender The test account to initialize with
     */
    public fun init_for_test(sender: &signer) {
        init_module(sender);
    }
}
