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
exports.Client = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
const utils = __importStar(require("./utils"));
const exchange_1 = require("./exchange");
const web3_js_1 = require("@solana/web3.js");
const constants = __importStar(require("./constants"));
const program_instructions_1 = require("./program-instructions");
const events_1 = require("./events");
const types = __importStar(require("./types"));
const subclient_1 = require("./subclient");
const instructions = __importStar(require("./program-instructions"));
class Client {
    /**
     * Anchor provider instance.
     */
    get provider() {
        return this._provider;
    }
    get connection() {
        return this._provider.connection;
    }
    /**
     * Stores the user referral account data.
     */
    get referralAccount() {
        return this._referralAccount;
    }
    /**
     * Stores the user referrer account data.
     */
    get referrerAccount() {
        return this._referrerAccount;
    }
    /**
     * Stores the user referrer account alias.
     */
    get referrerAlias() {
        return this._referrerAlias;
    }
    /**
     * Client margin account address.
     */
    get publicKey() {
        return this.provider.wallet.publicKey;
    }
    /**
     * Client usdc account address.
     */
    get usdcAccountAddress() {
        return this._usdcAccountAddress;
    }
    /**
     * whitelist deposit account.
     */
    get whitelistDepositAddress() {
        return this._whitelistDepositAddress;
    }
    /**
     * whitelist trading fees account.
     */
    get whitelistTradingFeesAddress() {
        return this._whitelistTradingFeesAddress;
    }
    get subClients() {
        return this._subClients;
    }
    constructor(connection, wallet, opts) {
        this._provider = new anchor.AnchorProvider(connection, wallet, opts);
        this._subClients = new Map();
        this._marginAccountToAsset = new Map();
        this._referralAccount = null;
        this._referrerAccount = null;
        this._referrerAlias = null;
    }
    static async load(connection, wallet, opts = utils.defaultCommitment(), callback = undefined, throttle = false) {
        let client = new Client(connection, wallet, opts);
        client._usdcAccountAddress = await utils.getAssociatedTokenAddress(exchange_1.exchange.usdcMintAddress, wallet.publicKey);
        client._whitelistDepositAddress = undefined;
        try {
            let [whitelistDepositAddress, _whitelistTradingFeesNonce] = await utils.getUserWhitelistDepositAccount(exchange_1.exchange.programId, wallet.publicKey);
            await exchange_1.exchange.program.account.whitelistDepositAccount.fetch(whitelistDepositAddress);
            console.log("User is whitelisted for unlimited deposits into zeta.");
            client._whitelistDepositAddress = whitelistDepositAddress;
        }
        catch (e) { }
        client._whitelistTradingFeesAddress = undefined;
        try {
            let [whitelistTradingFeesAddress, _whitelistTradingFeesNonce] = await utils.getUserWhitelistTradingFeesAccount(exchange_1.exchange.programId, wallet.publicKey);
            await exchange_1.exchange.program.account.whitelistTradingFeesAccount.fetch(whitelistTradingFeesAddress);
            console.log("User is whitelisted for trading fees.");
            client._whitelistTradingFeesAddress = whitelistTradingFeesAddress;
        }
        catch (e) { }
        await Promise.all(exchange_1.exchange.assets.map(async (asset) => {
            const subClient = await subclient_1.SubClient.load(asset, client, connection, wallet, callback, throttle);
            client.addSubClient(asset, subClient);
            client._marginAccountToAsset.set(subClient.marginAccountAddress.toString(), asset);
        }));
        client.setPolling(constants.DEFAULT_CLIENT_TIMER_INTERVAL);
        client._referralAccountAddress = undefined;
        client._referrerAlias = undefined;
        if (callback !== undefined) {
            client._tradeEventV2Listener = exchange_1.exchange.program.addEventListener("TradeEventV2", (event, _slot) => {
                if (client._marginAccountToAsset.has(event.marginAccount.toString())) {
                    callback(client._marginAccountToAsset.get(event.marginAccount.toString()), events_1.EventType.TRADEV2, event);
                }
            });
            client._orderCompleteEventListener = exchange_1.exchange.program.addEventListener("OrderCompleteEvent", (event, _slot) => {
                if (client._marginAccountToAsset.has(event.marginAccount.toString())) {
                    callback(client._marginAccountToAsset.get(event.marginAccount.toString()), events_1.EventType.ORDERCOMPLETE, event);
                }
            });
        }
        await Promise.all(client.getAllSubClients().map(async (subclient) => {
            await subclient.updateState();
        }));
        return client;
    }
    addSubClient(asset, subClient) {
        this._subClients.set(asset, subClient);
    }
    getSubClient(asset) {
        return this._subClients.get(asset);
    }
    getAllSubClients() {
        return [...this._subClients.values()];
        // This is referring itself by another referrer.
    }
    async setReferralData() {
        try {
            let [referrerAccount] = await utils.getReferrerAccountAddress(exchange_1.exchange.programId, this.publicKey);
            this._referrerAccount =
                (await exchange_1.exchange.program.account.referrerAccount.fetch(referrerAccount));
            console.log(`User is a referrer. ${this.publicKey}.`);
            let referrerAlias = await utils.fetchReferrerAliasAccount(this.publicKey);
            if (referrerAlias !== null) {
                let existingAlias = Buffer.from(referrerAlias.alias).toString().trim();
                this._referrerAlias = existingAlias;
            }
        }
        catch (e) { }
        try {
            let [referralAccountAddress, _nonce] = await utils.getReferralAccountAddress(exchange_1.exchange.programId, this.publicKey);
            this._referralAccountAddress = referralAccountAddress;
            this._referralAccount =
                (await exchange_1.exchange.program.account.referralAccount.fetch(referralAccountAddress));
            console.log(`User has been referred by ${this._referralAccount.referrer.toString()}.`);
        }
        catch (e) { }
    }
    async referUser(referrer) {
        let [referrerAccount] = await utils.getReferrerAccountAddress(exchange_1.exchange.programId, referrer);
        try {
            await exchange_1.exchange.program.account.referrerAccount.fetch(referrerAccount);
        }
        catch (e) {
            throw Error(`Invalid referrer. ${referrer.toString()}`);
        }
        let tx = new web3_js_1.Transaction().add(await (0, program_instructions_1.referUserIx)(this.provider.wallet.publicKey, referrer));
        let txId = await utils.processTransaction(this.provider, tx);
        [this._referralAccountAddress] = await utils.getReferralAccountAddress(exchange_1.exchange.programId, this.publicKey);
        this._referralAccount =
            (await exchange_1.exchange.program.account.referralAccount.fetch(this._referralAccountAddress));
        return txId;
    }
    /**
     * @param timerInterval   desired interval for subClient polling.
     */
    setPolling(timerInterval) {
        if (this._pollIntervalId !== undefined) {
            console.log(`Resetting existing timer to ${timerInterval} seconds.`);
            clearInterval(this._pollIntervalId);
        }
        this._pollIntervalId = setInterval(async () => {
            await Promise.all(this.getAllSubClients().map(async (subClient) => {
                subClient.pollUpdate();
            }));
        }, timerInterval * 1000);
    }
    marketIdentifierToPublicKey(asset, market) {
        // marketIndex is either number or PublicKey
        let marketPubkey;
        if (typeof market == "number") {
            marketPubkey = exchange_1.exchange.getMarket(asset, market).address;
        }
        else {
            marketPubkey = market;
        }
        return marketPubkey;
    }
    marketIdentifierToIndex(asset, market) {
        let index;
        if (typeof market == "number") {
            index = market;
        }
        else {
            index = exchange_1.exchange.getZetaGroupMarkets(asset).getMarketIndex(market);
        }
        return index;
    }
    async placeOrder(asset, market, price, size, side, options = types.defaultOrderOptions()) {
        let marketPubkey = this.marketIdentifierToPublicKey(asset, market);
        if (marketPubkey == exchange_1.exchange.getPerpMarket(asset).address) {
            return await this.getSubClient(asset).placePerpOrder(price, size, side, options);
        }
        else {
            return await this.getSubClient(asset).placeOrder(marketPubkey, price, size, side, options);
        }
    }
    async placePerpOrder(asset, price, size, side, options = types.defaultOrderOptions()) {
        return await this.getSubClient(asset).placePerpOrder(price, size, side, options);
    }
    createPlacePerpOrderInstruction(asset, price, size, side, options = types.defaultOrderOptions()) {
        return this.getSubClient(asset).createPlacePerpOrderInstruction(price, size, side, options);
    }
    createPlaceOrderInstruction(asset, marketIndex, price, size, side, options = types.defaultOrderOptions()) {
        return this.getSubClient(asset).createPlaceOrderInstruction(marketIndex, price, size, side, options);
    }
    createCancelOrderNoErrorInstruction(asset, market, orderId, side) {
        return this.getSubClient(asset).createCancelOrderNoErrorInstruction(this.marketIdentifierToIndex(asset, market), orderId, side);
    }
    createCancelAllMarketOrdersInstruction(asset, market) {
        return this.getSubClient(asset).createCancelAllMarketOrdersInstruction(this.marketIdentifierToIndex(asset, market));
    }
    async migrateFunds(amount, withdrawAsset, depositAsset) {
        await this.usdcAccountCheck();
        let tx = new web3_js_1.Transaction();
        let withdrawSubClient = this.getSubClient(withdrawAsset);
        let depositSubClient = this.getSubClient(depositAsset);
        // Create withdraw ix
        tx.add(instructions.withdrawIx(withdrawAsset, amount, withdrawSubClient.marginAccountAddress, this.usdcAccountAddress, this.publicKey));
        // Create deposit tx
        if (depositSubClient.marginAccount === null) {
            console.log("User has no margin account. Creating margin account...");
            tx.add(instructions.initializeMarginAccountIx(depositSubClient.subExchange.zetaGroupAddress, depositSubClient.marginAccountAddress, this.publicKey));
        }
        tx.add(await instructions.depositIx(depositAsset, amount, depositSubClient.marginAccountAddress, this.usdcAccountAddress, this.publicKey, this.whitelistDepositAddress));
        return await utils.processTransaction(this._provider, tx);
    }
    async deposit(asset, amount) {
        await this.usdcAccountCheck();
        return await this.getSubClient(asset).deposit(amount);
    }
    async usdcAccountCheck() {
        try {
            let tokenAccountInfo = await utils.getTokenAccountInfo(this._provider.connection, this._usdcAccountAddress);
            console.log(`Found user USDC associated token account ${this._usdcAccountAddress.toString()}. Balance = $${utils.convertNativeBNToDecimal(tokenAccountInfo.amount)}.`);
        }
        catch (e) {
            throw Error("User has no USDC associated token account. Please create one and deposit USDC.");
        }
    }
    /**
     * Polls the margin account for the latest state.
     * @param asset The underlying asset (eg SOL, BTC)
     * @param fetch Whether to fetch and update _marginAccount and _spreadAccount in the subClient
     * @param force Whether to forcefully update even though we may be already updating state currently
     */
    async updateState(asset = undefined, fetch = true, force = false) {
        if (asset != undefined) {
            await this.getSubClient(asset).updateState(fetch, force);
        }
        else {
            await Promise.all(this.getAllSubClients().map(async (subClient) => {
                await subClient.updateState(fetch, force);
            }));
        }
    }
    async cancelAllOrders(asset = undefined) {
        if (asset != undefined) {
            return await this.getSubClient(asset).cancelAllOrders();
        }
        else {
            for (var subClient of this.getAllSubClients()) {
                await subClient.cancelAllOrders();
            }
        }
    }
    async cancelAllOrdersNoError(asset = undefined) {
        if (asset != undefined) {
            return await this.getSubClient(asset).cancelAllOrdersNoError();
        }
        else {
            let allTxIds = [];
            await Promise.all(this.getAllSubClients().map(async (subClient) => {
                let txIds = await subClient.cancelAllOrdersNoError();
                allTxIds = allTxIds.concat(txIds);
            }));
            return allTxIds;
        }
    }
    getMarginAccountState(asset) {
        return exchange_1.exchange.riskCalculator.getMarginAccountState(this.getSubClient(asset).marginAccount);
    }
    async closeMarginAccount(asset) {
        return await this.getSubClient(asset).closeMarginAccount();
    }
    async closeSpreadAccount(asset) {
        return await this.getSubClient(asset).closeSpreadAccount();
    }
    async withdraw(asset, amount) {
        return await this.getSubClient(asset).withdraw(amount);
    }
    async withdrawAndCloseMarginAccount(asset) {
        return await this.getSubClient(asset).withdrawAndCloseMarginAccount();
    }
    async placeOrderAndLockPosition(asset, market, price, size, side, tag = constants.DEFAULT_ORDER_TAG) {
        return await this.getSubClient(asset).placeOrderAndLockPosition(this.marketIdentifierToPublicKey(asset, market), price, size, side, tag);
    }
    async cancelAllMarketOrders(asset, market) {
        let tx = new web3_js_1.Transaction();
        let index = exchange_1.exchange.getZetaGroupMarkets(asset).getMarketIndex(this.marketIdentifierToPublicKey(asset, market));
        let ix = instructions.cancelAllMarketOrdersIx(asset, index, this.publicKey, this.getSubClient(asset).marginAccountAddress, this.getSubClient(asset).openOrdersAccounts[index]);
        tx.add(ix);
        return await utils.processTransaction(this.provider, tx);
    }
    async cancelOrder(asset, market, orderId, side) {
        let marketPubkey = this.marketIdentifierToPublicKey(asset, market);
        return await this.getSubClient(asset).cancelOrder(marketPubkey, orderId, side);
    }
    async cancelOrderByClientOrderId(asset, market, clientOrderId) {
        let marketPubkey = this.marketIdentifierToPublicKey(asset, market);
        return await this.getSubClient(asset).cancelOrderByClientOrderId(marketPubkey, clientOrderId);
    }
    async cancelAndPlaceOrder(asset, market, orderId, cancelSide, newOrderPrice, newOrderSize, newOrderSide, newOptions = types.defaultOrderOptions()) {
        return await this.getSubClient(asset).cancelAndPlaceOrder(this.marketIdentifierToPublicKey(asset, market), orderId, cancelSide, newOrderPrice, newOrderSize, newOrderSide, newOptions);
    }
    async cancelAndPlaceOrderByClientOrderId(asset, market, cancelClientOrderId, newOrderPrice, newOrderSize, newOrderSide, newOptions = types.defaultOrderOptions()) {
        return await this.getSubClient(asset).cancelAndPlaceOrderByClientOrderId(this.marketIdentifierToPublicKey(asset, market), cancelClientOrderId, newOrderPrice, newOrderSize, newOrderSide, newOptions);
    }
    async replaceByClientOrderId(asset, market, cancelClientOrderId, newOrderPrice, newOrderSize, newOrderSide, newOptions = types.defaultOrderOptions()) {
        return await this.getSubClient(asset).replaceByClientOrderId(this.marketIdentifierToPublicKey(asset, market), cancelClientOrderId, newOrderPrice, newOrderSize, newOrderSide, newOptions);
    }
    async initializeOpenOrdersAccount(asset, market) {
        return await this.getSubClient(asset).initializeOpenOrdersAccount(market);
    }
    async closeOpenOrdersAccount(asset, market) {
        return await this.getSubClient(asset).closeOpenOrdersAccount(market);
    }
    async closeMultipleOpenOrdersAccount(asset, markets) {
        return await this.getSubClient(asset).closeMultipleOpenOrdersAccount(markets);
    }
    async cancelMultipleOrders(cancelArguments) {
        let ixs = [];
        for (var i = 0; i < cancelArguments.length; i++) {
            let asset = cancelArguments[i].asset;
            let marketIndex = exchange_1.exchange.getZetaGroupMarkets(asset).getMarketIndex(cancelArguments[i].market);
            let ix = instructions.cancelOrderIx(asset, marketIndex, this.publicKey, this.getSubClient(asset).marginAccountAddress, this.getSubClient(asset).openOrdersAccounts[marketIndex], cancelArguments[i].orderId, cancelArguments[i].cancelSide);
            ixs.push(ix);
        }
        let txs = utils.splitIxsIntoTx(ixs, constants.MAX_CANCELS_PER_TX);
        let txIds = [];
        await Promise.all(txs.map(async (tx) => {
            txIds.push(await utils.processTransaction(this.provider, tx));
        }));
        return txIds;
    }
    async cancelMultipleOrdersNoError(asset, cancelArguments) {
        let ixs = [];
        for (var i = 0; i < cancelArguments.length; i++) {
            let asset = cancelArguments[i].asset;
            let marketIndex = exchange_1.exchange.getZetaGroupMarkets(asset).getMarketIndex(cancelArguments[i].market);
            let ix = instructions.cancelOrderNoErrorIx(asset, marketIndex, this.publicKey, this.getSubClient(asset).marginAccountAddress, this.getSubClient(asset).openOrdersAccounts[marketIndex], cancelArguments[i].orderId, cancelArguments[i].cancelSide);
            ixs.push(ix);
        }
        let txs = utils.splitIxsIntoTx(ixs, constants.MAX_CANCELS_PER_TX);
        let txIds = [];
        await Promise.all(txs.map(async (tx) => {
            txIds.push(await utils.processTransaction(this.provider, tx));
        }));
        return txIds;
    }
    async forceCancelOrderByOrderId(asset, market, marginAccountToCancel, orderId, side) {
        return await this.getSubClient(asset).forceCancelOrderByOrderId(this.marketIdentifierToPublicKey(asset, market), marginAccountToCancel, orderId, side);
    }
    async forceCancelOrders(asset, market, marginAccountToCancel) {
        return await this.getSubClient(asset).forceCancelOrders(this.marketIdentifierToPublicKey(asset, market), marginAccountToCancel);
    }
    async liquidate(asset, market, liquidatedMarginAccount, size) {
        return await this.getSubClient(asset).liquidate(this.marketIdentifierToPublicKey(asset, market), liquidatedMarginAccount, size);
    }
    async positionMovement(asset, movementType, movements) {
        return await this.getSubClient(asset).positionMovement(movementType, movements);
    }
    async simulatePositionMovement(asset, movementType, movements) {
        return await this.getSubClient(asset).simulatePositionMovement(movementType, movements);
    }
    async transferExcessSpreadBalance(asset) {
        return await this.getSubClient(asset).transferExcessSpreadBalance();
    }
    getMarginPositionSize(asset, index, decimal = false) {
        return this.getSubClient(asset).getMarginPositionSize(index, decimal);
    }
    getMarginCostOfTrades(asset, index, decimal = false) {
        return this.getSubClient(asset).getMarginCostOfTrades(index, decimal);
    }
    getMarginPositions(asset) {
        return this.getSubClient(asset).marginPositions;
    }
    getSpreadPositions(asset) {
        return this.getSubClient(asset).spreadPositions;
    }
    getOrders(asset) {
        return this.getSubClient(asset).orders;
    }
    getOpeningOrders(asset, index, side, decimal = false) {
        return this.getSubClient(asset).getOpeningOrders(index, side, decimal);
    }
    getClosingOrders(asset, index, decimal = false) {
        return this.getSubClient(asset).getClosingOrders(index, decimal);
    }
    getOpenOrdersAccounts(asset) {
        return this.getSubClient(asset).openOrdersAccounts;
    }
    getSpreadPositionSize(asset, index, decimal = false) {
        return this.getSubClient(asset).getSpreadPositionSize(index, decimal);
    }
    getSpreadCostOfTrades(asset, index, decimal = false) {
        return this.getSubClient(asset).getSpreadCostOfTrades(index, decimal);
    }
    getSpreadAccount(asset) {
        return this.getSubClient(asset).spreadAccount;
    }
    getSpreadAccountAddress(asset) {
        return this.getSubClient(asset).spreadAccountAddress;
    }
    getMarginAccount(asset) {
        return this.getSubClient(asset).marginAccount;
    }
    getMarginAccountAddress(asset) {
        return this.getSubClient(asset).marginAccountAddress;
    }
    async initializeReferrerAccount() {
        let tx = new web3_js_1.Transaction().add(await instructions.initializeReferrerAccountIx(this.publicKey));
        await utils.processTransaction(this._provider, tx);
    }
    async initializeReferrerAlias(alias) {
        if (alias.length > 15) {
            throw new Error("Alias cannot be over 15 chars!");
        }
        let [referrerAccountAddress] = await utils.getReferrerAccountAddress(exchange_1.exchange.programId, this.publicKey);
        try {
            await exchange_1.exchange.program.account.referrerAccount.fetch(referrerAccountAddress);
        }
        catch (e) {
            throw Error(`User is not a referrer, cannot create alias.`);
        }
        let referrerAlias = await utils.fetchReferrerAliasAccount(this.publicKey);
        if (referrerAlias !== null) {
            let existingAlias = Buffer.from(referrerAlias.alias).toString().trim();
            throw Error(`Referrer already has alias. ${existingAlias}`);
        }
        let tx = new web3_js_1.Transaction().add(await instructions.initializeReferrerAliasIx(this.publicKey, alias));
        let txid = await utils.processTransaction(this.provider, tx);
        this._referrerAlias = alias;
        return txid;
    }
    async claimReferrerRewards() {
        let [referrerAccountAddress] = await utils.getReferrerAccountAddress(exchange_1.exchange.programId, this.publicKey);
        let tx = new web3_js_1.Transaction().add(await instructions.claimReferralsRewardsIx(referrerAccountAddress, this._usdcAccountAddress, this.publicKey));
        return await utils.processTransaction(this._provider, tx);
    }
    async claimReferralRewards() {
        let [referralAccountAddress] = await utils.getReferralAccountAddress(exchange_1.exchange.programId, this.publicKey);
        let tx = new web3_js_1.Transaction().add(await instructions.claimReferralsRewardsIx(referralAccountAddress, this._usdcAccountAddress, this.publicKey));
        return await utils.processTransaction(this._provider, tx);
    }
    getProductLedger(asset, marketIndex) {
        return this.getSubClient(asset).getProductLedger(marketIndex);
    }
    async close() {
        await Promise.all(this.getAllSubClients().map(async (subClient) => {
            subClient.close();
        }));
        if (this._pollIntervalId !== undefined) {
            clearInterval(this._pollIntervalId);
            this._pollIntervalId = undefined;
        }
        if (this._tradeEventV2Listener !== undefined) {
            await exchange_1.exchange.program.removeEventListener(this._tradeEventV2Listener);
            this._tradeEventV2Listener = undefined;
        }
        if (this._orderCompleteEventListener !== undefined) {
            await exchange_1.exchange.program.removeEventListener(this._orderCompleteEventListener);
            this._orderCompleteEventListener = undefined;
        }
    }
}
exports.Client = Client;
