"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_TOTAL_SPREAD_ACCOUNT_CONTRACTS = exports.ASK_ORDERS_INDEX = exports.BID_ORDERS_INDEX = exports.BPS_DENOMINATOR = exports.MAX_POSITION_MOVEMENTS = exports.DEFAULT_ORDER_TAG = exports.POSITION_PRECISION = exports.MARGIN_PRECISION = exports.PRICING_PRECISION = exports.PLATFORM_PRECISION = exports.VOLATILITY_POINTS = exports.UPDATING_STATE_LIMIT_SECONDS = exports.DEFAULT_CLIENT_TIMER_INTERVAL = exports.DEFAULT_CLIENT_POLL_INTERVAL = exports.DEFAULT_MARKET_POLL_INTERVAL = exports.DEFAULT_EXCHANGE_POLL_INTERVAL = exports.PERP_INDEX = exports.TOTAL_MARKETS = exports.TOTAL_EXPIRIES = exports.ACTIVE_MARKETS = exports.ACTIVE_EXPIRIES = exports.SERIES_FUTURE_INDEX = exports.PRODUCTS_PER_EXPIRY = exports.NUM_STRIKES = exports.CLUSTER_URLS = exports.USDC_MINT_ADDRESS = exports.PYTH_PRICE_FEEDS = exports.SPREAD_ACCOUNT_ASSET_OFFSET = exports.MARGIN_ACCOUNT_ASSET_OFFSET = exports.MAX_ORDER_TAG_LENGTH = exports.DEFAULT_ORDERBOOK_DEPTH = exports.MARKET_LOAD_LIMIT = exports.MAX_MARKETS_TO_FETCH = exports.CRANK_PERP_ACCOUNT_LIMIT = exports.CRANK_ACCOUNT_LIMIT = exports.CLEAN_MARKET_LIMIT = exports.MARKET_INDEX_LIMIT = exports.MAX_INITIALIZE_MARKET_TIF_EPOCH_CYCLE_IXS_PER_TX = exports.MAX_SET_REFERRALS_REWARDS_ACCOUNTS = exports.MAX_MARGIN_AND_SPREAD_ACCOUNTS = exports.MAX_ZETA_GROUPS = exports.MAX_SETTLE_ACCOUNTS = exports.MAX_REBALANCE_ACCOUNTS = exports.MAX_FUNDING_ACCOUNTS = exports.MAX_SETTLEMENT_ACCOUNTS = exports.MAX_GREEK_UPDATES_PER_TX = exports.MAX_CANCELS_PER_TX = exports.MAX_SETTLE_AND_CLOSE_PER_TX = exports.DEX_PID = exports.MINTS = void 0;
const web3_js_1 = require("@solana/web3.js");
const assets_1 = require("./assets");
// Asset keys are wormhole from mainnet.
exports.MINTS = {
    [assets_1.Asset.SOL]: new web3_js_1.PublicKey("So11111111111111111111111111111111111111112"),
    [assets_1.Asset.BTC]: new web3_js_1.PublicKey("qfnqNqs3nCAHjnyCgLRDbBtq4p2MtHZxw8YjSyYhPoL"),
    [assets_1.Asset.ETH]: new web3_js_1.PublicKey("FeGn77dhg1KXRRFeSwwMiykZnZPw5JXW6naf2aQgZDQf"),
};
exports.DEX_PID = {
    localnet: new web3_js_1.PublicKey("zDEXqXEG7gAyxb1Kg9mK5fPnUdENCGKzWrM21RMdWRq"),
    devnet: new web3_js_1.PublicKey("5CmWtUihvSrJpaUrpJ3H1jUa9DRjYz4v2xs6c3EgQWMf"),
    mainnet: new web3_js_1.PublicKey("zDEXqXEG7gAyxb1Kg9mK5fPnUdENCGKzWrM21RMdWRq"),
};
exports.MAX_SETTLE_AND_CLOSE_PER_TX = 4;
exports.MAX_CANCELS_PER_TX = 3;
exports.MAX_GREEK_UPDATES_PER_TX = 20;
exports.MAX_SETTLEMENT_ACCOUNTS = 20;
exports.MAX_FUNDING_ACCOUNTS = 20;
exports.MAX_REBALANCE_ACCOUNTS = 18;
exports.MAX_SETTLE_ACCOUNTS = 5;
exports.MAX_ZETA_GROUPS = 20;
exports.MAX_MARGIN_AND_SPREAD_ACCOUNTS = 20;
exports.MAX_SET_REFERRALS_REWARDS_ACCOUNTS = 12;
exports.MAX_INITIALIZE_MARKET_TIF_EPOCH_CYCLE_IXS_PER_TX = 15;
exports.MARKET_INDEX_LIMIT = 18;
// 3 accounts per set * 9 = 27 + 2 = 29 accounts.
exports.CLEAN_MARKET_LIMIT = 9;
exports.CRANK_ACCOUNT_LIMIT = 12;
exports.CRANK_PERP_ACCOUNT_LIMIT = 10;
exports.MAX_MARKETS_TO_FETCH = 50;
// This is the most we can load per iteration without
// hitting the rate limit.
exports.MARKET_LOAD_LIMIT = 12;
exports.DEFAULT_ORDERBOOK_DEPTH = 5;
exports.MAX_ORDER_TAG_LENGTH = 4;
// From the account itself in account.rs
// 8 + 32 + 1 + 8 + 1 + 138 + 48 + 5520 + 8
exports.MARGIN_ACCOUNT_ASSET_OFFSET = 5764;
// 8 + 32 + 1 + 8 + 48 + 2208
exports.SPREAD_ACCOUNT_ASSET_OFFSET = 2305;
exports.PYTH_PRICE_FEEDS = {
    localnet: {
        [assets_1.Asset.SOL]: new web3_js_1.PublicKey("GhKSLwUKDdVAKVLbJzsFdBfc2Mj8ZGMR4Hzv9n549Umd"),
        [assets_1.Asset.BTC]: new web3_js_1.PublicKey("7pZtdiPa9NwcfCjFaR4bijh9tLrps4FmFgSuWDY3aMmz"),
        [assets_1.Asset.ETH]: new web3_js_1.PublicKey("6z78Hvb9y8d6DS5GEVryHMFJvV5KmfMaHEdWhELHAnkP"),
    },
    devnet: {
        [assets_1.Asset.SOL]: new web3_js_1.PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"),
        [assets_1.Asset.BTC]: new web3_js_1.PublicKey("HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J"),
        [assets_1.Asset.ETH]: new web3_js_1.PublicKey("EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw"),
    },
    mainnet: {
        [assets_1.Asset.SOL]: new web3_js_1.PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG"),
        [assets_1.Asset.BTC]: new web3_js_1.PublicKey("GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU"),
        [assets_1.Asset.ETH]: new web3_js_1.PublicKey("JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB"),
    },
};
exports.USDC_MINT_ADDRESS = {
    localnet: new web3_js_1.PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    devnet: new web3_js_1.PublicKey("6PEh8n3p7BbCTykufbq1nSJYAZvUp6gSwEANAs1ZhsCX"),
    mainnet: new web3_js_1.PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
};
exports.CLUSTER_URLS = {
    localnet: "http://127.0.0.1:8899",
    devnet: "https://api.devnet.solana.com",
    mainnet: "https://api.mainnet-beta.solana.com",
};
// These are fixed and shouldn't change in the future.
exports.NUM_STRIKES = 11;
exports.PRODUCTS_PER_EXPIRY = exports.NUM_STRIKES * 2 + 1; // +1 for the future.
exports.SERIES_FUTURE_INDEX = exports.PRODUCTS_PER_EXPIRY - 1;
exports.ACTIVE_EXPIRIES = 2;
exports.ACTIVE_MARKETS = exports.ACTIVE_EXPIRIES * exports.PRODUCTS_PER_EXPIRY + 1; // +1 for perp
exports.TOTAL_EXPIRIES = 5;
exports.TOTAL_MARKETS = exports.PRODUCTS_PER_EXPIRY * (exports.TOTAL_EXPIRIES + 1);
exports.PERP_INDEX = exports.TOTAL_MARKETS - 1;
exports.DEFAULT_EXCHANGE_POLL_INTERVAL = 30;
exports.DEFAULT_MARKET_POLL_INTERVAL = 5;
exports.DEFAULT_CLIENT_POLL_INTERVAL = 20;
exports.DEFAULT_CLIENT_TIMER_INTERVAL = 1;
exports.UPDATING_STATE_LIMIT_SECONDS = 10;
exports.VOLATILITY_POINTS = 5;
// Numbers represented in BN are generally fixed point integers with precision of 6.
exports.PLATFORM_PRECISION = 6;
exports.PRICING_PRECISION = 12;
exports.MARGIN_PRECISION = 8;
exports.POSITION_PRECISION = 3;
exports.DEFAULT_ORDER_TAG = "SDK";
exports.MAX_POSITION_MOVEMENTS = 10;
exports.BPS_DENOMINATOR = 10000;
exports.BID_ORDERS_INDEX = 0;
exports.ASK_ORDERS_INDEX = 1;
exports.MAX_TOTAL_SPREAD_ACCOUNT_CONTRACTS = 100000000;
