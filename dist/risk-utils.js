"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateNormalizedCostOfTrades = exports.lockSpreadAccountPosition = exports.handleExecutionCostOfTrades = exports.movePositions = exports.checkMarginAccountMarginRequirement = exports.calculatePutCumPnl = exports.calculateSpreadAccountMarginRequirement = exports.calculateLongOptionMargin = exports.calculateShortOptionMargin = exports.calculateOptionMargin = exports.calculatePerpMargin = exports.calculateFutureMargin = exports.calculateProductMargin = exports.calculateOtmAmount = exports.calculateLiquidationPrice = void 0;
const anchor_1 = require("@project-serum/anchor");
const _1 = require(".");
const utils_1 = require("./utils");
/**
 * Calculates the price at which a position will be liquidated.
 * @param accountBalance    margin account balance.
 * @param marginRequirement total margin requirement for margin account.
 * @param unrealizedPnl     unrealized pnl for margin account.
 * @param markPrice         mark price of product being calculated.
 * @param position          signed position size of user.
 */
function calculateLiquidationPrice(accountBalance, marginRequirement, unrealizedPnl, markPrice, position) {
    if (position == 0) {
        return 0;
    }
    let availableBalance = accountBalance - marginRequirement + unrealizedPnl;
    return markPrice - availableBalance / position;
}
exports.calculateLiquidationPrice = calculateLiquidationPrice;
/**
 * Calculates how much the strike is out of the money.
 * @param kind          product kind (expect CALL/PUT);
 * @param strike        strike of the product.
 * @param spotPrice     price of the spot.
 */
function calculateOtmAmount(kind, strike, spotPrice) {
    switch (kind) {
        case _1.types.Kind.CALL: {
            return Math.max(0, strike - spotPrice);
        }
        case _1.types.Kind.PUT: {
            return Math.max(0, spotPrice - strike);
        }
        default:
            throw Error("Unsupported kind for OTM amount.");
    }
}
exports.calculateOtmAmount = calculateOtmAmount;
/**
 * Calculates the margin requirement for given market index.
 * @param asset         underlying asset (SOL, BTC, etc.)
 * @param productIndex  market index of the product.
 * @param spotPrice     price of the spot.
 */
function calculateProductMargin(asset, productIndex, spotPrice) {
    let subExchange = _1.Exchange.getSubExchange(asset);
    let market = _1.Exchange.getMarket(asset, productIndex);
    if (market.strike == null) {
        return null;
    }
    let kind = market.kind;
    let strike = market.strike;
    switch (kind) {
        case _1.types.Kind.FUTURE:
            return calculateFutureMargin(asset, spotPrice);
        case _1.types.Kind.CALL:
        case _1.types.Kind.PUT:
            return calculateOptionMargin(asset, spotPrice, (0, utils_1.convertNativeBNToDecimal)(subExchange.greeks.markPrices[productIndex]), kind, strike);
        case _1.types.Kind.PERP:
            return calculatePerpMargin(asset, spotPrice);
    }
}
exports.calculateProductMargin = calculateProductMargin;
/**
 * Calculates the margin requirement for a future.
 * @param asset         underlying asset (SOL, BTC, etc.)
 * @param spotPrice     price of the spot.
 */
function calculateFutureMargin(asset, spotPrice) {
    let subExchange = _1.Exchange.getSubExchange(asset);
    let initial = spotPrice * subExchange.marginParams.futureMarginInitial;
    let maintenance = spotPrice * subExchange.marginParams.futureMarginMaintenance;
    return {
        initialLong: initial,
        initialShort: initial,
        maintenanceLong: maintenance,
        maintenanceShort: maintenance,
    };
}
exports.calculateFutureMargin = calculateFutureMargin;
/**
 * Calculates the margin requirement for a perp.
 * @param asset         underlying asset (SOL, BTC, etc.)
 * @param spotPrice     price of the spot.
 */
function calculatePerpMargin(asset, spotPrice) {
    return calculateFutureMargin(asset, spotPrice);
}
exports.calculatePerpMargin = calculatePerpMargin;
/**
 * @param asset             underlying asset (SOL, BTC, etc.)
 * @param markPrice         mark price of product being calculated.
 * @param spotPrice         spot price of the underlying from oracle.
 * @param strike            strike of the option.
 * @param kind              kind of the option (expect CALL/PUT)
 */
