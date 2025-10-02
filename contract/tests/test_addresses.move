/// Test account addresses from .env configuration
/// These addresses correspond to the funded test accounts on testnet
#[test_only]
module VeriFiPublisher::test_addresses {

    /// Market Creator account (10 APT)
    const MARKET_CREATOR: address = @0x247058d0fa4d63683376116b11ab90bea4a9582141794d83ddbcce5a75b3578c;

    /// Trader 1 account (5 APT)
    const TRADER_1: address = @0x55ba2b4d7be676e77bbfef29c27401c9862eb6682e66b45e5924da34324c55cd;

    /// Trader 2 account (5 APT)
    const TRADER_2: address = @0xd3b36c7fea14a6939ec4a8bebb422459e85b65f523b3babffd31ddf2f1479c1d;

    /// Trader 3 account (5 APT)
    const TRADER_3: address = @0xdfb0a131451d31fa932201392d1118e81cb39c1f9b122e1316468076ef22d62e;

    /// Trader 4 account (5 APT)
    const TRADER_4: address = @0xe47a0a5de8ed36c9c1f060ca73000d07d8fbd499297d06f87f87734db6f65390;

    public fun market_creator(): address { MARKET_CREATOR }
    public fun trader_1(): address { TRADER_1 }
    public fun trader_2(): address { TRADER_2 }
    public fun trader_3(): address { TRADER_3 }
    public fun trader_4(): address { TRADER_4 }
}
