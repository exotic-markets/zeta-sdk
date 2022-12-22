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
exports.OpenOrders = exports.SerumMarket = exports.subscription = exports.Market = exports.Wallet = exports.idl = exports.events = exports.riskUtils = exports.risk = exports.programTypes = exports.Oracle = exports.errors = exports.Network = exports.network = exports.InsuranceClient = exports.instructions = exports.Decimal = exports.Client = exports.SubClient = exports.types = exports.constants = exports.Exchange = exports.SubExchange = exports.utils = exports.assets = void 0;
// Singleton
const exchange_1 = require("./exchange");
Object.defineProperty(exports, "Exchange", { enumerable: true, get: function () { return exchange_1.exchange; } });
const subexchange_1 = require("./subexchange");
Object.defineProperty(exports, "SubExchange", { enumerable: true, get: function () { return subexchange_1.SubExchange; } });
const subclient_1 = require("./subclient");
Object.defineProperty(exports, "SubClient", { enumerable: true, get: function () { return subclient_1.SubClient; } });
const client_1 = require("./client");
Object.defineProperty(exports, "Client", { enumerable: true, get: function () { return client_1.Client; } });
const insurance_client_1 = require("./insurance-client");
Object.defineProperty(exports, "InsuranceClient", { enumerable: true, get: function () { return insurance_client_1.InsuranceClient; } });
const network_1 = require("./network");
Object.defineProperty(exports, "Network", { enumerable: true, get: function () { return network_1.Network; } });
const decimal_1 = require("./decimal");
Object.defineProperty(exports, "Decimal", { enumerable: true, get: function () { return decimal_1.Decimal; } });
const oracle_1 = require("./oracle");
Object.defineProperty(exports, "Oracle", { enumerable: true, get: function () { return oracle_1.Oracle; } });
const zeta_json_1 = __importDefault(require("./idl/zeta.json"));
exports.idl = zeta_json_1.default;
const anchor_1 = require("@project-serum/anchor");
Object.defineProperty(exports, "Wallet", { enumerable: true, get: function () { return anchor_1.Wallet; } });
const market_1 = require("./market");
Object.defineProperty(exports, "Market", { enumerable: true, get: function () { return market_1.Market; } });
const network = __importStar(require("./network"));
exports.network = network;
const assets = __importStar(require("./assets"));
exports.assets = assets;
const errors = __importStar(require("./errors"));
exports.errors = errors;
const utils = __importStar(require("./utils"));
exports.utils = utils;
const constants = __importStar(require("./constants"));
exports.constants = constants;
const types = __importStar(require("./types"));
exports.types = types;
const instructions = __importStar(require("./program-instructions"));
exports.instructions = instructions;
const programTypes = __importStar(require("./program-types"));
exports.programTypes = programTypes;
const risk = __importStar(require("./risk"));
exports.risk = risk;
const riskUtils = __importStar(require("./risk-utils"));
exports.riskUtils = riskUtils;
const events = __importStar(require("./events"));
exports.events = events;
const subscription = __importStar(require("./subscription"));
exports.subscription = subscription;
const market_2 = require("./serum/market");
Object.defineProperty(exports, "SerumMarket", { enumerable: true, get: function () { return market_2.Market; } });
Object.defineProperty(exports, "OpenOrders", { enumerable: true, get: function () { return market_2.OpenOrders; } });
