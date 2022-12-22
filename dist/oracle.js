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
exports.Oracle = void 0;
const oracle_utils_1 = require("./oracle-utils");
const exchange_1 = require("./exchange");
const constants = __importStar(require("./constants"));
const _1 = require("./");
class Oracle {
    constructor(network, connection) {
        this._network = network;
        this._connection = connection;
        this._subscriptionIds = new Map();
        this._data = new Map();
        this._callback = undefined;
    }
    getAvailablePriceFeeds() {
        return Object.keys(constants.PYTH_PRICE_FEEDS[this._network]);
    }
    getPrice(asset) {
        if (!this._data.has(asset)) {
            return null;
        }
        return this._data.get(asset);
    }
    getPriceAge(asset) {
        return Date.now() / 1000 - this.getPrice(asset).lastUpdatedTime;
    }
    // Allows fetching of any pyth oracle price.
    async fetchPrice(oracleKey) {
        let accountInfo = await this._connection.getAccountInfo(oracleKey);
        let priceData = (0, oracle_utils_1.parsePythData)(accountInfo.data);
        return priceData.price;
    }
    // Fetch and update an oracle price manually
    async pollPrice(asset, triggerCallback = true) {
        if (!(asset in constants.PYTH_PRICE_FEEDS[this._network])) {
            throw Error("Invalid Oracle feed, no matching asset!");
        }
        let priceAddress = constants.PYTH_PRICE_FEEDS[this._network][asset];
        let accountInfo = await this._connection.getAccountInfo(priceAddress);
        let priceData = (0, oracle_utils_1.parsePythData)(accountInfo.data);
        let oracleData = {
            asset,
            price: priceData.price,
            lastUpdatedTime: exchange_1.exchange.clockTimestamp,
            lastUpdatedSlot: priceData.publishSlot,
        };
        this._data.set(asset, oracleData);
        if (triggerCallback) {
            this._callback(asset, oracleData);
        }
        return oracleData;
    }
    async subscribePriceFeeds(assetList, callback) {
        if (this._callback != undefined) {
            throw Error("Oracle price feeds already subscribed to!");
        }
        this._callback = callback;
        await Promise.all(assetList.map(async (asset) => {
            console.log(`Oracle subscribing to feed ${_1.assets.assetToName(asset)}`);
            let priceAddress = constants.PYTH_PRICE_FEEDS[this._network][asset];
            let subscriptionId = this._connection.onAccountChange(priceAddress, (accountInfo, _context) => {
                let priceData = (0, oracle_utils_1.parsePythData)(accountInfo.data);
                let currPrice = this._data.get(asset);
                if (currPrice !== undefined &&
                    currPrice.price === priceData.price) {
                    return;
                }
                let oracleData = {
                    asset,
                    price: priceData.price,
                    lastUpdatedTime: exchange_1.exchange.clockTimestamp,
                    lastUpdatedSlot: priceData.publishSlot,
                };
                this._data.set(asset, oracleData);
                this._callback(asset, oracleData);
            }, exchange_1.exchange.provider.connection.commitment);
            this._subscriptionIds.set(asset, subscriptionId);
            // Set this so the oracle contains a price on initialization.
            await this.pollPrice(asset, true);
        }));
    }
    async close() {
        for (let subscriptionId of this._subscriptionIds.values()) {
            await this._connection.removeAccountChangeListener(subscriptionId);
        }
    }
}
exports.Oracle = Oracle;
