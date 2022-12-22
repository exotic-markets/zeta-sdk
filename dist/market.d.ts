import { Orderbook, Market as SerumMarket } from "./serum/market";
import { ConfirmOptions, PublicKey } from "@solana/web3.js";
import * as types from "./types";
import { EventType } from "./events";
import { Asset } from "./assets";
export declare class ZetaGroupMarkets {
    /**
     * Returns the index for the front expiry in expiry series.
     */
    get frontExpiryIndex(): number;
    private _frontExpiryIndex;
    /**
     * Returns the expiry series for this zeta group.
     */
    get expirySeries(): ExpirySeries[];
    private _expirySeries;
    /**
     * The underlying asset this set of markets belong to.
     */
    get asset(): Asset;
    private _asset;
    /**
     * The list of markets in the same ordering as the zeta group account
     * They are in sorted order by market address.
     */
    get markets(): Market[];
    private _markets;
    get perpMarket(): Market;
    private _perpMarket;
    set pollInterval(interval: number);
    get pollInterval(): number;
    private _pollInterval;
    private _lastPollTimestamp;
    private _subscribedMarketIndexes;
    private _subscribedPerp;
    /**
     * Returns the market's index.
     */
    getMarketsByExpiryIndex(expiryIndex: number): Market[];
    /**
     * Returns all strikes given an expiry index. Strikes are returned as decimal numbers.
     */
    getStrikesByExpiryIndex(expiryIndex: number): number[];
    /**
     * Returns the options market given an expiry index and options kind.
     */
    getOptionsMarketByExpiryIndex(expiryIndex: number, kind: types.Kind): Market[];
    /**
     * Returns the futures market given an expiry index.
     */
    getFuturesMarketByExpiryIndex(expiryIndex: number): Market;
    getMarketByExpiryKindStrike(expiryIndex: number, kind: types.Kind, strike?: number): Market | undefined;
    private constructor();
    subscribeMarket(marketIndex: number): void;
    unsubscribeMarket(marketIndex: number): boolean;
    subscribePerp(): void;
    unsubscribePerp(): void;
    handlePolling(callback?: (asset: Asset, eventType: EventType, data: any) => void): Promise<void>;
    /**
     * Will load a new instance of ZetaGroupMarkets
     * Should not be called outside of SubExchange.
     */
    static load(asset: Asset, opts: ConfirmOptions, throttleMs: number): Promise<ZetaGroupMarkets>;
    /**
     * Updates the option series state based off state in SubExchange.
     */
    updateExpirySeries(): Promise<void>;
    /**
     * Returns the market object for a given index.
     */
    getMarket(market: PublicKey): Market;
    /**
     * Returns the market index for a given market address.
     */
    getMarketIndex(market: PublicKey): number;
    /**
     * Returns the index of expiry series that are tradeable.
     */
    getTradeableExpiryIndices(): number[];
    productsPerExpiry(): number;
}
export declare class ExpirySeries {
    asset: Asset;
    expiryIndex: number;
    activeTs: number;
    expiryTs: number;
    dirty: boolean;
    strikesInitialized: boolean;
    constructor(asset: Asset, expiryIndex: number, activeTs: number, expiryTs: number, dirty: boolean, strikesInitialized: boolean);
    isLive(): boolean;
}
/**
 * Wrapper class for a zeta market on serum.
 */
export declare class Market {
    /**
     * The market index corresponding to the zeta group account.
     */
    get marketIndex(): number;
    private _marketIndex;
    /**
     * The expiry series index this market belongs to.
     */
    get expiryIndex(): number;
    get expirySeries(): ExpirySeries;
    private _expiryIndex;
    /**
     * The underlying asset this set of markets belong to.
     */
    get asset(): Asset;
    private _asset;
    /**
     * The type of product this market represents.
     */
    get kind(): types.Kind;
    private _kind;
    /**
     * The serum market address.
     */
    get address(): PublicKey;
    private _address;
    /**
     * The zeta group this market belongs to.
     * TODO currently there exists only one zeta group.
     */
    get zetaGroup(): PublicKey;
    private _zetaGroup;
    /**
     * The zeta vault for the quote mint.
     */
    get quoteVault(): PublicKey;
    private _quoteVault;
    /**
     * The zeta vault for the base mint.
     */
    get baseVault(): PublicKey;
    private _baseVault;
    /**
     * The serum Market object from @project-serum/ts
     */
    get serumMarket(): SerumMarket;
    private _serumMarket;
    set bids(bids: Orderbook);
    private _bids;
    set asks(asks: Orderbook);
    private _asks;
    /**
     * Returns the best N levels for bids and asks
     */
    get orderbook(): types.DepthOrderbook;
    private _orderbook;
    /**
     * The strike of this option, modified on new expiry.
     */
    get strike(): number;
    private _strike;
    constructor(asset: Asset, marketIndex: number, expiryIndex: number, kind: types.Kind, address: PublicKey, zetaGroup: PublicKey, quoteVault: PublicKey, baseVault: PublicKey, serumMarket: SerumMarket);
    updateStrike(): void;
    updateOrderbook(loadSerum?: boolean): Promise<void>;
    getTopLevel(): types.TopLevel;
    static convertOrder(market: Market, order: any): types.Order;
    getOrdersForAccount(openOrdersAddress: PublicKey): types.Order[];
    getMarketOrders(): types.Order[];
    getBidOrders(): types.Order[];
    getAskOrders(): types.Order[];
    cancelAllExpiredOrders(): Promise<void>;
    cancelAllOrdersHalted(): Promise<void>;
}
