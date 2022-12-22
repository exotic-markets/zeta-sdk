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
exports.Market = exports.ExpirySeries = exports.ZetaGroupMarkets = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
const market_1 = require("./serum/market");
const exchange_1 = require("./exchange");
const constants = __importStar(require("./constants"));
const utils_1 = require("./utils");
const types = __importStar(require("./types"));
const events_1 = require("./events");
class ZetaGroupMarkets {
    /**
     * Returns the index for the front expiry in expiry series.
     */
    get frontExpiryIndex() {
        return this._frontExpiryIndex;
    }
    /**
     * Returns the expiry series for this zeta group.
     */
    get expirySeries() {
        return this._expirySeries;
    }
    /**
     * The underlying asset this set of markets belong to.
     */
    get asset() {
        return this._asset;
    }
    /**
     * The list of markets in the same ordering as the zeta group account
     * They are in sorted order by market address.
     */
    get markets() {
        return this._markets;
    }
    get perpMarket() {
        return this._perpMarket;
    }
    set pollInterval(interval) {
        if (interval < 0) {
            throw Error("Invalid poll interval");
        }
        this._pollInterval = interval;
    }
    get pollInterval() {
        return this._pollInterval;
    }
    /**
     * Returns the market's index.
     */
    getMarketsByExpiryIndex(expiryIndex) {
        let head = expiryIndex * this.productsPerExpiry();
        return this._markets.slice(head, head + this.productsPerExpiry());
    }
    /**
     * Returns all strikes given an expiry index. Strikes are returned as decimal numbers.
     */
    getStrikesByExpiryIndex(expiryIndex) {
        let strikes = Array(constants.NUM_STRIKES).fill(0);
        let markets = this.getMarketsByExpiryIndex(expiryIndex);
        for (let i = 0; i < constants.NUM_STRIKES; i++) {
            strikes[i] = markets[i].strike;
        }
        return strikes;
    }
    /**
     * Returns the options market given an expiry index and options kind.
     */
    getOptionsMarketByExpiryIndex(expiryIndex, kind) {
        let markets = this.getMarketsByExpiryIndex(expiryIndex);
        switch (kind) {
            case types.Kind.CALL:
                return markets.slice(0, constants.NUM_STRIKES);
            case types.Kind.PUT:
                return markets.slice(constants.NUM_STRIKES, 2 * constants.NUM_STRIKES);
            default:
                throw Error("Options market kind not supported, must be CALL or PUT");
        }
    }
    /**
     * Returns the futures market given an expiry index.
     */
    getFuturesMarketByExpiryIndex(expiryIndex) {
        let markets = this.getMarketsByExpiryIndex(expiryIndex);
        let market = markets[markets.length - 1];
        if (market.kind != types.Kind.FUTURE) {
            throw Error("Futures market kind error");
        }
        return market;
    }
    getMarketByExpiryKindStrike(expiryIndex, kind, strike) {
        let markets = this.getMarketsByExpiryIndex(expiryIndex);
        let marketsKind;
        if (kind === types.Kind.CALL || kind === types.Kind.PUT) {
            if (strike === undefined) {
                throw new Error("Strike must be specified for options markets");
            }
            marketsKind = this.getOptionsMarketByExpiryIndex(expiryIndex, kind);
        }
        else if (kind === types.Kind.FUTURE) {
            return this.getFuturesMarketByExpiryIndex(expiryIndex);
        }
        else {
            throw new Error("Only CALL, PUT, FUTURE kinds are supported");
        }
        let market = marketsKind.filter((x) => x.strike == strike);
        return markets.length == 0 ? undefined : markets[0];
    }
    constructor(asset) {
        this._pollInterval = constants.DEFAULT_MARKET_POLL_INTERVAL;
        let subExchange = exchange_1.exchange.getSubExchange(asset);
        this._asset = asset;
        this._expirySeries = new Array(subExchange.zetaGroup.expirySeries.length);
        this._markets = new Array(subExchange.zetaGroup.products.length);
        this._subscribedMarketIndexes = new Set();
        this._lastPollTimestamp = 0;
    }
    subscribeMarket(marketIndex) {
        if (marketIndex >= this._markets.length &&
            marketIndex != constants.PERP_INDEX) {
            throw Error(`Market index ${marketIndex} doesn't exist.`);
        }
        this._subscribedMarketIndexes.add(marketIndex);
    }
    unsubscribeMarket(marketIndex) {
        return this._subscribedMarketIndexes.delete(marketIndex);
    }
    subscribePerp() {
        this._subscribedPerp = true;
    }
    unsubscribePerp() {
        this._subscribedPerp = false;
    }
    async handlePolling(callback) {
        if (exchange_1.exchange.clockTimestamp >
            this._lastPollTimestamp + this._pollInterval) {
            this._lastPollTimestamp = exchange_1.exchange.clockTimestamp;
            let indexes = Array.from(this._subscribedMarketIndexes);
            await Promise.all(indexes.map(async (index) => {
                try {
                    await this._markets[index].updateOrderbook();
                }
                catch (e) {
                    console.error(`Orderbook poll failed: ${e}`);
                }
                if (callback !== undefined) {
                    let data = { marketIndex: index };
                    callback(this.asset, events_1.EventType.ORDERBOOK, data);
                }
            }));
            if (this._subscribedPerp) {
                try {
                    await this._perpMarket.updateOrderbook();
                }
                catch (e) {
                    console.error(`Orderbook poll failed: ${e}`);
                }
                if (callback !== undefined) {
                    let data = { marketIndex: constants.PERP_INDEX };
                    callback(this.asset, events_1.EventType.ORDERBOOK, data);
                }
            }
        }
    }
    /**
     * Will load a new instance of ZetaGroupMarkets
     * Should not be called outside of SubExchange.
     */
    static async load(asset, opts, throttleMs) {
        let instance = new ZetaGroupMarkets(asset);
        let subExchange = exchange_1.exchange.getSubExchange(asset);
        let productsPerExpiry = Math.floor(subExchange.zetaGroup.products.length /
            subExchange.zetaGroup.expirySeries.length);
        let indexes = [...Array(constants.ACTIVE_MARKETS - 1).keys()];
        for (var i = 0; i < indexes.length; i += constants.MARKET_LOAD_LIMIT) {
            let slice = indexes.slice(i, i + constants.MARKET_LOAD_LIMIT);
            await Promise.all(slice.map(async (index) => {
                let marketAddr = subExchange.zetaGroup.products[index].market;
                let serumMarket = await market_1.Market.load(exchange_1.exchange.connection, marketAddr, { commitment: opts.commitment, skipPreflight: opts.skipPreflight }, constants.DEX_PID[exchange_1.exchange.network]);
                let [baseVaultAddr, _baseVaultNonce] = await (0, utils_1.getZetaVault)(exchange_1.exchange.programId, serumMarket.baseMintAddress);
                let [quoteVaultAddr, _quoteVaultNonce] = await (0, utils_1.getZetaVault)(exchange_1.exchange.programId, serumMarket.quoteMintAddress);
                let expiryIndex = Math.floor(index / productsPerExpiry);
                instance._markets[index] = new Market(asset, index, expiryIndex, types.toProductKind(subExchange.zetaGroup.products[index].kind), marketAddr, subExchange.zetaGroupAddress, quoteVaultAddr, baseVaultAddr, serumMarket);
            }));
            await (0, utils_1.sleep)(throttleMs);
        }
        // Perps product/market is separate
        let marketAddr = subExchange.zetaGroup.perp.market;
        let serumMarket = await market_1.Market.load(exchange_1.exchange.connection, marketAddr, { commitment: opts.commitment, skipPreflight: opts.skipPreflight }, constants.DEX_PID[exchange_1.exchange.network]);
        let [baseVaultAddr, _baseVaultNonce] = await (0, utils_1.getZetaVault)(exchange_1.exchange.programId, serumMarket.baseMintAddress);
        let [quoteVaultAddr, _quoteVaultNonce] = await (0, utils_1.getZetaVault)(exchange_1.exchange.programId, serumMarket.quoteMintAddress);
        instance._perpMarket = new Market(asset, constants.PERP_INDEX, // not in use but technically sits at the end of the list of Products in the ZetaGroup
        null, types.toProductKind(subExchange.zetaGroup.perp.kind), marketAddr, subExchange.zetaGroupAddress, quoteVaultAddr, baseVaultAddr, serumMarket);
        instance.updateExpirySeries();
        return instance;
    }
    /**
     * Updates the option series state based off state in SubExchange.
     */
    async updateExpirySeries() {
        let subExchange = exchange_1.exchange.getSubExchange(this.asset);
        for (var i = 0; i < subExchange.zetaGroup.products.length; i++) {
            this._markets[i].updateStrike();
        }
        this._frontExpiryIndex = subExchange.zetaGroup.frontExpiryIndex;
        for (var i = 0; i < subExchange.zetaGroup.expirySeries.length; i++) {
            let strikesInitialized = this._markets[i * this.productsPerExpiry()].strike != null;
            this._expirySeries[i] = new ExpirySeries(this.asset, i, subExchange.zetaGroup.expirySeries[i].activeTs.toNumber(), subExchange.zetaGroup.expirySeries[i].expiryTs.toNumber(), subExchange.zetaGroup.expirySeries[i].dirty, strikesInitialized);
        }
    }
    /**
     * Returns the market object for a given index.
     */
    getMarket(market) {
        let index = this.getMarketIndex(market);
        return index == constants.PERP_INDEX
            ? this._perpMarket
            : this._markets[index];
    }
    /**
     * Returns the market index for a given market address.
     */
    getMarketIndex(market) {
        let compare = (a, b) => a.toBuffer().compare(b.toBuffer());
        let m = 0;
        let n = this._markets.length - 1;
        while (m <= n) {
            let k = (n + m) >> 1;
            let cmp = compare(market, this._markets[k].address);
            if (cmp > 0) {
                m = k + 1;
            }
            else if (cmp < 0) {
                n = k - 1;
            }
            else {
                return k;
            }
        }
        if (compare(market, this._perpMarket.address) == 0) {
            return constants.PERP_INDEX;
        }
        throw Error("Market doesn't exist!");
    }
    /**
     * Returns the index of expiry series that are tradeable.
     */
    getTradeableExpiryIndices() {
        let result = [];
        for (var i = 0; i < this._expirySeries.length; i++) {
            let expirySeries = this._expirySeries[i];
            if (expirySeries.isLive()) {
                result.push(i);
            }
        }
        return result;
    }
    productsPerExpiry() {
        return Math.floor(this._markets.length / this.expirySeries.length);
    }
}
exports.ZetaGroupMarkets = ZetaGroupMarkets;
class ExpirySeries {
    constructor(asset, expiryIndex, activeTs, expiryTs, dirty, strikesInitialized) {
        this.asset = asset;
        this.expiryIndex = expiryIndex;
        this.activeTs = activeTs;
        this.expiryTs = expiryTs;
        this.dirty = dirty;
        this.strikesInitialized = strikesInitialized;
    }
    isLive() {
        return (exchange_1.exchange.clockTimestamp >= this.activeTs &&
            exchange_1.exchange.clockTimestamp < this.expiryTs &&
            this.strikesInitialized &&
            !this.dirty);
    }
}
exports.ExpirySeries = ExpirySeries;
/**
 * Wrapper class for a zeta market on serum.
 */
