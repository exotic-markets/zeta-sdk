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
exports.SubExchange = void 0;
const web3_js_1 = require("@solana/web3.js");
const utils = __importStar(require("./utils"));
const constants = __importStar(require("./constants"));
const market_1 = require("./market");
const events_1 = require("./events");
const network_1 = require("./network");
const assets_1 = require("./assets");
const instructions = __importStar(require("./program-instructions"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const exchange_1 = require("./exchange");
class SubExchange {
    constructor() {
        this._isSetup = false;
        this._isInitialized = false;
        this._eventEmitters = [];
    }
    /**
     * Whether the object has been set up (in .initialize()).
     */
    get isSetup() {
        return this._isSetup;
    }
    /**
     * Whether the object has been initialized (in .load()).
     */
    get isInitialized() {
        return this._isInitialized;
    }
    /**
     * Account storing zeta group account info.
     */
    get zetaGroup() {
        return this._zetaGroup;
    }
    /**
     * The asset loaded to the this.
     */
    get asset() {
        return this._asset;
    }
    // Program global addresses that will remain constant.
    /**
     * Address of zeta group account.
     */
    get zetaGroupAddress() {
        return this._zetaGroupAddress;
    }
    /**
     * Public key for a given zeta group vault.
     */
    get vaultAddress() {
        return this._vaultAddress;
    }
    /**
     * Public key for insurance vault.
     */
    get insuranceVaultAddress() {
        return this._insuranceVaultAddress;
    }
    /**
     * Public key for socialized loss account.
     */
    get socializedLossAccountAddress() {
        return this._socializedLossAccountAddress;
    }
    /**
     * Returns the markets object.
     */
    get markets() {
        return this._markets;
    }
    get numMarkets() {
        return this.getMarkets().length;
    }
    /**
     * Account storing all the greeks.
     */
    get greeks() {
        return this._greeks;
    }
    get greeksAddress() {
        return this._greeksAddress;
    }
    /**
     * Account storing the queue which synchronises taker/maker perp funding payments.
     * You shouldn't need to read from this, it's mainly for our integration tests
     */
    get perpSyncQueue() {
        return this._perpSyncQueue;
    }
    get perpSyncQueueAddress() {
        return this._perpSyncQueueAddress;
    }
    get marginParams() {
        return this._marginParams;
    }
    get frontExpirySeries() {
        return this._zetaGroup.expirySeries[this._zetaGroup.frontExpiryIndex];
    }
    get halted() {
        return this._zetaGroup.haltState.halted;
    }
    async initialize(asset) {
        if (this.isSetup) {
            throw "SubExchange already initialized.";
        }
        this._asset = asset;
        // Load zeta group.
        let underlyingMint = constants.MINTS[asset];
        const [zetaGroup, _zetaGroupNonce] = await utils.getZetaGroup(exchange_1.exchange.programId, underlyingMint);
        this._zetaGroupAddress = zetaGroup;
        let [greeks, _greeksNonce] = await utils.getGreeks(exchange_1.exchange.programId, this.zetaGroupAddress);
        this._greeksAddress = greeks;
        let [perpSyncQueue, _perpSyncQueueNonce] = await utils.getPerpSyncQueue(exchange_1.exchange.programId, this.zetaGroupAddress);
        this._perpSyncQueueAddress = perpSyncQueue;
        const [vaultAddress, _vaultNonce] = await utils.getVault(exchange_1.exchange.programId, this._zetaGroupAddress);
        const [insuranceVaultAddress, _insuranceNonce] = await utils.getZetaInsuranceVault(exchange_1.exchange.programId, this.zetaGroupAddress);
        const [socializedLossAccount, _socializedLossAccountNonce] = await utils.getSocializedLossAccount(exchange_1.exchange.programId, this._zetaGroupAddress);
        this._vaultAddress = vaultAddress;
        this._insuranceVaultAddress = insuranceVaultAddress;
        this._socializedLossAccountAddress = socializedLossAccount;
        this._isSetup = true;
    }
    /**
     * Loads a fresh instance of the subExchange object using on chain state.
     * @param throttle    Whether to sleep on market loading for rate limit reasons.
     */
    async load(asset, programId, network, opts, throttleMs = 0, callback) {
        console.info(`Loading ${(0, assets_1.assetToName)(asset)} subExchange.`);
        if (this.isInitialized) {
            throw "SubExchange already loaded.";
        }
        await this.updateZetaGroup();
        this._markets = await market_1.ZetaGroupMarkets.load(this.asset, opts, 0);
        if (this.zetaGroup.products[this.zetaGroup.products.length - 1].market.equals(web3_js_1.PublicKey.default) ||
            this.zetaGroup.perp.market.equals(web3_js_1.PublicKey.default)) {
            throw "Zeta group markets are uninitialized!";
        }
        this._markets = await market_1.ZetaGroupMarkets.load(asset, opts, throttleMs);
        this._greeks = (await exchange_1.exchange.program.account.greeks.fetch(this.greeksAddress));
        this._perpSyncQueue = (await exchange_1.exchange.program.account.perpSyncQueue.fetch(this.perpSyncQueueAddress));
        exchange_1.exchange.riskCalculator.updateMarginRequirements(asset);
        // Set callbacks.
        this.subscribeZetaGroup(asset, callback);
        this.subscribeGreeks(asset, callback);
        this.subscribePerpSyncQueue();
        this._isInitialized = true;
        console.log(`${(0, assets_1.assetToName)(this.asset)} SubExchange loaded`);
    }
    /**
     * Refreshes serum markets cache
     * @param asset    which asset to load
     */
    async updateSerumMarkets(asset, opts) {
        console.info(`Refreshing Serum markets for ${(0, assets_1.assetToName)(asset)} SubExchange.`);
        this._markets = await market_1.ZetaGroupMarkets.load(this.asset, opts, 0);
        console.log(`${(0, assets_1.assetToName)(this.asset)} SubExchange Serum markets refreshed`);
    }
    /**
     * Initializes the market nodes for a zeta group.
     */
    async initializeMarketNodes(zetaGroup) {
        let indexes = [...Array(constants.ACTIVE_MARKETS - 1).keys()];
        await Promise.all(indexes.map(async (index) => {
            let tx = new web3_js_1.Transaction().add(await instructions.initializeMarketNodeIx(this.asset, index));
            await utils.processTransaction(exchange_1.exchange.provider, tx);
        }));
    }
    /**
     * Update the pricing parameters for a zeta group.
     */
    async updatePricingParameters(args) {
        let tx = new web3_js_1.Transaction().add(instructions.updatePricingParametersIx(this.asset, args, exchange_1.exchange.provider.wallet.publicKey));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
        await this.updateZetaGroup();
    }
    /**
     * Update the margin parameters for a zeta group.
     */
    async updateMarginParameters(args) {
        let tx = new web3_js_1.Transaction().add(instructions.updateMarginParametersIx(this.asset, args, exchange_1.exchange.provider.wallet.publicKey));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
        await this.updateZetaGroup();
    }
    /**
     * Update the perp parameters for a zeta group.
     */
    async updatePerpParameters(args) {
        let tx = new web3_js_1.Transaction().add(instructions.updatePerpParametersIx(this.asset, args, exchange_1.exchange.provider.wallet.publicKey));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
        await this.updateZetaGroup();
    }
    /**
     * Update the margin parameters for a zeta group.
     */
    async updateZetaGroupExpiryParameters(args) {
        let tx = new web3_js_1.Transaction().add(instructions.updateZetaGroupExpiryParameters(this.asset, args, exchange_1.exchange.provider.wallet.publicKey));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
        await this.updateZetaGroup();
    }
    /**
     * Update the volatility nodes for a surface.
     */
    async updateVolatilityNodes(nodes) {
        if (nodes.length != constants.VOLATILITY_POINTS) {
            throw Error(`Invalid number of nodes. Expected ${constants.VOLATILITY_POINTS}.`);
        }
        let tx = new web3_js_1.Transaction().add(instructions.updateVolatilityNodesIx(this.asset, nodes, exchange_1.exchange.provider.wallet.publicKey));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
    }
    /**
     * Initializes the zeta markets for a zeta group.
     */
    async initializeZetaMarkets() {
        // Initialize market indexes.
        let [marketIndexes, marketIndexesNonce] = await utils.getMarketIndexes(exchange_1.exchange.programId, this._zetaGroupAddress);
        console.log("Initializing market indexes.");
        let tx = new web3_js_1.Transaction().add(instructions.initializeMarketIndexesIx(this.asset, marketIndexes, marketIndexesNonce));
        try {
            await utils.processTransaction(exchange_1.exchange.provider, tx, [], utils.defaultCommitment(), exchange_1.exchange.useLedger);
        }
        catch (e) {
            console.error(`Initialize market indexes failed: ${e}`);
        }
        // We initialize 50 indexes at a time in the program.
        let tx2 = new web3_js_1.Transaction().add(instructions.addMarketIndexesIx(this.asset, marketIndexes));
        for (var i = 0; i < constants.TOTAL_MARKETS; i += constants.MARKET_INDEX_LIMIT) {
            try {
                await utils.processTransaction(exchange_1.exchange.provider, tx2, [], utils.defaultCommitment(), exchange_1.exchange.useLedger);
            }
            catch (e) {
                console.error(`Add market indexes failed: ${e}`);
            }
        }
        let marketIndexesAccount = (await exchange_1.exchange.program.account.marketIndexes.fetch(marketIndexes));
        if (!marketIndexesAccount.initialized) {
            throw Error("Market indexes are not initialized!");
        }
        let indexes = [...Array(this.zetaGroup.products.length).keys()];
        if (!exchange_1.exchange.useLedger) {
            await Promise.all(indexes.map(async (i) => {
                await this.initializeZetaMarket(i, marketIndexes, marketIndexesAccount);
            }));
        }
        else {
            for (var i = 0; i < this.zetaGroup.products.length; i++) {
                await this.initializeZetaMarket(i, marketIndexes, marketIndexesAccount);
            }
        }
        await this.initializeZetaMarket(constants.PERP_INDEX, marketIndexes, marketIndexesAccount);
    }
    async initializeZetaMarket(i, marketIndexes, marketIndexesAccount) {
        console.log(`Initializing zeta market ${i}`);
        const homedir = os.homedir();
        let dir = `${homedir}/keys/${(0, assets_1.assetToName)(this.asset)}`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const requestQueue = utils.getOrCreateKeypair(`${dir}/rq-${i}.json`);
        const eventQueue = utils.getOrCreateKeypair(`${dir}/eq-${i}.json`);
        const bids = utils.getOrCreateKeypair(`${dir}/bids-${i}.json`);
        const asks = utils.getOrCreateKeypair(`${dir}/asks-${i}.json`);
        let [tx, tx2] = await instructions.initializeZetaMarketTxs(this.asset, i, marketIndexesAccount.indexes[i], requestQueue.publicKey, eventQueue.publicKey, bids.publicKey, asks.publicKey, marketIndexes);
        let marketInitialized = false;
        let accountsInitialized = false;
        if (exchange_1.exchange.network != network_1.Network.LOCALNET) {
            // Validate that the market hasn't already been initialized
            // So no sol is wasted on unnecessary accounts.
            const [market, _marketNonce] = await utils.getMarketUninitialized(exchange_1.exchange.programId, this._zetaGroupAddress, marketIndexesAccount.indexes[i]);
            let info = await exchange_1.exchange.provider.connection.getAccountInfo(market);
            if (info !== null) {
                marketInitialized = true;
            }
            info = await exchange_1.exchange.provider.connection.getAccountInfo(bids.publicKey);
            if (info !== null) {
                accountsInitialized = true;
            }
        }
        if (accountsInitialized) {
            console.log(`Market ${i} serum accounts already initialized...`);
        }
        else {
            try {
                await utils.processTransaction(exchange_1.exchange.provider, tx, [requestQueue, eventQueue, bids, asks], utils.commitmentConfig(exchange_1.exchange.connection.commitment), exchange_1.exchange.useLedger);
            }
            catch (e) {
                console.error(`Initialize zeta market serum accounts ${i} failed: ${e}`);
            }
        }
        if (marketInitialized) {
            console.log(`Market ${i} already initialized. Skipping...`);
        }
        else {
            try {
                await utils.processTransaction(exchange_1.exchange.provider, tx2, [], utils.commitmentConfig(exchange_1.exchange.connection.commitment), exchange_1.exchange.useLedger);
            }
            catch (e) {
                console.error(`Initialize zeta market ${i} failed: ${e}`);
            }
        }
    }
    async initializeZetaMarketsTIFEpochCycle(cycleLengthSecs) {
        if (cycleLengthSecs > 65535) {
            throw Error("Can't initialize TIF epoch cycle > u16::MAX");
        }
        let ixs = [];
        for (let i = 0; i < constants.ACTIVE_MARKETS; i++) {
            if (i == constants.ACTIVE_MARKETS - 1) {
                ixs.push(instructions.initializeZetaMarketTIFEpochCyclesIx(this.asset, constants.PERP_INDEX, cycleLengthSecs));
                continue;
            }
            ixs.push(instructions.initializeZetaMarketTIFEpochCyclesIx(this.asset, i, cycleLengthSecs));
        }
        let txs = utils.splitIxsIntoTx(ixs, constants.MAX_INITIALIZE_MARKET_TIF_EPOCH_CYCLE_IXS_PER_TX);
        await Promise.all(txs.map(async (tx) => {
            await utils.processTransaction(exchange_1.exchange.provider, tx, [], utils.commitmentConfig(exchange_1.exchange.connection.commitment), exchange_1.exchange.useLedger);
        }));
    }
    /**
     * Will throw if it is not strike initialization time.
     */
    async initializeMarketStrikes() {
        let tx = new web3_js_1.Transaction().add(instructions.initializeMarketStrikesIx(this.asset));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
    }
    async initializePerpSyncQueue() {
        let tx = new web3_js_1.Transaction().add(await instructions.initializePerpSyncQueueIx(this.asset));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
    }
    /**
     * Polls the on chain account to update zeta group.
     */
    async updateZetaGroup() {
        this._zetaGroup = (await exchange_1.exchange.program.account.zetaGroup.fetch(this.zetaGroupAddress));
        this.updateMarginParams();
    }
    /**
     * Update pricing for an expiry index.
     */
    async updatePricing(expiryIndex) {
        let tx = new web3_js_1.Transaction().add(instructions.updatePricingIx(this.asset, expiryIndex));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
    }
    /**
     * Retreat volatility surface and interest rates for an expiry index.
     */
    async retreatMarketNodes(expiryIndex) {
        let tx = new web3_js_1.Transaction().add(instructions.retreatMarketNodesIx(this.asset, expiryIndex));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
    }
    assertInitialized() {
        if (!this.isInitialized) {
            throw "SubExchange uninitialized";
        }
    }
    subscribeZetaGroup(asset, callback) {
        let eventEmitter = exchange_1.exchange.program.account.zetaGroup.subscribe(this._zetaGroupAddress, exchange_1.exchange.provider.connection.commitment);
        eventEmitter.on("change", async (zetaGroup) => {
            let expiry = this._zetaGroup !== undefined &&
                this._zetaGroup.frontExpiryIndex !== zetaGroup.frontExpiryIndex;
            this._zetaGroup = zetaGroup;
            if (this._markets !== undefined) {
                this._markets.updateExpirySeries();
            }
            this.updateMarginParams();
            if (callback !== undefined) {
                if (expiry) {
                    callback(this.asset, events_1.EventType.EXPIRY, null);
                }
                else {
                    callback(this.asset, events_1.EventType.EXCHANGE, null);
                }
            }
        });
        this._eventEmitters.push(eventEmitter);
    }
    subscribeGreeks(asset, callback) {
        if (this._zetaGroup === null) {
            throw Error("Cannot subscribe greeks. ZetaGroup is null.");
        }
        let eventEmitter = exchange_1.exchange.program.account.greeks.subscribe(this._zetaGroup.greeks, exchange_1.exchange.provider.connection.commitment);
        eventEmitter.on("change", async (greeks) => {
            this._greeks = greeks;
            if (this._isInitialized) {
                exchange_1.exchange.riskCalculator.updateMarginRequirements(asset);
            }
            if (callback !== undefined) {
                callback(this.asset, events_1.EventType.GREEKS, null);
            }
        });
        this._eventEmitters.push(eventEmitter);
    }
    subscribePerpSyncQueue() {
        if (this._zetaGroup === null) {
            throw Error("Cannot subscribe perpSyncQueue. ZetaGroup is null.");
        }
        let eventEmitter = exchange_1.exchange.program.account.perpSyncQueue.subscribe(this._zetaGroup.perpSyncQueue, exchange_1.exchange.provider.connection.commitment);
        // Purposely don't push out a callback here, users shouldn't care about
        // updates to perpSyncQueue
        eventEmitter.on("change", async (perpSyncQueue) => {
            this._perpSyncQueue = perpSyncQueue;
        });
        this._eventEmitters.push(eventEmitter);
    }
    async handlePolling(callback) {
        if (!this._isInitialized) {
            return;
        }
        await this.updateZetaGroup();
        this._markets.updateExpirySeries();
        if (callback !== undefined) {
            callback(this.asset, events_1.EventType.EXCHANGE, null);
        }
        await this._markets.handlePolling(callback);
    }
    async updateSubExchangeState() {
        await this.updateZetaGroup();
        this._markets.updateExpirySeries();
    }
    /**
     * @param index   market index to get mark price.
     */
    getMarkPrice(index) {
        let price = index == constants.PERP_INDEX
            ? this._greeks.perpMarkPrice
            : this._greeks.markPrices[index];
        return utils.convertNativeBNToDecimal(price, constants.PLATFORM_PRECISION);
    }
    /**
     * Returns all perp & nonperk markets in a single list
     */
    getMarkets() {
        return this._markets.markets.concat(this._markets.perpMarket);
    }
    /**
     * @param user user pubkey to be whitelisted for uncapped deposit
     */
    async whitelistUserForDeposit(user) {
        let tx = new web3_js_1.Transaction().add(await instructions.initializeWhitelistDepositAccountIx(this.asset, user, exchange_1.exchange.provider.wallet.publicKey));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
    }
    /**
     * @param user user pubkey to be whitelisted for our insurance vault
     */
    async whitelistUserForInsuranceVault(user) {
        let tx = new web3_js_1.Transaction().add(await instructions.initializeWhitelistInsuranceAccountIx(user, exchange_1.exchange.provider.wallet.publicKey));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
    }
    /**
     * @param user user pubkey to be whitelisted for trading fees
     */
    async whitelistUserForTradingFees(user) {
        let tx = new web3_js_1.Transaction().add(await instructions.initializeWhitelistTradingFeesAccountIx(user, exchange_1.exchange.provider.wallet.publicKey));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
    }
    /**
     *
     * @param movementType move funds from treasury wallet to insurance fund or the opposite
     * @param amount an array of remaining accounts (margin accounts) that will be rebalanced
     */
    async treasuryMovement(treasuryMovementType, amount) {
        let tx = new web3_js_1.Transaction().add(instructions.treasuryMovementIx(this.asset, treasuryMovementType, amount));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
    }
    /**
     *
     * @param marginAccounts an array of remaining accounts (margin accounts) that will be rebalanced
     */
    async rebalanceInsuranceVault(marginAccounts) {
        let txs = [];
        for (var i = 0; i < marginAccounts.length; i += constants.MAX_REBALANCE_ACCOUNTS) {
            let tx = new web3_js_1.Transaction();
            let slice = marginAccounts.slice(i, i + constants.MAX_REBALANCE_ACCOUNTS);
            tx.add(instructions.rebalanceInsuranceVaultIx(this.asset, slice));
            txs.push(tx);
        }
        try {
            await Promise.all(txs.map(async (tx) => {
                let txSig = await utils.processTransaction(exchange_1.exchange.provider, tx);
                console.log(`[REBALANCE INSURANCE VAULT]: ${txSig}`);
            }));
        }
        catch (e) {
            console.log(`Error in rebalancing the insurance vault ${e}`);
        }
    }
    updateMarginParams() {
        if (this.zetaGroup === undefined) {
            return;
        }
        this._marginParams = {
            futureMarginInitial: utils.convertNativeBNToDecimal(this.zetaGroup.marginParameters.futureMarginInitial, constants.MARGIN_PRECISION),
            futureMarginMaintenance: utils.convertNativeBNToDecimal(this.zetaGroup.marginParameters.futureMarginMaintenance, constants.MARGIN_PRECISION),
            optionMarkPercentageLongInitial: utils.convertNativeBNToDecimal(this.zetaGroup.marginParameters.optionMarkPercentageLongInitial, constants.MARGIN_PRECISION),
            optionSpotPercentageLongInitial: utils.convertNativeBNToDecimal(this.zetaGroup.marginParameters.optionSpotPercentageLongInitial, constants.MARGIN_PRECISION),
            optionSpotPercentageShortInitial: utils.convertNativeBNToDecimal(this.zetaGroup.marginParameters.optionSpotPercentageShortInitial, constants.MARGIN_PRECISION),
            optionDynamicPercentageShortInitial: utils.convertNativeBNToDecimal(this.zetaGroup.marginParameters.optionDynamicPercentageShortInitial, constants.MARGIN_PRECISION),
            optionMarkPercentageLongMaintenance: utils.convertNativeBNToDecimal(this.zetaGroup.marginParameters.optionMarkPercentageLongMaintenance, constants.MARGIN_PRECISION),
            optionSpotPercentageLongMaintenance: utils.convertNativeBNToDecimal(this.zetaGroup.marginParameters.optionSpotPercentageLongMaintenance, constants.MARGIN_PRECISION),
            optionSpotPercentageShortMaintenance: utils.convertNativeBNToDecimal(this.zetaGroup.marginParameters.optionSpotPercentageShortMaintenance, constants.MARGIN_PRECISION),
            optionDynamicPercentageShortMaintenance: utils.convertNativeBNToDecimal(this.zetaGroup.marginParameters.optionDynamicPercentageShortMaintenance, constants.MARGIN_PRECISION),
            optionShortPutCapPercentage: utils.convertNativeBNToDecimal(this.zetaGroup.marginParameters.optionShortPutCapPercentage, constants.MARGIN_PRECISION),
        };
    }
    /**
     * Halt zeta group functionality.
     */
    assertHalted() {
        if (!this.zetaGroup.haltState.halted) {
            throw "Zeta group not halted.";
        }
    }
    async haltZetaGroup(zetaGroupAddress) {
        let tx = new web3_js_1.Transaction().add(instructions.haltZetaGroupIx(this.asset, zetaGroupAddress, exchange_1.exchange.provider.wallet.publicKey));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
    }
    async unhaltZetaGroup() {
        let tx = new web3_js_1.Transaction().add(instructions.unhaltZetaGroupIx(this._asset, exchange_1.exchange.provider.wallet.publicKey));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
    }
    async updateHaltState(zetaGroupAddress, args) {
        let tx = new web3_js_1.Transaction().add(instructions.updateHaltStateIx(zetaGroupAddress, args, exchange_1.exchange.provider.wallet.publicKey));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
    }
    async settlePositionsHalted(marginAccounts) {
        let txs = instructions.settlePositionsHaltedTxs(this.asset, marginAccounts, exchange_1.exchange.provider.wallet.publicKey);
        await Promise.all(txs.map(async (tx) => {
            await utils.processTransaction(exchange_1.exchange.provider, tx);
        }));
    }
    async settleSpreadPositionsHalted(spreadAccounts) {
        let txs = instructions.settleSpreadPositionsHaltedTxs(this.asset, spreadAccounts, exchange_1.exchange.provider.wallet.publicKey);
        await Promise.all(txs.map(async (tx) => {
            await utils.processTransaction(exchange_1.exchange.provider, tx);
        }));
    }
    async cancelAllOrdersHalted() {
        this.assertHalted();
        await Promise.all(this.getMarkets().map(async (market) => {
            await market.cancelAllOrdersHalted();
        }));
    }
    async cleanZetaMarketsHalted() {
        this.assertHalted();
        let marketAccounts = await Promise.all(this._markets.markets.map(async (market) => {
            return utils.getMutMarketAccounts(this.asset, market.marketIndex);
        }));
        marketAccounts.push((this._markets.perpMarket,
            utils.getMutMarketAccounts(this.asset, constants.PERP_INDEX)));
        await utils.cleanZetaMarketsHalted(this.asset, marketAccounts);
    }
    async updatePricingHalted(expiryIndex) {
        let tx = new web3_js_1.Transaction().add(instructions.updatePricingHaltedIx(this.asset, expiryIndex, exchange_1.exchange.provider.wallet.publicKey));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
    }
    async cleanMarketNodes(expiryIndex) {
        let tx = new web3_js_1.Transaction().add(instructions.cleanMarketNodesIx(this.asset, expiryIndex));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
    }
    async updateVolatility(args) {
        let tx = new web3_js_1.Transaction().add(instructions.updateVolatilityIx(this.asset, args, exchange_1.exchange.provider.wallet.publicKey));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
    }
    async updateInterestRate(args) {
        let tx = new web3_js_1.Transaction().add(instructions.updateInterestRateIx(this.asset, args, exchange_1.exchange.provider.wallet.publicKey));
        await utils.processTransaction(exchange_1.exchange.provider, tx);
    }
    getProductGreeks(marketIndex, expiryIndex) {
        let index = ((marketIndex - expiryIndex * constants.PRODUCTS_PER_EXPIRY) %
            constants.NUM_STRIKES) +
            expiryIndex * constants.NUM_STRIKES;
        return this._greeks.productGreeks[index];
    }
    /**
     * Close the websockets.
     */
    async close() {
        this._isInitialized = false;
        this._isSetup = false;
        await exchange_1.exchange.program.account.zetaGroup.unsubscribe(this._zetaGroupAddress);
        await exchange_1.exchange.program.account.greeks.unsubscribe(this._zetaGroup.greeks);
        await exchange_1.exchange.program.account.perpSyncQueue.unsubscribe(this._zetaGroup.perpSyncQueue);
        for (var i = 0; i < this._eventEmitters.length; i++) {
            this._eventEmitters[i].removeListener("change");
        }
        this._eventEmitters = [];
    }
}
exports.SubExchange = SubExchange;
