import * as types from "./types";
import { MarginAccount, PositionMovementEvent } from "./program-types";
import { Asset } from "./assets";
import { Client, instructions } from ".";
export declare class RiskCalculator {
    private _marginRequirements;
    private _perpMarginRequirements;
    constructor(assets: Asset[]);
    getMarginRequirements(asset: Asset): Array<types.MarginRequirement>;
    getPerpMarginRequirements(asset: Asset): types.MarginRequirement;
    updateMarginRequirements(asset: Asset): void;
    /**
     * Returns the margin requirement for a given market and size.
     * @param asset          underlying asset type.
     * @param productIndex   market index of the product to calculate margin for.
     * @param size           signed integer of size for margin requirements (short orders should be negative)
     * @param marginType     type of margin calculation.
     */
    getMarginRequirement(asset: Asset, productIndex: number, size: number, marginType: types.MarginType): number;
    getPerpMarginRequirement(asset: Asset, size: number, marginType: types.MarginType): number;
    calculateMarginRequirement(marginRequirement: types.MarginRequirement, size: number, marginType: types.MarginType): number;
    /**
     * Returns the size of an order that would be considered "opening", when applied to margin requirements.
     * Total intended trade size = closing size + opening size
     * @param size           signed integer of size for margin requirements (short orders should be negative)
     * @param position       signed integer the user's current position for that product (0 if none).
     * @param closingSize    unsigned integer of the user's current closing order quantity for that product (0 if none)
     */
    calculateOpeningSize(size: number, position: number, closingSize: number): number;
    /**
     * Returns the unpaid funding for a given margin account.
     * @param account the user's spread (returns 0) or margin account.
     */
    calculateUnpaidFunding(account: any, accountType?: types.ProgramAccountType): number;
    /**
     * Returns the unrealized pnl for a given margin or spread account.
     * @param account the user's spread or margin account.
     */
    calculateUnrealizedPnl(account: any, accountType?: types.ProgramAccountType): number;
    /**
     * Returns the total initial margin requirement for a given account.
     * This includes initial margin on positions which is used for
     * Place order, withdrawal and force cancels
     * @param marginAccount   the user's MarginAccount.
     */
    calculateTotalInitialMargin(marginAccount: MarginAccount, skipConcession?: boolean): number;
    /**
     * Returns the total maintenance margin requirement for a given account.
     * This only uses maintenance margin on positions and is used for
     * liquidations.
     * @param asset           underlying asset type
     * @param marginAccount   the user's MarginAccount.
     */
    calculateTotalMaintenanceMargin(marginAccount: MarginAccount): number;
    /**
     * Returns the total maintenance margin requirement for a given account including orders.
     * This calculates maintenance margin across all positions and orders.
     * This value is used to determine margin when sending a closing order only.
     * @param asset           underlying asset type
     * @param marginAccount   the user's MarginAccount.
     */
    calculateTotalMaintenanceMarginIncludingOrders(marginAccount: MarginAccount): number;
    /**
     * Returns the aggregate margin account state.
     * @param marginAccount   the user's MarginAccount.
     */
    getMarginAccountState(marginAccount: MarginAccount): types.MarginAccountState;
    calculatePositionMovement(user: Client, asset: Asset, movementType: types.MovementType, movements: instructions.PositionMovementArg[]): PositionMovementEvent;
}
