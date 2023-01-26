import { PublicKey } from "@solana/web3.js";
export declare const MINTS: {
    SOL: PublicKey;
    BTC: PublicKey;
    ETH: PublicKey;
};
export declare const DEX_PID: {
    localnet: PublicKey;
    devnet: PublicKey;
    mainnet: PublicKey;
};
export declare const CHAINLINK_PID: PublicKey;
export declare const MAX_SETTLE_AND_CLOSE_PER_TX = 4;
export declare const MAX_CANCELS_PER_TX = 3;
export declare const MAX_GREEK_UPDATES_PER_TX = 20;
export declare const MAX_SETTLEMENT_ACCOUNTS = 20;
export declare const MAX_FUNDING_ACCOUNTS = 20;
export declare const MAX_REBALANCE_ACCOUNTS = 18;
export declare const MAX_SETTLE_ACCOUNTS = 5;
export declare const MAX_ZETA_GROUPS = 20;
export declare const MAX_MARGIN_AND_SPREAD_ACCOUNTS = 20;
export declare const MAX_SET_REFERRALS_REWARDS_ACCOUNTS = 12;
export declare const MAX_INITIALIZE_MARKET_TIF_EPOCH_CYCLE_IXS_PER_TX = 15;
export declare const MARKET_INDEX_LIMIT = 18;
export declare const CLEAN_MARKET_LIMIT = 9;
export declare const CRANK_ACCOUNT_LIMIT = 12;
export declare const CRANK_PERP_ACCOUNT_LIMIT = 10;
export declare const MAX_MARKETS_TO_FETCH = 50;
export declare const MARKET_LOAD_LIMIT = 12;
export declare const DEFAULT_ORDERBOOK_DEPTH = 5;
export declare const MAX_ORDER_TAG_LENGTH = 4;
export declare const MARGIN_ACCOUNT_ASSET_OFFSET = 5764;
export declare const SPREAD_ACCOUNT_ASSET_OFFSET = 2305;
export declare const PYTH_PRICE_FEEDS: {
    localnet: {
        SOL: PublicKey;
        BTC: PublicKey;
        ETH: PublicKey;
    };
    devnet: {
        SOL: PublicKey;
        BTC: PublicKey;
        ETH: PublicKey;
    };
    mainnet: {
        SOL: PublicKey;
        BTC: PublicKey;
        ETH: PublicKey;
    };
};
export declare const USDC_MINT_ADDRESS: {
    localnet: PublicKey;
    devnet: PublicKey;
    mainnet: PublicKey;
};
export declare const CLUSTER_URLS: {
    localnet: string;
    devnet: string;
    mainnet: string;
};
export declare const NUM_STRIKES = 11;
export declare const PRODUCTS_PER_EXPIRY: number;
export declare const SERIES_FUTURE_INDEX: number;
export declare const ACTIVE_EXPIRIES = 2;
export declare const ACTIVE_MARKETS: number;
export declare const TOTAL_EXPIRIES = 5;
export declare const TOTAL_MARKETS: number;
export declare const PERP_INDEX: number;
export declare const DEFAULT_EXCHANGE_POLL_INTERVAL = 30;
export declare const DEFAULT_MARKET_POLL_INTERVAL = 5;
export declare const DEFAULT_CLIENT_POLL_INTERVAL = 20;
export declare const DEFAULT_CLIENT_TIMER_INTERVAL = 1;
export declare const UPDATING_STATE_LIMIT_SECONDS = 10;
export declare const VOLATILITY_POINTS = 5;
export declare const PLATFORM_PRECISION = 6;
export declare const PRICING_PRECISION = 12;
export declare const MARGIN_PRECISION = 8;
export declare const POSITION_PRECISION = 3;
export declare const DEFAULT_ORDER_TAG = "SDK";
export declare const MAX_POSITION_MOVEMENTS = 10;
export declare const BPS_DENOMINATOR = 10000;
export declare const BID_ORDERS_INDEX = 0;
export declare const ASK_ORDERS_INDEX = 1;
export declare const MAX_TOTAL_SPREAD_ACCOUNT_CONTRACTS = 100000000;
export declare const DEFAULT_MICRO_LAMPORTS_PER_CU_FEE = 1000;
