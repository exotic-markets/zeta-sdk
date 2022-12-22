"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubClient = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
const utils = __importStar(require("./utils"));
const assets_1 = require("./assets");
const constants = __importStar(require("./constants"));
const exchange_1 = require("./exchange");
const web3_js_1 = require("@solana/web3.js");
const types = __importStar(require("./types"));
const instructions = __importStar(require("./program-instructions"));
const events_1 = require("./events");
class SubClient {
    /**
     * Stores the user margin account state.
     */
    get marginAccount() {
        return this._marginAccount;
    }
    /**
     * SubClient margin account address.
     */
    get marginAccountAddress() {
        return this._marginAccountAddress;
    }
    /**
     * SubClient's underlying asset, used to grab the subExchange.
     */
    get asset() {
        return this._asset;
    }
    /**
     * A reference to this subclient's parent, to grab things like usdc and whitelist addresses
     */
    get parent() {
        return this._parent;
    }
    /**
     * A reference to the subExchange corresponding to the same asset this subclient is using,
     * so that we don't need to fetch it every time
     */
    get subExchange() {
        return this._subExchange;
    }
    /**
     * Stores the user margin account state.
     */
    get spreadAccount() {
        return this._spreadAccount;
    }
    /**
     * SubClient margin account address.
     */
    get spreadAccountAddress() {
        return this._spreadAccountAddress;
    }
    /**
     * User open order addresses.
     * If a user hasn't initialized it, it is set to PublicKey.default
     */
    get openOrdersAccounts() {
        return this._openOrdersAccounts;
    }
    /**
     * Returns a list of the user's current orders.
     */
    get orders() {
        return this._orders;
    }
    /**
     * Returns a list of user current margin account positions.
     */
    get marginPositions() {
        return this._marginPositions;
    }
    /**
     * Returns a list of user current spread account positions.
     */
    get spreadPositions() {
        return this._spreadPositions;
    }
    /**
     * Polling interval.
     */
    get pollInterval() {
        return this._pollInterval;
    }
    set pollInterval(interval) {
        if (interval < 0) {
            throw Error("Polling interval invalid!");
        }
        this._pollInterval = interval;
    }
    constructor(asset, parent) {
        /**
         * The subscription id for the margin account subscription.
         */
        this._marginAccountSubscriptionId = undefined;
        /**
         * The subscription id for the spread account subscription.
         */
        this._spreadAccountSubscriptionId = undefined;
        /**
         * The context slot of the pending update.
         */
        this._pendingUpdateSlot = 0;
        this._pollInterval = constants.DEFAULT_CLIENT_POLL_INTERVAL;
        this._updatingState = false;
        this._updatingStateTimestamp = undefined;
        this._asset = asset;
        this._subExchange = exchange_1.exchange.getSubExchange(asset);
        this._openOrdersAccounts = Array(constants.TOTAL_MARKETS).fill(web3_js_1.PublicKey.default);
        this._parent = parent;
        this._marginPositions = [];
        this._spreadPositions = [];
        this._orders = [];
        this._lastUpdateTimestamp = 0;
        this._pendingUpdate = false;
        this._marginAccount = null;
        this._spreadAccount = null;
    }
    /**
     * Returns a new instance of SubClient, based off state in the Exchange singleton.
     * Requires the Exchange to be in a valid state to succeed.
     *
     * @param throttle    Defaults to true.
     *                    If set to false, margin account callbacks will also call
     *                    `updateState` instead of waiting for the poll.
     */
    static async load(asset, parent, connection, wallet, callback = undefined, throttle = false) {
        let subClient = new SubClient(asset, parent);
        let [marginAccountAddress, _marginAccountNonce] = await utils.getMarginAccount(exchange_1.exchange.programId, subClient._subExchange.zetaGroupAddress, wallet.publicKey);
        let [spreadAccountAddress, _spreadAccountNonce] = await utils.getSpreadAccount(exchange_1.exchange.programId, subClient._subExchange.zetaGroupAddress, wallet.publicKey);
        subClient._marginAccountAddress = marginAccountAddress;
        subClient._spreadAccountAddress = spreadAccountAddress;
        subClient._callback = callback;
        subClient._marginAccountSubscriptionId = connection.onAccountChange(subClient._marginAccountAddress, async (accountInfo, context) => {
            subClient._marginAccount = exchange_1.exchange.program.coder.accounts.decode(types.ProgramAccountType.MarginAccount, accountInfo.data);
            if (throttle || subClient._updatingState) {
                subClient._pendingUpdate = true;
                subClient._pendingUpdateSlot = context.slot;
                return;
            }
            await subClient.updateState(false);
            subClient._lastUpdateTimestamp = exchange_1.exchange.clockTimestamp;
            if (callback !== undefined) {
                callback(asset, events_1.EventType.USER, null);
            }
            await subClient.updateOpenOrdersAddresses();
        }, connection.commitment);
        subClient._spreadAccountSubscriptionId = connection.onAccountChange(subClient._spreadAccountAddress, async (accountInfo, _context) => {
            subClient._spreadAccount = exchange_1.exchange.program.coder.accounts.decode(types.ProgramAccountType.SpreadAccount, accountInfo.data);
            subClient.updateSpreadPositions();
            if (callback !== undefined) {
                callback(asset, events_1.EventType.USER, null);
            }
        }, connection.commitment);
        try {
            subClient._marginAccount =
                (await exchange_1.exchange.program.account.marginAccount.fetch(subClient._marginAccountAddress));
            // Set open order pdas for initialized accounts.
            await subClient.updateOpenOrdersAddresses();
            subClient.updateMarginPositions();
            // We don't update orders here to make load faster.
            subClient._pendingUpdate = true;
        }
        catch (e) {
            console.log(`User does not have a margin account for ${asset}.`);
        }
        try {
            subClient._spreadAccount =
                (await exchange_1.exchange.program.account.spreadAccount.fetch(subClient._spreadAccountAddress));
            subClient.updateSpreadPositions();
        }
        catch (e) {
            console.log(`User does not have a spread account for ${asset}.`);
        }
        return subClient;
    }
    async pollUpdate() {
        if (exchange_1.exchange.clockTimestamp >
            this._lastUpdateTimestamp + this._pollInterval ||
            this._pendingUpdate) {
            try {
                if (this._updatingState) {
                    return;
                }
                let latestSlot = this._pendingUpdateSlot;
                await this.updateState();
                // If there was a margin account websocket callback, we want to
                // trigger an `updateState` on the next timer tick.
                if (latestSlot == this._pendingUpdateSlot) {
                    this._pendingUpdate = false;
                }
                this._lastUpdateTimestamp = exchange_1.exchange.clockTimestamp;
                if (this._callback !== undefined) {
                    this._callback(this.asset, events_1.EventType.USER, null);
                }
            }
            catch (e) {
                console.log(`SubClient poll update failed. Error: ${e}`);
            }
        }
    }
    toggleUpdateState(toggleOn) {
        if (toggleOn) {
            this._updatingState = true;
            this._updatingStateTimestamp = Date.now() / 1000;
        }
        else {
            this._updatingState = false;
            this._updatingStateTimestamp = undefined;
        }
    }
    // Safety to reset this._updatingState
    checkResetUpdatingState() {
        if (this._updatingState &&
            Date.now() / 1000 - this._updatingStateTimestamp >
                constants.UPDATING_STATE_LIMIT_SECONDS) {
            this.toggleUpdateState(false);
        }
    }
    /**
     * Polls the margin account for the latest state.
     */
    async updateState(fetch = true, force = false) {
        this.checkResetUpdatingState();
        if (this._updatingState && !force) {
            return;
        }
        this.toggleUpdateState(true);
        if (fetch) {
            try {
                this._marginAccount =
                    (await exchange_1.exchange.program.account.marginAccount.fetch(this._marginAccountAddress));
            }
            catch (e) {
                this.toggleUpdateState(false);
                return;
            }
            try {
                this._spreadAccount =
                    (await exchange_1.exchange.program.account.spreadAccount.fetch(this._spreadAccountAddress));
            }
            catch (e) { }
        }
        try {
            if (this._marginAccount !== null) {
                this.updateMarginPositions();
                await this.updateOrders();
            }
            if (this._spreadAccount !== null) {
                this.updateSpreadPositions();
            }
        }
        catch (e) { }
        this.toggleUpdateState(false);
    }
    /**
     * @param amount  the native amount to deposit (6 decimals fixed point)
     */
    async deposit(amount) {
        // Check if the user has a USDC account.
        let tx = new web3_js_1.Transaction();
        if (this._marginAccount === null) {
            console.log("User has no margin account. Creating margin account...");
            tx.add(instructions.initializeMarginAccountIx(this._subExchange.zetaGroupAddress, this._marginAccountAddress, this._parent.publicKey));
        }
        tx.add(await instructions.depositIx(this.asset, amount, this._marginAccountAddress, this._parent.usdcAccountAddress, this._parent.publicKey, this._parent.whitelistDepositAddress));
        let txId = await utils.processTransaction(this._parent.provider, tx);
        return txId;
    }
    /**
     * Closes a subClient's margin account
     */
    async closeMarginAccount() {
        if (this._marginAccount === null) {
            throw Error("User has no margin account to close");
        }
        let tx = new web3_js_1.Transaction().add(instructions.closeMarginAccountIx(this.asset, this._parent.publicKey, this._marginAccountAddress));
        let txId = await utils.processTransaction(this._parent.provider, tx);
        this._marginAccount = null;
        return txId;
    }
    /**
     * Closes a subClient's spread account
     */
    async closeSpreadAccount() {
        if (this._spreadAccount === null) {
            throw Error("User has no spread account to close");
        }
        let subExchange = this._subExchange;
        let tx = new web3_js_1.Transaction();
        tx.add(instructions.transferExcessSpreadBalanceIx(subExchange.zetaGroupAddress, this.marginAccountAddress, this._spreadAccountAddress, this._parent.publicKey));
        tx.add(instructions.closeSpreadAccountIx(subExchange.zetaGroupAddress, this._spreadAccountAddress, this._parent.publicKey));
        let txId = await utils.processTransaction(this._parent.provider, tx);
        this._spreadAccount = null;
        return txId;
    }
    /**
     * @param amount  the native amount to withdraw (6 dp)
     */
    async withdraw(amount) {
        let tx = new web3_js_1.Transaction();
        tx.add(instructions.withdrawIx(this.asset, amount, this._marginAccountAddress, this._parent.usdcAccountAddress, this._parent.publicKey));
        return await utils.processTransaction(this._parent.provider, tx);
    }
    /**
     * Withdraws the entirety of the subClient's margin account and then closes it.
     */
    async withdrawAndCloseMarginAccount() {
        if (this._marginAccount === null) {
            throw Error("User has no margin account to withdraw or close.");
        }
        let tx = new web3_js_1.Transaction();
        tx.add(instructions.withdrawIx(this.asset, this._marginAccount.balance.toNumber(), this._marginAccountAddress, this._parent.usdcAccountAddress, this._parent.publicKey));
        tx.add(instructions.closeMarginAccountIx(this.asset, this._parent.publicKey, this._marginAccountAddress));
        return await utils.processTransaction(this._parent.provider, tx);
    }
    /**
     * Places a fill or kill  order on a zeta market.
     * If successful - it will lock the full size into a user's spread account.
     * It will create the spread account if the user didn't have one already.
     * @param market          the address of the serum market
     * @param price           the native price of the order (6 d.p as integer)
     * @param size            the quantity of the order (3 d.p)
     * @param side            the side of the order. bid / ask
     */
    async placeOrderAndLockPosition(market, price, size, side, tag = constants.DEFAULT_ORDER_TAG) {
        let tx = new web3_js_1.Transaction();
        let subExchange = this._subExchange;
        let marketIndex = subExchange.markets.getMarketIndex(market);
        let openOrdersPda = null;
        if (this._openOrdersAccounts[marketIndex].equals(web3_js_1.PublicKey.default)) {
            console.log(`User doesn't have open orders account. Initialising for market ${market.toString()}.`);
            let [initIx, _openOrdersPda] = await instructions.initializeOpenOrdersIx(this.asset, market, this._parent.publicKey, this.marginAccountAddress);
            openOrdersPda = _openOrdersPda;
            tx.add(initIx);
        }
        else {
            openOrdersPda = this._openOrdersAccounts[marketIndex];
        }
        let orderIx = instructions.placeOrderV4Ix(this.asset, marketIndex, price, size, side, types.OrderType.FILLORKILL, 0, // Default to none for now.
        tag, 0, this.marginAccountAddress, this._parent.publicKey, openOrdersPda, this._parent.whitelistTradingFeesAddress);
        tx.add(orderIx);
        if (this.spreadAccount == null) {
            console.log("User has no spread account. Creating spread account...");
            tx.add(instructions.initializeSpreadAccountIx(subExchange.zetaGroupAddress, this.spreadAccountAddress, this._parent.publicKey));
        }
        let movementSize = side == types.Side.BID ? size : -size;
        let movements = [
            {
                index: marketIndex,
                size: new anchor.BN(movementSize),
            },
        ];
        tx.add(instructions.positionMovementIx(this._asset, subExchange.zetaGroupAddress, this.marginAccountAddress, this.spreadAccountAddress, this._parent.publicKey, subExchange.greeksAddress, subExchange.zetaGroup.oracle, types.MovementType.LOCK, movements));
        let txId = await utils.processTransaction(this._parent.provider, tx);
        this._openOrdersAccounts[marketIndex] = openOrdersPda;
        return txId;
    }
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
    async placeOrder(market, price, size, side, options) {
        let tx = new web3_js_1.Transaction();
        let marketIndex = this._subExchange.markets.getMarketIndex(market);
        let openOrdersPda = null;
        if (this._openOrdersAccounts[marketIndex].equals(web3_js_1.PublicKey.default)) {
            console.log(`[${(0, assets_1.assetToName)(this.asset)}] User doesn't have open orders account. Initialising for market ${market.toString()}.`);
            let [initIx, _openOrdersPda] = await instructions.initializeOpenOrdersIx(this.asset, market, this._parent.publicKey, this.marginAccountAddress);
            openOrdersPda = _openOrdersPda;
            tx.add(initIx);
        }
        else {
            openOrdersPda = this._openOrdersAccounts[marketIndex];
        }
        let marketInfo = exchange_1.exchange.getMarkets(this._asset)[marketIndex];
        let tifOffsetToUse = utils.getTIFOffset(options.explicitTIF != undefined ? options.explicitTIF : true, options.tifOffset != undefined ? options.tifOffset : 0, marketInfo.serumMarket.epochStartTs.toNumber(), marketInfo.serumMarket.epochLength.toNumber());
        let orderIx = instructions.placeOrderV4Ix(this.asset, marketIndex, price, size, side, options.orderType != undefined
            ? options.orderType
            : types.OrderType.LIMIT, options.clientOrderId != undefined ? options.clientOrderId : 0, options.tag != undefined ? options.tag : constants.DEFAULT_ORDER_TAG, tifOffsetToUse, this.marginAccountAddress, this._parent.publicKey, openOrdersPda, this._parent.whitelistTradingFeesAddress);
        tx.add(orderIx);
        let txId;
        txId = await utils.processTransaction(this._parent.provider, tx, undefined, undefined, undefined, options.blockhash);
        this._openOrdersAccounts[marketIndex] = openOrdersPda;
        return txId;
    }
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
    async placePerpOrder(price, size, side, options) {
        let tx = new web3_js_1.Transaction();
        let market = exchange_1.exchange.getPerpMarket(this._asset).address;
        let marketIndex = constants.PERP_INDEX;
        let openOrdersPda = null;
        if (this._openOrdersAccounts[marketIndex].equals(web3_js_1.PublicKey.default)) {
            console.log(`[${(0, assets_1.assetToName)(this.asset)}] User doesn't have open orders account. Initialising for market ${market.toString()}.`);
            let [initIx, _openOrdersPda] = await instructions.initializeOpenOrdersIx(this.asset, market, this._parent.publicKey, this.marginAccountAddress);
            openOrdersPda = _openOrdersPda;
            tx.add(initIx);
        }
        else {
            openOrdersPda = this._openOrdersAccounts[marketIndex];
        }
        let marketInfo = exchange_1.exchange.getPerpMarket(this._asset);
        let tifOffsetToUse = utils.getTIFOffset(options.explicitTIF != undefined ? options.explicitTIF : true, options.tifOffset != undefined ? options.tifOffset : 0, marketInfo.serumMarket.epochStartTs.toNumber(), marketInfo.serumMarket.epochLength.toNumber());
        let orderIx = instructions.placePerpOrderV2Ix(this.asset, marketIndex, price, size, side, options.orderType != undefined
            ? options.orderType
            : types.OrderType.LIMIT, options.clientOrderId != undefined ? options.clientOrderId : 0, options.tag != undefined ? options.tag : constants.DEFAULT_ORDER_TAG, tifOffsetToUse, this.marginAccountAddress, this._parent.publicKey, openOrdersPda, this._parent.whitelistTradingFeesAddress);
        tx.add(orderIx);
        let txId;
        txId = await utils.processTransaction(this._parent.provider, tx, undefined, undefined, undefined, options.blockhash);
        this._openOrdersAccounts[marketIndex] = openOrdersPda;
        return txId;
    }
    createCancelOrderNoErrorInstruction(marketIndex, orderId, side) {
        return instructions.cancelOrderNoErrorIx(this.asset, marketIndex, this._parent.publicKey, this._marginAccountAddress, this._openOrdersAccounts[marketIndex], orderId, side);
    }
    createCancelAllMarketOrdersInstruction(marketIndex) {
        return instructions.cancelAllMarketOrdersIx(this.asset, marketIndex, this._parent.publicKey, this._marginAccountAddress, this._openOrdersAccounts[marketIndex]);
    }
    createPlaceOrderInstruction(marketIndex, price, size, side, options) {
        if (marketIndex == constants.PERP_INDEX) {
            return this.createPlacePerpOrderInstruction(price, size, side, options);
        }
        let marketInfo = exchange_1.exchange.getMarkets(this._asset)[marketIndex];
        let tifOffsetToUse = utils.getTIFOffset(options.explicitTIF != undefined ? options.explicitTIF : true, options.tifOffset != undefined ? options.tifOffset : 0, marketInfo.serumMarket.epochStartTs.toNumber(), marketInfo.serumMarket.epochLength.toNumber());
        return instructions.placeOrderV4Ix(this.asset, marketIndex, price, size, side, options.orderType != undefined
            ? options.orderType
            : types.OrderType.LIMIT, options.clientOrderId != undefined ? options.clientOrderId : 0, options.tag != undefined ? options.tag : constants.DEFAULT_ORDER_TAG, tifOffsetToUse, this.marginAccountAddress, this._parent.publicKey, this._openOrdersAccounts[marketIndex], this._parent.whitelistTradingFeesAddress);
    }
    createPlacePerpOrderInstruction(price, size, side, options) {
        if (this._openOrdersAccounts[constants.PERP_INDEX].equals(web3_js_1.PublicKey.default)) {
            console.log(`No open orders account for ${(0, assets_1.assetToName)(this.asset)}-PERP. Please call client.placeOrder() or client.initializeOpenOrdersAccount()`);
            throw Error("User does not have an open orders account.");
        }
        return instructions.placePerpOrderV2Ix(this.asset, constants.PERP_INDEX, price, size, side, options.orderType != undefined
            ? options.orderType
            : types.OrderType.LIMIT, options.clientOrderId != undefined ? options.clientOrderId : 0, options.tag != undefined ? options.tag : constants.DEFAULT_ORDER_TAG, options.tifOffset != undefined ? options.tifOffset : 0, this.marginAccountAddress, this._parent.publicKey, this._openOrdersAccounts[constants.PERP_INDEX], this._parent.whitelistTradingFeesAddress);
    }
    /**
     * Cancels a user order by orderId
     * @param market     the market address of the order to be cancelled.
     * @param orderId    the order id of the order.
     * @param side       the side of the order. bid / ask.
     */
    async cancelOrder(market, orderId, side) {
        let tx = new web3_js_1.Transaction();
        let index = this._subExchange.markets.getMarketIndex(market);
        let ix = instructions.cancelOrderIx(this.asset, index, this._parent.publicKey, this._marginAccountAddress, this._openOrdersAccounts[index], orderId, side);
        tx.add(ix);
        return await utils.processTransaction(this._parent.provider, tx);
    }
    /**
     * Cancels a user order by subClient order id.
     * It will only cancel the FIRST
     * @param market          the market address of the order to be cancelled.
     * @param clientOrderId   the subClient order id of the order. (Non zero value).
     */
    async cancelOrderByClientOrderId(market, clientOrderId) {
        if (clientOrderId == 0) {
            throw Error("SubClient order id cannot be 0.");
        }
        let tx = new web3_js_1.Transaction();
        let index = this._subExchange.markets.getMarketIndex(market);
        let ix = instructions.cancelOrderByClientOrderIdIx(this.asset, index, this._parent.publicKey, this._marginAccountAddress, this._openOrdersAccounts[index], new anchor.BN(clientOrderId));
        tx.add(ix);
        return await utils.processTransaction(this._parent.provider, tx);
    }
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
    async cancelAndPlaceOrder(market, orderId, cancelSide, newOrderPrice, newOrderSize, newOrderSide, options) {
        let tx = new web3_js_1.Transaction();
        let marketIndex = this._subExchange.markets.getMarketIndex(market);
        tx.add(instructions.cancelOrderIx(this.asset, marketIndex, this._parent.publicKey, this._marginAccountAddress, this._openOrdersAccounts[marketIndex], orderId, cancelSide));
        let marketInfo = exchange_1.exchange.getMarkets(this._asset)[marketIndex];
        let tifOffsetToUse = utils.getTIFOffset(options.explicitTIF != undefined ? options.explicitTIF : true, options.tifOffset != undefined ? options.tifOffset : 0, marketInfo.serumMarket.epochStartTs.toNumber(), marketInfo.serumMarket.epochLength.toNumber());
        tx.add(instructions.placeOrderV4Ix(this.asset, marketIndex, newOrderPrice, newOrderSize, newOrderSide, options.orderType != undefined
            ? options.orderType
            : types.OrderType.LIMIT, options.clientOrderId != undefined ? options.clientOrderId : 0, options.tag != undefined ? options.tag : constants.DEFAULT_ORDER_TAG, tifOffsetToUse, this.marginAccountAddress, this._parent.publicKey, this._openOrdersAccounts[marketIndex], this._parent.whitelistTradingFeesAddress));
        return await utils.processTransaction(this._parent.provider, tx);
    }
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
    async cancelAndPlaceOrderByClientOrderId(market, cancelClientOrderId, newOrderPrice, newOrderSize, newOrderSide, newOptions) {
        let tx = new web3_js_1.Transaction();
        let marketIndex = this._subExchange.markets.getMarketIndex(market);
        tx.add(instructions.cancelOrderByClientOrderIdIx(this.asset, marketIndex, this._parent.publicKey, this._marginAccountAddress, this._openOrdersAccounts[marketIndex], new anchor.BN(cancelClientOrderId)));
        let marketInfo = exchange_1.exchange.getMarkets(this._asset)[marketIndex];
        let tifOffsetToUse = utils.getTIFOffset(newOptions.explicitTIF != undefined ? newOptions.explicitTIF : true, newOptions.tifOffset != undefined ? newOptions.tifOffset : 0, marketInfo.serumMarket.epochStartTs.toNumber(), marketInfo.serumMarket.epochLength.toNumber());
        tx.add(instructions.placeOrderV4Ix(this.asset, marketIndex, newOrderPrice, newOrderSize, newOrderSide, newOptions.orderType != undefined
            ? newOptions.orderType
            : types.OrderType.LIMIT, newOptions.clientOrderId != undefined ? newOptions.clientOrderId : 0, newOptions.tag != undefined
            ? newOptions.tag
            : constants.DEFAULT_ORDER_TAG, tifOffsetToUse, this.marginAccountAddress, this._parent.publicKey, this._openOrdersAccounts[marketIndex], this._parent.whitelistTradingFeesAddress));
        return await utils.processTransaction(this._parent.provider, tx);
    }
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
    async replaceByClientOrderId(market, cancelClientOrderId, newOrderPrice, newOrderSize, newOrderSide, newOptions) {
        let tx = new web3_js_1.Transaction();
        let marketIndex = this._subExchange.markets.getMarketIndex(market);
        tx.add(instructions.cancelOrderByClientOrderIdNoErrorIx(this.asset, marketIndex, this._parent.publicKey, this._marginAccountAddress, this._openOrdersAccounts[marketIndex], new anchor.BN(cancelClientOrderId)));
        let marketInfo = exchange_1.exchange.getMarkets(this._asset)[marketIndex];
        let tifOffsetToUse = utils.getTIFOffset(newOptions.explicitTIF != undefined ? newOptions.explicitTIF : true, newOptions.tifOffset != undefined ? newOptions.tifOffset : 0, marketInfo.serumMarket.epochStartTs.toNumber(), marketInfo.serumMarket.epochLength.toNumber());
        tx.add(instructions.placeOrderV4Ix(this.asset, marketIndex, newOrderPrice, newOrderSize, newOrderSide, newOptions.orderType != undefined
            ? newOptions.orderType
            : types.OrderType.LIMIT, newOptions.clientOrderId != undefined ? newOptions.clientOrderId : 0, newOptions.tag != undefined
            ? newOptions.tag
            : constants.DEFAULT_ORDER_TAG, tifOffsetToUse, this.marginAccountAddress, this._parent.publicKey, this._openOrdersAccounts[marketIndex], this._parent.whitelistTradingFeesAddress));
        return await utils.processTransaction(this._parent.provider, tx);
    }
    /**
     * Initializes a user open orders account for a given market.
     * This is handled atomically by place order but can be used by subClients to initialize it independent of placing an order.
     */
    async initializeOpenOrdersAccount(market) {
        let marketIndex = this._subExchange.markets.getMarketIndex(market);
        if (!this._openOrdersAccounts[marketIndex].equals(web3_js_1.PublicKey.default)) {
            throw Error("User already has an open orders account for market!");
        }
        let [initIx, openOrdersPda] = await instructions.initializeOpenOrdersIx(this.asset, market, this._parent.publicKey, this.marginAccountAddress);
        let tx = new web3_js_1.Transaction().add(initIx);
        let txId = await utils.processTransaction(this._parent.provider, tx);
        this._openOrdersAccounts[marketIndex] = openOrdersPda;
        return txId;
    }
    /**
     * Closes a user open orders account for a given market.
     */
    async closeOpenOrdersAccount(market) {
        let marketIndex = this._subExchange.markets.getMarketIndex(market);
        if (this._openOrdersAccounts[marketIndex].equals(web3_js_1.PublicKey.default)) {
            throw Error("User has no open orders account for this market!");
        }
        const [vaultOwner, _vaultSignerNonce] = await utils.getSerumVaultOwnerAndNonce(market, constants.DEX_PID[exchange_1.exchange.network]);
        let tx = new web3_js_1.Transaction();
        tx.add(instructions.settleDexFundsIx(this.asset, market, vaultOwner, this._openOrdersAccounts[marketIndex]));
        tx.add(await instructions.closeOpenOrdersIx(this.asset, market, this._parent.publicKey, this.marginAccountAddress, this._openOrdersAccounts[marketIndex]));
        let txId = await utils.processTransaction(this._parent.provider, tx);
        this._openOrdersAccounts[marketIndex] = web3_js_1.PublicKey.default;
        return txId;
    }
    /**
     * Closes multiple user open orders account for a given set of markets.
     * Cannot pass in multiple of the same market address
     */
    async closeMultipleOpenOrdersAccount(markets) {
        let combinedIxs = [];
        let subExchange = this._subExchange;
        for (var i = 0; i < markets.length; i++) {
            let market = markets[i];
            let marketIndex = subExchange.markets.getMarketIndex(market);
            if (this._openOrdersAccounts[marketIndex].equals(web3_js_1.PublicKey.default)) {
                throw Error("User has no open orders account for this market!");
            }
            const [vaultOwner, _vaultSignerNonce] = await utils.getSerumVaultOwnerAndNonce(market, constants.DEX_PID[exchange_1.exchange.network]);
            let settleIx = instructions.settleDexFundsIx(this.asset, market, vaultOwner, this._openOrdersAccounts[marketIndex]);
            let closeIx = await instructions.closeOpenOrdersIx(this.asset, market, this._parent.publicKey, this.marginAccountAddress, this._openOrdersAccounts[marketIndex]);
            combinedIxs.push(settleIx);
            combinedIxs.push(closeIx);
        }
        let txIds = [];
        let combinedTxs = utils.splitIxsIntoTx(combinedIxs, constants.MAX_SETTLE_AND_CLOSE_PER_TX);
        for (var i = 0; i < combinedTxs.length; i++) {
            let tx = combinedTxs[i];
            let txId = await utils.processTransaction(this._parent.provider, tx);
            txIds.push(txId);
        }
        // Reset openOrdersAccount keys
        for (var i = 0; i < markets.length; i++) {
            let market = markets[i];
            let marketIndex = subExchange.markets.getMarketIndex(market);
            this._openOrdersAccounts[marketIndex] = web3_js_1.PublicKey.default;
        }
        return txIds;
    }
    /**
     * Calls force cancel on another user's orders
     * @param market  Market to cancel orders on
     * @param marginAccountToCancel Users to be force-cancelled's margin account
     */
    async forceCancelOrderByOrderId(market, marginAccountToCancel, orderId, side) {
        let marginAccount = (await exchange_1.exchange.program.account.marginAccount.fetch(marginAccountToCancel));
        let marketIndex = this._subExchange.markets.getMarketIndex(market);
        let openOrdersAccountToCancel = await utils.createOpenOrdersAddress(exchange_1.exchange.programId, market, marginAccount.authority, marginAccount.openOrdersNonce[marketIndex]);
        let tx = new web3_js_1.Transaction();
        let ix = instructions.forceCancelOrderByOrderIdIx(this.asset, marketIndex, marginAccountToCancel, openOrdersAccountToCancel, orderId, side);
        tx.add(ix);
        return await utils.processTransaction(this._parent.provider, tx);
    }
    /**
     * Calls force cancel on another user's orders
     * @param market  Market to cancel orders on
     * @param marginAccountToCancel Users to be force-cancelled's margin account
     */
    async forceCancelOrders(market, marginAccountToCancel) {
        let marginAccount = (await exchange_1.exchange.program.account.marginAccount.fetch(marginAccountToCancel));
        let marketIndex = this._subExchange.markets.getMarketIndex(market);
        let openOrdersAccountToCancel = await utils.createOpenOrdersAddress(exchange_1.exchange.programId, market, marginAccount.authority, marginAccount.openOrdersNonce[marketIndex]);
        let tx = new web3_js_1.Transaction();
        let ix = instructions.forceCancelOrdersIx(this.asset, marketIndex, marginAccountToCancel, openOrdersAccountToCancel);
        tx.add(ix);
        return await utils.processTransaction(this._parent.provider, tx);
    }
    /**
     * Calls liquidate on another user
     * @param market
     * @param liquidatedMarginAccount
     * @param size                        the quantity of the order (3 d.p)
     */
    async liquidate(market, liquidatedMarginAccount, size) {
        let tx = new web3_js_1.Transaction();
        let ix = instructions.liquidateIx(this.asset, this._parent.publicKey, this._marginAccountAddress, market, liquidatedMarginAccount, size);
        tx.add(ix);
        return await utils.processTransaction(this._parent.provider, tx);
    }
    /**
     * Instruction builder for cancelAllOrders()
     * Returns a list of instructions cancelling all of this subclient's orders
     */
    cancelAllOrdersIxs() {
        let ixs = [];
        for (var i = 0; i < this._orders.length; i++) {
            let order = this._orders[i];
            let ix = instructions.cancelOrderIx(this.asset, order.marketIndex, this._parent.publicKey, this._marginAccountAddress, this._openOrdersAccounts[order.marketIndex], order.orderId, order.side);
            ixs.push(ix);
        }
        return ixs;
    }
    /**
     * Instruction builder for cancelAllOrdersNoError()
     * Returns a list of instructions cancelling all of this subclient's orders
     */
    cancelAllOrdersNoErrorIxs() {
        let ixs = [];
        for (var i = 0; i < this._orders.length; i++) {
            let order = this._orders[i];
            let ix = instructions.cancelOrderNoErrorIx(this.asset, order.marketIndex, this._parent.publicKey, this._marginAccountAddress, this._openOrdersAccounts[order.marketIndex], order.orderId, order.side);
            ixs.push(ix);
        }
        return ixs;
    }
    /**
     * Cancels all active user orders
     */
    async cancelAllOrders() {
        // Can only fit 6 cancels worth of accounts per transaction.
        // on 4 separate markets
        // Compute is fine.
        let txs = utils.splitIxsIntoTx(this.cancelAllOrdersIxs(), constants.MAX_CANCELS_PER_TX);
        let txIds = [];
        await Promise.all(txs.map(async (tx) => {
            txIds.push(await utils.processTransaction(this._parent.provider, tx));
        }));
        return txIds;
    }
    /**
     * Cancels all active user orders, but will not crash if some cancels fail
     */
    async cancelAllOrdersNoError() {
        // Can only fit 6 cancels worth of accounts per transaction.
        // on 4 separate markets
        // Compute is fine.
        let txs = utils.splitIxsIntoTx(this.cancelAllOrdersNoErrorIxs(), constants.MAX_CANCELS_PER_TX);
        let txIds = [];
        await Promise.all(txs.map(async (tx) => {
            txIds.push(await utils.processTransaction(this._parent.provider, tx));
        }));
        return txIds;
    }
    /**
     * Moves positions to and from spread and margin account, based on the type.
     * @param movementType    - type of movement
     * @param movements       - vector of position movements
     */
    async positionMovement(movementType, movements) {
        let tx = this.getPositionMovementTx(movementType, movements);
        return await utils.processTransaction(this._parent.provider, tx);
    }
    /**
     * Moves positions to and from spread and margin account, based on the type.
     * @param movementType    - type of movement
     * @param movements       - vector of position movements
     */
    async simulatePositionMovement(movementType, movements) {
        let tx = this.getPositionMovementTx(movementType, movements);
        let response = await utils.simulateTransaction(this._parent.provider, tx);
        let events = response.events;
        let positionMovementEvent = undefined;
        for (var i = 0; i < events.length; i++) {
            if (events[i].name == "PositionMovementEvent") {
                positionMovementEvent = events[i].data;
                break;
            }
        }
        if (positionMovementEvent == undefined) {
            throw new Error("Failed to simulate position movement.");
        }
        return positionMovementEvent;
    }
    getPositionMovementTx(movementType, movements) {
        if (movements.length > constants.MAX_POSITION_MOVEMENTS) {
            throw new Error(`Max position movements exceeded. Max = ${constants.MAX_POSITION_MOVEMENTS} < ${movements.length}`);
        }
        let tx = new web3_js_1.Transaction();
        this.assertHasMarginAccount();
        let subExchange = this._subExchange;
        if (this.spreadAccount == null) {
            console.log("User has no spread account. Creating spread account...");
            tx.add(instructions.initializeSpreadAccountIx(subExchange.zetaGroupAddress, this.spreadAccountAddress, this._parent.publicKey));
        }
        tx.add(instructions.positionMovementIx(this._asset, subExchange.zetaGroupAddress, this.marginAccountAddress, this.spreadAccountAddress, this._parent.publicKey, subExchange.greeksAddress, subExchange.zetaGroup.oracle, movementType, movements));
        return tx;
    }
    /**
     * Transfers any non required balance in the spread account to margin account.
     */
    async transferExcessSpreadBalance() {
        let tx = new web3_js_1.Transaction().add(instructions.transferExcessSpreadBalanceIx(this._subExchange.zetaGroupAddress, this.marginAccountAddress, this.spreadAccountAddress, this._parent.publicKey));
        return await utils.processTransaction(this._parent.provider, tx);
    }
    getRelevantMarketIndexes() {
        let indexes = [];
        for (var i = 0; i < this._marginAccount.productLedgers.length; i++) {
            let ledger = this._marginAccount.productLedgers[i];
            if (ledger.position.size.toNumber() !== 0 ||
                ledger.orderState.openingOrders[0].toNumber() != 0 ||
                ledger.orderState.openingOrders[1].toNumber() != 0) {
                indexes.push(i);
            }
        }
        // Push perps productLedger too if relevant
        let perpLedger = this._marginAccount.perpProductLedger;
        if (perpLedger.position.size.toNumber() !== 0 ||
            perpLedger.orderState.openingOrders[0].toNumber() != 0 ||
            perpLedger.orderState.openingOrders[1].toNumber() != 0) {
            indexes.push(constants.PERP_INDEX);
        }
        return indexes;
    }
    async updateOrders() {
        let orders = [];
        await Promise.all([...this.getRelevantMarketIndexes()].map(async (i) => {
            let market = exchange_1.exchange.getMarket(this._asset, i);
            await market.updateOrderbook();
            orders.push(market.getOrdersForAccount(this._openOrdersAccounts[i]));
        }));
        this._orders = [].concat(...orders);
    }
    updateMarginPositions() {
        let positions = [];
        for (var i = 0; i < this._marginAccount.productLedgers.length; i++) {
            if (this._marginAccount.productLedgers[i].position.size.toNumber() != 0) {
                positions.push({
                    marketIndex: i,
                    market: this._subExchange.zetaGroup.products[i].market,
                    size: utils.convertNativeLotSizeToDecimal(this._marginAccount.productLedgers[i].position.size.toNumber()),
                    costOfTrades: utils.convertNativeBNToDecimal(this._marginAccount.productLedgers[i].position.costOfTrades),
                });
            }
        }
        // perps too
        if (this._marginAccount.perpProductLedger.position.size.toNumber() != 0) {
            positions.push({
                marketIndex: constants.PERP_INDEX,
                market: this._subExchange.zetaGroup.perp.market,
                size: utils.convertNativeLotSizeToDecimal(this._marginAccount.perpProductLedger.position.size.toNumber()),
                costOfTrades: utils.convertNativeBNToDecimal(this._marginAccount.perpProductLedger.position.costOfTrades),
            });
        }
        this._marginPositions = positions;
    }
    updateSpreadPositions() {
        let positions = [];
        for (var i = 0; i < this._spreadAccount.positions.length; i++) {
            if (this._spreadAccount.positions[i].size.toNumber() != 0) {
                positions.push({
                    marketIndex: i,
                    market: this._subExchange.zetaGroup.products[i].market,
                    size: utils.convertNativeLotSizeToDecimal(this._spreadAccount.positions[i].size.toNumber()),
                    costOfTrades: utils.convertNativeBNToDecimal(this._spreadAccount.positions[i].costOfTrades),
                });
            }
        }
        this._spreadPositions = positions;
    }
    async updateOpenOrdersAddresses() {
        await Promise.all(this._subExchange.zetaGroup.products.map(async (product, index) => {
            if (
            // If the nonce is not zero, we know there is an open orders account.
            this._marginAccount.openOrdersNonce[index] !== 0 &&
                // If this is equal to default, it means we haven't added the PDA yet.
                this._openOrdersAccounts[index].equals(web3_js_1.PublicKey.default)) {
                let [openOrdersPda, _openOrdersNonce] = await utils.getOpenOrders(exchange_1.exchange.programId, product.market, this._parent.publicKey);
                this._openOrdersAccounts[index] = openOrdersPda;
            }
        }));
        // perps too
        if (
        // If the nonce is not zero, we know there is an open orders account.
        this._marginAccount.openOrdersNonce[constants.PERP_INDEX] !== 0 &&
            // If this is equal to default, it means we haven't added the PDA yet.
            this._openOrdersAccounts[constants.PERP_INDEX].equals(web3_js_1.PublicKey.default)) {
            let [openOrdersPda, _openOrdersNonce] = await utils.getOpenOrders(exchange_1.exchange.programId, this._subExchange.zetaGroup.perp.market, this._parent.publicKey);
            this._openOrdersAccounts[constants.PERP_INDEX] = openOrdersPda;
        }
    }
    assertHasMarginAccount() {
        if (this.marginAccount == null) {
            throw Error("Margin account doesn't exist!");
        }
    }
    /**
     * Getter functions for raw user margin account state.
     */
    /**
     * @param index - market index.
     * @param decimal - whether to convert to readable decimal.
     */
    getMarginPositionSize(index, decimal = false) {
        let position = this.getProductLedger(index).position;
        let size = position.size.toNumber();
        return decimal ? utils.convertNativeLotSizeToDecimal(size) : size;
    }
    /**
     * @param index - market index.
     * @param decimal - whether to convert to readable decimal.
     */
    getMarginCostOfTrades(index, decimal = false) {
        let position = this.getProductLedger(index).position;
        let costOfTrades = position.costOfTrades.toNumber();
        return decimal
            ? utils.convertNativeIntegerToDecimal(costOfTrades)
            : costOfTrades;
    }
    /**
     * @param index - market index.
     * @param decimal - whether to convert to readable decimal.
     */
    getOpeningOrders(index, side, decimal = false) {
        let orderState = this.getProductLedger(index).orderState;
        let orderIndex = side == types.Side.BID ? 0 : 1;
        let size = orderState.openingOrders[orderIndex].toNumber();
        return decimal ? utils.convertNativeLotSizeToDecimal(size) : size;
    }
    /**
     * @param index - market index.
     * @param decimal - whether to convert to readable decimal.
     */
    getClosingOrders(index, decimal = false) {
        let orderState = this.getProductLedger(index).orderState;
        let size = orderState.closingOrders.toNumber();
        return decimal ? utils.convertNativeLotSizeToDecimal(size) : size;
    }
    /**
     * Getter functions for raw user spread account state.
     */
    /**
     * @param index - market index.
     * @param decimal - whether to convert to readable decimal.
     */
    getSpreadPositionSize(index, decimal = false) {
        let position = this.spreadAccount.positions[index];
        let size = position.size.toNumber();
        return decimal ? utils.convertNativeLotSizeToDecimal(size) : size;
    }
    /**
     * @param index - market index.
     * @param decimal - whether to convert to readable decimal.
     */
    getSpreadCostOfTrades(index, decimal = false) {
        let position = this.spreadAccount.positions[index];
        let costOfTrades = position.costOfTrades.toNumber();
        return decimal
            ? utils.convertNativeIntegerToDecimal(costOfTrades)
            : costOfTrades;
    }
    /**
     * Getter function to grab the correct product ledger because perps is separate
     */
    getProductLedger(index) {
        return utils.getProductLedger(this.marginAccount, index);
    }
    /**
     * Closes the subClient websocket subscription to margin account.
     */
    async close() {
        if (this._marginAccountSubscriptionId !== undefined) {
            await this._parent.provider.connection.removeAccountChangeListener(this._marginAccountSubscriptionId);
            this._marginAccountSubscriptionId = undefined;
        }
        if (this._spreadAccountSubscriptionId !== undefined) {
            await this._parent.provider.connection.removeAccountChangeListener(this._spreadAccountSubscriptionId);
            this._spreadAccountSubscriptionId = undefined;
        }
    }
}
exports.SubClient = SubClient;
