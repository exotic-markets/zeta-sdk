import * as anchor from "@project-serum/anchor";
import { PublicKey, ConfirmOptions, AccountMeta } from "@solana/web3.js";
import { Greeks, ExpirySeries, ZetaGroup, ProductGreeks, PerpSyncQueue } from "./program-types";
import { Market, ZetaGroupMarkets } from "./market";
import { EventType } from "./events";
import { Network } from "./network";
import { Asset } from "./assets";
import * as instructions from "./program-instructions";
import * as types from "./types";
export declare class SubExchange {
    /**
     * Whether the object has been set up (in .initialize()).
     */
    get isSetup(): boolean;
    private _isSetup;
    /**
     * Whether the object has been initialized (in .load()).
     */
    get isInitialized(): boolean;
    private _isInitialized;
    /**
     * Account storing zeta group account info.
     */
    get zetaGroup(): ZetaGroup;
    private _zetaGroup;
    /**
     * The asset loaded to the this.
     */
    get asset(): Asset;
    private _asset;
    /**
     * Address of zeta group account.
     */
    get zetaGroupAddress(): PublicKey;
    private _zetaGroupAddress;
    /**
     * Public key for a given zeta group vault.
     */
    get vaultAddress(): PublicKey;
    private _vaultAddress;
    /**
     * Public key for insurance vault.
     */
    get insuranceVaultAddress(): PublicKey;
    private _insuranceVaultAddress;
    /**
     * Public key for socialized loss account.
     */
    get socializedLossAccountAddress(): PublicKey;
    private _socializedLossAccountAddress;
    /**
     * Returns the markets object.
     */
    get markets(): ZetaGroupMarkets;
    get numMarkets(): number;
    private _markets;
    private _eventEmitters;
    /**
     * Account storing all the greeks.
     */
    get greeks(): Greeks;
    private _greeks;
    get greeksAddress(): PublicKey;
    private _greeksAddress;
    /**
     * Account storing the queue which synchronises taker/maker perp funding payments.
     * You shouldn't need to read from this, it's mainly for our integration tests
     */
    get perpSyncQueue(): PerpSyncQueue;
    private _perpSyncQueue;
    get perpSyncQueueAddress(): PublicKey;
    private _perpSyncQueueAddress;
    get marginParams(): types.MarginParams;
    private _marginParams;
    get frontExpirySeries(): ExpirySeries;
    get halted(): boolean;
    initialize(asset: Asset): Promise<void>;
    /**
     * Loads a fresh instance of the subExchange object using on chain state.
     * @param throttle    Whether to sleep on market loading for rate limit reasons.
     */
    load(asset: Asset, programId: PublicKey, network: Network, opts: ConfirmOptions, throttleMs?: number, callback?: (asset: Asset, event: EventType, data: any) => void): Promise<void>;
    /**
     * Refreshes serum markets cache
     * @param asset    which asset to load
     */
    updateSerumMarkets(asset: Asset, opts: ConfirmOptions): Promise<void>;
    /**
     * Initializes the market nodes for a zeta group.
     */
    initializeMarketNodes(zetaGroup: PublicKey): Promise<void>;
    /**
     * Update the pricing parameters for a zeta group.
     */
    updatePricingParameters(args: instructions.UpdatePricingParametersArgs): Promise<void>;
    /**
     * Update the margin parameters for a zeta group.
     */
    updateMarginParameters(args: instructions.UpdateMarginParametersArgs): Promise<void>;
    /**
     * Update the perp parameters for a zeta group.
     */
    updatePerpParameters(args: instructions.UpdatePerpParametersArgs): Promise<void>;
    /**
     * Update the margin parameters for a zeta group.
     */
    updateZetaGroupExpiryParameters(args: instructions.UpdateZetaGroupExpiryArgs): Promise<void>;
    /**
     * Update the volatility nodes for a surface.
     */
    updateVolatilityNodes(nodes: Array<anchor.BN>): Promise<void>;
    /**
     * Initializes the zeta markets for a zeta group.
     */
    initializeZetaMarkets(): Promise<void>;
    private initializeZetaMarket;
    initializeZetaMarketsTIFEpochCycle(cycleLengthSecs: number): Promise<void>;
    /**
     * Will throw if it is not strike initialization time.
     */
    initializeMarketStrikes(): Promise<void>;
    initializePerpSyncQueue(): Promise<void>;
    /**
     * Polls the on chain account to update zeta group.
     */
    updateZetaGroup(): Promise<void>;
    /**
     * Update pricing for an expiry index.
     */
    updatePricing(expiryIndex: number): Promise<void>;
    /**
     * Retreat volatility surface and interest rates for an expiry index.
     */
    retreatMarketNodes(expiryIndex: number): Promise<void>;
    assertInitialized(): void;
    private subscribeZetaGroup;
    private subscribeGreeks;
    private subscribePerpSyncQueue;
    handlePolling(callback?: (asset: Asset, eventType: EventType, data: any) => void): Promise<void>;
    updateSubExchangeState(): Promise<void>;
    /**
     * @param index   market index to get mark price.
     */
    getMarkPrice(index: number): number;
    /**
     * Returns all perp & nonperk markets in a single list
     */
    getMarkets(): Market[];
    /**
     * @param user user pubkey to be whitelisted for uncapped deposit
     */
    whitelistUserForDeposit(user: PublicKey): Promise<void>;
    /**
     * @param user user pubkey to be whitelisted for our insurance vault
     */
    whitelistUserForInsuranceVault(user: PublicKey): Promise<void>;
    /**
     * @param user user pubkey to be whitelisted for trading fees
     */
    whitelistUserForTradingFees(user: PublicKey): Promise<void>;
    /**
     *
     * @param movementType move funds from treasury wallet to insurance fund or the opposite
     * @param amount an array of remaining accounts (margin accounts) that will be rebalanced
     */
    treasuryMovement(treasuryMovementType: types.TreasuryMovementType, amount: anchor.BN): Promise<void>;
    /**
     *
     * @param marginAccounts an array of remaining accounts (margin accounts) that will be rebalanced
     */
    rebalanceInsuranceVault(marginAccounts: any[]): Promise<void>;
    updateMarginParams(): void;
    /**
     * Halt zeta group functionality.
     */
    assertHalted(): void;
    haltZetaGroup(zetaGroupAddress: PublicKey): Promise<void>;
    unhaltZetaGroup(): Promise<void>;
    updateHaltState(zetaGroupAddress: PublicKey, args: instructions.UpdateHaltStateArgs): Promise<void>;
    settlePositionsHalted(marginAccounts: AccountMeta[]): Promise<void>;
    settleSpreadPositionsHalted(spreadAccounts: AccountMeta[]): Promise<void>;
    cancelAllOrdersHalted(): Promise<void>;
    cleanZetaMarketsHalted(): Promise<void>;
    updatePricingHalted(expiryIndex: number): Promise<void>;
    cleanMarketNodes(expiryIndex: number): Promise<void>;
    updateVolatility(args: instructions.UpdateVolatilityArgs): Promise<void>;
    updateInterestRate(args: instructions.UpdateInterestRateArgs): Promise<void>;
    getProductGreeks(marketIndex: number, expiryIndex: number): ProductGreeks;
    /**
     * Close the websockets.
     */
    close(): Promise<void>;
}