class Market {
    /**
     * The market index corresponding to the zeta group account.
     */
    get marketIndex() {
        return this._marketIndex;
    }
    /**
     * The expiry series index this market belongs to.
     */
    get expiryIndex() {
        return this._expiryIndex;
    }
    get expirySeries() {
        return exchange_1.exchange.getSubExchange(this.asset).markets.expirySeries[this.expiryIndex];
    }
    /**
     * The underlying asset this set of markets belong to.
     */
    get asset() {
        return this._asset;
    }
    /**
     * The type of product this market represents.
     */
    get kind() {
        return this._kind;
    }
    /**
     * The serum market address.
     */
    get address() {
        return this._address;
    }
    /**
     * The zeta group this market belongs to.
     * TODO currently there exists only one zeta group.
     */
    get zetaGroup() {
        return this._zetaGroup;
    }
    /**
     * The zeta vault for the quote mint.
     */
    get quoteVault() {
        return this._quoteVault;
    }
    /**
     * The zeta vault for the base mint.
     */
    get baseVault() {
        return this._baseVault;
    }
    /**
     * The serum Market object from @project-serum/ts
     */
    get serumMarket() {
        return this._serumMarket;
    }
    set bids(bids) {
        this._bids = bids;
    }
    set asks(asks) {
        this._asks = asks;
    }
    /**
     * Returns the best N levels for bids and asks
     */
    get orderbook() {
        return this._orderbook;
    }
    /**
     * The strike of this option, modified on new expiry.
     */
    get strike() {
        return this._strike;
    }
    constructor(asset, marketIndex, expiryIndex, kind, address, zetaGroup, quoteVault, baseVault, serumMarket) {
        this._asset = asset;
        this._marketIndex = marketIndex;
        this._expiryIndex = expiryIndex;
        this._kind = kind;
        this._address = address;
        this._zetaGroup = zetaGroup;
        this._quoteVault = quoteVault;
        this._baseVault = baseVault;
        this._serumMarket = serumMarket;
        this._strike = 0;
        this._orderbook = { bids: [], asks: [] };
    }
    updateStrike() {
        let strike = this._marketIndex == constants.PERP_INDEX
            ? exchange_1.exchange.getSubExchange(this.asset).zetaGroup.perp.strike
            : exchange_1.exchange.getSubExchange(this.asset).zetaGroup.products[this._marketIndex].strike;
        if (!strike.isSet) {
            this._strike = null;
        }
        else {
            this._strike = (0, utils_1.convertNativeBNToDecimal)(strike.value);
        }
    }
    async updateOrderbook(loadSerum = true) {
        // if not loadSerum, we assume that this._bids and this._asks was set elsewhere manually beforehand
        if (loadSerum) {
            [this._bids, this._asks] = await Promise.all([
                this._serumMarket.loadBids(exchange_1.exchange.provider.connection),
                this._serumMarket.loadAsks(exchange_1.exchange.provider.connection),
            ]);
        }
        [this._bids, this._asks].map((orderbookSide) => {
            const descending = orderbookSide.isBids ? true : false;
            const levels = []; // (price, size, tifOffset)
            for (const { key, quantity, tifOffset } of orderbookSide.slab.items(descending)) {
                let seqNum = (0, utils_1.getSeqNumFromSerumOrderKey)(key, orderbookSide.isBids);
                if ((0, utils_1.isOrderExpired)(tifOffset.toNumber(), seqNum, this._serumMarket.epochStartTs.toNumber(), this._serumMarket.startEpochSeqNum)) {
                    continue;
                }
                const price = (0, utils_1.getPriceFromSerumOrderKey)(key);
                if (levels.length > 0 && levels[levels.length - 1][0].eq(price)) {
                    levels[levels.length - 1][1].iadd(quantity);
                }
                else {
                    levels.push([price, new anchor.BN(quantity.toNumber())]);
                }
            }
            this._orderbook[orderbookSide.isBids ? "bids" : "asks"] = levels.map(([priceLots, sizeLots]) => {
                return {
                    price: this._serumMarket.priceLotsToNumber(priceLots),
                    size: (0, utils_1.convertNativeLotSizeToDecimal)(this._serumMarket.baseSizeLotsToNumber(sizeLots)),
                };
            });
        });
    }
    getTopLevel() {
        let topLevel = { bid: null, ask: null };
        if (this._orderbook.bids.length != 0) {
            topLevel.bid = this._orderbook.bids[0];
        }
        if (this._orderbook.asks.length != 0) {
            topLevel.ask = this._orderbook.asks[0];
        }
        return topLevel;
    }
    static convertOrder(market, order) {
        return {
            marketIndex: market.marketIndex,
            market: market.address,
            price: order.price,
            size: (0, utils_1.convertNativeLotSizeToDecimal)(order.size),
            side: order.side == "buy" ? types.Side.BID : types.Side.ASK,
            orderId: order.orderId,
            owner: order.openOrdersAddress,
            clientOrderId: order.clientId,
            tifOffset: order.tifOffset,
        };
    }
    getOrdersForAccount(openOrdersAddress) {
        let orders = [...this._bids, ...this._asks].filter((order) => order.openOrdersAddress.equals(openOrdersAddress));
        return orders.map((order) => {
            return Market.convertOrder(this, order);
        });
    }
    getMarketOrders() {
        return [...this._bids, ...this._asks].map((order) => {
            return Market.convertOrder(this, order);
        });
    }
    getBidOrders() {
        return [...this._bids].map((order) => {
            return Market.convertOrder(this, order);
        });
    }
    getAskOrders() {
        return [...this._asks].map((order) => {
            return Market.convertOrder(this, order);
        });
    }
    async cancelAllExpiredOrders() {
        await this.updateOrderbook();
        let orders = this.getMarketOrders();
        // Assumption of similar MAX number of instructions as regular cancel
        let ixs = await (0, utils_1.getCancelAllIxs)(this.asset, orders, true);
        let txs = (0, utils_1.splitIxsIntoTx)(ixs, constants.MAX_CANCELS_PER_TX);
        await Promise.all(txs.map(async (tx) => {
            await (0, utils_1.processTransaction)(exchange_1.exchange.provider, tx);
        }));
    }
    async cancelAllOrdersHalted() {
        exchange_1.exchange.getSubExchange(this.asset).assertHalted();
        await this.updateOrderbook();
        let orders = this.getMarketOrders();
        let ixs = await (0, utils_1.getCancelAllIxs)(this.asset, orders, false);
        let txs = (0, utils_1.splitIxsIntoTx)(ixs, constants.MAX_CANCELS_PER_TX);
        await Promise.all(txs.map(async (tx) => {
            await (0, utils_1.processTransaction)(exchange_1.exchange.provider, tx);
        }));
    }
}
exports.Market = Market;
