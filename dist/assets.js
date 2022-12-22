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
exports.assetToIndex = exports.indexToAsset = exports.fromProgramAsset = exports.toProgramAsset = exports.getAssetMint = exports.nameToAsset = exports.assetToName = exports.allAssets = exports.isValidStr = exports.isValidType = exports.Asset = void 0;
const utils_1 = require("./utils");
// Ordered in underlying sequence number.
var Asset;
(function (Asset) {
    Asset["SOL"] = "SOL";
    Asset["BTC"] = "BTC";
    Asset["ETH"] = "ETH";
    Asset["UNDEFINED"] = "UNDEFINED";
})(Asset = exports.Asset || (exports.Asset = {}));
const constants = __importStar(require("./constants"));
function isValidType(asset) {
    try {
        assetToName(asset);
    }
    catch (e) {
        return false;
    }
    return true;
}
exports.isValidType = isValidType;
function isValidStr(asset) {
    try {
        nameToAsset(asset);
    }
    catch (e) {
        return false;
    }
    return true;
}
exports.isValidStr = isValidStr;
function allAssets() {
    let allAssets = [];
    for (var a in Asset) {
        if (typeof Asset[a] === "string" && a != "UNDEFINED") {
            allAssets.push(nameToAsset(a));
        }
    }
    return allAssets;
}
exports.allAssets = allAssets;
function assetToName(asset) {
    if (asset == Asset.SOL)
        return "SOL";
    if (asset == Asset.BTC)
        return "BTC";
    if (asset == Asset.ETH)
        return "ETH";
    if (asset == Asset.UNDEFINED)
        return "UNDEFINED";
    if (asset == null)
        return null; // Some things, like clock callbacks, are for all assets and return asset=null
    throw Error("Invalid asset");
}
exports.assetToName = assetToName;
function nameToAsset(name) {
    if (name == "SOL")
        return Asset.SOL;
    if (name == "BTC")
        return Asset.BTC;
    if (name == "ETH")
        return Asset.ETH;
    if (name == "UNDEFINED")
        return Asset.UNDEFINED;
    throw Error("Invalid asset");
}
exports.nameToAsset = nameToAsset;
function getAssetMint(asset) {
    return constants.MINTS[asset];
}
exports.getAssetMint = getAssetMint;
function toProgramAsset(asset) {
    if (asset == Asset.SOL)
        return { sol: {} };
    if (asset == Asset.BTC)
        return { btc: {} };
    if (asset == Asset.ETH)
        return { eth: {} };
    throw Error("Invalid asset");
}
exports.toProgramAsset = toProgramAsset;
function fromProgramAsset(asset) {
    if ((0, utils_1.objectEquals)(asset, { sol: {} })) {
        return Asset.SOL;
    }
    if ((0, utils_1.objectEquals)(asset, { btc: {} })) {
        return Asset.BTC;
    }
    if ((0, utils_1.objectEquals)(asset, { eth: {} })) {
        return Asset.ETH;
    }
    throw Error("Invalid asset");
}
exports.fromProgramAsset = fromProgramAsset;
function indexToAsset(index) {
    switch (index) {
        case 0: {
            return Asset.SOL;
        }
        case 1: {
            return Asset.BTC;
        }
        case 2: {
            return Asset.ETH;
        }
    }
    throw new Error("Invalid index");
}
exports.indexToAsset = indexToAsset;
function assetToIndex(asset) {
    switch (asset) {
        case Asset.SOL: {
            return 0;
        }
        case Asset.BTC: {
            return 1;
        }
        case Asset.ETH: {
            return 2;
        }
    }
    throw new Error("Invalid asset");
}
exports.assetToIndex = assetToIndex;
