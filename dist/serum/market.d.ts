/// <reference types="node" />
import { Slab } from "./slab";
import BN from "bn.js";
import { Account, AccountInfo, Commitment, Connection, PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
export declare const MARKET_STATE_LAYOUT_V3: any;
export declare class Market {
    private _decoded;
    private _baseSplTokenDecimals;
    private _quoteSplTokenDecimals;
    private _skipPreflight;
    private _commitment;
    private _programId;
    private _openOrdersAccountsCache;
    private _layoutOverride?;
    private _feeDiscountKeysCache;
    constructor(decoded: any, baseMintDecimals: number, quoteMintDecimals: number, options: MarketOptions, programId: PublicKey, layoutOverride?: any);
    static load(connection: Connection, address: PublicKey, options: MarketOptions, programId: PublicKey, layoutOverride?: any): Promise<Market>;
    get programId(): PublicKey;
    get address(): PublicKey;
    get publicKey(): PublicKey;
    get baseMintAddress(): PublicKey;
    get quoteMintAddress(): PublicKey;
    get bidsAddress(): PublicKey;
    get asksAddress(): PublicKey;
    get requestQueueAddress(): PublicKey;
    get eventQueueAddress(): PublicKey;
    get baseVaultAddress(): PublicKey;
    get quoteVaultAddress(): PublicKey;
    get epochStartTs(): BN;
    get epochLength(): BN;
    get startEpochSeqNum(): BN;
    get decoded(): any;
    loadBids(connection: Connection): Promise<Orderbook>;
    loadAsks(connection: Connection): Promise<Orderbook>;
    loadRequestQueue(connection: Connection): Promise<any[]>;
    loadEventQueue(connection: Connection): Promise<import("./queue").Event[]>;
    private get _baseSplTokenMultiplier();
    private get _quoteSplTokenMultiplier();
    priceLotsToNumber(price: BN): number;
    priceNumberToLots(price: number): BN;
    baseSplSizeToNumber(size: BN): number;
    quoteSplSizeToNumber(size: BN): number;
    baseSizeLotsToNumber(size: BN): number;
    baseSizeNumberToLots(size: number): BN;
    quoteSizeLotsToNumber(size: BN): number;
    quoteSizeNumberToLots(size: number): BN;
    get minOrderSize(): number;
    get tickSize(): number;
}
export interface MarketOptions {
    skipPreflight?: boolean;
    commitment?: Commitment;
}
export interface OrderParams<T = Account> {
    owner: T;
    payer: PublicKey;
    side: "buy" | "sell";
    price: number;
    size: number;
    orderType?: "limit" | "ioc" | "postOnly";
    clientId?: BN;
    openOrdersAddressKey?: PublicKey;
    openOrdersAccount?: Account;
    feeDiscountPubkey?: PublicKey | null;
    selfTradeBehavior?: "decrementTake" | "cancelProvide" | "abortTransaction" | undefined;
    programId?: PublicKey;
}
export declare const _OPEN_ORDERS_LAYOUT_V2: any;
export declare class OpenOrders {
    private _programId;
    address: PublicKey;
    market: PublicKey;
    owner: PublicKey;
    baseTokenFree: BN;
    baseTokenTotal: BN;
    quoteTokenFree: BN;
    quoteTokenTotal: BN;
    orders: BN[];
    clientIds: BN[];
    constructor(address: PublicKey, decoded: any, programId: PublicKey);
    static load(connection: Connection, address: PublicKey, programId: PublicKey): Promise<OpenOrders>;
    static fromAccountInfo(address: PublicKey, accountInfo: AccountInfo<Buffer>, programId: PublicKey): OpenOrders;
}
export declare const ORDERBOOK_LAYOUT: any;
export declare class Orderbook {
    market: Market;
    isBids: boolean;
    slab: Slab;
    constructor(market: Market, accountFlags: any, slab: Slab);
    static get LAYOUT(): any;
    static decode(market: Market, buffer: Buffer): Orderbook;
    [Symbol.iterator](): Generator<Order, any, unknown>;
    items(descending?: boolean): Generator<Order>;
}
export interface Order {
    orderId: BN;
    openOrdersAddress: PublicKey;
    openOrdersSlot: number;
    price: number;
    priceLots: BN;
    size: number;
    feeTier: number;
    sizeLots: BN;
    side: "buy" | "sell";
    clientId?: BN;
    tifOffset: number;
    tifOffsetBN: BN;
}
export declare function getMintDecimals(connection: Connection, mint: PublicKey): Promise<number>;
