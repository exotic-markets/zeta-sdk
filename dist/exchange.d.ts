import * as anchor from "@project-serum/anchor";
import { PublicKey, Connection, ConfirmOptions, AccountMeta } from "@solana/web3.js";
import { Greeks, PerpSyncQueue, ProductGreeks, State, ZetaGroup } from "./program-types";
import { ExpirySeries, Market, ZetaGroupMarkets } from "./market";
import { RiskCalculator } from "./risk";
import { EventType } from "./events";
import { Network } from "./network";
import { Oracle } from "./oracle";
import { Zeta } from "./types/zeta";
import * as types from "./types";
import { Asset } from "./assets";
import { SubExchange } from "./subexchange";
import * as instructions from "./program-instructions";
export declare class Exchange {
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
     * Account storing zeta state.
     */
    get state(): State;
    private _state;
    /**
     * The solana network being used.
     */
    get network(): Network;
    private _network;
    /**
     * Anchor program instance.
     */
    get program(): anchor.Program<Zeta>;
    private _program;
    get programId(): PublicKey;
    /**
     * Anchor provider instance.
     */
    get provider(): anchor.AnchorProvider;
    get connection(): Connection;
    private _provider;
    /**
     * Public key used as the stable coin mint.
     */
    get usdcMintAddress(): PublicKey;
    private _usdcMintAddress;
    /**
     * ConfirmOptions, stored so we don't need it again when making a SerumMarket.
     */
    get opts(): ConfirmOptions;
    private _opts;
    get subExchanges(): Map<Asset, SubExchange>;
    private _subExchanges;
    /**
     * The assets being used
     */
    get assets(): Asset[];
    private _assets;
    get oracle(): Oracle;
    private _oracle;
    /**
     * Risk calculator that holds all margin requirements.
     */
    get riskCalculator(): RiskCalculator;
    private _riskCalculator;
    /**
     * Zeta PDA for serum market authority
     */
    get serumAuthority(): PublicKey;
    private _serumAuthority;
    /**
     * Zeta PDA for minting serum mints
     */
    get mintAuthority(): PublicKey;
    private _mintAuthority;
    /**
     * Address of state account.
     */
    get stateAddress(): PublicKey;
    private _stateAddress;
    /**
     * Public key for treasury wallet.
     */
    get treasuryWalletAddress(): PublicKey;
    private _treasuryWalletAddress;
    /**
     * Public key for referral rewards wallet.
     */
    get referralsRewardsWalletAddress(): PublicKey;
    private _referralsRewardsWalletAddress;
    /**
     * Stores the latest timestamp received by websocket subscription
     * to the system clock account.
     */
    get clockTimestamp(): number;
    private _clockTimestamp;
    /**
     * Stores the latest clock slot from clock subscription.
     */
    get clockSlot(): number;
    private _clockSlot;
    /**
     * Websocket subscription id for clock.
     */
    private _clockSubscriptionId;
    /**
     * @param interval   How often to poll zeta group and state in seconds.
     */
    get pollInterval(): number;
    set pollInterval(interval: number);
    private _pollInterval;
    private _lastPollTimestamp;
    get ledgerWallet(): any;
    private _ledgerWallet;
    get useLedger(): boolean;
    setLedgerWallet(wallet: any): void;
    private _useLedger;
    private _programSubscriptionIds;
    initialize(assets: Asset[], programId: PublicKey, network: Network, connection: Connection, opts: ConfirmOptions, wallet?: types.DummyWallet): Promise<void>;
    initializeZetaState(params: instructions.StateParams, referralAdmin: PublicKey): Promise<void>;
    initializeZetaGroup(asset: Asset, oracle: PublicKey, pricingArgs: instructions.InitializeZetaGroupPricingArgs, perpArgs: instructions.UpdatePerpParametersArgs, marginArgs: instructions.UpdateMarginParametersArgs, expiryArgs: instructions.UpdateZetaGroupExpiryArgs): Promise<void>;
    load(assets: Asset[], programId: PublicKey, network: Network, connection: Connection, opts: ConfirmOptions, wallet?: types.DummyWallet, throttleMs?: number, callback?: (asset: Asset, event: EventType, data: any) => void): Promise<void>;
    private addSubExchange;
    getSubExchange(asset: Asset): SubExchange;
    getAllSubExchanges(): SubExchange[];
    private subscribeOracle;
    private setClockData;
    private subscribeClock;
    addProgramSubscriptionId(id: number): void;
    updateExchangeState(): Promise<void>;
    /**
     * Polls the on chain account to update state.
     */
    updateState(): Promise<void>;
    /**
     * Update the expiry state variables for the program.
     */
    updateZetaState(params: instructions.StateParams): Promise<void>;
    initializeMarketNodes(asset: Asset, zetaGroup: PublicKey): Promise<void>;
    subscribeMarket(asset: Asset, index: number): void;
    unsubscribeMarket(asset: Asset, index: number): void;
    subscribePerp(asset: Asset): void;
    unsubscribePerp(asset: Asset): void;
    updateOrderbook(asset: Asset, index: number): Promise<void>;
    updateAllOrderbooks(live?: boolean): Promise<void>;
    getZetaGroupMarkets(asset: Asset): ZetaGroupMarkets;
    getMarket(asset: Asset, index: number): Market;
    getMarkets(asset: Asset): Market[];
    getPerpMarket(asset: Asset): Market;
    getMarketsByExpiryIndex(asset: Asset, index: number): Market[];
    getExpirySeriesList(asset: Asset): ExpirySeries[];
    getZetaGroup(asset: Asset): ZetaGroup;
    getZetaGroupAddress(asset: Asset): PublicKey;
    getGreeks(asset: Asset): Greeks;
    getPerpSyncQueue(asset: Asset): PerpSyncQueue;
    getOrderbook(asset: Asset, index: number): types.DepthOrderbook;
    getMarkPrice(asset: Asset, index: number): number;
    getInsuranceVaultAddress(asset: Asset): PublicKey;
    getVaultAddress(asset: Asset): PublicKey;
    getSocializedLossAccountAddress(asset: Asset): PublicKey;
    updatePricingParameters(asset: Asset, args: instructions.UpdatePricingParametersArgs): Promise<void>;
    getMarginParams(asset: Asset): types.MarginParams;
    updateMarginParameters(asset: Asset, args: instructions.UpdateMarginParametersArgs): Promise<void>;
    updatePerpParameters(asset: Asset, args: instructions.UpdatePerpParametersArgs): Promise<void>;
    updateZetaGroupExpiryParameters(asset: Asset, args: instructions.UpdateZetaGroupExpiryArgs): Promise<void>;
    updateVolatilityNodes(asset: Asset, nodes: Array<anchor.BN>): Promise<void>;
    initializeZetaMarkets(asset: Asset): Promise<void>;
    initializeZetaMarketsTIFEpochCycle(asset: Asset, cycleLengthSecs: number): Promise<void>;
    initializeMarketStrikes(asset: Asset): Promise<void>;
    initializePerpSyncQueue(asset: Asset): Promise<void>;
    updateZetaGroup(asset: Asset): Promise<void>;
    updatePricing(asset: Asset, expiryIndex: number): Promise<void>;
    retreatMarketNodes(asset: Asset, expiryIndex: number): Promise<void>;
    updateSubExchangeState(asset: Asset): Promise<void>;
    whitelistUserForDeposit(asset: Asset, user: PublicKey): Promise<void>;
    whitelistUserForInsuranceVault(asset: Asset, user: PublicKey): Promise<void>;
    whitelistUserForTradingFees(asset: Asset, user: PublicKey): Promise<void>;
    treasuryMovement(asset: Asset, treasuryMovementType: types.TreasuryMovementType, amount: anchor.BN): Promise<void>;
    rebalanceInsuranceVault(asset: Asset, marginAccounts: any[]): Promise<void>;
    updateMarginParams(asset: Asset): void;
    haltZetaGroup(asset: Asset, zetaGroupAddress: PublicKey): Promise<void>;
    unhaltZetaGroup(asset: Asset, zetaGroupAddress: PublicKey): Promise<void>;
    updateHaltState(asset: Asset, zetaGroupAddress: PublicKey, args: instructions.UpdateHaltStateArgs): Promise<void>;
    settlePositionsHalted(asset: Asset, marginAccounts: AccountMeta[]): Promise<void>;
    settleSpreadPositionsHalted(asset: Asset, marginAccounts: AccountMeta[]): Promise<void>;
    cancelAllOrdersHalted(asset: Asset): Promise<void>;
    cleanZetaMarketsHalted(asset: Asset): Promise<void>;
    updatePricingHalted(asset: Asset, expiryIndex: number): Promise<void>;
    isHalted(asset: Asset): boolean;
    cleanMarketNodes(asset: Asset, expiryIndex: number): Promise<void>;
    updateVolatility(asset: Asset, args: instructions.UpdateVolatilityArgs): Promise<void>;
    updateInterestRate(asset: Asset, args: instructions.UpdateInterestRateArgs): Promise<void>;
    getProductGreeks(asset: Asset, marketIndex: number, expiryIndex: number): ProductGreeks;
    close(): Promise<void>;
}
export declare const exchange: Exchange;