function calculateOptionMargin(asset, spotPrice, markPrice, kind, strike) {
    let otmAmount = calculateOtmAmount(kind, strike, spotPrice);
    let initialLong = calculateLongOptionMargin(asset, spotPrice, markPrice, _1.types.MarginType.INITIAL);
    let initialShort = calculateShortOptionMargin(asset, spotPrice, otmAmount, _1.types.MarginType.INITIAL);
    let maintenanceLong = calculateLongOptionMargin(asset, spotPrice, markPrice, _1.types.MarginType.MAINTENANCE);
    let maintenanceShort = calculateShortOptionMargin(asset, spotPrice, otmAmount, _1.types.MarginType.MAINTENANCE);
    let subExchange = _1.Exchange.getSubExchange(asset);
    return {
        initialLong,
        initialShort: kind == _1.types.Kind.PUT
            ? Math.min(initialShort, subExchange.marginParams.optionShortPutCapPercentage * strike)
            : initialShort,
        maintenanceLong,
        maintenanceShort: kind == _1.types.Kind.PUT
            ? Math.min(maintenanceShort, subExchange.marginParams.optionShortPutCapPercentage * strike)
            : maintenanceShort,
    };
}
exports.calculateOptionMargin = calculateOptionMargin;
/**
 * Calculates the margin requirement for a short option.
 * @param asset        underlying asset (SOL, BTC, etc.)
 * @param spotPrice    margin account balance.
 * @param otmAmount    otm amount calculated `from calculateOtmAmount`
 * @param marginType   type of margin calculation
 */
function calculateShortOptionMargin(asset, spotPrice, otmAmount, marginType) {
    let subExchange = _1.Exchange.getSubExchange(asset);
    let basePercentageShort = marginType == _1.types.MarginType.INITIAL
        ? subExchange.marginParams.optionDynamicPercentageShortInitial
        : subExchange.marginParams.optionDynamicPercentageShortMaintenance;
    let spotPricePercentageShort = marginType == _1.types.MarginType.INITIAL
        ? subExchange.marginParams.optionSpotPercentageShortInitial
        : subExchange.marginParams.optionSpotPercentageShortMaintenance;
    let dynamicMargin = spotPrice * (basePercentageShort - otmAmount / spotPrice);
    let minMargin = spotPrice * spotPricePercentageShort;
    return Math.max(dynamicMargin, minMargin);
}
exports.calculateShortOptionMargin = calculateShortOptionMargin;
/**
 * Calculates the margin requirement for a long option.
 * @param asset        underlying asset (SOL, BTC, etc.)
 * @param spotPrice    margin account balance.
 * @param markPrice    mark price of option from greeks account.
 * @param marginType   type of margin calculation
 */
function calculateLongOptionMargin(asset, spotPrice, markPrice, marginType) {
    let subExchange = _1.Exchange.getSubExchange(asset);
    let markPercentageLong = marginType == _1.types.MarginType.INITIAL
        ? subExchange.marginParams.optionMarkPercentageLongInitial
        : subExchange.marginParams.optionMarkPercentageLongMaintenance;
    let spotPercentageLong = marginType == _1.types.MarginType.INITIAL
        ? subExchange.marginParams.optionSpotPercentageLongInitial
        : subExchange.marginParams.optionSpotPercentageLongMaintenance;
    return Math.min(markPrice * markPercentageLong, spotPrice * spotPercentageLong);
}
exports.calculateLongOptionMargin = calculateLongOptionMargin;
function calculateSpreadAccountMarginRequirement(spreadAccount, zetaGroup) {
    let marginRequirement = 0;
    for (let i = 0; i < zetaGroup.expirySeries.length; i++) {
        // Skip if strikes are uninitialised
        if (!zetaGroup.products[i].strike.isSet) {
            continue;
        }
        let strikes = _1.Exchange.getSubExchange(_1.assets.fromProgramAsset(zetaGroup.asset))
            .markets.getStrikesByExpiryIndex(i)
            // Convert to native integer, as all calculations are worked in native size
            .map((strike) => (0, utils_1.convertDecimalToNativeInteger)(strike));
        let positions = getPositionsByExpiryIndexforSpreadAccount(spreadAccount, i);
        marginRequirement =
            marginRequirement + calculateSpreadMarginRequirements(strikes, positions);
    }
    return marginRequirement;
}
exports.calculateSpreadAccountMarginRequirement = calculateSpreadAccountMarginRequirement;
/**
 * Note: BN maths below are achieved through a BN -> number -> BN method.
 * If overflow errors occur, change this in future to pure BN math.
 */
