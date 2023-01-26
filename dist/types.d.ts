import * as anchor from "@project-serum/anchor";
import { BN } from "@project-serum/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";
import { Asset } from "./assets";
import { MarginAccount } from "./program-types";
import { types } from ".";
/**
 * Wallet interface for objects that can be used to sign provider transactions.
 */
export interface Wallet {
    signTransaction(tx: Transaction): Promise<Transaction>;
    signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
    publicKey: PublicKey;
}
export declare class DummyWallet implements Wallet {
    constructor();
    signTransaction(_tx: Transaction): Promise<Transaction>;
    signAllTransactions(_txs: Transaction[]): Promise<Transaction[]>;
    get publicKey(): PublicKey;
}
export declare enum OrderType {
    LIMIT = 0,
    POSTONLY = 1,
    FILLORKILL = 2,
    IMMEDIATEORCANCEL = 3,
    POSTONLYSLIDE = 4
}
export declare function toProgramOrderType(orderType: OrderType): {
    limit: {};
    postOnly?: undefined;
    fillOrKill?: undefined;
    immediateOrCancel?: undefined;
    postOnlySlide?: undefined;
} | {
    postOnly: {};
    limit?: undefined;
    fillOrKill?: undefined;
    immediateOrCancel?: undefined;
    postOnlySlide?: undefined;
} | {
    fillOrKill: {};
    limit?: undefined;
    postOnly?: undefined;
    immediateOrCancel?: undefined;
    postOnlySlide?: undefined;
} | {
    immediateOrCancel: {};
    limit?: undefined;
    postOnly?: undefined;
    fillOrKill?: undefined;
    postOnlySlide?: undefined;
} | {
    postOnlySlide: {};
    limit?: undefined;
    postOnly?: undefined;
    fillOrKill?: undefined;
    immediateOrCancel?: undefined;
};
export declare enum Side {
    BID = 0,
    ASK = 1
}
export declare function toProgramSide(side: Side): {
    bid: {};
    ask?: undefined;
} | {
    ask: {};
    bid?: undefined;
};
export declare function fromProgramSide(side: any): Side;
export declare enum Kind {
    UNINITIALIZED = "uninitialized",
    CALL = "call",
    PUT = "put",
    FUTURE = "future",
    PERP = "perp"
}
export declare function toProductKind(kind: Object): Kind;
export interface Order {
    marketIndex: number;
    market: PublicKey;
    price: number;
    size: number;
    side: Side;
    orderId: BN;
    owner: PublicKey;
    clientOrderId: BN;
    tifOffset: number;
}
export declare function orderEquals(a: Order, b: Order, cmpOrderId?: boolean): boolean;
export interface Position {
    marketIndex: number;
    market: PublicKey;
    size: number;
    costOfTrades: number;
}
export declare function positionEquals(a: Position, b: Position): boolean;
export interface Level {
    price: number;
    size: number;
}
export interface DepthOrderbook {
    bids: Level[];
    asks: Level[];
}
export interface TopLevel {
    bid: Level | null;
    ask: Level | null;
}
export declare enum MarginType {
    /**
     * Margin for orders.
     */
    INITIAL = "initial",
    /**
     * Margin for positions.
     */
    MAINTENANCE = "maintenance"
}
export interface MarginRequirement {
    initialLong: number;
    initialShort: number;
    maintenanceLong: number;
    maintenanceShort: number;
}
export interface MarginAccountState {
    balance: number;
    initialMargin: number;
    initialMarginSkipConcession: number;
    maintenanceMargin: number;
    unrealizedPnl: number;
    unpaidFunding: number;
    availableBalanceInitial: number;
    availableBalanceMaintenance: number;
    availableBalanceWithdrawable: number;
}
export interface CancelArgs {
    asset: Asset;
    market: PublicKey;
    orderId: anchor.BN;
    cancelSide: Side;
}
export interface MarginParams {
    futureMarginInitial: number;
    futureMarginMaintenance: number;
    optionMarkPercentageLongInitial: number;
    optionSpotPercentageLongInitial: number;
    optionSpotPercentageShortInitial: number;
    optionDynamicPercentageShortInitial: number;
    optionMarkPercentageLongMaintenance: number;
    optionSpotPercentageLongMaintenance: number;
    optionSpotPercentageShortMaintenance: number;
    optionDynamicPercentageShortMaintenance: number;
    optionShortPutCapPercentage: number;
}
export declare enum ProgramAccountType {
    MarginAccount = "MarginAccount",
    SpreadAccount = "SpreadAccount"
}
export interface ClockData {
    timestamp: number;
    slot: number;
}
export declare enum MovementType {
    LOCK = 1,
    UNLOCK = 2
}
export declare function toProgramMovementType(movementType: MovementType): {
    lock: {};
    unlock?: undefined;
} | {
    unlock: {};
    lock?: undefined;
};
export declare enum TreasuryMovementType {
    TO_TREASURY_FROM_INSURANCE = 1,
    TO_INSURANCE_FROM_TREASURY = 2,
    TO_TREASURY_FROM_REFERRALS_REWARDS = 3,
    TO_REFERRALS_REWARDS_FROM_TREASURY = 4
}
export declare function toProgramTreasuryMovementType(treasuryMovementType: TreasuryMovementType): {
    toTreasuryFromInsurance: {};
    toInsuranceFromTreasury?: undefined;
    toTreasuryFromReferralsRewards?: undefined;
    toReferralsRewardsFromTreasury?: undefined;
} | {
    toInsuranceFromTreasury: {};
    toTreasuryFromInsurance?: undefined;
    toTreasuryFromReferralsRewards?: undefined;
    toReferralsRewardsFromTreasury?: undefined;
} | {
    toTreasuryFromReferralsRewards: {};
    toTreasuryFromInsurance?: undefined;
    toInsuranceFromTreasury?: undefined;
    toReferralsRewardsFromTreasury?: undefined;
} | {
    toReferralsRewardsFromTreasury: {};
    toTreasuryFromInsurance?: undefined;
    toInsuranceFromTreasury?: undefined;
    toTreasuryFromReferralsRewards?: undefined;
};
export type MarketIdentifier = number | PublicKey;
export declare enum MarginAccountType {
    NORMAL = 0,
    MARKET_MAKER = 1
}
export declare function fromProgramMarginAccountType(accountType: any): MarginAccountType;
export declare function isMarketMaker(marginAccount: MarginAccount): boolean;
export declare enum OrderCompleteType {
    CANCEL = 0,
    FILL = 1,
    BOOTED = 2
}
export declare function fromProgramOrderCompleteType(orderCompleteType: any): OrderCompleteType;
export interface OrderOptions {
    tifOptions: TIFOptions;
    orderType?: types.OrderType;
    clientOrderId?: number;
    tag?: string;
    blockhash?: string;
}
/**
 * Only set one of these options
 * @field expiryOffset  seconds in future that the order will expire. Set to undefined to disable TIF.
 * @field expiryTs      timestamp that the order will expire. Set to undefined to disable TIF.
 */
export interface TIFOptions {
    expiryOffset?: number | undefined;
    expiryTs?: number | undefined;
}
export declare function defaultOrderOptions(): OrderOptions;
