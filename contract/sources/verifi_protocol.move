/**
 * @title VeriFi Protocol
 * @author edsphinx
 * @notice This module contains the core logic for the VeriFi oracle-less derivatives protocol.
 * @dev Implements a MarketFactory singleton and individual Market objects on the Aptos blockchain using the Object model.
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

    // === Constants ===
    const PROTOCOL_FEE_BASIS_POINTS: u64 = 200; // 2%
    const MARKET_FACTORY_SEED: vector<u8> = b"verifi_protocol_market_factory";
    const STATUS_OPEN: u8 = 0;
    const STATUS_CLOSED: u8 = 1; // for markets closed before resolution
    const STATUS_RESOLVED_YES: u8 = 2;
    const STATUS_RESOLVED_NO: u8 = 3;

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
        total_supply_yes: u64,
        total_supply_no: u64,
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

        shares_minted_events: EventHandle<SharesMintedEvent>,
        market_resolved_events: EventHandle<MarketResolvedEvent>,
        winnings_redeemed_events: EventHandle<WinningsRedeemedEvent>,
        shares_sold_events: EventHandle<SharesSoldEvent>,
    }

    /// @dev Controller resource to hold the factory's capability to create new objects.
    struct MarketFactoryController has key {
        extend_ref: ExtendRef,
    }

    struct MarketFactory has key {
        market_count: u64,
        markets: vector<Object<Market>>,
        creation_events: EventHandle<MarketCreatedEvent>,
        protocol_treasury_cap: account::SignerCapability,
    }

    /// @dev A data-transfer-object (DTO) for efficiently fetching market data for the UI.
    struct MarketView has store, drop {
        description: String,
        resolution_timestamp: u64,
        status: u8,
        pool_yes_tokens: u64,
        pool_no_tokens: u64,
        total_supply_yes: u64,
        total_supply_no: u64,
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
        
    //         💡 Important Note for the Frontend DON'T FORGET!!!!!!!!!!!
    // This change means that the frontend now has a new responsibility. 
    // Before a user can buy shares in a market for the first time, we must give them a button
    // that allows them to execute a one-time transaction that calls primary_fungible_store::create_store 
    // for both the YES and NO tokens of that market. 
    // This initializes their "bank accounts" so they can receive the tokens.
    }
    
    /**
    * @notice Allows a user to sell their outcome shares back to the market for APT.
    * @dev The user provides a FungibleAsset object containing their shares. The contract
    * verifies, burns, and pays out the corresponding amount of APT from the treasury.
    * @param seller The signer of the account selling the shares.
    * @param market_object The market object to sell shares to.
    * @param tokens_to_sell An ephemeral FungibleAsset containing the shares to be sold.
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
    * @notice Resolves a market, setting the final outcome.
    * @dev Can only be called by the designated `resolver` address for the market,
    * and only after the `resolution_timestamp` has passed. This function
    * locks the market status, preventing further trading and enabling redemptions.
    * @param resolver The signer of the account designated as the market resolver.
    * @param market_object The market object to be resolved.
    * @param outcome_is_yes The final outcome of the market (true for YES, false for NO).
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
    * @notice Allows a holder of winning tokens to redeem them for their share of the prize pool (APT).
    * @dev This function can only be called after a market has been resolved. It withdraws the
    * specified amount of winning tokens from the user's store, burns them, and pays out APT.
    * @param redeemer The signer of the account redeeming the tokens.
    * @param market_object The market object to redeem from.
    * @param amount_to_redeem The amount of winning tokens to redeem.
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

    /**
    * @notice Resolves a market programmatically and trustlessly, The foundation for On Chain Oracle.
    * @dev ANYONE can call this function after the `resolution_timestamp` has passed.
    * The function itself will read the state of another contract on Aptos to determine
    * the outcome in a trustless manner.
    * @param caller The signer of any account paying the gas to execute the resolution.
    * @param market_object The market object to be resolved.
    */
    public entry fun resolve_market_programmatically(
        _caller: &signer, // Can be called by ANYONE.
        market_object: Object<Market>,
    ) acquires Market {
        let market_address = object::object_address(&market_object);
        let market = borrow_global_mut<Market>(market_address);

        // --- SECURITY CHECKS ---
        assert!(timestamp::now_seconds() >= market.resolution_timestamp, E_MARKET_NOT_READY_FOR_RESOLUTION);
        assert!(market.status == STATUS_OPEN, E_MARKET_ALREADY_RESOLVED);

        // --- ON-CHAIN VERIFICATION LOGIC (THE MAGIC) ---
        // This is the part we will need to adapt for each market "template".
        // For now, we assume we are reading a simple view function that returns a u64.
        // IN A REAL-WORLD SCENARIO, THIS CALL WOULD BE DYNAMIC OR USE AN INTERMEDIARY MODULE.
        // For the hackathon demo, we will hardcode the call to a known function.

        // Example: Calling a `get_tvl()` function from the `target_address` contract.
        // NOTE: Move does not currently support direct, generic calls to `view` functions in other modules.
        // The idiomatic way to handle this is by creating a wrapper function in our own module or using an
        // "on-chain oracle" module that specializes in these calls.
        // For the MVP, we will SIMULATE this call. For production, a more advanced approach is needed.

        // *** SIMULATION FOR THE DEMO ***
        // In this demo, we will have a "test oracle" module that returns a value:
        // let current_on_chain_value = test_oracle::get_mock_value(market.target_address);
        // For this example, let's use a hardcoded value to illustrate the logic.
        let current_on_chain_value = 5_500_000; // Simulated value for the demo.

        let outcome_is_yes = if (market.operator == 0) { // 0 = Greater Than (>)
            current_on_chain_value > market.target_value
        } else if (market.operator == 1) { // 1 = Less Than (<)
            current_on_chain_value < market.target_value
        } else { // Add more operators as needed (==, >=, <=)
            false
        };

        // --- SET FINAL OUTCOME ---
        if (outcome_is_yes) {
            market.status = STATUS_RESOLVED_YES; // 2 = Resolved-Yes
        } else {
            market.status = STATUS_RESOLVED_NO; // 3 = Resolved-No
        };
    }

    #[view]
    /**
    * @notice Gets the YES and NO share balance for a specific owner in a given market.
    * @dev This is a read-only view function that gracefully handles cases where a store doesn't exist.
    * @param owner The address of the account to check.
    * @param market_object The market to check the balance in.
    * @return (u64, u64) A tuple containing the YES balance and the NO balance.
    */
    public fun get_balances(owner: address, market_object: Object<Market>): (u64, u64) acquires Market {
        let market = borrow_global<Market>(object::object_address(&market_object));
        
        // --- CORRECCIÓN: Usar la función de ayuda `balance` que ya comprueba la existencia ---
        let yes_balance = primary_fungible_store::balance(owner, market.yes_token_metadata);
        let no_balance = primary_fungible_store::balance(owner, market.no_token_metadata);
        // ---------------------------------------------------------------------------------

        (yes_balance, no_balance)
    }

    #[view]
    /**
    * @notice Gets all necessary UI data for a single market in one call.
    * @dev Aggregates static and dynamic data into a single MarketView struct.
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
    * @dev A view function to efficiently fetch dynamic market data for the UI.
    * @param market_object The market to query.
    * @return (u8, u64, u64, u64, u64) A tuple containing:
    * - status
    * - total_supply_yes
    * - total_supply_no
    * - pool_yes_tokens
    * - pool_no_tokens
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
    * @notice A view function to check if the MarketFactoryController has been initialized.
    * @dev Used for debugging to confirm that `init_module` ran successfully.
    * @return bool True if the controller resource exists at the factory address.
    */
    public fun is_factory_initialized(): bool {
        exists<MarketFactoryController>(get_factory_address())
    }

    #[view]
    /**
     * @notice A comprehensive view function to debug the factory's initialization status.
     * @dev Checks for the existence of both the controller and the factory resources.
     * @return (bool, bool) A tuple where:
     * - The first bool is true if MarketFactoryController exists.
     * - The second bool is true if MarketFactory exists.
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
    public fun get_factory_signer_address(): address acquires MarketFactoryController {
        let factory_signer = get_factory_signer();
        // 'signer::address_of' extrae el dato 'address' de la capacidad 'signer'.
        // El 'address' sí es un dato simple que se puede devolver.
        let factory_address = signer::address_of(&factory_signer);
        if (!account::exists_at(factory_address)) {
            @0x0
        } else {
            factory_address
        }
    }
}