function calculateSpreadMarginRequirements(strikes, positions) {
    if (strikes.length !== _1.constants.NUM_STRIKES)
        return;
    // Structure the strikes as such [0, s0, s1, ..., sN-1]
    // with 0 being the 0 strike call (future).
    let adjustedStrikes = new Array(_1.constants.NUM_STRIKES + 1).fill(0);
    for (let i = 0; i < _1.constants.NUM_STRIKES; i++) {
        if (strikes[i] === null)
            continue;
        adjustedStrikes[i + 1] = strikes[i];
    }
    let callPositions = positions.slice(0, _1.constants.NUM_STRIKES);
    let putPositions = positions.slice(_1.constants.NUM_STRIKES, _1.constants.NUM_STRIKES * 2);
    let futurePosition = positions[_1.constants.SERIES_FUTURE_INDEX].size.toNumber();
    let cumCallPnl = calculateCallCumPnl(adjustedStrikes, callPositions, futurePosition);
    let cumPutPnl = calculatePutCumPnl(adjustedStrikes, putPositions);
    let totalPositionPnl = new Array(_1.constants.NUM_STRIKES + 1).fill(0);
    for (let i = 0; i < cumCallPnl.length; i++) {
        totalPositionPnl[i] = cumCallPnl[i] + cumPutPnl[i];
    }
    let minPositionPnl = Math.min(...totalPositionPnl);
    let totalCostOfTrades = 0;
    for (let i = 0; i < positions.length; i++) {
        totalCostOfTrades +=
            positions[i].size.toNumber() > 0
                ? positions[i].costOfTrades.toNumber()
                : -positions[i].costOfTrades.toNumber();
    }
    return Math.abs(Math.min(minPositionPnl - totalCostOfTrades, 0));
}
function calculateCallCumPnl(strikes, callPositions, futurePosition) {
    let cumCallPositions = new Array(_1.constants.NUM_STRIKES + 1).fill(0);
    let cumCallPnl = new Array(_1.constants.NUM_STRIKES + 1).fill(0);
    cumCallPositions[0] = futurePosition;
    for (let i = 0; i < _1.constants.NUM_STRIKES; i++) {
        cumCallPositions[i + 1] =
            callPositions[i].size.toNumber() + cumCallPositions[i];
        let strikeDiff = strikes[i + 1] - strikes[i];
        // The incremental change in pnl is the cumulative position from the previous index
        // multiplied by the difference in strike price
        let pnlDelta = calculateSignedCostOfTrades(strikeDiff, cumCallPositions[i]);
        cumCallPnl[i + 1] = cumCallPnl[i] + pnlDelta;
    }
    if (cumCallPositions[_1.constants.NUM_STRIKES] < 0) {
        throw Error("Naked short call is not allowed.");
    }
    return cumCallPnl;
}
function calculatePutCumPnl(strikes, putPositions) {
    let cumPutPositions = new Array(_1.constants.NUM_STRIKES + 1).fill(0);
    let cumPutPnl = new Array(_1.constants.NUM_STRIKES + 1).fill(0);
    cumPutPositions[_1.constants.NUM_STRIKES] =
        putPositions[_1.constants.NUM_STRIKES - 1].size.toNumber();
    for (let i = _1.constants.NUM_STRIKES - 1; i >= 0; i--) {
        let positionSize = i === 0 ? 0 : putPositions[i - 1].size.toNumber();
        cumPutPositions[i] = positionSize + cumPutPositions[i + 1];
        let strikeDiff = strikes[i + 1] - strikes[i];
        // The incremental change in pnl is the cumulative position from the previous index
        // multiplied by the difference in strike price
        let pnlDelta = calculateSignedCostOfTrades(strikeDiff, cumPutPositions[i + 1]);
        cumPutPnl[i] = cumPutPnl[i + 1] + pnlDelta;
    }
    return cumPutPnl;
}
exports.calculatePutCumPnl = calculatePutCumPnl;
function getPositionsByExpiryIndexforSpreadAccount(spreadAccount, expiryIndex) {
    let head = expiryIndex * _1.constants.PRODUCTS_PER_EXPIRY;
    return spreadAccount.positions.slice(head, head + _1.constants.PRODUCTS_PER_EXPIRY);
}
function checkMarginAccountMarginRequirement(marginAccount) {
    let pnl = _1.Exchange.riskCalculator.calculateUnrealizedPnl(marginAccount, _1.types.ProgramAccountType.MarginAccount);
    let totalMaintenanceMargin = _1.Exchange.riskCalculator.calculateTotalMaintenanceMargin(marginAccount);
    let buffer = marginAccount.balance.toNumber() + pnl - totalMaintenanceMargin;
    return buffer > 0;
}
exports.checkMarginAccountMarginRequirement = checkMarginAccountMarginRequirement;
function movePositions(zetaGroup, spreadAccount, marginAccount, movementType, movements) {
    for (let i = 0; i < movements.length; i++) {
        let size = movements[i].size.toNumber();
        let index = movements[i].index;
        if (size === 0 || index >= _1.constants.ACTIVE_MARKETS - 1) {
            throw Error("Invalid movement.");
        }
        if (movementType === _1.types.MovementType.LOCK) {
            lockMarginAccountPosition(marginAccount, spreadAccount, index, size);
        }
        else if (movementType === _1.types.MovementType.UNLOCK) {
            unlockSpreadAccountPosition(marginAccount, spreadAccount, index, size);
        }
        else {
            throw Error("Invalid movement type.");
        }
    }
    let spreadMarginRequirements = calculateSpreadAccountMarginRequirement(spreadAccount, zetaGroup);
    if (spreadMarginRequirements > spreadAccount.balance.toNumber()) {
        let diff = spreadMarginRequirements - spreadAccount.balance.toNumber();
        if (diff > marginAccount.balance.toNumber()) {
            throw Error("Insufficient funds to collateralize spread account.");
        }
        // Move funds from margin to spread.
        spreadAccount.balance = new anchor_1.BN(spreadAccount.balance.toNumber() + diff);
        marginAccount.balance = new anchor_1.BN(marginAccount.balance.toNumber() - diff);
    }
    else if (spreadMarginRequirements < spreadAccount.balance.toNumber()) {
        let diff = spreadAccount.balance.toNumber() - spreadMarginRequirements;
        // Move funds from spread to margin.
        spreadAccount.balance = new anchor_1.BN(spreadAccount.balance.toNumber() - diff);
        marginAccount.balance = new anchor_1.BN(marginAccount.balance.toNumber() + diff);
    }
}
exports.movePositions = movePositions;
function unlockSpreadAccountPosition(marginAccount, spreadAccount, index, size) {
    let position = spreadAccount.positions[index];
    let costOfTrades = moveSize(position, size);
    handleExecutionCostOfTrades(marginAccount, index, size, costOfTrades, false);
}
function handleExecutionCostOfTrades(marginAccount, index, size, costOfTrades, orderbook) {
    if (size === 0) {
        if (costOfTrades !== 0) {
            throw Error("Cost of trades must be greater than zero.");
        }
        return;
    }
    let ledger = (0, utils_1.getProductLedger)(marginAccount, index);
    let [openSize, closeSize] = getExecutionOpenCloseSize(ledger.position.size.toNumber(), size);
    let sideIndex = size > 0 ? _1.constants.BID_ORDERS_INDEX : _1.constants.ASK_ORDERS_INDEX;
    if (orderbook) {
        ledger.orderState.closingOrders = new anchor_1.BN(ledger.orderState.closingOrders.toNumber() - closeSize);
        ledger.orderState.openingOrders[sideIndex] = new anchor_1.BN(ledger.orderState.openingOrders[sideIndex].toNumber() - openSize);
    }
    let [openCostOfTrades, closeCostOfTrades] = getOpenCloseCostOfTrades(openSize, closeSize, costOfTrades);
    let signedOpenSize = size >= 0 ? openSize : -openSize;
    resetClosingOrders(ledger);
    closePosition(ledger.position, marginAccount, closeSize, closeCostOfTrades);
    openPosition(ledger.position, signedOpenSize, openCostOfTrades);
    rebalanceOrders(ledger);
}
exports.handleExecutionCostOfTrades = handleExecutionCostOfTrades;
function lockMarginAccountPosition(marginAccount, spreadAccount, index, size) {
    let ledger = (0, utils_1.getProductLedger)(marginAccount, index);
    resetClosingOrders(ledger);
    let costOfTrades = moveSize(ledger.position, size);
    rebalanceOrders(ledger);
    lockSpreadAccountPosition(spreadAccount, index, size, costOfTrades);
}
function rebalanceOrders(ledger) {
    if (ledger.orderState.closingOrders.toNumber() !== 0 ||
        ledger.position.size.toNumber() === 0) {
        return;
    }
    // If long, closing order size are asks
    // If short, closing order size are bids
    let index = ledger.position.size.toNumber() > 0
        ? _1.constants.ASK_ORDERS_INDEX
        : _1.constants.BID_ORDERS_INDEX;
    ledger.orderState.closingOrders = new anchor_1.BN(Math.min(Math.abs(ledger.position.size.toNumber()), ledger.orderState.openingOrders[index].toNumber()));
    ledger.orderState.openingOrders[index] = new anchor_1.BN(ledger.orderState.openingOrders[index].toNumber() -
        ledger.orderState.closingOrders.toNumber());
}
/// Moves closing orders to the respective opening orders.
/// To be called before executing or moving positions.
/// `rebalance_orders` should be called after executing.
function resetClosingOrders(ledger) {
    if (ledger.orderState.closingOrders.toNumber() === 0 ||
        ledger.position.size.toNumber() === 0)
        return;
    // If long, closing order size are asks
    // If short, closing order size are bids
    let index = ledger.position.size.toNumber() > 0
        ? _1.constants.ASK_ORDERS_INDEX
        : _1.constants.BID_ORDERS_INDEX;
    ledger.orderState.openingOrders[index] = new anchor_1.BN(ledger.orderState.openingOrders[index].toNumber() +
        ledger.orderState.closingOrders.toNumber());
    ledger.orderState.closingOrders = new anchor_1.BN(0);
}
function moveSize(position, size) {
    if (size === 0)
        return 0;
    if ((size > 0 && position.size.toNumber() < size) ||
        (size < 0 && position.size.toNumber() > size)) {
        throw Error("Invalid movement size.");
    }
    let costOfTrades;
    if (size === position.size.toNumber()) {
        costOfTrades = position.costOfTrades;
        position.costOfTrades = new anchor_1.BN(0);
        position.size = new anchor_1.BN(0);
    }
    else {
        costOfTrades = prorataCostOfTrades(position, Math.abs(size));
        // larger (-ve) minus smaller (-ve) or larger (+ve) minus larger (+ve) -> 0
        position.size = new anchor_1.BN(position.size.toNumber() - size);
        position.costOfTrades = new anchor_1.BN(position.costOfTrades.toNumber() - costOfTrades);
    }
    return costOfTrades;
}
function lockSpreadAccountPosition(spreadAccount, index, size, costOfTrades) {
    let position = spreadAccount.positions[index];
    let [openSize, closeSize] = getExecutionOpenCloseSize(position.size.toNumber(), size);
    // Prorata cost of trades here.
    let [openCostOfTrades, closeCostOfTrades] = getOpenCloseCostOfTrades(openSize, closeSize, costOfTrades);
    closePosition(position, spreadAccount, closeSize, closeCostOfTrades);
    let signedOpenSize = size >= 0 ? openSize : -openSize;
    openPosition(position, signedOpenSize, openCostOfTrades);
}
exports.lockSpreadAccountPosition = lockSpreadAccountPosition;
function getExecutionOpenCloseSize(positionSize, executionSize) {
    // If is opening size
    if ((executionSize > 0 && positionSize >= 0) ||
        (executionSize < 0 && positionSize <= 0)) {
        return [Math.abs(executionSize), 0];
    }
    let executionSizeAbs = Math.abs(executionSize);
    let closeSize = Math.min(executionSizeAbs, Math.abs(positionSize));
    let openSize = executionSizeAbs - closeSize;
    return [openSize, closeSize];
}
function getOpenCloseCostOfTrades(openSize, closeSize, costOfTrades) {
    let size = openSize + closeSize;
    let closeCostOfTrades;
    let openCostOfTrades;
    if (openSize === 0) {
        openCostOfTrades = 0;
        closeCostOfTrades = costOfTrades;
    }
    else {
        closeCostOfTrades = (costOfTrades / size) * closeSize;
        openCostOfTrades = costOfTrades - closeCostOfTrades;
    }
    return [openCostOfTrades, closeCostOfTrades];
}
function openPosition(position, size, costOfTrades) {
    if (size === 0 || costOfTrades === 0)
        return;
    // Assert same side
    if ((size > 0 && position.size.toNumber() < 0) ||
        (size < 0 && position.size.toNumber() > 0)) {
        return;
    }
    position.size = new anchor_1.BN(position.size.toNumber() + size);
    position.costOfTrades = new anchor_1.BN(position.costOfTrades.toNumber() + costOfTrades);
}
function closePosition(position, account, size, executionCostOfTrades) {
    if (size === 0)
        return;
    let positionSizeAbs = Math.abs(position.size.toNumber());
    // Cannot close more than your position
    if (size > positionSizeAbs)
        return;
    let fullClose = size === positionSizeAbs;
    let closedCostOfTrades = prorataCostOfTrades(position, size);
    /*
     * Cases:
     * 1. Closing long position
     * - Profitable if execution COT > closed COT (bought for more than purchase)
     * - Loss if execution COT < closed COT (Sold for less than purchase)
     * 2. Closing short position
     * - Profitable if execution COT < closed COT (bought back for less than sold)
     * - Loss if execution COT > closed COT (bought back for more than sold)
     */
    let [profitable, balanceDelta] = closedCostOfTrades >= executionCostOfTrades
        ? [
            position.size.toNumber() < 0,
            closedCostOfTrades - executionCostOfTrades,
        ]
        : [
            position.size.toNumber() > 0,
            executionCostOfTrades - closedCostOfTrades,
        ];
    if (profitable) {
        account.balance = new anchor_1.BN(account.balance.toNumber() + balanceDelta);
    }
    else {
        account.balance = new anchor_1.BN(account.balance.toNumber() - balanceDelta);
    }
    if (position.size.toNumber() > 0) {
        position.size = new anchor_1.BN(position.size.toNumber() - size);
    }
    else {
        position.size = new anchor_1.BN(position.size.toNumber() + size);
    }
    // Closed_cost_of_trades may have small rounding error.
    if (fullClose) {
        position.costOfTrades = new anchor_1.BN(0);
    }
    else {
        position.costOfTrades = new anchor_1.BN(position.costOfTrades.toNumber() - closedCostOfTrades);
    }
}
function prorataCostOfTrades(position, size) {
    let sizeAbs = Math.abs(position.size.toNumber());
    if (size === sizeAbs) {
        return position.costOfTrades.toNumber();
    }
    else {
        return Math.floor(position.costOfTrades.toNumber() / sizeAbs) * size;
    }
}
function calculateSignedCostOfTrades(price, size) {
    return Math.floor((price * size) / Math.pow(10, _1.constants.POSITION_PRECISION));
}
function calculateNormalizedCostOfTrades(price, size) {
    return Math.floor(Math.abs(price * size) / Math.pow(10, _1.constants.POSITION_PRECISION));
}
exports.calculateNormalizedCostOfTrades = calculateNormalizedCostOfTrades;
