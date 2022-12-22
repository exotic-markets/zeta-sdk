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
exports.RiskCalculator = void 0;
const exchange_1 = require("./exchange");
const types = __importStar(require("./types"));
const constants = __importStar(require("./constants"));
const utils_1 = require("./utils");
const assets_1 = require("./assets");
const anchor_1 = require("@project-serum/anchor");
const _1 = require(".");
const lodash_1 = require("lodash");
const risk_utils_1 = require("./risk-utils");
class RiskCalculator {
    constructor(assets) {
        this._marginRequirements = new Map();
        this._perpMarginRequirements = new Map();
        for (var asset of assets) {
            this._marginRequirements.set(asset, new Array(constants.ACTIVE_MARKETS - 1));
        }
    }
    getMarginRequirements(asset) {
        return this._marginRequirements.get(asset);
    }
    getPerpMarginRequirements(asset) {
        return this._perpMarginRequirements.get(asset);
    }
    updateMarginRequirements(asset) {
        if (exchange_1.exchange.getSubExchange(asset).greeks === undefined ||
            exchange_1.exchange.oracle === undefined) {
            throw Error("Pricing (greeks and/or oracle) is not initialized");
        }
        let oraclePrice = exchange_1.exchange.oracle.getPrice(asset);
        let spotPrice = oraclePrice === null ? 0 : oraclePrice.price;
        for (var i = 0; i < this._marginRequirements.get(asset).length; i++) {
            this._marginRequirements.get(asset)[i] = (0, risk_utils_1.calculateProductMargin)(asset, i, spotPrice);
        }
        this._perpMarginRequirements.set(asset, (0, risk_utils_1.calculateProductMargin)(asset, constants.PERP_INDEX, spotPrice));
    }
    /**
     * Returns the margin requirement for a given market and size.
     * @param asset          underlying asset type.
     * @param productIndex   market index of the product to calculate margin for.
     * @param size           signed integer of size for margin requirements (short orders should be negative)
     * @param marginType     type of margin calculation.
     */
    getMarginRequirement(asset, productIndex, size, marginType) {
        let marginRequirement = productIndex == constants.PERP_INDEX
            ? this._perpMarginRequirements.get(asset)
            : this._marginRequirements.get(asset)[productIndex];
        return this.calculateMarginRequirement(marginRequirement, size, marginType);
    }
    getPerpMarginRequirement(asset, size, marginType) {
        return this.calculateMarginRequirement(this._perpMarginRequirements.get(asset), size, marginType);
    }
    calculateMarginRequirement(marginRequirement, size, marginType) {
        if (marginRequirement === null) {
            return null;
        }
        if (size > 0) {
            if (marginType == types.MarginType.INITIAL) {
                return size * marginRequirement.initialLong;
            }
            else {
                return size * marginRequirement.maintenanceLong;
            }
        }
        else {
            if (marginType == types.MarginType.INITIAL) {
                return Math.abs(size) * marginRequirement.initialShort;
            }
            else {
                return Math.abs(size) * marginRequirement.maintenanceShort;
            }
        }
    }
    /**
     * Returns the size of an order that would be considered "opening", when applied to margin requirements.
     * Total intended trade size = closing size + opening size
     * @param size           signed integer of size for margin requirements (short orders should be negative)
     * @param position       signed integer the user's current position for that product (0 if none).
     * @param closingSize    unsigned integer of the user's current closing order quantity for that product (0 if none)
     */
    calculateOpeningSize(size, position, closingSize) {
        if ((size > 0 && position > 0) || (size < 0 && position < 0)) {
            return size;
        }
        let closeSize = Math.min(Math.abs(size), Math.abs(position) - closingSize);
        let openingSize = Math.abs(size) - closeSize;
        let sideMultiplier = size >= 0 ? 1 : -1;
        return sideMultiplier * openingSize;
    }
    /**
     * Returns the unpaid funding for a given margin account.
     * @param account the user's spread (returns 0) or margin account.
     */
    calculateUnpaidFunding(account, accountType = types.ProgramAccountType
        .MarginAccount) {
        // Spread accounts cannot hold perps and therefore have no unpaid funding
        if (accountType == types.ProgramAccountType.SpreadAccount) {
            return 0;
        }
        const position = account.perpProductLedger.position;
        const size = position.size.toNumber() / Math.pow(10, constants.POSITION_PRECISION);
        let asset = (0, assets_1.fromProgramAsset)(account.asset);
        let greeks = exchange_1.exchange.getGreeks(asset);
        let deltaDiff = (_1.Decimal.fromAnchorDecimal(greeks.perpFundingDelta).toNumber() -
            _1.Decimal.fromAnchorDecimal(account.lastFundingDelta).toNumber()) /
            Math.pow(10, constants.PLATFORM_PRECISION);
        // Note that there is some rounding occurs here in the Zeta program
        // but we omit it in this function for simplicity
        return -1 * size * deltaDiff;
    }
    /**
     * Returns the unrealized pnl for a given margin or spread account.
     * @param account the user's spread or margin account.
     */
    calculateUnrealizedPnl(account, accountType = types.ProgramAccountType
        .MarginAccount) {
        let pnl = 0;
        let i_list = [...Array(constants.ACTIVE_MARKETS - 1).keys()];
        i_list.push(constants.PERP_INDEX);
        for (var i of i_list) {
            // No perps in spread accounts
            if (i == constants.PERP_INDEX &&
                accountType == types.ProgramAccountType.SpreadAccount) {
                continue;
            }
            const position = accountType == types.ProgramAccountType.MarginAccount
                ? i == constants.PERP_INDEX
                    ? account.perpProductLedger.position // Margin account perp
                    : account.productLedgers[i].position // Margin account non-perp
                : account.positions[i]; // Spread account
            const size = position.size.toNumber();
            if (size == 0) {
                continue;
            }
            let subExchange = exchange_1.exchange.getSubExchange((0, assets_1.fromProgramAsset)(account.asset));
            if (size > 0) {
                pnl +=
                    (0, utils_1.convertNativeLotSizeToDecimal)(size) * subExchange.getMarkPrice(i) -
                        (0, utils_1.convertNativeBNToDecimal)(position.costOfTrades);
            }
            else {
                pnl +=
                    (0, utils_1.convertNativeLotSizeToDecimal)(size) * subExchange.getMarkPrice(i) +
                        (0, utils_1.convertNativeBNToDecimal)(position.costOfTrades);
            }
        }
        return pnl;
    }
    /**
     * Returns the total initial margin requirement for a given account.
     * This includes initial margin on positions which is used for
     * Place order, withdrawal and force cancels
     * @param marginAccount   the user's MarginAccount.
     */
    calculateTotalInitialMargin(marginAccount, skipConcession = false) {
        let asset = (0, assets_1.fromProgramAsset)(marginAccount.asset);
        let marketMaker = types.isMarketMaker(marginAccount);
        let margin = 0;
        let ledgers = marginAccount.productLedgers.concat(marginAccount.perpProductLedger);
        for (var i = 0; i < ledgers.length; i++) {
            let ledger = ledgers[i];
            let size = ledger.position.size.toNumber();
            let bidOpenOrders = ledger.orderState.openingOrders[0].toNumber();
            let askOpenOrders = ledger.orderState.openingOrders[1].toNumber();
            if (bidOpenOrders == 0 && askOpenOrders == 0 && size == 0) {
                continue;
            }
            let longLots = (0, utils_1.convertNativeLotSizeToDecimal)(bidOpenOrders);
            let shortLots = (0, utils_1.convertNativeLotSizeToDecimal)(askOpenOrders);
            if (!marketMaker || skipConcession) {
                if (size > 0) {
                    longLots += Math.abs((0, utils_1.convertNativeLotSizeToDecimal)(size));
                }
                else if (size < 0) {
                    shortLots += Math.abs((0, utils_1.convertNativeLotSizeToDecimal)(size));
                }
            }
            let marginForMarket = undefined;
            let longLotsMarginReq = this.getMarginRequirement(asset, i == ledgers.length - 1 ? constants.PERP_INDEX : i, 
            // Positive for buys.
            longLots, types.MarginType.INITIAL);
            let shortLotsMarginReq = this.getMarginRequirement(asset, i == ledgers.length - 1 ? constants.PERP_INDEX : i, 
            // Negative for sells.
            -shortLots, types.MarginType.INITIAL);
            if ((i + 1) % constants.PRODUCTS_PER_EXPIRY == 0 ||
                i == constants.PERP_INDEX) {
                marginForMarket =
                    longLots > shortLots ? longLotsMarginReq : shortLotsMarginReq;
            }
            else {
                marginForMarket = longLotsMarginReq + shortLotsMarginReq;
            }
            if (marketMaker && !skipConcession) {
                // Mark initial margin to concession (only contains open order margin).
                marginForMarket *= exchange_1.exchange.state.marginConcessionPercentage / 100;
                // Add position margin which doesn't get concessions.
                marginForMarket += this.getMarginRequirement(asset, i == ledgers.length - 1 ? constants.PERP_INDEX : i, 
                // This is signed.
                (0, utils_1.convertNativeLotSizeToDecimal)(size), types.MarginType.MAINTENANCE);
            }
            if (marginForMarket !== undefined) {
                margin += marginForMarket;
            }
        }
        return margin;
    }
    /**
     * Returns the total maintenance margin requirement for a given account.
     * This only uses maintenance margin on positions and is used for
     * liquidations.
     * @param asset           underlying asset type
     * @param marginAccount   the user's MarginAccount.
     */
    calculateTotalMaintenanceMargin(marginAccount) {
        let asset = (0, assets_1.fromProgramAsset)(marginAccount.asset);
        let margin = 0;
        let ledgers = marginAccount.productLedgers.concat(marginAccount.perpProductLedger);
        for (var i = 0; i < ledgers.length; i++) {
            let position = ledgers[i].position;
            let size = position.size.toNumber();
            if (size == 0) {
                continue;
            }
            let positionMargin = this.getMarginRequirement(asset, i == ledgers.length - 1 ? constants.PERP_INDEX : i, 
            // This is signed.
            (0, utils_1.convertNativeLotSizeToDecimal)(size), types.MarginType.MAINTENANCE);
            if (positionMargin !== undefined) {
                margin += positionMargin;
            }
        }
        return margin;
    }
    /**
     * Returns the total maintenance margin requirement for a given account including orders.
     * This calculates maintenance margin across all positions and orders.
     * This value is used to determine margin when sending a closing order only.
     * @param asset           underlying asset type
     * @param marginAccount   the user's MarginAccount.
     */
    calculateTotalMaintenanceMarginIncludingOrders(marginAccount) {
        let asset = (0, assets_1.fromProgramAsset)(marginAccount.asset);
        let margin = 0;
        let ledgers = marginAccount.productLedgers.concat(marginAccount.perpProductLedger);
        for (var i = 0; i < ledgers.length; i++) {
            let ledger = ledgers[i];
            let size = ledger.position.size.toNumber();
            let bidOpenOrders = ledger.orderState.openingOrders[0].toNumber();
            let askOpenOrders = ledger.orderState.openingOrders[1].toNumber();
            if (bidOpenOrders == 0 && askOpenOrders == 0 && size == 0) {
                continue;
            }
            let longLots = (0, utils_1.convertNativeLotSizeToDecimal)(bidOpenOrders);
            let shortLots = (0, utils_1.convertNativeLotSizeToDecimal)(askOpenOrders);
            if (size > 0) {
                longLots += Math.abs((0, utils_1.convertNativeLotSizeToDecimal)(size));
            }
            else if (size < 0) {
                shortLots += Math.abs((0, utils_1.convertNativeLotSizeToDecimal)(size));
            }
            let marginForMarket = this.getMarginRequirement(asset, i == ledgers.length - 1 ? constants.PERP_INDEX : i, 
            // Positive for buys.
            longLots, types.MarginType.MAINTENANCE) +
                this.getMarginRequirement(asset, i == ledgers.length - 1 ? constants.PERP_INDEX : i, 
                // Negative for sells.
                -shortLots, types.MarginType.MAINTENANCE);
            if (marginForMarket !== undefined) {
                margin += marginForMarket;
            }
        }
        return margin;
    }
    /**
     * Returns the aggregate margin account state.
     * @param marginAccount   the user's MarginAccount.
     */
    getMarginAccountState(marginAccount) {
        let balance = (0, utils_1.convertNativeBNToDecimal)(marginAccount.balance);
        let unrealizedPnl = this.calculateUnrealizedPnl(marginAccount);
        let unpaidFunding = this.calculateUnpaidFunding(marginAccount);
        let initialMargin = this.calculateTotalInitialMargin(marginAccount);
        let initialMarginSkipConcession = this.calculateTotalInitialMargin(marginAccount, true);
        let maintenanceMargin = this.calculateTotalMaintenanceMargin(marginAccount);
        let availableBalanceInitial = balance + unrealizedPnl + unpaidFunding - initialMargin;
        let availableBalanceWithdrawable = balance + unrealizedPnl + unpaidFunding - initialMarginSkipConcession;
        let availableBalanceMaintenance = balance + unrealizedPnl + unpaidFunding - maintenanceMargin;
        return {
            balance,
            initialMargin,
            initialMarginSkipConcession,
            maintenanceMargin,
            unrealizedPnl,
            unpaidFunding,
            availableBalanceInitial,
            availableBalanceMaintenance,
            availableBalanceWithdrawable,
        };
    }
    calculatePositionMovement(user, asset, movementType, movements) {
        if (movements.length > constants.MAX_POSITION_MOVEMENTS) {
            throw Error("Exceeded max position movements.");
        }
        let marginAccount = user.getMarginAccount(asset);
        let spreadAccount = user.getSpreadAccount(asset);
        if (spreadAccount === null) {
            let positions = [];
            let positionsPadding = [];
            let seriesExpiry = [];
            for (let i = 0; i < constants.ACTIVE_MARKETS - 1; i++) {
                positions.push({
                    size: new anchor_1.BN(0),
                    costOfTrades: new anchor_1.BN(0),
                });
            }
            for (let i = 0; i < constants.TOTAL_MARKETS; i++) {
                positionsPadding.push({
                    size: new anchor_1.BN(0),
                    costOfTrades: new anchor_1.BN(0),
                });
            }
            for (let i = 0; i < constants.TOTAL_MARKETS - (constants.ACTIVE_MARKETS - 1); i++) {
                seriesExpiry.push(new anchor_1.BN(0));
            }
            spreadAccount = {
                authority: marginAccount.authority,
                nonce: 0,
                balance: new anchor_1.BN(0),
                seriesExpiry,
                seriesExpiryPadding: new anchor_1.BN(0),
                positions,
                positionsPadding,
                asset: _1.assets.toProgramAsset(asset),
                padding: new Array(262).fill(0),
            };
        }
        // Copy account objects to perform simulated position movement
        let simulatedMarginAccount = (0, lodash_1.cloneDeep)(marginAccount);
        let simulatedSpreadAccount = (0, lodash_1.cloneDeep)(spreadAccount);
        let nativeSpot = _1.utils.convertDecimalToNativeInteger(exchange_1.exchange.oracle.getPrice(asset).price);
        // Perform movement by movement type onto new margin and spread accounts
        (0, risk_utils_1.movePositions)(exchange_1.exchange.getZetaGroup(asset), simulatedSpreadAccount, simulatedMarginAccount, movementType, movements);
        // Calculate margin requirements for new margin and spread accounts
        // Calculate margin requirements for old margin and spread accounts
        let totalContracts = 0;
        for (let i = 0; i < movements.length; i++) {
            totalContracts = totalContracts + Math.abs(movements[i].size.toNumber());
        }
        let movementNotional = (0, risk_utils_1.calculateNormalizedCostOfTrades)(nativeSpot, totalContracts);
        let movementFees = (movementNotional / constants.BPS_DENOMINATOR) *
            exchange_1.exchange.state.positionMovementFeeBps;
        simulatedMarginAccount.balance = new anchor_1.BN(simulatedMarginAccount.balance.toNumber() - movementFees);
        simulatedMarginAccount.rebalanceAmount = new anchor_1.BN(simulatedMarginAccount.rebalanceAmount.toNumber() + movementFees);
        if (!(0, risk_utils_1.checkMarginAccountMarginRequirement)(simulatedMarginAccount))
            throw Error("Failed maintenance margin requirement.");
        // Temporarily add limitation for maximum contracts locked as a safety.
        // Set to 100k total contracts for now.
        totalContracts = 0;
        for (let i = 0; i < simulatedSpreadAccount.positions.length; i++) {
            totalContracts =
                totalContracts +
                    Math.abs(simulatedSpreadAccount.positions[i].size.toNumber());
        }
        if (totalContracts > constants.MAX_TOTAL_SPREAD_ACCOUNT_CONTRACTS)
            throw Error("Exceeded max spread account contracts.");
        let netTransfer = simulatedSpreadAccount.balance.toNumber() -
            spreadAccount.balance.toNumber();
        return {
            netBalanceTransfer: new anchor_1.BN(netTransfer),
            marginAccountBalance: simulatedMarginAccount.balance,
            spreadAccountBalance: simulatedSpreadAccount.balance,
            movementFees: new anchor_1.BN(movementFees),
        };
    }
}
exports.RiskCalculator = RiskCalculator;
