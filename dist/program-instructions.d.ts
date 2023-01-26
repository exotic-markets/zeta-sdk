import { PublicKey, TransactionInstruction, Transaction, AccountMeta } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import * as types from "./types";
import { Asset } from "./assets";
export declare function initializeMarginAccountIx(zetaGroup: PublicKey, marginAccount: PublicKey, user: PublicKey): TransactionInstruction;
export declare function closeMarginAccountIx(asset: Asset, userKey: PublicKey, marginAccount: PublicKey): TransactionInstruction;
export declare function initializeInsuranceDepositAccountIx(asset: Asset, userKey: PublicKey, userWhitelistInsuranceKey: PublicKey): Promise<TransactionInstruction>;
/**
 * @param amount the native amount to deposit (6dp)
 */
export declare function depositIx(asset: Asset, amount: number, marginAccount: PublicKey, usdcAccount: PublicKey, userKey: PublicKey, whitelistDepositAccount: PublicKey | undefined): Promise<TransactionInstruction>;
/**
 * @param amount
 * @param insuranceDepositAccount
 * @param usdcAccount
 * @param userKey
 */
export declare function depositInsuranceVaultIx(asset: Asset, amount: number, insuranceDepositAccount: PublicKey, usdcAccount: PublicKey, userKey: PublicKey): TransactionInstruction;
export declare function withdrawInsuranceVaultIx(asset: Asset, percentageAmount: number, insuranceDepositAccount: PublicKey, usdcAccount: PublicKey, userKey: PublicKey): TransactionInstruction;
/**
 * @param amount the native amount to withdraw (6dp)
 */
