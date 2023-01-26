import * as anchor from "@project-serum/anchor";
import { Asset } from "./assets";
import { SpreadAccount, MarginAccount, PositionMovementEvent } from "./program-types";
import { PublicKey, Connection, TransactionSignature, TransactionInstruction } from "@solana/web3.js";
import * as types from "./types";
import * as instructions from "./program-instructions";
import { EventType } from "./events";
import { Client } from "./client";
import { SubExchange } from "./subexchange";
export declare class SubClient {
    /**
     * Stores the user margin account state.
     */
    get marginAccount(): MarginAccount | null;
    private _marginAccount;
    /**
     * SubClient margin account address.
     */
    get marginAccountAddress(): PublicKey;
    private _marginAccountAddress;
    /**
     * SubClient's underlying asset, used to grab the subExchange.
     */
    get asset(): Asset;
    private _asset;
    /**
     * A reference to this subclient's parent, to grab things like usdc and whitelist addresses
     */
    get parent(): Client;
    private _parent;
    /**
     * A reference to the subExchange corresponding to the same asset this subclient is using,
     * so that we don't need to fetch it every time
     */
    get subExchange(): SubExchange;
    private _subExchange;
    /**
     * Stores the user margin account state.
     */
    get spreadAccount(): SpreadAccount | null;
    private _spreadAccount;
    /**
     * SubClient margin account address.
     */
    get spreadAccountAddress(): PublicKey;
    private _spreadAccountAddress;
    /**
     * User open order addresses.
     * If a user hasn't initialized it, it is set to PublicKey.default
     */
    get openOrdersAccounts(): PublicKey[];
    private _openOrdersAccounts;
    /**
     * Returns a list of the user's current orders.
     */
    get orders(): types.Order[];
    private _orders;
    /**
     * Returns a list of user current margin account positions.
     */
    get marginPositions(): types.Position[];
    private _marginPositions;
    /**
     * Returns a list of user current spread account positions.
     */
    get spreadPositions(): types.Position[];
    private _spreadPositions;
    /**
     * The subscription id for the margin account subscription.
     */
    private _marginAccountSubscriptionId;
    /**
     * The subscription id for the spread account subscription.
     */
    private _spreadAccountSubscriptionId;
    /**
     * Last update timestamp.
     */
    private _lastUpdateTimestamp;
    /**
     * Pending update.
     */
    private _pendingUpdate;
    /**
     * The context slot of the pending update.
     */
    private _pendingUpdateSlot;
    /**
     * Polling interval.
     */
    get pollInterval(): number;
    set pollInterval(interval: number);
    private _pollInterval;
    /**
     * User passed callback on load, stored for polling.
     */
    private _callback;
    private _updatingState;
    private _updatingStateTimestamp;
    private constructor();
    /**
     * Returns a new instance of SubClient, based off state in the Exchange singleton.
     * Requires the Exchange to be in a valid state to succeed.
     *
     * @param throttle    Defaults to true.
     *                    If set to false, margin account callbacks will also call
     *                    `updateState` instead of waiting for the poll.
     */
    static load(asset: Asset, parent: Client, connection: Connection, user: PublicKey, callback?: (asset: Asset, type: EventType, data: any) => void, throttle?: boolean): Promise<SubClient>;
    pollUpdate(): Promise<void>;
    private toggleUpdateState;
    private checkResetUpdatingState;
    /**
     * Polls the margin account for the latest state.
     */
    updateState(fetch?: boolean, force?: boolean): Promise<void>;
    /**
     * @param amount  the native amount to deposit (6 decimals fixed point)
     */
    deposit(amount: number): Promise<TransactionSignature>;
    /**
     * Closes a subClient's margin account
     */
    closeMarginAccount(): Promise<TransactionSignature>;
    /**
     * Closes a subClient's spread account
     */
    closeSpreadAccount(): Promise<TransactionSignature>;
    /**
     * @param amount  the native amount to withdraw (6 dp)
     */
    withdraw(amount: number): Promise<TransactionSignature>;
    /**
     * Withdraws the entirety of the subClient's margin account and then closes it.
     */
    withdrawAndCloseMarginAccount(): Promise<TransactionSignature>;
    /**
     * Places a fill or kill  order on a zeta market.
     * If successful - it will lock the full size into a user's spread account.
     * It will create the spread account if the user didn't have one already.
     * @param market          the address of the serum market
     * @param price           the native price of the order (6 d.p as integer)
     * @param size            the quantity of the order (3 d.p)
     * @param side            the side of the order. bid / ask
     */
    placeOrderAndLockPosition(market: PublicKey, price: number, size: number, side: types.Side, tag?: String): Promise<TransactionSignature>;
    /**
     * Places an order on a zeta market.
     * @param market          the address of the serum market
     * @param price           the native price of the order (6 d.p as integer)
     * @param size            the quantity of the order (3 d.p)
     * @param side            the side of the order. bid / ask
     * @param explicitTIF     whether to calculate the relative TIF offset or use absolute TIF offset
     * @param tifOffset       the TIF offset at which the order will expire
     * @param orderType       the type of the order. limit / ioc / post-only
     * @param clientOrderId   optional: subClient order id (non 0 value)
     * @param tag             optional: the string tag corresponding to who is inserting
     * NOTE: If duplicate subClient order ids are used, after a cancel order,
     * to cancel the second order with the same subClient order id,
     * you may need to crank the corresponding event queue to flush that order id
     * from the user open orders account before cancelling the second order.
     * (Depending on the order in which the order was cancelled).
     */
    placeOrder(market: PublicKey, price: number, size: number, side: types.Side, options?: types.OrderOptions): Promise<TransactionSignature>;
    /**
     * Places an order on a zeta perp market.
     * @param price           the native price of the order (6 d.p as integer)
     * @param size            the quantity of the order (3 d.p)
     * @param side            the side of the order. bid / ask
     * @param orderType       the type of the order. limit / ioc / post-only
     * @param clientOrderId   optional: subClient order id (non 0 value)
     * @param tag             optional: the string tag corresponding to who is inserting
     * NOTE: If duplicate subClient order ids are used, after a cancel order,
     * to cancel the second order with the same subClient order id,
     * you may need to crank the corresponding event queue to flush that order id
     * from the user open orders account before cancelling the second order.
     * (Depending on the order in which the order was cancelled).
     */
    placePerpOrder(price: number, size: number, side: types.Side, options?: types.OrderOptions): Promise<TransactionSignature>;
    editDelegatedPubkey(delegatedPubkey: PublicKey): Promise<TransactionSignature>;
    createCancelOrderNoErrorInstruction(marketIndex: number, orderId: anchor.BN, side: types.Side): TransactionInstruction;
    createCancelAllMarketOrdersInstruction(marketIndex: number): TransactionInstruction;
    createPlaceOrderInstruction(marketIndex: number, price: number, size: number, side: types.Side, options?: types.OrderOptions): TransactionInstruction;
    createPlacePerpOrderInstruction(price: number, size: number, side: types.Side, options?: types.OrderOptions): TransactionInstruction;
    /**
     * Cancels a user order by orderId
     * @param market     the market address of the order to be cancelled.
     * @param orderId    the order id of the order.
     * @param side       the side of the order. bid / ask.
     */
    cancelOrder(market: PublicKey, orderId: anchor.BN, side: types.Side): Promise<TransactionSignature>;
    /**
     * Cancels a user order by subClient order id.
     * It will only cancel the FIRST
     * @param market          the market address of the order to be cancelled.
     * @param clientOrderId   the subClient order id of the order. (Non zero value).
     */
    cancelOrderByClientOrderId(market: PublicKey, clientOrderId: number): Promise<TransactionSignature>;
    /**
     * Cancels a user order by orderId and atomically places an order
     * @param market     the market address of the order to be cancelled.
     * @param orderId    the order id of the order.
     * @param cancelSide       the side of the order. bid / ask.
     * @param newOrderPrice  the native price of the order (6 d.p) as integer
     * @param newOrderSize   the quantity of the order (3 d.p) as integer
     * @param newOrderSide   the side of the order. bid / ask
     * @param newOrderType   the type of the order, limit / ioc / post-only
     * @param clientOrderId   optional: subClient order id (non 0 value)
     * @param newOrderTag     optional: the string tag corresponding to who is inserting. Default "SDK", max 4 length
     */
    cancelAndPlaceOrder(market: PublicKey, orderId: anchor.BN, cancelSide: types.Side, newOrderPrice: number, newOrderSize: number, newOrderSide: types.Side, options?: types.OrderOptions): Promise<TransactionSignature>;
    /**
     * Cancels a user order by subClient order id and atomically places an order by new subClient order id.
     * @param market                  the market address of the order to be cancelled and new order.
     * @param cancelClientOrderId     the subClient order id of the order to be cancelled.
     * @param newOrderPrice           the native price of the order (6 d.p) as integer
     * @param newOrderSize            the quantity of the order (3 d.p) as integer
     * @param newOrderSide            the side of the order. bid / ask
     * @param newOrderType            the type of the order, limit / ioc / post-only
     * @param newOrderClientOrderId   the subClient order id for the new order
     * @param newOrderTag     optional: the string tag corresponding to who is inserting. Default "SDK", max 4 length
     */
    cancelAndPlaceOrderByClientOrderId(market: PublicKey, cancelClientOrderId: number, newOrderPrice: number, newOrderSize: number, newOrderSide: types.Side, newOptions?: types.OrderOptions): Promise<TransactionSignature>;
    /**
     * Cancels a user order by client order id and atomically places an order by new client order id.
     * Uses the 'NoError' cancel instruction, so a failed cancellation won't prohibit the placeOrder
     * @param market                  the market address of the order to be cancelled and new order.
     * @param cancelClientOrderId     the client order id of the order to be cancelled.
     * @param newOrderPrice           the native price of the order (6 d.p) as integer
     * @param newOrderSize            the quantity of the order (3 d.p) as integer
     * @param newOrderSide            the side of the order. bid / ask
     * @param newOrderType            the type of the order, limit / ioc / post-only
     * @param newOrderClientOrderId   the client order id for the new order
     * @param newOrderTag     optional: the string tag corresponding to who is inserting. Default "SDK", max 4 length
     */
    replaceByClientOrderId(market: PublicKey, cancelClientOrderId: number, newOrderPrice: number, newOrderSize: number, newOrderSide: types.Side, newOptions?: types.OrderOptions): Promise<TransactionSignature>;
    /**
     * Initializes a user open orders account for a given market.
     * This is handled atomically by place order but can be used by subClients to initialize it independent of placing an order.
     */
    initializeOpenOrdersAccount(market: PublicKey): Promise<TransactionSignature>;
    /**
     * Closes a user open orders account for a given market.
     */
    closeOpenOrdersAccount(market: PublicKey): Promise<TransactionSignature>;
    /**
     * Closes multiple user open orders account for a given set of markets.
     * Cannot pass in multiple of the same market address
     */
    closeMultipleOpenOrdersAccount(markets: PublicKey[]): Promise<TransactionSignature[]>;
    /**
     * Calls force cancel on another user's orders
     * @param market  Market to cancel orders on
     * @param marginAccountToCancel Users to be force-cancelled's margin account
     */
    forceCancelOrderByOrderId(market: PublicKey, marginAccountToCancel: PublicKey, orderId: anchor.BN, side: types.Side): Promise<TransactionSignature>;
    /**
     * Calls force cancel on another user's orders
     * @param market  Market to cancel orders on
     * @param marginAccountToCancel Users to be force-cancelled's margin account
     */
    forceCancelOrders(market: PublicKey, marginAccountToCancel: PublicKey): Promise<TransactionSignature>;
    /**
     * Calls liquidate on another user
     * @param market
     * @param liquidatedMarginAccount
     * @param size                        the quantity of the order (3 d.p)
     */
    liquidate(market: PublicKey, liquidatedMarginAccount: PublicKey, size: number): Promise<TransactionSignature>;
    /**
     * Instruction builder for cancelAllOrders()
     * Returns a list of instructions cancelling all of this subclient's orders
     */
    cancelAllOrdersIxs(): TransactionInstruction[];
    /**
     * Instruction builder for cancelAllOrdersNoError()
     * Returns a list of instructions cancelling all of this subclient's orders
     */
    cancelAllOrdersNoErrorIxs(): TransactionInstruction[];
    /**
     * Cancels all active user orders
     */
    cancelAllOrders(): Promise<TransactionSignature[]>;
    /**
     * Cancels all active user orders, but will not crash if some cancels fail
     */
    cancelAllOrdersNoError(): Promise<TransactionSignature[]>;
    /**
     * Moves positions to and from spread and margin account, based on the type.
     * @param movementType    - type of movement
     * @param movements       - vector of position movements
     */
    positionMovement(movementType: types.MovementType, movements: instructions.PositionMovementArg[]): Promise<TransactionSignature>;
    /**
     * Moves positions to and from spread and margin account, based on the type.
     * @param movementType    - type of movement
     * @param movements       - vector of position movements
     */
    simulatePositionMovement(movementType: types.MovementType, movements: instructions.PositionMovementArg[]): Promise<PositionMovementEvent>;
    private getPositionMovementTx;
    /**
     * Transfers any non required balance in the spread account to margin account.
     */
    transferExcessSpreadBalance(): Promise<TransactionSignature>;
    private getRelevantMarketIndexes;
    private updateOrders;
    private updateMarginPositions;
    private updateSpreadPositions;
    private updateOpenOrdersAddresses;
    private assertHasMarginAccount;
    /**
     * Getter functions for raw user margin account state.
     */
    /**
     * @param index - market index.
     * @param decimal - whether to convert to readable decimal.
     */
    getMarginPositionSize(index: number, decimal?: boolean): number;
    /**
     * @param index - market index.
     * @param decimal - whether to convert to readable decimal.
     */
    getMarginCostOfTrades(index: number, decimal?: boolean): number;
    /**
     * @param index - market index.
     * @param decimal - whether to convert to readable decimal.
     */
    getOpeningOrders(index: number, side: types.Side, decimal?: boolean): number;
    /**
     * @param index - market index.
     * @param decimal - whether to convert to readable decimal.
     */
    getClosingOrders(index: number, decimal?: boolean): number;
    /**
     * Getter functions for raw user spread account state.
     */
    /**
     * @param index - market index.
     * @param decimal - whether to convert to readable decimal.
     */
    getSpreadPositionSize(index: number, decimal?: boolean): number;
    /**
     * @param index - market index.
     * @param decimal - whether to convert to readable decimal.
     */
    getSpreadCostOfTrades(index: number, decimal?: boolean): number;
    /**
     * Getter function to grab the correct product ledger because perps is separate
     */
    getProductLedger(index: number): import("./program-types").ProductLedger;
    /**
     * Closes the subClient websocket subscription to margin account.
     */
    close(): Promise<void>;
    private delegatedCheck;
}
