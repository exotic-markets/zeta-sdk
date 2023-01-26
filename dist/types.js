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
exports.defaultOrderOptions = exports.fromProgramOrderCompleteType = exports.OrderCompleteType = exports.isMarketMaker = exports.fromProgramMarginAccountType = exports.MarginAccountType = exports.toProgramTreasuryMovementType = exports.TreasuryMovementType = exports.toProgramMovementType = exports.MovementType = exports.ProgramAccountType = exports.MarginType = exports.positionEquals = exports.orderEquals = exports.toProductKind = exports.Kind = exports.fromProgramSide = exports.toProgramSide = exports.Side = exports.toProgramOrderType = exports.OrderType = exports.DummyWallet = void 0;
const utils_1 = require("./utils");
const constants = __importStar(require("./constants"));
class DummyWallet {
    constructor() { }
    async signTransaction(_tx) {
        throw Error("Not supported by dummy wallet!");
    }
    async signAllTransactions(_txs) {
        throw Error("Not supported by dummy wallet!");
    }
    get publicKey() {
        throw Error("Not supported by dummy wallet!");
    }
}
exports.DummyWallet = DummyWallet;
var OrderType;
(function (OrderType) {
    OrderType[OrderType["LIMIT"] = 0] = "LIMIT";
    OrderType[OrderType["POSTONLY"] = 1] = "POSTONLY";
    OrderType[OrderType["FILLORKILL"] = 2] = "FILLORKILL";
    OrderType[OrderType["IMMEDIATEORCANCEL"] = 3] = "IMMEDIATEORCANCEL";
    OrderType[OrderType["POSTONLYSLIDE"] = 4] = "POSTONLYSLIDE";
})(OrderType = exports.OrderType || (exports.OrderType = {}));
function toProgramOrderType(orderType) {
    if (orderType == OrderType.LIMIT)
        return { limit: {} };
    if (orderType == OrderType.POSTONLY)
        return { postOnly: {} };
    if (orderType == OrderType.FILLORKILL)
        return { fillOrKill: {} };
    if (orderType == OrderType.IMMEDIATEORCANCEL)
        return { immediateOrCancel: {} };
    if (orderType == OrderType.POSTONLYSLIDE)
        return { postOnlySlide: {} };
}
exports.toProgramOrderType = toProgramOrderType;
var Side;
(function (Side) {
    Side[Side["BID"] = 0] = "BID";
    Side[Side["ASK"] = 1] = "ASK";
})(Side = exports.Side || (exports.Side = {}));
function toProgramSide(side) {
    if (side == Side.BID)
        return { bid: {} };
    if (side == Side.ASK)
        return { ask: {} };
    throw Error("Invalid side");
}
exports.toProgramSide = toProgramSide;
function fromProgramSide(side) {
    if ((0, utils_1.objectEquals)(side, { bid: {} })) {
        return Side.BID;
    }
    if ((0, utils_1.objectEquals)(side, { ask: {} })) {
        return Side.ASK;
    }
    throw Error("Invalid program side!");
}
exports.fromProgramSide = fromProgramSide;
var Kind;
(function (Kind) {
    Kind["UNINITIALIZED"] = "uninitialized";
    Kind["CALL"] = "call";
    Kind["PUT"] = "put";
    Kind["FUTURE"] = "future";
    Kind["PERP"] = "perp";
})(Kind = exports.Kind || (exports.Kind = {}));
function toProductKind(kind) {
    if (Object.keys(kind).includes(Kind.CALL))
        return Kind.CALL;
    if (Object.keys(kind).includes(Kind.PUT))
        return Kind.PUT;
    if (Object.keys(kind).includes(Kind.FUTURE))
        return Kind.FUTURE;
    if (Object.keys(kind).includes(Kind.PERP))
        return Kind.PERP;
    // We don't expect uninitialized.
    throw Error("Invalid product type");
}
exports.toProductKind = toProductKind;
function orderEquals(a, b, cmpOrderId = false) {
    let orderIdMatch = true;
    if (cmpOrderId) {
        orderIdMatch = a.orderId.eq(b.orderId);
    }
    return (a.marketIndex === b.marketIndex &&
        a.market.equals(b.market) &&
        a.price === b.price &&
        a.size === b.size &&
        a.side === b.side &&
        a.tifOffset === b.tifOffset &&
        orderIdMatch);
}
exports.orderEquals = orderEquals;
function positionEquals(a, b) {
    return (a.marketIndex === b.marketIndex &&
        a.market.equals(b.market) &&
        a.size === b.size &&
        a.costOfTrades === b.costOfTrades);
}
exports.positionEquals = positionEquals;
var MarginType;
(function (MarginType) {
    /**
     * Margin for orders.
     */
    MarginType["INITIAL"] = "initial";
    /**
     * Margin for positions.
     */
    MarginType["MAINTENANCE"] = "maintenance";
})(MarginType = exports.MarginType || (exports.MarginType = {}));
var ProgramAccountType;
(function (ProgramAccountType) {
    ProgramAccountType["MarginAccount"] = "MarginAccount";
    ProgramAccountType["SpreadAccount"] = "SpreadAccount";
})(ProgramAccountType = exports.ProgramAccountType || (exports.ProgramAccountType = {}));
var MovementType;
(function (MovementType) {
    MovementType[MovementType["LOCK"] = 1] = "LOCK";
    MovementType[MovementType["UNLOCK"] = 2] = "UNLOCK";
})(MovementType = exports.MovementType || (exports.MovementType = {}));
function toProgramMovementType(movementType) {
    if (movementType == MovementType.LOCK)
        return { lock: {} };
    if (movementType == MovementType.UNLOCK)
        return { unlock: {} };
    throw Error("Invalid movement type");
}
exports.toProgramMovementType = toProgramMovementType;
var TreasuryMovementType;
(function (TreasuryMovementType) {
    TreasuryMovementType[TreasuryMovementType["TO_TREASURY_FROM_INSURANCE"] = 1] = "TO_TREASURY_FROM_INSURANCE";
    TreasuryMovementType[TreasuryMovementType["TO_INSURANCE_FROM_TREASURY"] = 2] = "TO_INSURANCE_FROM_TREASURY";
    TreasuryMovementType[TreasuryMovementType["TO_TREASURY_FROM_REFERRALS_REWARDS"] = 3] = "TO_TREASURY_FROM_REFERRALS_REWARDS";
    TreasuryMovementType[TreasuryMovementType["TO_REFERRALS_REWARDS_FROM_TREASURY"] = 4] = "TO_REFERRALS_REWARDS_FROM_TREASURY";
})(TreasuryMovementType = exports.TreasuryMovementType || (exports.TreasuryMovementType = {}));
function toProgramTreasuryMovementType(treasuryMovementType) {
    if (treasuryMovementType == TreasuryMovementType.TO_TREASURY_FROM_INSURANCE)
        return { toTreasuryFromInsurance: {} };
    if (treasuryMovementType == TreasuryMovementType.TO_INSURANCE_FROM_TREASURY)
        return { toInsuranceFromTreasury: {} };
    if (treasuryMovementType ==
        TreasuryMovementType.TO_TREASURY_FROM_REFERRALS_REWARDS)
        return { toTreasuryFromReferralsRewards: {} };
    if (treasuryMovementType ==
        TreasuryMovementType.TO_REFERRALS_REWARDS_FROM_TREASURY)
        return { toReferralsRewardsFromTreasury: {} };
    throw Error("Invalid treasury movement type");
}
exports.toProgramTreasuryMovementType = toProgramTreasuryMovementType;
var MarginAccountType;
(function (MarginAccountType) {
    MarginAccountType[MarginAccountType["NORMAL"] = 0] = "NORMAL";
    MarginAccountType[MarginAccountType["MARKET_MAKER"] = 1] = "MARKET_MAKER";
})(MarginAccountType = exports.MarginAccountType || (exports.MarginAccountType = {}));
function fromProgramMarginAccountType(accountType) {
    if ((0, utils_1.objectEquals)(accountType, { normal: {} })) {
        return MarginAccountType.NORMAL;
    }
    if ((0, utils_1.objectEquals)(accountType, { marketMaker: {} })) {
        return MarginAccountType.MARKET_MAKER;
    }
    throw Error("Invalid margin account type");
}
exports.fromProgramMarginAccountType = fromProgramMarginAccountType;
function isMarketMaker(marginAccount) {
    return (fromProgramMarginAccountType(marginAccount.accountType) ==
        MarginAccountType.MARKET_MAKER);
}
exports.isMarketMaker = isMarketMaker;
var OrderCompleteType;
(function (OrderCompleteType) {
    OrderCompleteType[OrderCompleteType["CANCEL"] = 0] = "CANCEL";
    OrderCompleteType[OrderCompleteType["FILL"] = 1] = "FILL";
    OrderCompleteType[OrderCompleteType["BOOTED"] = 2] = "BOOTED";
})(OrderCompleteType = exports.OrderCompleteType || (exports.OrderCompleteType = {}));
function fromProgramOrderCompleteType(orderCompleteType) {
    if ((0, utils_1.objectEquals)(orderCompleteType, { cancel: {} })) {
        return OrderCompleteType.CANCEL;
    }
    if ((0, utils_1.objectEquals)(orderCompleteType, { fill: {} })) {
        return OrderCompleteType.FILL;
    }
    if ((0, utils_1.objectEquals)(orderCompleteType, { booted: {} })) {
        return OrderCompleteType.BOOTED;
    }
    throw Error("Invalid order complete type");
}
exports.fromProgramOrderCompleteType = fromProgramOrderCompleteType;
function defaultOrderOptions() {
    return {
        tifOptions: {
            expiryOffset: undefined,
            expiryTs: undefined,
        },
        orderType: OrderType.LIMIT,
        clientOrderId: 0,
        tag: constants.DEFAULT_ORDER_TAG,
        blockhash: undefined,
    };
}
exports.defaultOrderOptions = defaultOrderOptions;
