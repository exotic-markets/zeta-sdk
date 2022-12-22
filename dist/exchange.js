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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchange = exports.Exchange = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
const web3_js_1 = require("@solana/web3.js");
const utils = __importStar(require("./utils"));
const constants = __importStar(require("./constants"));
const risk_1 = require("./risk");
const events_1 = require("./events");
const oracle_1 = require("./oracle");
const zeta_json_1 = __importDefault(require("./idl/zeta.json"));
const types = __importStar(require("./types"));
const subexchange_1 = require("./subexchange");
const instructions = __importStar(require("./program-instructions"));
const market_1 = require("./serum/market");
class Exchange {
    constructor() {
        this._isSetup = false;
        this._isInitialized = false;
        this._subExchanges = new Map();
        this._clockTimestamp = undefined;
        this._pollInterval = constants.DEFAULT_EXCHANGE_POLL_INTERVAL;
        this._useLedger = false;
        this._programSubscriptionIds = [];
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
     * Account storing zeta state.
     */
    get state() {
        return this._state;
    }
    /**
     * The solana network being used.
     */
    get network() {
        return this._network;
    }
    /**
     * Anchor program instance.
     */
    get program() {
        return this._program;
    }
    get programId() {
        return this._program.programId;
    }
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
     * Public key used as the stable coin mint.
     */
    get usdcMintAddress() {
        return this._usdcMintAddress;
    }
    /**
     * ConfirmOptions, stored so we don't need it again when making a SerumMarket.
     */
    get opts() {
        return this._opts;
    }
    /*
     * One SubExchange per underlying.
     */
    get subExchanges() {
        return this._subExchanges;
    }
    /**
     * The assets being used
     */
    get assets() {
        return this._assets;
    }
    /*
     * Oracle object that holds all oracle prices.
     */
    get oracle() {
        return this._oracle;
    }
    /**
     * Risk calculator that holds all margin requirements.
     */
    get riskCalculator() {
        return this._riskCalculator;
    }
    /**
     * Zeta PDA for serum market authority
     */
    get serumAuthority() {
        return this._serumAuthority;
    }
    /**
     * Zeta PDA for minting serum mints
     */
    get mintAuthority() {
        return this._mintAuthority;
    }
    /**
     * Address of state account.
     */
    get stateAddress() {
        return this._stateAddress;
    }
    /**
     * Public key for treasury wallet.
     */
    get treasuryWalletAddress() {
        return this._treasuryWalletAddress;
    }
    /**
     * Public key for referral rewards wallet.
     */
    get referralsRewardsWalletAddress() {
        return this._referralsRewardsWalletAddress;
    }
    /**
     * Stores the latest timestamp received by websocket subscription
     * to the system clock account.
     */
    get clockTimestamp() {
        return this._clockTimestamp;
    }
    /**
     * Stores the latest clock slot from clock subscription.
     */
    get clockSlot() {
        return this._clockSlot;
    }
    /**
     * @param interval   How often to poll zeta group and state in seconds.
     */
    get pollInterval() {
        return this._pollInterval;
    }
    set pollInterval(interval) {
        if (interval < 0) {
            throw Error("Invalid polling interval");
        }
        this._pollInterval = interval;
    }
    get ledgerWallet() {
        return this._ledgerWallet;
    }
    get useLedger() {
        return this._useLedger;
    }
    setLedgerWallet(wallet) {
        this._useLedger = true;
        this._ledgerWallet = wallet;
    }
    async initialize(assets, programId, network, connection, opts, wallet = new types.DummyWallet()) {
        if (this.isSetup) {
            throw "Exchange already setup";
        }
        this._assets = assets;
        this._provider = new anchor.AnchorProvider(connection, wallet, opts || utils.commitmentConfig(connection.commitment));
        this._opts = opts;
        this._network = network;
        this._program = new anchor.Program(zeta_json_1.default, programId, this._provider);
        for (var asset of assets) {
            await this.addSubExchange(asset, new subexchange_1.SubExchange());
            await this.getSubExchange(asset).initialize(asset);
        }
        this._isSetup = true;
    }
    async initializeZetaState(params, referralAdmin) {
        const [mintAuthority, mintAuthorityNonce] = await utils.getMintAuthority(this.programId);
        const [state, stateNonce] = await utils.getState(this.programId);
        const [serumAuthority, serumNonce] = await utils.getSerumAuthority(this.programId);
        this._usdcMintAddress = constants.USDC_MINT_ADDRESS[this.network];
        const [treasuryWallet, _treasuryWalletNonce] = await utils.getZetaTreasuryWallet(this.programId, this._usdcMintAddress);
        const [referralRewardsWallet, _referralRewardsWalletNonce] = await utils.getZetaReferralsRewardsWallet(this.programId, this._usdcMintAddress);
        let tx = new web3_js_1.Transaction().add(instructions.initializeZetaStateIx(state, stateNonce, serumAuthority, treasuryWallet, referralAdmin, referralRewardsWallet, serumNonce, mintAuthority, mintAuthorityNonce, params));
        try {
            await utils.processTransaction(this._provider, tx);
        }
        catch (e) {
            console.error(`Initialize zeta state failed: ${e}`);
        }
        this._mintAuthority = mintAuthority;
        this._stateAddress = state;
        this._serumAuthority = serumAuthority;
        this._treasuryWalletAddress = treasuryWallet;
        this._referralsRewardsWalletAddress = referralRewardsWallet;
        await this.updateState();
    }
    async initializeZetaGroup(asset, oracle, pricingArgs, perpArgs, marginArgs, expiryArgs) {
        let tx = new web3_js_1.Transaction().add(await instructions.initializeZetaGroupIx(asset, constants.MINTS[asset], oracle, pricingArgs, perpArgs, marginArgs, expiryArgs));
        try {
            await utils.processTransaction(this._provider, tx, [], utils.defaultCommitment(), this.useLedger);
        }
        catch (e) {
            console.error(`Initialize zeta group failed: ${e}`);
        }
        await this.updateState();
        await this.getSubExchange(asset).updateZetaGroup();
    }
    async load(assets, programId, network, connection, opts, wallet = new types.DummyWallet(), throttleMs = 0, callback) {
        if (this.isInitialized) {
            throw "Exchange already loaded";
        }
        if (!this.isSetup) {
            await this.initialize(assets, programId, network, connection, opts, wallet);
        }
        this._riskCalculator = new risk_1.RiskCalculator(this.assets);
        // Load variables from state.
        const [mintAuthority, _mintAuthorityNonce] = await utils.getMintAuthority(this.programId);
        const [state, _stateNonce] = await utils.getState(this.programId);
        const [serumAuthority, _serumNonce] = await utils.getSerumAuthority(this.programId);
        this._mintAuthority = mintAuthority;
        this._stateAddress = state;
        this._serumAuthority = serumAuthority;
        this._usdcMintAddress = constants.USDC_MINT_ADDRESS[network];
        const [treasuryWallet, _treasuryWalletnonce] = await utils.getZetaTreasuryWallet(this.programId, this._usdcMintAddress);
        this._treasuryWalletAddress = treasuryWallet;
        const [referralsRewardsWallet, _referralsRewardsWalletNonce] = await utils.getZetaReferralsRewardsWallet(this.programId, this._usdcMintAddress);
        this._referralsRewardsWalletAddress = referralsRewardsWallet;
        this._lastPollTimestamp = 0;
        this._oracle = new oracle_1.Oracle(this.network, this.connection);
        await this.subscribeOracle(this.assets, callback);
        await Promise.all(this.assets.map(async (asset) => {
            await this.getSubExchange(asset).load(asset, this.programId, this.network, this.opts, throttleMs, callback);
        }));
        await this.updateState();
        await this.subscribeClock(callback);
        this._isInitialized = true;
    }
    async addSubExchange(asset, subExchange) {
        this._subExchanges.set(asset, subExchange);
    }
    getSubExchange(asset) {
        try {
            return this._subExchanges.get(asset);
        }
        catch (_e) {
            throw Error(`Failed to get subExchange for asset=${asset}, have you called Exchange.load()?`);
        }
    }
    getAllSubExchanges() {
        return [...this._subExchanges.values()];
    }
    async subscribeOracle(assets, callback) {
        await this._oracle.subscribePriceFeeds(assets, (asset, price) => {
            if (this.isInitialized) {
                this._riskCalculator.updateMarginRequirements(asset);
            }
            if (callback !== undefined) {
                callback(asset, events_1.EventType.ORACLE, price);
            }
        });
    }
    setClockData(data) {
        this._clockTimestamp = data.timestamp;
        this._clockSlot = data.slot;
    }
    async subscribeClock(callback) {
        if (this._clockSubscriptionId !== undefined) {
            throw Error("Clock already subscribed to.");
        }
        this._clockSubscriptionId = this.provider.connection.onAccountChange(web3_js_1.SYSVAR_CLOCK_PUBKEY, async (accountInfo, _context) => {
            this.setClockData(utils.getClockData(accountInfo));
            if (callback !== undefined) {
                callback(null, events_1.EventType.CLOCK, null);
            }
            try {
                if (this._clockTimestamp >
                    this._lastPollTimestamp + this._pollInterval &&
                    this.isInitialized) {
                    this._lastPollTimestamp = this._clockTimestamp;
                    await Promise.all(this.getAllSubExchanges().map(async (subExchange) => {
                        await subExchange.handlePolling(callback);
                    }));
                }
            }
            catch (e) {
                console.log(`SubExchange polling failed. Error: ${e}`);
            }
        }, this.provider.connection.commitment);
        let accountInfo = await this.provider.connection.getAccountInfo(web3_js_1.SYSVAR_CLOCK_PUBKEY);
        this.setClockData(utils.getClockData(accountInfo));
    }
    addProgramSubscriptionId(id) {
        this._programSubscriptionIds.push(id);
    }
    async updateExchangeState() {
        await this.updateState();
        await Promise.all(this.assets.map(async (asset) => {
            await this.updateZetaGroup(asset);
            this.getZetaGroupMarkets(asset).updateExpirySeries();
        }));
    }
    /**
     * Polls the on chain account to update state.
     */
    async updateState() {
        this._state = (await this.program.account.state.fetch(this.stateAddress));
    }
    /**
     * Update the expiry state variables for the program.
     */
    async updateZetaState(params) {
        let tx = new web3_js_1.Transaction().add(instructions.updateZetaStateIx(params, this.provider.wallet.publicKey));
        await utils.processTransaction(this.provider, tx);
        await this.updateState();
    }
    async initializeMarketNodes(asset, zetaGroup) {
        await this.getSubExchange(asset).initializeMarketNodes(zetaGroup);
    }
    subscribeMarket(asset, index) {
        this.getSubExchange(asset).markets.subscribeMarket(index);
    }
    unsubscribeMarket(asset, index) {
        this.getSubExchange(asset).markets.unsubscribeMarket(index);
    }
    subscribePerp(asset) {
        this.getSubExchange(asset).markets.subscribePerp();
    }
    unsubscribePerp(asset) {
        this.getSubExchange(asset).markets.unsubscribePerp();
    }
    async updateOrderbook(asset, index) {
        await this.getMarket(asset, index).updateOrderbook();
    }
    async updateAllOrderbooks(live = true) {
        // This assumes that every market has 1 asksAddress and 1 bidsAddress
        let allLiveMarkets = [];
        this.assets.forEach((asset) => {
            allLiveMarkets = allLiveMarkets.concat(this.getMarkets(asset));
        });
        if (live) {
            allLiveMarkets = allLiveMarkets.filter((m) => m.kind == types.Kind.PERP || m.expirySeries.isLive());
        }
        let liveMarketsSlices = [];
        for (let i = 0; i < allLiveMarkets.length; i += constants.MAX_MARKETS_TO_FETCH) {
            liveMarketsSlices.push(allLiveMarkets.slice(i, i + constants.MAX_MARKETS_TO_FETCH));
        }
        await Promise.all(liveMarketsSlices.map(async (liveMarkets) => {
            let liveMarketAskAddresses = liveMarkets.map((m) => m.serumMarket.asksAddress);
            let liveMarketBidAddresses = liveMarkets.map((m) => m.serumMarket.bidsAddress);
            let accountInfos = await this.connection.getMultipleAccountsInfo(liveMarketAskAddresses.concat(liveMarketBidAddresses));
            const half = Math.ceil(accountInfos.length / 2);
            const asksAccountInfos = accountInfos.slice(0, half);
            const bidsAccountInfos = accountInfos.slice(-half);
            // A bit of a weird one but we want a map of liveMarkets -> accountInfos because
            // we'll do the following orderbook updates async
            let liveMarketsToAskAccountInfosMap = new Map();
            let liveMarketsToBidAccountInfosMap = new Map();
            liveMarkets.map((m, i) => {
                liveMarketsToAskAccountInfosMap.set(m, asksAccountInfos[i]);
                liveMarketsToBidAccountInfosMap.set(m, bidsAccountInfos[i]);
            });
            await Promise.all(liveMarkets.map(async (market) => {
                market.asks = market_1.Orderbook.decode(market.serumMarket, liveMarketsToAskAccountInfosMap.get(market).data);
                market.bids = market_1.Orderbook.decode(market.serumMarket, liveMarketsToBidAccountInfosMap.get(market).data);
                market.updateOrderbook(false);
            }));
        }));
    }
    getZetaGroupMarkets(asset) {
        return this.getSubExchange(asset).markets;
    }
    getMarket(asset, index) {
        if (index == constants.PERP_INDEX) {
            return this.getPerpMarket(asset);
        }
        return this.getSubExchange(asset).markets.markets[index];
    }
    getMarkets(asset) {
        return this.getSubExchange(asset).markets.markets.concat(this.getSubExchange(asset).markets.perpMarket);
    }
    getPerpMarket(asset) {
        return this.getSubExchange(asset).markets.perpMarket;
    }
    getMarketsByExpiryIndex(asset, index) {
        return this.getSubExchange(asset).markets.getMarketsByExpiryIndex(index);
    }
    getExpirySeriesList(asset) {
        return this.getSubExchange(asset).markets.expirySeries;
    }
    getZetaGroup(asset) {
        return this.getSubExchange(asset).zetaGroup;
    }
    getZetaGroupAddress(asset) {
        return this.getSubExchange(asset).zetaGroupAddress;
    }
    getGreeks(asset) {
        return this.getSubExchange(asset).greeks;
    }
    getPerpSyncQueue(asset) {
        return this.getSubExchange(asset).perpSyncQueue;
    }
    getOrderbook(asset, index) {
        return this.getMarket(asset, index).orderbook;
    }
    getMarkPrice(asset, index) {
        return this.getSubExchange(asset).getMarkPrice(index);
    }
    getInsuranceVaultAddress(asset) {
        return this.getSubExchange(asset).insuranceVaultAddress;
    }
    getVaultAddress(asset) {
        return this.getSubExchange(asset).vaultAddress;
    }
    getSocializedLossAccountAddress(asset) {
        return this.getSubExchange(asset).socializedLossAccountAddress;
    }
    async updatePricingParameters(asset, args) {
        await this.getSubExchange(asset).updatePricingParameters(args);
    }
    getMarginParams(asset) {
        return this.getSubExchange(asset).marginParams;
    }
    async updateMarginParameters(asset, args) {
        await this.getSubExchange(asset).updateMarginParameters(args);
    }
    async updatePerpParameters(asset, args) {
        await this.getSubExchange(asset).updatePerpParameters(args);
    }
    async updateZetaGroupExpiryParameters(asset, args) {
        await this.getSubExchange(asset).updateZetaGroupExpiryParameters(args);
    }
    async updateVolatilityNodes(asset, nodes) {
        await this.getSubExchange(asset).updateVolatilityNodes(nodes);
    }
    async initializeZetaMarkets(asset) {
        await this.getSubExchange(asset).initializeZetaMarkets();
    }
    async initializeZetaMarketsTIFEpochCycle(asset, cycleLengthSecs) {
        await this.getSubExchange(asset).initializeZetaMarketsTIFEpochCycle(cycleLengthSecs);
    }
    async initializeMarketStrikes(asset) {
        await this.getSubExchange(asset).initializeMarketStrikes();
    }
    async initializePerpSyncQueue(asset) {
        await this.getSubExchange(asset).initializePerpSyncQueue();
    }
    async updateZetaGroup(asset) {
        await this.getSubExchange(asset).updateZetaGroup();
    }
    async updatePricing(asset, expiryIndex) {
        await this.getSubExchange(asset).updatePricing(expiryIndex);
    }
    async retreatMarketNodes(asset, expiryIndex) {
        await this.getSubExchange(asset).retreatMarketNodes(expiryIndex);
    }
    async updateSubExchangeState(asset) {
        await this.getSubExchange(asset).updateSubExchangeState();
    }
    async whitelistUserForDeposit(asset, user) {
        await this.getSubExchange(asset).whitelistUserForDeposit(user);
    }
    async whitelistUserForInsuranceVault(asset, user) {
        await this.getSubExchange(asset).whitelistUserForInsuranceVault(user);
    }
    async whitelistUserForTradingFees(asset, user) {
        await this.getSubExchange(asset).whitelistUserForTradingFees(user);
    }
    async treasuryMovement(asset, treasuryMovementType, amount) {
        await this.getSubExchange(asset).treasuryMovement(treasuryMovementType, amount);
    }
    async rebalanceInsuranceVault(asset, marginAccounts) {
        await this.getSubExchange(asset).rebalanceInsuranceVault(marginAccounts);
    }
    updateMarginParams(asset) {
        this.getSubExchange(asset).updateMarginParams();
    }
    async haltZetaGroup(asset, zetaGroupAddress) {
        await this.getSubExchange(asset).haltZetaGroup(zetaGroupAddress);
    }
    async unhaltZetaGroup(asset, zetaGroupAddress) {
        await this.getSubExchange(asset).unhaltZetaGroup();
    }
    async updateHaltState(asset, zetaGroupAddress, args) {
        await this.getSubExchange(asset).updateHaltState(zetaGroupAddress, args);
    }
    async settlePositionsHalted(asset, marginAccounts) {
        await this.getSubExchange(asset).settlePositionsHalted(marginAccounts);
    }
    async settleSpreadPositionsHalted(asset, marginAccounts) {
        await this.getSubExchange(asset).settleSpreadPositionsHalted(marginAccounts);
    }
    async cancelAllOrdersHalted(asset) {
        await this.getSubExchange(asset).cancelAllOrdersHalted();
    }
    async cleanZetaMarketsHalted(asset) {
        await this.getSubExchange(asset).cleanZetaMarketsHalted();
    }
    async updatePricingHalted(asset, expiryIndex) {
        await this.getSubExchange(asset).updatePricingHalted(expiryIndex);
    }
    isHalted(asset) {
        return this.getSubExchange(asset).halted;
    }
    async cleanMarketNodes(asset, expiryIndex) {
        await this.getSubExchange(asset).cleanMarketNodes(expiryIndex);
    }
    async updateVolatility(asset, args) {
        await this.getSubExchange(asset).updateVolatility(args);
    }
    async updateInterestRate(asset, args) {
        await this.getSubExchange(asset).updateInterestRate(args);
    }
    getProductGreeks(asset, marketIndex, expiryIndex) {
        return this.getSubExchange(asset).getProductGreeks(marketIndex, expiryIndex);
    }
    async close() {
        this._isInitialized = false;
        this._isSetup = false;
        await Promise.all(this.getAllSubExchanges().map(async (subExchange) => {
            await subExchange.close();
        }));
        await this._oracle.close();
        if (this._clockSubscriptionId !== undefined) {
            await this.connection.removeAccountChangeListener(this._clockSubscriptionId);
            this._clockSubscriptionId = undefined;
        }
        for (var i = 0; i < this._programSubscriptionIds.length; i++) {
            await this.connection.removeProgramAccountChangeListener(this._programSubscriptionIds[i]);
        }
        this._programSubscriptionIds = [];
    }
}
exports.Exchange = Exchange;
// Exchange singleton.
exports.exchange = new Exchange();
