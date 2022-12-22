import { types, instructions } from ".";
import { Asset } from "./assets";
import { Position, SpreadAccount, ZetaGroup, MarginAccount } from "./program-types";
/**
 * Calculates the price at which a position will be liquidated.
 * @param accountBalance    margin account balance.
 * @param marginRequirement total margin requirement for margin account.
 * @param unrealizedPnl     unrealized pnl for margin account.
 * @param markPrice         mark price of product being calculated.
 * @param position          signed position size of user.
 */
export declare function calculateLiquidationPrice(accountBalance: number, marginRequirement: number, unrealizedPnl: number, markPrice: number, position: number): number;
/**
 * Calculates how much the strike is out of the money.
 * @param kind          product kind (expect CALL/PUT);
 * @param strike        strike of the product.
 * @param spotPrice     price of the spot.
 */
export declare function calculateOtmAmount(kind: types.Kind, strike: number, spotPrice: number): number;
/**
 * Calculates the margin requirement for given market index.
 * @param asset         underlying asset (SOL, BTC, etc.)
 * @param productIndex  market index of the product.
 * @param spotPrice     price of the spot.
 */
export declare function calculateProductMargin(asset: Asset, productIndex: number, spotPrice: number): types.MarginRequirement;
/**
 * Calculates the margin requirement for a future.
 * @param asset         underlying asset (SOL, BTC, etc.)
 * @param spotPrice     price of the spot.
 */
export declare function calculateFutureMargin(asset: Asset, spotPrice: number): types.MarginRequirement;
/**
 * Calculates the margin requirement for a perp.
 * @param asset         underlying asset (SOL, BTC, etc.)
 * @param spotPrice     price of the spot.
 */
export declare function calculatePerpMargin(asset: Asset, spotPrice: number): types.MarginRequirement;
/**
 * @param asset             underlying asset (SOL, BTC, etc.)
 * @param markPrice         mark price of product being calculated.
 * @param spotPrice         spot price of the underlying from oracle.
 * @param strike            strike of the option.
 * @param kind              kind of the option (expect CALL/PUT)
 */
export declare function calculateOptionMargin(asset: Asset, spotPrice: number, markPrice: number, kind: types.Kind, strike: number): types.MarginRequirement;
/**
 * Calculates the margin requirement for a short option.
 * @param asset        underlying asset (SOL, BTC, etc.)
 * @param spotPrice    margin account balance.
 * @param otmAmount    otm amount calculated `from calculateOtmAmount`
 * @param marginType   type of margin calculation
 */
export declare function calculateShortOptionMargin(asset: Asset, spotPrice: number, otmAmount: number, marginType: types.MarginType): number;
/**
 * Calculates the margin requirement for a long option.
 * @param asset        underlying asset (SOL, BTC, etc.)
 * @param spotPrice    margin account balance.
 * @param markPrice    mark price of option from greeks account.
 * @param marginType   type of margin calculation
 */
export declare function calculateLongOptionMargin(asset: Asset, spotPrice: number, markPrice: number, marginType: types.MarginType): number;
export declare function calculateSpreadAccountMarginRequirement(spreadAccount: SpreadAccount, zetaGroup: ZetaGroup): number;
export declare function calculatePutCumPnl(strikes: number[], putPositions: Position[]): any[];
export declare function checkMarginAccountMarginRequirement(marginAccount: MarginAccount): boolean;
export declare function movePositions(zetaGroup: ZetaGroup, spreadAccount: SpreadAccount, marginAccount: MarginAccount, movementType: types.MovementType, movements: instructions.PositionMovementArg[]): void;
export declare function handleExecutionCostOfTrades(marginAccount: MarginAccount, index: number, size: number, costOfTrades: number, orderbook: boolean): void;
export declare function lockSpreadAccountPosition(spreadAccount: SpreadAccount, index: number, size: number, costOfTrades: number): void;
export declare function calculateNormalizedCostOfTrades(price: number, size: number): number;
