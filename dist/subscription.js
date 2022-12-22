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
exports.subscribeProgramAccounts = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
const bs58 = __importStar(require("bs58"));
const exchange_1 = require("./exchange");
function subscribeProgramAccounts(asset, accountType, callback) {
    const discriminator = anchor.BorshAccountsCoder.accountDiscriminator(accountType);
    const subscriptionId = exchange_1.exchange.connection.onProgramAccountChange(exchange_1.exchange.programId, async (keyedAccountInfo, context) => {
        let acc = exchange_1.exchange.program.account.marginAccount.coder.accounts.decode(accountType, keyedAccountInfo.accountInfo.data);
        callback({ key: keyedAccountInfo.accountId, account: acc, context });
    }, "confirmed", [
        {
            memcmp: {
                offset: 0,
                bytes: bs58.encode(discriminator),
            },
        },
    ]);
    exchange_1.exchange.addProgramSubscriptionId(subscriptionId);
}
exports.subscribeProgramAccounts = subscribeProgramAccounts;
