import * as anchor from "@project-serum/anchor";
import { SpreadAccount, MarginAccount, PositionMovementEvent, ReferralAccount, ReferrerAccount, ProductLedger } from "./program-types";
import { PublicKey, Connection, ConfirmOptions, TransactionSignature, TransactionInstruction } from "@solana/web3.js";
import { EventType } from "./events";
import * as types from "./types";
import { Asset } from "./assets";
import { SubClient } from "./subclient";
import * as instructions from "./program-instructions";
import { assets } from ".";
export declare class Client {
    /**
     * Anchor provider instance.
     */
    get provider(): anchor.AnchorProvider;
    get connection(): Connection;
    private _provider;
    /**
     * Stores the user referral account data.
     */
    get referralAccount(): ReferralAccount | null;
    private _referralAccount;
    private _referralAccountAddress;
    /**
     * Stores the user referrer account data.
     */
    get referrerAccount(): ReferrerAccount | null;
    private _referrerAccount;
    /**
     * Stores the user referrer account alias.
     */
    get referrerAlias(): string | null;
    private _referrerAlias;
    /**
     * Client margin account address.
     */
    get publicKey(): PublicKey;
    /**
     * Client usdc account address.
     */
    get usdcAccountAddress(): PublicKey;
    private _usdcAccountAddress;
    /**
     * whitelist deposit account.
     */
    get whitelistDepositAddress(): PublicKey | undefined;
    private _whitelistDepositAddress;
    /**
     * whitelist trading fees account.
     */
    get whitelistTradingFeesAddress(): PublicKey | undefined;
    private _whitelistTradingFeesAddress;
    /**
     * The listener for trade v2 events.
     */
    private _tradeEventV2Listener;
    /**
     * The listener for OrderComplete events.
     */
    private _orderCompleteEventListener;
    /**
     * A map for quick access when getting a callback
     */
    private _marginAccountToAsset;
    /**
     * Timer id from SetInterval.
     */
    private _pollIntervalId;
    get subClients(): Map<Asset, SubClient>;
    get delegatorKey(): PublicKey;
    _delegatorKey: PublicKey;
    private constructor();
    private _subClients;
    static load(connection: Connection, wallet: types.Wallet, opts?: ConfirmOptions, callback?: (asset: Asset, type: EventType, data: any) => void, throttle?: boolean, delegator?: PublicKey): Promise<Client>;
    private addSubClient;
    getSubClient(asset: Asset): SubClient;
    getAllSubClients(): SubClient[];
    setReferralData(): Promise<void>;
    referUser(referrer: PublicKey): Promise<TransactionSignature>;
    /**
     * @param timerInterval   desired interval for subClient polling.
     */
    private setPolling;
    marketIdentifierToPublicKey(asset: Asset, market: types.MarketIdentifier): anchor.web3.PublicKey;
    marketIdentifierToIndex(asset: Asset, market: types.MarketIdentifier): number;
    placeOrder(asset: Asset, market: types.MarketIdentifier, price: number, size: number, side: types.Side, options?: types.OrderOptions): Promise<TransactionSignature>;
    placePerpOrder(asset: Asset, price: number, size: number, side: types.Side, options?: types.OrderOptions): Promise<TransactionSignature>;
    createPlacePerpOrderInstruction(asset: Asset, price: number, size: number, side: types.Side, options?: types.OrderOptions): TransactionInstruction;
    createPlaceOrderInstruction(asset: Asset, marketIndex: number, price: number, size: number, side: types.Side, options?: types.OrderOptions): TransactionInstruction;
    createCancelOrderNoErrorInstruction(asset: Asset, market: types.MarketIdentifier, orderId: anchor.BN, side: types.Side): TransactionInstruction;
    createCancelAllMarketOrdersInstruction(asset: Asset, market: types.MarketIdentifier): TransactionInstruction;
    editDelegatedPubkey(asset: Asset, delegatedPubkey: PublicKey): Promise<TransactionSignature>;
    migrateFunds(amount: number, withdrawAsset: assets.Asset, depositAsset: assets.Asset): Promise<TransactionSignature>;
    deposit(asset: Asset, amount: number): Promise<TransactionSignature>;
    private usdcAccountCheck;
    /**
     * Polls the margin account for the latest state.
     * @param asset The underlying asset (eg SOL, BTC)
     * @param fetch Whether to fetch and update _marginAccount and _spreadAccount in the subClient
     * @param force Whether to forcefully update even though we may be already updating state currently
     */
    updateState(asset?: Asset, fetch?: boolean, force?: boolean): Promise<void>;
    cancelAllOrders(asset?: Asset): Promise<TransactionSignature[]>;
    cancelAllOrdersNoError(asset?: Asset): Promise<TransactionSignature[]>;
    getMarginAccountState(asset: Asset): types.MarginAccountState;
    closeMarginAccount(asset: Asset): Promise<TransactionSignature>;
    closeSpreadAccount(asset: Asset): Promise<TransactionSignature>;
    withdraw(asset: Asset, amount: number): Promise<TransactionSignature>;
    withdrawAndCloseMarginAccount(asset: Asset): Promise<TransactionSignature>;
    placeOrderAndLockPosition(asset: Asset, market: types.MarketIdentifier, price: number, size: number, side: types.Side, tag?: String): Promise<TransactionSignature>;
    cancelAllMarketOrders(asset: Asset, market: types.MarketIdentifier): Promise<TransactionSignature>;
    cancelOrder(asset: Asset, market: types.MarketIdentifier, orderId: anchor.BN, side: types.Side): Promise<TransactionSignature>;
    cancelOrderByClientOrderId(asset: Asset, market: types.MarketIdentifier, clientOrderId: number): Promise<TransactionSignature>;
    cancelAndPlaceOrder(asset: Asset, market: types.MarketIdentifier, orderId: anchor.BN, cancelSide: types.Side, newOrderPrice: number, newOrderSize: number, newOrderSide: types.Side, newOptions?: types.OrderOptions): Promise<TransactionSignature>;
    cancelAndPlaceOrderByClientOrderId(asset: Asset, market: types.MarketIdentifier, cancelClientOrderId: number, newOrderPrice: number, newOrderSize: number, newOrderSide: types.Side, newOptions?: types.OrderOptions): Promise<TransactionSignature>;
    replaceByClientOrderId(asset: Asset, market: types.MarketIdentifier, cancelClientOrderId: number, newOrderPrice: number, newOrderSize: number, newOrderSide: types.Side, newOptions?: types.OrderOptions): Promise<TransactionSignature>;
    initializeOpenOrdersAccount(asset: Asset, market: PublicKey): Promise<TransactionSignature>;
    closeOpenOrdersAccount(asset: Asset, market: PublicKey): Promise<TransactionSignature>;
    closeMultipleOpenOrdersAccount(asset: Asset, markets: PublicKey[]): Promise<TransactionSignature[]>;
    cancelMultipleOrders(cancelArguments: types.CancelArgs[]): Promise<TransactionSignature[]>;
    cancelMultipleOrdersNoError(asset: Asset, cancelArguments: types.CancelArgs[]): Promise<TransactionSignature[]>;
    forceCancelOrderByOrderId(asset: Asset, market: types.MarketIdentifier, marginAccountToCancel: PublicKey, orderId: anchor.BN, side: types.Side): Promise<TransactionSignature>;
    forceCancelOrders(asset: Asset, market: types.MarketIdentifier, marginAccountToCancel: PublicKey): Promise<TransactionSignature>;
    liquidate(asset: Asset, market: types.MarketIdentifier, liquidatedMarginAccount: PublicKey, size: number): Promise<TransactionSignature>;
    positionMovement(asset: Asset, movementType: types.MovementType, movements: instructions.PositionMovementArg[]): Promise<TransactionSignature>;
    simulatePositionMovement(asset: Asset, movementType: types.MovementType, movements: instructions.PositionMovementArg[]): Promise<PositionMovementEvent>;
    transferExcessSpreadBalance(asset: Asset): Promise<TransactionSignature>;
    getMarginPositionSize(asset: Asset, index: number, decimal?: boolean): number;
    getMarginCostOfTrades(asset: Asset, index: number, decimal?: boolean): number;
    getMarginPositions(asset: Asset): types.Position[];
    getSpreadPositions(asset: Asset): types.Position[];
    getOrders(asset: Asset): types.Order[];
    getOpeningOrders(asset: Asset, index: number, side: types.Side, decimal?: boolean): number;
    getClosingOrders(asset: Asset, index: number, decimal?: boolean): number;
    getOpenOrdersAccounts(asset: Asset): PublicKey[];
    getSpreadPositionSize(asset: Asset, index: number, decimal?: boolean): number;
    getSpreadCostOfTrades(asset: Asset, index: number, decimal?: boolean): number;
    getSpreadAccount(asset: Asset): SpreadAccount;
    getSpreadAccountAddress(asset: Asset): PublicKey;
    getMarginAccount(asset: Asset): MarginAccount;
    getMarginAccountAddress(asset: Asset): PublicKey;
    getMarginAccountAddresses(): PublicKey[];
    initializeReferrerAccount(): Promise<void>;
    initializeReferrerAlias(alias: string): Promise<TransactionSignature>;
    claimReferrerRewards(): Promise<TransactionSignature>;
    claimReferralRewards(): Promise<TransactionSignature>;
    getProductLedger(asset: Asset, marketIndex: number): ProductLedger;
    close(): Promise<void>;
    private delegatedCheck;
}
