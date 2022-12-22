"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMintDecimals = exports.Orderbook = exports.ORDERBOOK_LAYOUT = exports.OpenOrders = exports._OPEN_ORDERS_LAYOUT_V2 = exports.Market = exports.MARKET_STATE_LAYOUT_V3 = void 0;
const buffer_layout_1 = require("buffer-layout");
const layout_1 = require("./layout");
const slab_1 = require("./slab");
const bn_js_1 = __importDefault(require("bn.js"));
const web3_js_1 = require("@solana/web3.js");
const queue_1 = require("./queue");
exports.MARKET_STATE_LAYOUT_V3 = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.blob)(5),
    (0, layout_1.accountFlagsLayout)("accountFlags"),
    (0, layout_1.publicKeyLayout)("ownAddress"),
    (0, layout_1.u64)("vaultSignerNonce"),
    (0, layout_1.publicKeyLayout)("baseMint"),
    (0, layout_1.publicKeyLayout)("quoteMint"),
    (0, layout_1.publicKeyLayout)("baseVault"),
    (0, layout_1.u64)("baseDepositsTotal"),
    (0, layout_1.u64)("baseFeesAccrued"),
    (0, layout_1.publicKeyLayout)("quoteVault"),
    (0, layout_1.u64)("quoteDepositsTotal"),
    (0, layout_1.u64)("quoteFeesAccrued"),
    (0, layout_1.u64)("quoteDustThreshold"),
    (0, layout_1.publicKeyLayout)("requestQueue"),
    (0, layout_1.publicKeyLayout)("eventQueue"),
    (0, layout_1.publicKeyLayout)("bids"),
    (0, layout_1.publicKeyLayout)("asks"),
    (0, layout_1.u64)("baseLotSize"),
    (0, layout_1.u64)("quoteLotSize"),
    (0, layout_1.u64)("feeRateBps"),
    (0, layout_1.u64)("referrerRebatesAccrued"),
    (0, layout_1.publicKeyLayout)("openOrdersAuthority"),
    (0, layout_1.publicKeyLayout)("pruneAuthority"),
    (0, layout_1.publicKeyLayout)("consumeEventsAuthority"),
    // Consume events authority
    (0, layout_1.u16)("epochLength"),
    (0, layout_1.u64)("epochStartTs"),
    (0, layout_1.u64)("startEpochSeqNum"),
    (0, buffer_layout_1.blob)(974),
    (0, buffer_layout_1.blob)(7),
]);
class Market {
    constructor(decoded, baseMintDecimals, quoteMintDecimals, options = {}, programId, layoutOverride) {
        const { skipPreflight = false, commitment = "recent" } = options;
        if (!decoded.accountFlags.initialized || !decoded.accountFlags.market) {
            throw new Error("Invalid market state");
        }
        this._decoded = decoded;
        this._baseSplTokenDecimals = baseMintDecimals;
        this._quoteSplTokenDecimals = quoteMintDecimals;
        this._skipPreflight = skipPreflight;
        this._commitment = commitment;
        this._programId = programId;
        this._openOrdersAccountsCache = {};
        this._feeDiscountKeysCache = {};
        this._layoutOverride = layoutOverride;
    }
    static async load(connection, address, options = {}, programId, layoutOverride) {
        const { owner, data } = throwIfNull(await connection.getAccountInfo(address), "Market not found");
        if (!owner.equals(programId)) {
            throw new Error("Address not owned by program: " + owner.toBase58());
        }
        const decoded = exports.MARKET_STATE_LAYOUT_V3.decode(data);
        if (!decoded.accountFlags.initialized ||
            !decoded.accountFlags.market ||
            !decoded.ownAddress.equals(address)) {
            throw new Error("Invalid market");
        }
        const [baseMintDecimals, quoteMintDecimals] = await Promise.all([
            getMintDecimals(connection, decoded.baseMint),
            getMintDecimals(connection, decoded.quoteMint),
        ]);
        return new Market(decoded, baseMintDecimals, quoteMintDecimals, options, programId, layoutOverride);
    }
    get programId() {
        return this._programId;
    }
    get address() {
        return this._decoded.ownAddress;
    }
    get publicKey() {
        return this.address;
    }
    get baseMintAddress() {
        return this._decoded.baseMint;
    }
    get quoteMintAddress() {
        return this._decoded.quoteMint;
    }
    get bidsAddress() {
        return this._decoded.bids;
    }
    get asksAddress() {
        return this._decoded.asks;
    }
    get requestQueueAddress() {
        return this._decoded.requestQueue;
    }
    get eventQueueAddress() {
        return this._decoded.eventQueue;
    }
    get baseVaultAddress() {
        return this._decoded.baseVault;
    }
    get quoteVaultAddress() {
        return this._decoded.quoteVault;
    }
    get epochStartTs() {
        return this._decoded.epochStartTs;
    }
    get epochLength() {
        return this._decoded.epochLength;
    }
    get startEpochSeqNum() {
        return this._decoded.startEpochSeqNum;
    }
    get decoded() {
        return this._decoded;
    }
    async loadBids(connection) {
        const { data } = throwIfNull(await connection.getAccountInfo(this._decoded.bids));
        return Orderbook.decode(this, data);
    }
    async loadAsks(connection) {
        const { data } = throwIfNull(await connection.getAccountInfo(this._decoded.asks));
        return Orderbook.decode(this, data);
    }
    async loadRequestQueue(connection) {
        const { data } = throwIfNull(await connection.getAccountInfo(this._decoded.requestQueue));
        return (0, queue_1.decodeRequestQueue)(data);
    }
    async loadEventQueue(connection) {
        const { data } = throwIfNull(await connection.getAccountInfo(this._decoded.eventQueue));
        return (0, queue_1.decodeEventQueue)(data);
    }
    get _baseSplTokenMultiplier() {
        return new bn_js_1.default(10).pow(new bn_js_1.default(this._baseSplTokenDecimals));
    }
    get _quoteSplTokenMultiplier() {
        return new bn_js_1.default(10).pow(new bn_js_1.default(this._quoteSplTokenDecimals));
    }
    priceLotsToNumber(price) {
        return divideBnToNumber(price.mul(this._decoded.quoteLotSize).mul(this._baseSplTokenMultiplier), this._decoded.baseLotSize.mul(this._quoteSplTokenMultiplier));
    }
    priceNumberToLots(price) {
        return new bn_js_1.default(Math.round((price *
            Math.pow(10, this._quoteSplTokenDecimals) *
            this._decoded.baseLotSize.toNumber()) /
            (Math.pow(10, this._baseSplTokenDecimals) *
                this._decoded.quoteLotSize.toNumber())));
    }
    baseSplSizeToNumber(size) {
        return divideBnToNumber(size, this._baseSplTokenMultiplier);
    }
    quoteSplSizeToNumber(size) {
        return divideBnToNumber(size, this._quoteSplTokenMultiplier);
    }
    baseSizeLotsToNumber(size) {
        return divideBnToNumber(size.mul(this._decoded.baseLotSize), this._baseSplTokenMultiplier);
    }
    baseSizeNumberToLots(size) {
        const native = new bn_js_1.default(Math.round(size * Math.pow(10, this._baseSplTokenDecimals)));
        // rounds down to the nearest lot size
        return native.div(this._decoded.baseLotSize);
    }
    quoteSizeLotsToNumber(size) {
        return divideBnToNumber(size.mul(this._decoded.quoteLotSize), this._quoteSplTokenMultiplier);
    }
    quoteSizeNumberToLots(size) {
        const native = new bn_js_1.default(Math.round(size * Math.pow(10, this._quoteSplTokenDecimals)));
        // rounds down to the nearest lot size
        return native.div(this._decoded.quoteLotSize);
    }
    get minOrderSize() {
        return this.baseSizeLotsToNumber(new bn_js_1.default(1));
    }
    get tickSize() {
        return this.priceLotsToNumber(new bn_js_1.default(1));
    }
}
exports.Market = Market;
exports._OPEN_ORDERS_LAYOUT_V2 = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.blob)(5),
    (0, layout_1.accountFlagsLayout)("accountFlags"),
    (0, layout_1.publicKeyLayout)("market"),
    (0, layout_1.publicKeyLayout)("owner"),
    // These are in spl-token (i.e. not lot) units
    (0, layout_1.u64)("baseTokenFree"),
    (0, layout_1.u64)("baseTokenTotal"),
    (0, layout_1.u64)("quoteTokenFree"),
    (0, layout_1.u64)("quoteTokenTotal"),
    (0, layout_1.u128)("freeSlotBits"),
    (0, layout_1.u128)("isBidBits"),
    (0, buffer_layout_1.seq)((0, layout_1.u128)(), 128, "orders"),
    (0, buffer_layout_1.seq)((0, layout_1.u64)(), 128, "clientIds"),
    (0, layout_1.u64)("referrerRebatesAccrued"),
    (0, buffer_layout_1.blob)(7),
]);
class OpenOrders {
    constructor(address, decoded, programId) {
        this.address = address;
        this._programId = programId;
        Object.assign(this, decoded);
    }
    static async load(connection, address, programId) {
        const accountInfo = await connection.getAccountInfo(address);
        if (accountInfo === null) {
            throw new Error("Open orders account not found");
        }
        return OpenOrders.fromAccountInfo(address, accountInfo, programId);
    }
    static fromAccountInfo(address, accountInfo, programId) {
        const { owner, data } = accountInfo;
        if (!owner.equals(programId)) {
            throw new Error("Address not owned by program");
        }
        const decoded = exports._OPEN_ORDERS_LAYOUT_V2.decode(data);
        if (!decoded.accountFlags.initialized || !decoded.accountFlags.openOrders) {
            throw new Error("Invalid open orders account");
        }
        return new OpenOrders(address, decoded, programId);
    }
}
exports.OpenOrders = OpenOrders;
exports.ORDERBOOK_LAYOUT = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.blob)(5),
    (0, layout_1.accountFlagsLayout)("accountFlags"),
    slab_1.SLAB_LAYOUT.replicate("slab"),
    (0, buffer_layout_1.blob)(7),
]);
class Orderbook {
    constructor(market, accountFlags, slab) {
        if (!accountFlags.initialized || !(accountFlags.bids ^ accountFlags.asks)) {
            throw new Error("Invalid orderbook");
        }
        this.market = market;
        this.isBids = accountFlags.bids;
        this.slab = slab;
    }
    static get LAYOUT() {
        return exports.ORDERBOOK_LAYOUT;
    }
    static decode(market, buffer) {
        const { accountFlags, slab } = exports.ORDERBOOK_LAYOUT.decode(buffer);
        return new Orderbook(market, accountFlags, slab);
    }
    [Symbol.iterator]() {
        return this.items(false);
    }
    *items(descending = false) {
        for (const { key, ownerSlot, owner, quantity, feeTier, clientOrderId, tifOffset, } of this.slab.items(descending)) {
            const price = getPriceFromKey(key);
            yield {
                orderId: key,
                clientId: clientOrderId,
                openOrdersAddress: owner,
                openOrdersSlot: ownerSlot,
                feeTier,
                price: this.market.priceLotsToNumber(price),
                priceLots: price,
                size: this.market.baseSizeLotsToNumber(quantity),
                sizeLots: quantity,
                side: (this.isBids ? "buy" : "sell"),
                tifOffset: tifOffset.toNumber(),
                tifOffsetBN: tifOffset,
            };
        }
    }
}
exports.Orderbook = Orderbook;
function getPriceFromKey(key) {
    return key.ushrn(64);
}
function divideBnToNumber(numerator, denominator) {
    const quotient = numerator.div(denominator).toNumber();
    const rem = numerator.umod(denominator);
    const gcd = rem.gcd(denominator);
    return quotient + rem.div(gcd).toNumber() / denominator.div(gcd).toNumber();
}
const MINT_LAYOUT = (0, buffer_layout_1.struct)([(0, buffer_layout_1.blob)(44), (0, buffer_layout_1.u8)("decimals"), (0, buffer_layout_1.blob)(37)]);
async function getMintDecimals(connection, mint) {
    if (mint.equals(new web3_js_1.PublicKey("So11111111111111111111111111111111111111112"))) {
        return 9;
    }
    const { data } = throwIfNull(await connection.getAccountInfo(mint), "mint not found");
    const { decimals } = MINT_LAYOUT.decode(data);
    return decimals;
}
exports.getMintDecimals = getMintDecimals;
function throwIfNull(value, message = "account not found") {
    if (value === null) {
        throw new Error(message);
    }
    return value;
}