export declare function withdrawIx(asset: Asset, amount: number, marginAccount: PublicKey, usdcAccount: PublicKey, userKey: PublicKey): TransactionInstruction;
export declare function initializeOpenOrdersIx(asset: Asset, market: PublicKey, userKey: PublicKey, authority: PublicKey, marginAccount: PublicKey): Promise<[TransactionInstruction, PublicKey]>;
export declare function closeOpenOrdersIx(asset: Asset, market: PublicKey, userKey: PublicKey, marginAccount: PublicKey, openOrders: PublicKey): Promise<TransactionInstruction>;
export declare function placeOrderV3Ix(asset: Asset, marketIndex: number, price: number, size: number, side: types.Side, orderType: types.OrderType, clientOrderId: number, tag: String, marginAccount: PublicKey, authority: PublicKey, openOrders: PublicKey, whitelistTradingFeesAccount: PublicKey | undefined): TransactionInstruction;
export declare function placeOrderV4Ix(asset: Asset, marketIndex: number, price: number, size: number, side: types.Side, orderType: types.OrderType, clientOrderId: number, tag: String, tifOffset: number, marginAccount: PublicKey, authority: PublicKey, openOrders: PublicKey, whitelistTradingFeesAccount: PublicKey | undefined): TransactionInstruction;
export declare function placePerpOrderIx(asset: Asset, marketIndex: number, price: number, size: number, side: types.Side, orderType: types.OrderType, clientOrderId: number, tag: String, marginAccount: PublicKey, authority: PublicKey, openOrders: PublicKey, whitelistTradingFeesAccount: PublicKey | undefined): TransactionInstruction;
export declare function placePerpOrderV2Ix(asset: Asset, marketIndex: number, price: number, size: number, side: types.Side, orderType: types.OrderType, clientOrderId: number, tag: String, tifOffset: number, marginAccount: PublicKey, authority: PublicKey, openOrders: PublicKey, whitelistTradingFeesAccount: PublicKey | undefined): TransactionInstruction;
export declare function cancelOrderIx(asset: Asset, marketIndex: number, userKey: PublicKey, marginAccount: PublicKey, openOrders: PublicKey, orderId: anchor.BN, side: types.Side): TransactionInstruction;
export declare function cancelOrderNoErrorIx(asset: Asset, marketIndex: number, userKey: PublicKey, marginAccount: PublicKey, openOrders: PublicKey, orderId: anchor.BN, side: types.Side): TransactionInstruction;
export declare function pruneExpiredTIFOrdersIx(asset: Asset, marketIndex: number): TransactionInstruction;
export declare function cancelAllMarketOrdersIx(asset: Asset, marketIndex: number, userKey: PublicKey, marginAccount: PublicKey, openOrders: PublicKey): TransactionInstruction;
export declare function cancelOrderByClientOrderIdIx(asset: Asset, marketIndex: number, userKey: PublicKey, marginAccount: PublicKey, openOrders: PublicKey, clientOrderId: anchor.BN): TransactionInstruction;
export declare function cancelOrderByClientOrderIdNoErrorIx(asset: Asset, marketIndex: number, userKey: PublicKey, marginAccount: PublicKey, openOrders: PublicKey, clientOrderId: anchor.BN): TransactionInstruction;
export declare function cancelExpiredOrderIx(asset: Asset, marketIndex: number, marginAccount: PublicKey, openOrders: PublicKey, orderId: anchor.BN, side: types.Side): TransactionInstruction;
export declare function forceCancelOrderByOrderIdIx(asset: Asset, marketIndex: number, marginAccount: PublicKey, openOrders: PublicKey, orderId: anchor.BN, side: types.Side): TransactionInstruction;
export declare function forceCancelOrdersIx(asset: Asset, marketIndex: number, marginAccount: PublicKey, openOrders: PublicKey): TransactionInstruction;
export declare function initializeZetaMarketTIFEpochCyclesIx(asset: Asset, marketIndex: number, cycleLength: number): TransactionInstruction;
export declare function initializeZetaMarketTxs(asset: Asset, marketIndex: number, seedIndex: number, requestQueue: PublicKey, eventQueue: PublicKey, bids: PublicKey, asks: PublicKey, marketIndexes: PublicKey): Promise<[Transaction, Transaction]>;
export declare function initializePerpSyncQueueIx(asset: Asset): Promise<TransactionInstruction>;
export declare function initializeZetaGroupIx(asset: Asset, underlyingMint: PublicKey, oracle: PublicKey, oracleBackupFeed: PublicKey, oracleBackupProgram: PublicKey, pricingArgs: InitializeZetaGroupPricingArgs, perpArgs: UpdatePerpParametersArgs, marginArgs: UpdateMarginParametersArgs, expiryArgs: UpdateZetaGroupExpiryArgs): Promise<TransactionInstruction>;
export declare function collectTreasuryFundsIx(collectionTokenAccount: PublicKey, amount: anchor.BN, admin: PublicKey): TransactionInstruction;
export declare function treasuryMovementIx(asset: Asset, treasuryMovementType: types.TreasuryMovementType, amount: anchor.BN): TransactionInstruction;
export declare function rebalanceInsuranceVaultIx(asset: Asset, remainingAccounts: any[]): TransactionInstruction;
export declare function liquidateIx(asset: Asset, liquidator: PublicKey, liquidatorMarginAccount: PublicKey, market: PublicKey, liquidatedMarginAccount: PublicKey, size: number): TransactionInstruction;
export declare function crankMarketIx(asset: Asset, market: PublicKey, eventQueue: PublicKey, dexProgram: PublicKey, remainingAccounts: any[]): TransactionInstruction;
export declare function initializeMarketNodeIx(asset: Asset, index: number): Promise<TransactionInstruction>;
export declare function retreatMarketNodesIx(asset: Asset, expiryIndex: number): TransactionInstruction;
export declare function updatePricingIx(asset: Asset, expiryIndex: number): TransactionInstruction;
export declare function applyPerpFundingIx(asset: Asset, remainingAccounts: any[]): TransactionInstruction;
export declare function updatePricingParametersIx(asset: Asset, args: UpdatePricingParametersArgs, admin: PublicKey): TransactionInstruction;
export declare function updateMarginParametersIx(asset: Asset, args: UpdateMarginParametersArgs, admin: PublicKey): TransactionInstruction;
export declare function updatePerpParametersIx(asset: Asset, args: UpdatePerpParametersArgs, admin: PublicKey): TransactionInstruction;
export declare function updateZetaGroupExpiryParameters(asset: Asset, args: UpdateZetaGroupExpiryArgs, admin: PublicKey): TransactionInstruction;
export declare function updateVolatilityNodesIx(asset: Asset, nodes: Array<anchor.BN>, admin: PublicKey): TransactionInstruction;
export declare function initializeZetaStateIx(stateAddress: PublicKey, stateNonce: number, serumAuthority: PublicKey, treasuryWallet: PublicKey, referralsAdmin: PublicKey, referralsRewardsWallet: PublicKey, serumNonce: number, mintAuthority: PublicKey, mintAuthorityNonce: number, params: StateParams): TransactionInstruction;
export declare function initializeZetaTreasuryWalletIx(): TransactionInstruction;
export declare function initializeZetaReferralsRewardsWalletIx(): TransactionInstruction;
export declare function updateZetaStateIx(params: StateParams, admin: PublicKey): TransactionInstruction;
export declare function initializeMarketIndexesIx(asset: Asset, marketIndexes: PublicKey, nonce: number): TransactionInstruction;
export declare function addMarketIndexesIx(asset: Asset, marketIndexes: PublicKey): TransactionInstruction;
export declare function initializeMarketStrikesIx(asset: Asset): TransactionInstruction;
export declare function initializeWhitelistDepositAccountIx(asset: Asset, user: PublicKey, admin: PublicKey): Promise<TransactionInstruction>;
export declare function initializeWhitelistInsuranceAccountIx(user: PublicKey, admin: PublicKey): Promise<TransactionInstruction>;
export declare function initializeWhitelistTradingFeesAccountIx(user: PublicKey, admin: PublicKey): Promise<TransactionInstruction>;
export declare function referUserIx(user: PublicKey, referrer: PublicKey): Promise<TransactionInstruction>;
export declare function initializeReferrerAccountIx(referrer: PublicKey): Promise<TransactionInstruction>;
export declare function initializeReferrerAliasIx(referrer: PublicKey, alias: string): Promise<TransactionInstruction>;
export declare function setReferralsRewardsIx(args: SetReferralsRewardsArgs[], referralsAdmin: PublicKey, remainingAccounts: AccountMeta[]): Promise<TransactionInstruction>;
export declare function claimReferralsRewardsIx(userReferralsAccount: PublicKey, userTokenAccount: PublicKey, user: PublicKey): Promise<TransactionInstruction>;
export declare function settlePositionsTxs(asset: Asset, expirationTs: anchor.BN, settlementPda: PublicKey, nonce: number, marginAccounts: any[]): Transaction[];
export declare function settlePositionsIx(asset: Asset, expirationTs: anchor.BN, settlementPda: PublicKey, nonce: number, marginAccounts: AccountMeta[]): TransactionInstruction;
export declare function settleSpreadPositionsIx(asset: Asset, expirationTs: anchor.BN, settlementPda: PublicKey, nonce: number, spreadAccounts: AccountMeta[]): TransactionInstruction;
export declare function settleSpreadPositionsHaltedTxs(asset: Asset, spreadAccounts: AccountMeta[], admin: PublicKey): Transaction[];
export declare function settlePositionsHaltedTxs(asset: Asset, marginAccounts: AccountMeta[], admin: PublicKey): Transaction[];
export declare function settlePositionsHaltedIx(asset: Asset, marginAccounts: AccountMeta[], admin: PublicKey): TransactionInstruction;
export declare function settleSpreadPositionsHaltedIx(asset: Asset, spreadAccounts: AccountMeta[], admin: PublicKey): TransactionInstruction;
export declare function cleanZetaMarketsIx(asset: Asset, marketAccounts: any[]): TransactionInstruction;
export declare function cleanZetaMarketsHaltedIx(asset: Asset, marketAccounts: any[]): TransactionInstruction;
export declare function updatePricingHaltedIx(asset: Asset, expiryIndex: number, admin: PublicKey): TransactionInstruction;
export declare function cleanMarketNodesIx(asset: Asset, expiryIndex: number): TransactionInstruction;
export declare function cancelOrderHaltedIx(asset: Asset, marketIndex: number, marginAccount: PublicKey, openOrders: PublicKey, orderId: anchor.BN, side: types.Side): TransactionInstruction;
export declare function haltZetaGroupIx(asset: Asset, zetaGroupAddress: PublicKey, admin: PublicKey): TransactionInstruction;
export declare function unhaltZetaGroupIx(asset: Asset, admin: PublicKey): TransactionInstruction;
export declare function updateHaltStateIx(zetaGroupAddress: PublicKey, args: UpdateHaltStateArgs, admin: PublicKey): TransactionInstruction;
export declare function updateVolatilityIx(asset: Asset, args: UpdateVolatilityArgs, admin: PublicKey): TransactionInstruction;
export declare function updateInterestRateIx(asset: Asset, args: UpdateInterestRateArgs, admin: PublicKey): TransactionInstruction;
export declare function updateAdminIx(admin: PublicKey, newAdmin: PublicKey): TransactionInstruction;
export declare function updateReferralsAdminIx(admin: PublicKey, newReferralsAdmin: PublicKey): TransactionInstruction;
export declare function expireSeriesOverrideIx(asset: Asset, admin: PublicKey, settlementAccount: PublicKey, args: ExpireSeriesOverrideArgs): TransactionInstruction;
export declare function initializeSpreadAccountIx(zetaGroup: PublicKey, spreadAccount: PublicKey, user: PublicKey): TransactionInstruction;
export declare function closeSpreadAccountIx(zetaGroup: PublicKey, spreadAccount: PublicKey, user: PublicKey): TransactionInstruction;
export declare function positionMovementIx(asset: Asset, zetaGroup: PublicKey, marginAccount: PublicKey, spreadAccount: PublicKey, user: PublicKey, greeks: PublicKey, oracle: PublicKey, oracleBackupFeed: PublicKey, oracleBackupProgram: PublicKey, movementType: types.MovementType, movements: PositionMovementArg[]): TransactionInstruction;
export declare function transferExcessSpreadBalanceIx(zetaGroup: PublicKey, marginAccount: PublicKey, spreadAccount: PublicKey, user: PublicKey): TransactionInstruction;
export declare function settleDexFundsTxs(asset: Asset, marketKey: PublicKey, vaultOwner: PublicKey, remainingAccounts: any[]): Transaction[];
export declare function settleDexFundsIx(asset: Asset, marketKey: PublicKey, vaultOwner: PublicKey, openOrders: PublicKey): TransactionInstruction;
export declare function burnVaultTokenTx(asset: Asset, marketKey: PublicKey): Transaction;
export declare function overrideExpiryIx(zetaGroup: PublicKey, args: OverrideExpiryArgs): TransactionInstruction;
export declare function toggleMarketMakerIx(isMarketMaker: boolean, zetaGroup: PublicKey, user: PublicKey): Promise<TransactionInstruction>;
export declare function editDelegatedPubkeyIx(asset: Asset, delegatedPubkey: PublicKey, marginAccount: PublicKey, authority: PublicKey): TransactionInstruction;
export interface ExpireSeriesOverrideArgs {
    settlementNonce: number;
    settlementPrice: anchor.BN;
}
export interface UpdateHaltStateArgs {
    spotPrice: anchor.BN;
    timestamp: anchor.BN;
}
export interface UpdateVolatilityArgs {
    expiryIndex: number;
    volatility: Array<anchor.BN>;
}
export interface UpdateInterestRateArgs {
    expiryIndex: number;
    interestRate: anchor.BN;
}
export interface StateParams {
    strikeInitializationThresholdSeconds: number;
    pricingFrequencySeconds: number;
    liquidatorLiquidationPercentage: number;
    insuranceVaultLiquidationPercentage: number;
    nativeD1TradeFeePercentage: anchor.BN;
    nativeD1UnderlyingFeePercentage: anchor.BN;
    nativeWhitelistUnderlyingFeePercentage: anchor.BN;
    nativeDepositLimit: anchor.BN;
    expirationThresholdSeconds: number;
    positionMovementFeeBps: number;
    marginConcessionPercentage: number;
    nativeOptionTradeFeePercentage: anchor.BN;
    nativeOptionUnderlyingFeePercentage: anchor.BN;
}
export interface UpdatePricingParametersArgs {
    optionTradeNormalizer: anchor.BN;
    futureTradeNormalizer: anchor.BN;
    maxVolatilityRetreat: anchor.BN;
    maxInterestRetreat: anchor.BN;
    maxDelta: anchor.BN;
    minDelta: anchor.BN;
    minInterestRate: anchor.BN;
    maxInterestRate: anchor.BN;
    minVolatility: anchor.BN;
    maxVolatility: anchor.BN;
}
export interface InitializeZetaGroupPricingArgs {
    interestRate: anchor.BN;
    volatility: Array<anchor.BN>;
    optionTradeNormalizer: anchor.BN;
    futureTradeNormalizer: anchor.BN;
    maxVolatilityRetreat: anchor.BN;
    maxInterestRetreat: anchor.BN;
    minDelta: anchor.BN;
    maxDelta: anchor.BN;
    minInterestRate: anchor.BN;
    maxInterestRate: anchor.BN;
    minVolatility: anchor.BN;
    maxVolatility: anchor.BN;
}
export interface UpdateMarginParametersArgs {
    futureMarginInitial: anchor.BN;
    futureMarginMaintenance: anchor.BN;
    optionMarkPercentageLongInitial: anchor.BN;
    optionSpotPercentageLongInitial: anchor.BN;
    optionSpotPercentageShortInitial: anchor.BN;
    optionDynamicPercentageShortInitial: anchor.BN;
    optionMarkPercentageLongMaintenance: anchor.BN;
    optionSpotPercentageLongMaintenance: anchor.BN;
    optionSpotPercentageShortMaintenance: anchor.BN;
    optionDynamicPercentageShortMaintenance: anchor.BN;
    optionShortPutCapPercentage: anchor.BN;
}
export interface UpdatePerpParametersArgs {
    minFundingRatePercent: anchor.BN;
    maxFundingRatePercent: anchor.BN;
    perpImpactCashDelta: anchor.BN;
}
export interface UpdateZetaGroupExpiryArgs {
    expiryIntervalSeconds: number;
    newExpiryThresholdSeconds: number;
}
export interface PositionMovementArg {
    index: number;
    size: anchor.BN;
}
export interface OverrideExpiryArgs {
    expiryIndex: number;
    activeTs: anchor.BN;
    expiryTs: anchor.BN;
}
export interface SetReferralsRewardsArgs {
    referralsAccountKey: PublicKey;
    pendingRewards: anchor.BN;
    overwrite: boolean;
}
