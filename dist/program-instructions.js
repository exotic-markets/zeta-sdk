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
exports.referUserIx = exports.initializeWhitelistTradingFeesAccountIx = exports.initializeWhitelistInsuranceAccountIx = exports.initializeWhitelistDepositAccountIx = exports.initializeMarketStrikesIx = exports.addMarketIndexesIx = exports.initializeMarketIndexesIx = exports.updateZetaStateIx = exports.initializeZetaReferralsRewardsWalletIx = exports.initializeZetaTreasuryWalletIx = exports.initializeZetaStateIx = exports.updateVolatilityNodesIx = exports.updateZetaGroupExpiryParameters = exports.updatePerpParametersIx = exports.updateMarginParametersIx = exports.updatePricingParametersIx = exports.applyPerpFundingIx = exports.updatePricingIx = exports.retreatMarketNodesIx = exports.initializeMarketNodeIx = exports.crankMarketIx = exports.liquidateIx = exports.rebalanceInsuranceVaultIx = exports.treasuryMovementIx = exports.collectTreasuryFundsIx = exports.initializeZetaGroupIx = exports.initializePerpSyncQueueIx = exports.initializeZetaMarketTxs = exports.initializeZetaMarketTIFEpochCyclesIx = exports.forceCancelOrdersIx = exports.forceCancelOrderByOrderIdIx = exports.cancelExpiredOrderIx = exports.cancelOrderByClientOrderIdNoErrorIx = exports.cancelOrderByClientOrderIdIx = exports.cancelAllMarketOrdersIx = exports.cancelOrderNoErrorIx = exports.cancelOrderIx = exports.placePerpOrderV2Ix = exports.placePerpOrderIx = exports.placeOrderV4Ix = exports.placeOrderV3Ix = exports.closeOpenOrdersIx = exports.initializeOpenOrdersIx = exports.withdrawIx = exports.withdrawInsuranceVaultIx = exports.depositInsuranceVaultIx = exports.depositIx = exports.initializeInsuranceDepositAccountIx = exports.closeMarginAccountIx = exports.initializeMarginAccountIx = void 0;
exports.toggleMarketMakerIx = exports.overrideExpiryIx = exports.burnVaultTokenTx = exports.settleDexFundsIx = exports.settleDexFundsTxs = exports.transferExcessSpreadBalanceIx = exports.positionMovementIx = exports.closeSpreadAccountIx = exports.initializeSpreadAccountIx = exports.expireSeriesOverrideIx = exports.updateReferralsAdminIx = exports.updateAdminIx = exports.updateInterestRateIx = exports.updateVolatilityIx = exports.updateHaltStateIx = exports.unhaltZetaGroupIx = exports.haltZetaGroupIx = exports.cancelOrderHaltedIx = exports.cleanMarketNodesIx = exports.updatePricingHaltedIx = exports.cleanZetaMarketsHaltedIx = exports.cleanZetaMarketsIx = exports.settleSpreadPositionsHaltedIx = exports.settlePositionsHaltedIx = exports.settlePositionsHaltedTxs = exports.settleSpreadPositionsHaltedTxs = exports.settleSpreadPositionsIx = exports.settlePositionsIx = exports.settlePositionsTxs = exports.claimReferralsRewardsIx = exports.setReferralsRewardsIx = exports.initializeReferrerAliasIx = exports.initializeReferrerAccountIx = void 0;
const exchange_1 = require("./exchange");
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const utils = __importStar(require("./utils"));
const anchor = __importStar(require("@project-serum/anchor"));
const types = __importStar(require("./types"));
const constants = __importStar(require("./constants"));
function initializeMarginAccountIx(zetaGroup, marginAccount, user) {
    return exchange_1.exchange.program.instruction.initializeMarginAccount({
        accounts: {
            zetaGroup,
            marginAccount,
            authority: user,
            payer: user,
            zetaProgram: exchange_1.exchange.programId,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
    });
}
exports.initializeMarginAccountIx = initializeMarginAccountIx;
function closeMarginAccountIx(asset, userKey, marginAccount) {
    return exchange_1.exchange.program.instruction.closeMarginAccount({
        accounts: {
            marginAccount,
            authority: userKey,
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
        },
    });
}
exports.closeMarginAccountIx = closeMarginAccountIx;
async function initializeInsuranceDepositAccountIx(asset, userKey, userWhitelistInsuranceKey) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let [insuranceDepositAccount, nonce] = await utils.getUserInsuranceDepositAccount(exchange_1.exchange.programId, subExchange.zetaGroupAddress, userKey);
    return exchange_1.exchange.program.instruction.initializeInsuranceDepositAccount(nonce, {
        accounts: {
            zetaGroup: subExchange.zetaGroupAddress,
            insuranceDepositAccount,
            authority: userKey,
            systemProgram: web3_js_1.SystemProgram.programId,
            whitelistInsuranceAccount: userWhitelistInsuranceKey,
        },
    });
}
exports.initializeInsuranceDepositAccountIx = initializeInsuranceDepositAccountIx;
/**
 * @param amount the native amount to deposit (6dp)
 */
async function depositIx(asset, amount, marginAccount, usdcAccount, userKey, whitelistDepositAccount) {
    let remainingAccounts = whitelistDepositAccount !== undefined
        ? [
            {
                pubkey: whitelistDepositAccount,
                isSigner: false,
                isWritable: false,
            },
        ]
        : [];
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    // TODO: Probably use mint to find decimal places in future.
    return exchange_1.exchange.program.instruction.deposit(new anchor.BN(amount), {
        accounts: {
            zetaGroup: subExchange.zetaGroupAddress,
            marginAccount: marginAccount,
            vault: subExchange.vaultAddress,
            userTokenAccount: usdcAccount,
            socializedLossAccount: subExchange.socializedLossAccountAddress,
            authority: userKey,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            state: exchange_1.exchange.stateAddress,
            greeks: subExchange.zetaGroup.greeks,
        },
        remainingAccounts,
    });
}
exports.depositIx = depositIx;
/**
 * @param amount
 * @param insuranceDepositAccount
 * @param usdcAccount
 * @param userKey
 */
function depositInsuranceVaultIx(asset, amount, insuranceDepositAccount, usdcAccount, userKey) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    return exchange_1.exchange.program.instruction.depositInsuranceVault(new anchor.BN(amount), {
        accounts: {
            zetaGroup: subExchange.zetaGroupAddress,
            insuranceVault: subExchange.insuranceVaultAddress,
            insuranceDepositAccount,
            userTokenAccount: usdcAccount,
            zetaVault: subExchange.vaultAddress,
            socializedLossAccount: subExchange.socializedLossAccountAddress,
            authority: userKey,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    });
}
exports.depositInsuranceVaultIx = depositInsuranceVaultIx;
function withdrawInsuranceVaultIx(asset, percentageAmount, insuranceDepositAccount, usdcAccount, userKey) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    return exchange_1.exchange.program.instruction.withdrawInsuranceVault(new anchor.BN(percentageAmount), {
        accounts: {
            zetaGroup: subExchange.zetaGroupAddress,
            insuranceVault: subExchange.insuranceVaultAddress,
            insuranceDepositAccount,
            userTokenAccount: usdcAccount,
            authority: userKey,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    });
}
exports.withdrawInsuranceVaultIx = withdrawInsuranceVaultIx;
/**
 * @param amount the native amount to withdraw (6dp)
 */
function withdrawIx(asset, amount, marginAccount, usdcAccount, userKey) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    return exchange_1.exchange.program.instruction.withdraw(new anchor.BN(amount), {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: subExchange.zetaGroupAddress,
            vault: subExchange.vaultAddress,
            marginAccount: marginAccount,
            userTokenAccount: usdcAccount,
            authority: userKey,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            greeks: subExchange.zetaGroup.greeks,
            oracle: subExchange.zetaGroup.oracle,
            socializedLossAccount: subExchange.socializedLossAccountAddress,
        },
    });
}
exports.withdrawIx = withdrawIx;
async function initializeOpenOrdersIx(asset, market, userKey, marginAccount) {
    const [openOrdersPda, _openOrdersNonce] = await utils.getOpenOrders(exchange_1.exchange.programId, market, userKey);
    const [openOrdersMap, _openOrdersMapNonce] = await utils.getOpenOrdersMap(exchange_1.exchange.programId, openOrdersPda);
    return [
        exchange_1.exchange.program.instruction.initializeOpenOrders({
            accounts: {
                state: exchange_1.exchange.stateAddress,
                zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
                dexProgram: constants.DEX_PID[exchange_1.exchange.network],
                systemProgram: web3_js_1.SystemProgram.programId,
                openOrders: openOrdersPda,
                marginAccount: marginAccount,
                authority: userKey,
                payer: userKey,
                market: market,
                rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                serumAuthority: exchange_1.exchange.serumAuthority,
                openOrdersMap,
            },
        }),
        openOrdersPda,
    ];
}
exports.initializeOpenOrdersIx = initializeOpenOrdersIx;
async function closeOpenOrdersIx(asset, market, userKey, marginAccount, openOrders) {
    const [openOrdersMap, openOrdersMapNonce] = await utils.getOpenOrdersMap(exchange_1.exchange.programId, openOrders);
    return exchange_1.exchange.program.instruction.closeOpenOrders(openOrdersMapNonce, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
            dexProgram: constants.DEX_PID[exchange_1.exchange.network],
            openOrders,
            marginAccount: marginAccount,
            authority: userKey,
            market: market,
            serumAuthority: exchange_1.exchange.serumAuthority,
            openOrdersMap,
        },
    });
}
exports.closeOpenOrdersIx = closeOpenOrdersIx;
function placeOrderV3Ix(asset, marketIndex, price, size, side, orderType, clientOrderId, tag, marginAccount, authority, openOrders, whitelistTradingFeesAccount) {
    if (tag.length > constants.MAX_ORDER_TAG_LENGTH) {
        throw Error(`Tag is too long! Max length = ${constants.MAX_ORDER_TAG_LENGTH}`);
    }
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let marketData = exchange_1.exchange.getMarket(asset, marketIndex);
    let remainingAccounts = whitelistTradingFeesAccount !== undefined
        ? [
            {
                pubkey: whitelistTradingFeesAccount,
                isSigner: false,
                isWritable: false,
            },
        ]
        : [];
    return exchange_1.exchange.program.instruction.placeOrderV3(new anchor.BN(price), new anchor.BN(size), types.toProgramSide(side), types.toProgramOrderType(orderType), clientOrderId == 0 ? null : new anchor.BN(clientOrderId), new String(tag), {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: subExchange.zetaGroupAddress,
            marginAccount: marginAccount,
            authority: authority,
            dexProgram: constants.DEX_PID[exchange_1.exchange.network],
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            serumAuthority: exchange_1.exchange.serumAuthority,
            greeks: subExchange.zetaGroup.greeks,
            openOrders: openOrders,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            marketAccounts: {
                market: marketData.serumMarket.address,
                requestQueue: marketData.serumMarket.requestQueueAddress,
                eventQueue: marketData.serumMarket.eventQueueAddress,
                bids: marketData.serumMarket.bidsAddress,
                asks: marketData.serumMarket.asksAddress,
                coinVault: marketData.serumMarket.baseVaultAddress,
                pcVault: marketData.serumMarket.quoteVaultAddress,
                // User params.
                orderPayerTokenAccount: side == types.Side.BID
                    ? marketData.quoteVault
                    : marketData.baseVault,
                coinWallet: marketData.baseVault,
                pcWallet: marketData.quoteVault,
            },
            oracle: subExchange.zetaGroup.oracle,
            marketNode: subExchange.greeks.nodeKeys[marketIndex],
            marketMint: side == types.Side.BID
                ? marketData.serumMarket.quoteMintAddress
                : marketData.serumMarket.baseMintAddress,
            mintAuthority: exchange_1.exchange.mintAuthority,
        },
        remainingAccounts,
    });
}
exports.placeOrderV3Ix = placeOrderV3Ix;
function placeOrderV4Ix(asset, marketIndex, price, size, side, orderType, clientOrderId, tag, tifOffset, marginAccount, authority, openOrders, whitelistTradingFeesAccount) {
    if (tag.length > constants.MAX_ORDER_TAG_LENGTH) {
        throw Error(`Tag is too long! Max length = ${constants.MAX_ORDER_TAG_LENGTH}`);
    }
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let marketData = exchange_1.exchange.getMarket(asset, marketIndex);
    let remainingAccounts = whitelistTradingFeesAccount !== undefined
        ? [
            {
                pubkey: whitelistTradingFeesAccount,
                isSigner: false,
                isWritable: false,
            },
        ]
        : [];
    return exchange_1.exchange.program.instruction.placeOrderV4(new anchor.BN(price), new anchor.BN(size), types.toProgramSide(side), types.toProgramOrderType(orderType), clientOrderId == 0 ? null : new anchor.BN(clientOrderId), new String(tag), tifOffset == 0 ? null : tifOffset, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: subExchange.zetaGroupAddress,
            marginAccount: marginAccount,
            authority: authority,
            dexProgram: constants.DEX_PID[exchange_1.exchange.network],
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            serumAuthority: exchange_1.exchange.serumAuthority,
            greeks: subExchange.zetaGroup.greeks,
            openOrders: openOrders,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            marketAccounts: {
                market: marketData.serumMarket.address,
                requestQueue: marketData.serumMarket.requestQueueAddress,
                eventQueue: marketData.serumMarket.eventQueueAddress,
                bids: marketData.serumMarket.bidsAddress,
                asks: marketData.serumMarket.asksAddress,
                coinVault: marketData.serumMarket.baseVaultAddress,
                pcVault: marketData.serumMarket.quoteVaultAddress,
                // User params.
                orderPayerTokenAccount: side == types.Side.BID
                    ? marketData.quoteVault
                    : marketData.baseVault,
                coinWallet: marketData.baseVault,
                pcWallet: marketData.quoteVault,
            },
            oracle: subExchange.zetaGroup.oracle,
            marketNode: subExchange.greeks.nodeKeys[marketIndex],
            marketMint: side == types.Side.BID
                ? marketData.serumMarket.quoteMintAddress
                : marketData.serumMarket.baseMintAddress,
            mintAuthority: exchange_1.exchange.mintAuthority,
        },
        remainingAccounts,
    });
}
exports.placeOrderV4Ix = placeOrderV4Ix;
function placePerpOrderIx(asset, marketIndex, price, size, side, orderType, clientOrderId, tag, marginAccount, authority, openOrders, whitelistTradingFeesAccount) {
    if (tag.length > constants.MAX_ORDER_TAG_LENGTH) {
        throw Error(`Tag is too long! Max length = ${constants.MAX_ORDER_TAG_LENGTH}`);
    }
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let marketData = subExchange.markets.perpMarket;
    let remainingAccounts = whitelistTradingFeesAccount !== undefined
        ? [
            {
                pubkey: whitelistTradingFeesAccount,
                isSigner: false,
                isWritable: false,
            },
        ]
        : [];
    return exchange_1.exchange.program.instruction.placePerpOrder(new anchor.BN(price), new anchor.BN(size), types.toProgramSide(side), types.toProgramOrderType(orderType), clientOrderId == 0 ? null : new anchor.BN(clientOrderId), new String(tag), {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: subExchange.zetaGroupAddress,
            marginAccount: marginAccount,
            authority: authority,
            dexProgram: constants.DEX_PID[exchange_1.exchange.network],
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            serumAuthority: exchange_1.exchange.serumAuthority,
            greeks: subExchange.zetaGroup.greeks,
            openOrders: openOrders,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            marketAccounts: {
                market: marketData.serumMarket.address,
                requestQueue: marketData.serumMarket.requestQueueAddress,
                eventQueue: marketData.serumMarket.eventQueueAddress,
                bids: marketData.serumMarket.bidsAddress,
                asks: marketData.serumMarket.asksAddress,
                coinVault: marketData.serumMarket.baseVaultAddress,
                pcVault: marketData.serumMarket.quoteVaultAddress,
                // User params.
                orderPayerTokenAccount: side == types.Side.BID
                    ? marketData.quoteVault
                    : marketData.baseVault,
                coinWallet: marketData.baseVault,
                pcWallet: marketData.quoteVault,
            },
            oracle: subExchange.zetaGroup.oracle,
            marketMint: side == types.Side.BID
                ? marketData.serumMarket.quoteMintAddress
                : marketData.serumMarket.baseMintAddress,
            mintAuthority: exchange_1.exchange.mintAuthority,
            perpSyncQueue: subExchange.zetaGroup.perpSyncQueue,
        },
        remainingAccounts,
    });
}
exports.placePerpOrderIx = placePerpOrderIx;
function placePerpOrderV2Ix(asset, marketIndex, price, size, side, orderType, clientOrderId, tag, tifOffset, marginAccount, authority, openOrders, whitelistTradingFeesAccount) {
    if (tag.length > constants.MAX_ORDER_TAG_LENGTH) {
        throw Error(`Tag is too long! Max length = ${constants.MAX_ORDER_TAG_LENGTH}`);
    }
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let marketData = subExchange.markets.perpMarket;
    let remainingAccounts = whitelistTradingFeesAccount !== undefined
        ? [
            {
                pubkey: whitelistTradingFeesAccount,
                isSigner: false,
                isWritable: false,
            },
        ]
        : [];
    return exchange_1.exchange.program.instruction.placePerpOrderV2(new anchor.BN(price), new anchor.BN(size), types.toProgramSide(side), types.toProgramOrderType(orderType), clientOrderId == 0 ? null : new anchor.BN(clientOrderId), new String(tag), tifOffset == 0 ? null : tifOffset, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: subExchange.zetaGroupAddress,
            marginAccount: marginAccount,
            authority: authority,
            dexProgram: constants.DEX_PID[exchange_1.exchange.network],
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            serumAuthority: exchange_1.exchange.serumAuthority,
            greeks: subExchange.zetaGroup.greeks,
            openOrders: openOrders,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            marketAccounts: {
                market: marketData.serumMarket.address,
                requestQueue: marketData.serumMarket.requestQueueAddress,
                eventQueue: marketData.serumMarket.eventQueueAddress,
                bids: marketData.serumMarket.bidsAddress,
                asks: marketData.serumMarket.asksAddress,
                coinVault: marketData.serumMarket.baseVaultAddress,
                pcVault: marketData.serumMarket.quoteVaultAddress,
                // User params.
                orderPayerTokenAccount: side == types.Side.BID
                    ? marketData.quoteVault
                    : marketData.baseVault,
                coinWallet: marketData.baseVault,
                pcWallet: marketData.quoteVault,
            },
            oracle: subExchange.zetaGroup.oracle,
            marketMint: side == types.Side.BID
                ? marketData.serumMarket.quoteMintAddress
                : marketData.serumMarket.baseMintAddress,
            mintAuthority: exchange_1.exchange.mintAuthority,
            perpSyncQueue: subExchange.zetaGroup.perpSyncQueue,
        },
        remainingAccounts,
    });
}
exports.placePerpOrderV2Ix = placePerpOrderV2Ix;
function cancelOrderIx(asset, marketIndex, userKey, marginAccount, openOrders, orderId, side) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let marketData = exchange_1.exchange.getMarket(asset, marketIndex);
    return exchange_1.exchange.program.instruction.cancelOrder(types.toProgramSide(side), orderId, {
        accounts: {
            authority: userKey,
            cancelAccounts: {
                zetaGroup: subExchange.zetaGroupAddress,
                state: exchange_1.exchange.stateAddress,
                marginAccount,
                dexProgram: constants.DEX_PID[exchange_1.exchange.network],
                serumAuthority: exchange_1.exchange.serumAuthority,
                openOrders,
                market: marketData.address,
                bids: marketData.serumMarket.bidsAddress,
                asks: marketData.serumMarket.asksAddress,
                eventQueue: marketData.serumMarket.eventQueueAddress,
            },
        },
    });
}
exports.cancelOrderIx = cancelOrderIx;
function cancelOrderNoErrorIx(asset, marketIndex, userKey, marginAccount, openOrders, orderId, side) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let marketData = exchange_1.exchange.getMarket(asset, marketIndex);
    return exchange_1.exchange.program.instruction.cancelOrderNoError(types.toProgramSide(side), orderId, {
        accounts: {
            authority: userKey,
            cancelAccounts: {
                zetaGroup: subExchange.zetaGroupAddress,
                state: exchange_1.exchange.stateAddress,
                marginAccount,
                dexProgram: constants.DEX_PID[exchange_1.exchange.network],
                serumAuthority: exchange_1.exchange.serumAuthority,
                openOrders,
                market: marketData.address,
                bids: marketData.serumMarket.bidsAddress,
                asks: marketData.serumMarket.asksAddress,
                eventQueue: marketData.serumMarket.eventQueueAddress,
            },
        },
    });
}
exports.cancelOrderNoErrorIx = cancelOrderNoErrorIx;
function cancelAllMarketOrdersIx(asset, marketIndex, userKey, marginAccount, openOrders) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let marketData = exchange_1.exchange.getMarket(asset, marketIndex);
    return exchange_1.exchange.program.instruction.cancelAllMarketOrders({
        accounts: {
            authority: userKey,
            cancelAccounts: {
                zetaGroup: subExchange.zetaGroupAddress,
                state: exchange_1.exchange.stateAddress,
                marginAccount,
                dexProgram: constants.DEX_PID[exchange_1.exchange.network],
                serumAuthority: exchange_1.exchange.serumAuthority,
                openOrders,
                market: marketData.address,
                bids: marketData.serumMarket.bidsAddress,
                asks: marketData.serumMarket.asksAddress,
                eventQueue: marketData.serumMarket.eventQueueAddress,
            },
        },
    });
}
exports.cancelAllMarketOrdersIx = cancelAllMarketOrdersIx;
function cancelOrderByClientOrderIdIx(asset, marketIndex, userKey, marginAccount, openOrders, clientOrderId) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let marketData = exchange_1.exchange.getMarket(asset, marketIndex);
    return exchange_1.exchange.program.instruction.cancelOrderByClientOrderId(clientOrderId, {
        accounts: {
            authority: userKey,
            cancelAccounts: {
                zetaGroup: subExchange.zetaGroupAddress,
                state: exchange_1.exchange.stateAddress,
                marginAccount,
                dexProgram: constants.DEX_PID[exchange_1.exchange.network],
                serumAuthority: exchange_1.exchange.serumAuthority,
                openOrders,
                market: marketData.address,
                bids: marketData.serumMarket.bidsAddress,
                asks: marketData.serumMarket.asksAddress,
                eventQueue: marketData.serumMarket.eventQueueAddress,
            },
        },
    });
}
exports.cancelOrderByClientOrderIdIx = cancelOrderByClientOrderIdIx;
function cancelOrderByClientOrderIdNoErrorIx(asset, marketIndex, userKey, marginAccount, openOrders, clientOrderId) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let marketData = exchange_1.exchange.getMarket(asset, marketIndex);
    return exchange_1.exchange.program.instruction.cancelOrderByClientOrderIdNoError(clientOrderId, {
        accounts: {
            authority: userKey,
            cancelAccounts: {
                zetaGroup: subExchange.zetaGroupAddress,
                state: exchange_1.exchange.stateAddress,
                marginAccount,
                dexProgram: constants.DEX_PID[exchange_1.exchange.network],
                serumAuthority: exchange_1.exchange.serumAuthority,
                openOrders,
                market: marketData.address,
                bids: marketData.serumMarket.bidsAddress,
                asks: marketData.serumMarket.asksAddress,
                eventQueue: marketData.serumMarket.eventQueueAddress,
            },
        },
    });
}
exports.cancelOrderByClientOrderIdNoErrorIx = cancelOrderByClientOrderIdNoErrorIx;
function cancelExpiredOrderIx(asset, marketIndex, marginAccount, openOrders, orderId, side) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let marketData = exchange_1.exchange.getMarket(asset, marketIndex);
    return exchange_1.exchange.program.instruction.cancelExpiredOrder(types.toProgramSide(side), orderId, {
        accounts: {
            cancelAccounts: {
                zetaGroup: subExchange.zetaGroupAddress,
                state: exchange_1.exchange.stateAddress,
                marginAccount,
                dexProgram: constants.DEX_PID[exchange_1.exchange.network],
                serumAuthority: exchange_1.exchange.serumAuthority,
                openOrders,
                market: marketData.address,
                bids: marketData.serumMarket.bidsAddress,
                asks: marketData.serumMarket.asksAddress,
                eventQueue: marketData.serumMarket.eventQueueAddress,
            },
        },
    });
}
exports.cancelExpiredOrderIx = cancelExpiredOrderIx;
function forceCancelOrderByOrderIdIx(asset, marketIndex, marginAccount, openOrders, orderId, side) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let marketData = exchange_1.exchange.getMarket(asset, marketIndex);
    return exchange_1.exchange.program.instruction.forceCancelOrderByOrderId(types.toProgramSide(side), orderId, {
        accounts: {
            greeks: subExchange.zetaGroup.greeks,
            oracle: subExchange.zetaGroup.oracle,
            cancelAccounts: {
                zetaGroup: subExchange.zetaGroupAddress,
                state: exchange_1.exchange.stateAddress,
                marginAccount,
                dexProgram: constants.DEX_PID[exchange_1.exchange.network],
                serumAuthority: exchange_1.exchange.serumAuthority,
                openOrders,
                market: marketData.address,
                bids: marketData.serumMarket.bidsAddress,
                asks: marketData.serumMarket.asksAddress,
                eventQueue: marketData.serumMarket.eventQueueAddress,
            },
        },
    });
}
exports.forceCancelOrderByOrderIdIx = forceCancelOrderByOrderIdIx;
function forceCancelOrdersIx(asset, marketIndex, marginAccount, openOrders) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let marketData = exchange_1.exchange.getMarket(asset, marketIndex);
    return exchange_1.exchange.program.instruction.forceCancelOrders({
        accounts: {
            greeks: subExchange.zetaGroup.greeks,
            oracle: subExchange.zetaGroup.oracle,
            cancelAccounts: {
                zetaGroup: subExchange.zetaGroupAddress,
                state: exchange_1.exchange.stateAddress,
                marginAccount,
                dexProgram: constants.DEX_PID[exchange_1.exchange.network],
                serumAuthority: exchange_1.exchange.serumAuthority,
                openOrders,
                market: marketData.address,
                bids: marketData.serumMarket.bidsAddress,
                asks: marketData.serumMarket.asksAddress,
                eventQueue: marketData.serumMarket.eventQueueAddress,
            },
        },
    });
}
exports.forceCancelOrdersIx = forceCancelOrdersIx;
function initializeZetaMarketTIFEpochCyclesIx(asset, marketIndex, cycleLength) {
    return exchange_1.exchange.program.instruction.initializeMarketTifEpochCycle(cycleLength, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            admin: exchange_1.exchange.state.admin,
            market: exchange_1.exchange.getMarket(asset, marketIndex).address,
            serumAuthority: exchange_1.exchange.serumAuthority,
            dexProgram: constants.DEX_PID[exchange_1.exchange.network],
        },
    });
}
exports.initializeZetaMarketTIFEpochCyclesIx = initializeZetaMarketTIFEpochCyclesIx;
async function initializeZetaMarketTxs(asset, marketIndex, seedIndex, requestQueue, eventQueue, bids, asks, marketIndexes) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    const [market, marketNonce] = await utils.getMarketUninitialized(exchange_1.exchange.programId, subExchange.zetaGroupAddress, seedIndex);
    const [vaultOwner, vaultSignerNonce] = await utils.getSerumVaultOwnerAndNonce(market, constants.DEX_PID[exchange_1.exchange.network]);
    const [baseMint, baseMintNonce] = await utils.getBaseMint(exchange_1.exchange.program.programId, market);
    const [quoteMint, quoteMintNonce] = await utils.getQuoteMint(exchange_1.exchange.program.programId, market);
    // Create SPL token vaults for serum trading owned by the Zeta program
    const [zetaBaseVault, zetaBaseVaultNonce] = await utils.getZetaVault(exchange_1.exchange.program.programId, baseMint);
    const [zetaQuoteVault, zetaQuoteVaultNonce] = await utils.getZetaVault(exchange_1.exchange.program.programId, quoteMint);
    // Create SPL token vaults for serum trading owned by the DEX program
    const [dexBaseVault, dexBaseVaultNonce] = await utils.getSerumVault(exchange_1.exchange.program.programId, baseMint);
    const [dexQuoteVault, dexQuoteVaultNonce] = await utils.getSerumVault(exchange_1.exchange.program.programId, quoteMint);
    let fromPubkey = exchange_1.exchange.useLedger
        ? exchange_1.exchange.ledgerWallet.publicKey
        : exchange_1.exchange.provider.wallet.publicKey;
    const tx = new web3_js_1.Transaction();
    tx.add(web3_js_1.SystemProgram.createAccount({
        fromPubkey,
        newAccountPubkey: requestQueue,
        lamports: await exchange_1.exchange.provider.connection.getMinimumBalanceForRentExemption(5120 + 12),
        space: 5120 + 12,
        programId: constants.DEX_PID[exchange_1.exchange.network],
    }), web3_js_1.SystemProgram.createAccount({
        fromPubkey,
        newAccountPubkey: eventQueue,
        lamports: await exchange_1.exchange.provider.connection.getMinimumBalanceForRentExemption(262144 + 12),
        space: 262144 + 12,
        programId: constants.DEX_PID[exchange_1.exchange.network],
    }), web3_js_1.SystemProgram.createAccount({
        fromPubkey,
        newAccountPubkey: bids,
        lamports: await exchange_1.exchange.provider.connection.getMinimumBalanceForRentExemption(65536 + 12),
        space: 65536 + 12,
        programId: constants.DEX_PID[exchange_1.exchange.network],
    }), web3_js_1.SystemProgram.createAccount({
        fromPubkey,
        newAccountPubkey: asks,
        lamports: await exchange_1.exchange.provider.connection.getMinimumBalanceForRentExemption(65536 + 12),
        space: 65536 + 12,
        programId: constants.DEX_PID[exchange_1.exchange.network],
    }));
    let tx2 = new web3_js_1.Transaction().add(exchange_1.exchange.program.instruction.initializeZetaMarket({
        index: marketIndex,
        marketNonce,
        baseMintNonce,
        quoteMintNonce,
        zetaBaseVaultNonce,
        zetaQuoteVaultNonce,
        dexBaseVaultNonce,
        dexQuoteVaultNonce,
        vaultSignerNonce,
    }, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            marketIndexes: marketIndexes,
            zetaGroup: subExchange.zetaGroupAddress,
            admin: exchange_1.exchange.state.admin,
            market,
            requestQueue: requestQueue,
            eventQueue: eventQueue,
            bids: bids,
            asks: asks,
            baseMint,
            quoteMint,
            zetaBaseVault,
            zetaQuoteVault,
            dexBaseVault,
            dexQuoteVault,
            vaultOwner,
            mintAuthority: exchange_1.exchange.mintAuthority,
            serumAuthority: exchange_1.exchange.serumAuthority,
            dexProgram: constants.DEX_PID[exchange_1.exchange.network],
            systemProgram: web3_js_1.SystemProgram.programId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
        },
    }));
    return [tx, tx2];
}
exports.initializeZetaMarketTxs = initializeZetaMarketTxs;
async function initializePerpSyncQueueIx(asset) {
    let [perpSyncQueue, nonce] = await utils.getPerpSyncQueue(exchange_1.exchange.programId, exchange_1.exchange.getSubExchange(asset).zetaGroupAddress);
    return exchange_1.exchange.program.instruction.initializePerpSyncQueue(nonce, {
        accounts: {
            admin: exchange_1.exchange.state.admin,
            zetaProgram: exchange_1.exchange.programId,
            state: exchange_1.exchange.stateAddress,
            perpSyncQueue,
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
            systemProgram: web3_js_1.SystemProgram.programId,
        },
    });
}
exports.initializePerpSyncQueueIx = initializePerpSyncQueueIx;
async function initializeZetaGroupIx(asset, underlyingMint, oracle, pricingArgs, perpArgs, marginArgs, expiryArgs) {
    let [zetaGroup, zetaGroupNonce] = await utils.getZetaGroup(exchange_1.exchange.programId, underlyingMint);
    let [underlying, underlyingNonce] = await utils.getUnderlying(exchange_1.exchange.programId, exchange_1.exchange.state.numUnderlyings);
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let [greeks, greeksNonce] = await utils.getGreeks(exchange_1.exchange.programId, subExchange.zetaGroupAddress);
    let [perpSyncQueue, perpSyncQueueNonce] = await utils.getPerpSyncQueue(exchange_1.exchange.programId, subExchange.zetaGroupAddress);
    let [vault, vaultNonce] = await utils.getVault(exchange_1.exchange.programId, subExchange.zetaGroupAddress);
    let [insuranceVault, insuranceVaultNonce] = await utils.getZetaInsuranceVault(exchange_1.exchange.programId, subExchange.zetaGroupAddress);
    let [socializedLossAccount, socializedLossAccountNonce] = await utils.getSocializedLossAccount(exchange_1.exchange.programId, subExchange.zetaGroupAddress);
    return exchange_1.exchange.program.instruction.initializeZetaGroup({
        zetaGroupNonce,
        underlyingNonce,
        greeksNonce,
        vaultNonce,
        insuranceVaultNonce,
        socializedLossAccountNonce,
        perpSyncQueueNonce,
        interestRate: pricingArgs.interestRate,
        volatility: pricingArgs.volatility,
        optionTradeNormalizer: pricingArgs.optionTradeNormalizer,
        futureTradeNormalizer: pricingArgs.futureTradeNormalizer,
        maxVolatilityRetreat: pricingArgs.maxVolatilityRetreat,
        maxInterestRetreat: pricingArgs.maxInterestRetreat,
        maxDelta: pricingArgs.maxDelta,
        minDelta: pricingArgs.minDelta,
        minInterestRate: pricingArgs.minInterestRate,
        maxInterestRate: pricingArgs.maxInterestRate,
        minVolatility: pricingArgs.minVolatility,
        maxVolatility: pricingArgs.maxVolatility,
        futureMarginInitial: marginArgs.futureMarginInitial,
        futureMarginMaintenance: marginArgs.futureMarginMaintenance,
        optionMarkPercentageLongInitial: marginArgs.optionMarkPercentageLongInitial,
        optionSpotPercentageLongInitial: marginArgs.optionSpotPercentageLongInitial,
        optionSpotPercentageShortInitial: marginArgs.optionSpotPercentageShortInitial,
        optionDynamicPercentageShortInitial: marginArgs.optionDynamicPercentageShortInitial,
        optionMarkPercentageLongMaintenance: marginArgs.optionMarkPercentageLongMaintenance,
        optionSpotPercentageLongMaintenance: marginArgs.optionSpotPercentageLongMaintenance,
        optionSpotPercentageShortMaintenance: marginArgs.optionSpotPercentageShortMaintenance,
        optionDynamicPercentageShortMaintenance: marginArgs.optionDynamicPercentageShortMaintenance,
        optionShortPutCapPercentage: marginArgs.optionShortPutCapPercentage,
        expiryIntervalSeconds: expiryArgs.expiryIntervalSeconds,
        newExpiryThresholdSeconds: expiryArgs.newExpiryThresholdSeconds,
        minFundingRatePercent: perpArgs.minFundingRatePercent,
        maxFundingRatePercent: perpArgs.maxFundingRatePercent,
        perpImpactCashDelta: perpArgs.perpImpactCashDelta,
    }, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            admin: exchange_1.exchange.state.admin,
            systemProgram: web3_js_1.SystemProgram.programId,
            underlyingMint,
            zetaProgram: exchange_1.exchange.programId,
            oracle,
            zetaGroup,
            greeks,
            perpSyncQueue,
            underlying,
            vault,
            insuranceVault,
            socializedLossAccount,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            usdcMint: exchange_1.exchange.usdcMintAddress,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
        },
    });
}
exports.initializeZetaGroupIx = initializeZetaGroupIx;
function collectTreasuryFundsIx(collectionTokenAccount, amount, admin) {
    return exchange_1.exchange.program.instruction.collectTreasuryFunds(amount, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            treasuryWallet: exchange_1.exchange.treasuryWalletAddress,
            collectionTokenAccount,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            admin,
        },
    });
}
exports.collectTreasuryFundsIx = collectTreasuryFundsIx;
function treasuryMovementIx(asset, treasuryMovementType, amount) {
    return exchange_1.exchange.program.instruction.treasuryMovement(types.toProgramTreasuryMovementType(treasuryMovementType), amount, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
            insuranceVault: exchange_1.exchange.getInsuranceVaultAddress(asset),
            treasuryWallet: exchange_1.exchange.treasuryWalletAddress,
            referralsRewardsWallet: exchange_1.exchange.referralsRewardsWalletAddress,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            admin: exchange_1.exchange.provider.wallet.publicKey,
        },
    });
}
exports.treasuryMovementIx = treasuryMovementIx;
function rebalanceInsuranceVaultIx(asset, remainingAccounts) {
    return exchange_1.exchange.program.instruction.rebalanceInsuranceVault({
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
            zetaVault: exchange_1.exchange.getVaultAddress(asset),
            insuranceVault: exchange_1.exchange.getInsuranceVaultAddress(asset),
            treasuryWallet: exchange_1.exchange.treasuryWalletAddress,
            socializedLossAccount: exchange_1.exchange.getSocializedLossAccountAddress(asset),
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
        remainingAccounts,
    });
}
exports.rebalanceInsuranceVaultIx = rebalanceInsuranceVaultIx;
function liquidateIx(asset, liquidator, liquidatorMarginAccount, market, liquidatedMarginAccount, size) {
    let liquidateSize = new anchor.BN(size);
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    return exchange_1.exchange.program.instruction.liquidate(liquidateSize, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            liquidator,
            liquidatorMarginAccount,
            greeks: subExchange.zetaGroup.greeks,
            oracle: subExchange.zetaGroup.oracle,
            market,
            zetaGroup: subExchange.zetaGroupAddress,
            liquidatedMarginAccount,
        },
    });
}
exports.liquidateIx = liquidateIx;
function crankMarketIx(asset, market, eventQueue, dexProgram, remainingAccounts) {
    return exchange_1.exchange.program.instruction.crankEventQueue({
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
            market,
            eventQueue,
            dexProgram,
            serumAuthority: exchange_1.exchange.serumAuthority,
        },
        remainingAccounts,
    });
}
exports.crankMarketIx = crankMarketIx;
async function initializeMarketNodeIx(asset, index) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let [marketNode, nonce] = await utils.getMarketNode(exchange_1.exchange.programId, subExchange.zetaGroupAddress, index);
    return exchange_1.exchange.program.instruction.initializeMarketNode({ nonce, index }, {
        accounts: {
            zetaGroup: subExchange.zetaGroupAddress,
            marketNode,
            greeks: subExchange.greeksAddress,
            payer: exchange_1.exchange.provider.wallet.publicKey,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
    });
}
exports.initializeMarketNodeIx = initializeMarketNodeIx;
function retreatMarketNodesIx(asset, expiryIndex) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let head = expiryIndex * constants.PRODUCTS_PER_EXPIRY;
    let remainingAccounts = subExchange.greeks.nodeKeys
        .map((x) => {
        return {
            pubkey: x,
            isSigner: false,
            isWritable: true,
        };
    })
        .slice(head, head + constants.PRODUCTS_PER_EXPIRY);
    return exchange_1.exchange.program.instruction.retreatMarketNodes(expiryIndex, {
        accounts: {
            zetaGroup: subExchange.zetaGroupAddress,
            greeks: subExchange.greeksAddress,
            oracle: subExchange.zetaGroup.oracle,
        },
        remainingAccounts,
    });
}
exports.retreatMarketNodesIx = retreatMarketNodesIx;
function updatePricingIx(asset, expiryIndex) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let marketData = exchange_1.exchange.getPerpMarket(asset);
    return exchange_1.exchange.program.instruction.updatePricing(expiryIndex, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: subExchange.zetaGroupAddress,
            greeks: subExchange.greeksAddress,
            oracle: subExchange.zetaGroup.oracle,
            perpMarket: marketData.address,
            perpBids: subExchange.markets.perpMarket.serumMarket.bidsAddress,
            perpAsks: subExchange.markets.perpMarket.serumMarket.asksAddress,
        },
    });
}
exports.updatePricingIx = updatePricingIx;
function applyPerpFundingIx(asset, remainingAccounts) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    return exchange_1.exchange.program.instruction.applyPerpFunding({
        accounts: {
            zetaGroup: subExchange.zetaGroupAddress,
            greeks: subExchange.greeksAddress,
        },
        remainingAccounts, // margin accounts
    });
}
exports.applyPerpFundingIx = applyPerpFundingIx;
function updatePricingParametersIx(asset, args, admin) {
    return exchange_1.exchange.program.instruction.updatePricingParameters(args, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
            admin,
        },
    });
}
exports.updatePricingParametersIx = updatePricingParametersIx;
function updateMarginParametersIx(asset, args, admin) {
    return exchange_1.exchange.program.instruction.updateMarginParameters(args, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
            admin,
        },
    });
}
exports.updateMarginParametersIx = updateMarginParametersIx;
function updatePerpParametersIx(asset, args, admin) {
    return exchange_1.exchange.program.instruction.updatePerpParameters(args, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
            admin,
        },
    });
}
exports.updatePerpParametersIx = updatePerpParametersIx;
function updateZetaGroupExpiryParameters(asset, args, admin) {
    return exchange_1.exchange.program.instruction.updateZetaGroupExpiryParameters(args, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
            admin,
        },
    });
}
exports.updateZetaGroupExpiryParameters = updateZetaGroupExpiryParameters;
function updateVolatilityNodesIx(asset, nodes, admin) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    return exchange_1.exchange.program.instruction.updateVolatilityNodes(nodes, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: subExchange.zetaGroupAddress,
            greeks: subExchange.greeksAddress,
            admin,
        },
    });
}
exports.updateVolatilityNodesIx = updateVolatilityNodesIx;
function initializeZetaStateIx(stateAddress, stateNonce, serumAuthority, treasuryWallet, referralsAdmin, referralsRewardsWallet, serumNonce, mintAuthority, mintAuthorityNonce, params) {
    let args = params;
    args["stateNonce"] = stateNonce;
    args["serumNonce"] = serumNonce;
    args["mintAuthNonce"] = mintAuthorityNonce;
    return exchange_1.exchange.program.instruction.initializeZetaState(args, {
        accounts: {
            state: stateAddress,
            serumAuthority,
            mintAuthority,
            treasuryWallet,
            referralsAdmin,
            referralsRewardsWallet,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            systemProgram: web3_js_1.SystemProgram.programId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            usdcMint: exchange_1.exchange.usdcMintAddress,
            admin: exchange_1.exchange.provider.wallet.publicKey,
        },
    });
}
exports.initializeZetaStateIx = initializeZetaStateIx;
function initializeZetaTreasuryWalletIx() {
    return exchange_1.exchange.program.instruction.initializeZetaTreasuryWallet({
        accounts: {
            state: exchange_1.exchange.stateAddress,
            treasuryWallet: exchange_1.exchange.treasuryWalletAddress,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            systemProgram: web3_js_1.SystemProgram.programId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            usdcMint: exchange_1.exchange.usdcMintAddress,
            admin: exchange_1.exchange.provider.wallet.publicKey,
        },
    });
}
exports.initializeZetaTreasuryWalletIx = initializeZetaTreasuryWalletIx;
function initializeZetaReferralsRewardsWalletIx() {
    return exchange_1.exchange.program.instruction.initializeZetaReferralsRewardsWallet({
        accounts: {
            state: exchange_1.exchange.stateAddress,
            referralsRewardsWallet: exchange_1.exchange.referralsRewardsWalletAddress,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            systemProgram: web3_js_1.SystemProgram.programId,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            usdcMint: exchange_1.exchange.usdcMintAddress,
            admin: exchange_1.exchange.provider.wallet.publicKey,
        },
    });
}
exports.initializeZetaReferralsRewardsWalletIx = initializeZetaReferralsRewardsWalletIx;
function updateZetaStateIx(params, admin) {
    return exchange_1.exchange.program.instruction.updateZetaState(params, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            admin,
        },
    });
}
exports.updateZetaStateIx = updateZetaStateIx;
function initializeMarketIndexesIx(asset, marketIndexes, nonce) {
    return exchange_1.exchange.program.instruction.initializeMarketIndexes(nonce, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            marketIndexes: marketIndexes,
            admin: exchange_1.exchange.state.admin,
            systemProgram: web3_js_1.SystemProgram.programId,
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
        },
    });
}
exports.initializeMarketIndexesIx = initializeMarketIndexesIx;
function addMarketIndexesIx(asset, marketIndexes) {
    return exchange_1.exchange.program.instruction.addMarketIndexes({
        accounts: {
            marketIndexes,
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
        },
    });
}
exports.addMarketIndexesIx = addMarketIndexesIx;
function initializeMarketStrikesIx(asset) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    return exchange_1.exchange.program.instruction.initializeMarketStrikes({
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: subExchange.zetaGroupAddress,
            oracle: subExchange.zetaGroup.oracle,
        },
    });
}
exports.initializeMarketStrikesIx = initializeMarketStrikesIx;
async function initializeWhitelistDepositAccountIx(asset, user, admin) {
    let [whitelistDepositAccount, whitelistDepositNonce] = await utils.getUserWhitelistDepositAccount(exchange_1.exchange.program.programId, user);
    return exchange_1.exchange.program.instruction.initializeWhitelistDepositAccount(whitelistDepositNonce, {
        accounts: {
            whitelistDepositAccount,
            admin,
            user: user,
            systemProgram: web3_js_1.SystemProgram.programId,
            state: exchange_1.exchange.stateAddress,
        },
    });
}
exports.initializeWhitelistDepositAccountIx = initializeWhitelistDepositAccountIx;
async function initializeWhitelistInsuranceAccountIx(user, admin) {
    let [whitelistInsuranceAccount, whitelistInsuranceNonce] = await utils.getUserWhitelistInsuranceAccount(exchange_1.exchange.program.programId, user);
    return exchange_1.exchange.program.instruction.initializeWhitelistInsuranceAccount(whitelistInsuranceNonce, {
        accounts: {
            whitelistInsuranceAccount,
            admin,
            user: user,
            systemProgram: web3_js_1.SystemProgram.programId,
            state: exchange_1.exchange.stateAddress,
        },
    });
}
exports.initializeWhitelistInsuranceAccountIx = initializeWhitelistInsuranceAccountIx;
async function initializeWhitelistTradingFeesAccountIx(user, admin) {
    let [whitelistTradingFeesAccount, whitelistTradingFeesNonce] = await utils.getUserWhitelistTradingFeesAccount(exchange_1.exchange.program.programId, user);
    return exchange_1.exchange.program.instruction.initializeWhitelistTradingFeesAccount(whitelistTradingFeesNonce, {
        accounts: {
            whitelistTradingFeesAccount,
            admin,
            user: user,
            systemProgram: web3_js_1.SystemProgram.programId,
            state: exchange_1.exchange.stateAddress,
        },
    });
}
exports.initializeWhitelistTradingFeesAccountIx = initializeWhitelistTradingFeesAccountIx;
async function referUserIx(user, referrer) {
    let [referrerAccount, _referrerAccountNonce] = await utils.getReferrerAccountAddress(exchange_1.exchange.program.programId, referrer);
    let [referralAccount, _referralAccountNonce] = await utils.getReferralAccountAddress(exchange_1.exchange.program.programId, user);
    return exchange_1.exchange.program.instruction.referUser({
        accounts: {
            user,
            referrerAccount,
            referralAccount,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
    });
}
exports.referUserIx = referUserIx;
async function initializeReferrerAccountIx(referrer) {
    let [referrerAccount, _referrerAccountNonce] = await utils.getReferrerAccountAddress(exchange_1.exchange.program.programId, referrer);
    return exchange_1.exchange.program.instruction.initializeReferrerAccount({
        accounts: {
            referrer,
            referrerAccount,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
    });
}
exports.initializeReferrerAccountIx = initializeReferrerAccountIx;
async function initializeReferrerAliasIx(referrer, alias) {
    let [referrerAccount] = await utils.getReferrerAccountAddress(exchange_1.exchange.program.programId, referrer);
    let [referrerAlias] = await utils.getReferrerAliasAddress(exchange_1.exchange.program.programId, alias);
    return exchange_1.exchange.program.instruction.initializeReferrerAlias(alias, {
        accounts: {
            referrer,
            referrerAlias,
            referrerAccount,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
    });
}
exports.initializeReferrerAliasIx = initializeReferrerAliasIx;
async function setReferralsRewardsIx(args, referralsAdmin, remainingAccounts) {
    return exchange_1.exchange.program.instruction.setReferralsRewards(args, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            referralsAdmin,
        },
        remainingAccounts,
    });
}
exports.setReferralsRewardsIx = setReferralsRewardsIx;
async function claimReferralsRewardsIx(userReferralsAccount, userTokenAccount, user) {
    return exchange_1.exchange.program.instruction.claimReferralsRewards({
        accounts: {
            state: exchange_1.exchange.stateAddress,
            referralsRewardsWallet: exchange_1.exchange.referralsRewardsWalletAddress,
            userReferralsAccount,
            userTokenAccount,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            user,
        },
    });
}
exports.claimReferralsRewardsIx = claimReferralsRewardsIx;
function settlePositionsTxs(asset, expirationTs, settlementPda, nonce, marginAccounts) {
    let txs = [];
    for (var i = 0; i < marginAccounts.length; i += constants.MAX_SETTLEMENT_ACCOUNTS) {
        let tx = new web3_js_1.Transaction();
        let slice = marginAccounts.slice(i, i + constants.MAX_SETTLEMENT_ACCOUNTS);
        tx.add(settlePositionsIx(asset, expirationTs, settlementPda, nonce, slice));
        txs.push(tx);
    }
    return txs;
}
exports.settlePositionsTxs = settlePositionsTxs;
function settlePositionsIx(asset, expirationTs, settlementPda, nonce, marginAccounts) {
    return exchange_1.exchange.program.instruction.settlePositions(expirationTs, nonce, {
        accounts: {
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
            settlementAccount: settlementPda,
        },
        remainingAccounts: marginAccounts,
    });
}
exports.settlePositionsIx = settlePositionsIx;
function settleSpreadPositionsIx(asset, expirationTs, settlementPda, nonce, spreadAccounts) {
    return exchange_1.exchange.program.instruction.settleSpreadPositions(expirationTs, nonce, {
        accounts: {
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
            settlementAccount: settlementPda,
        },
        remainingAccounts: spreadAccounts,
    });
}
exports.settleSpreadPositionsIx = settleSpreadPositionsIx;
function settleSpreadPositionsHaltedTxs(asset, spreadAccounts, admin) {
    let txs = [];
    for (var i = 0; i < spreadAccounts.length; i += constants.MAX_SETTLEMENT_ACCOUNTS) {
        let slice = spreadAccounts.slice(i, i + constants.MAX_SETTLEMENT_ACCOUNTS);
        txs.push(new web3_js_1.Transaction().add(settleSpreadPositionsHaltedIx(asset, slice, admin)));
    }
    return txs;
}
exports.settleSpreadPositionsHaltedTxs = settleSpreadPositionsHaltedTxs;
function settlePositionsHaltedTxs(asset, marginAccounts, admin) {
    let txs = [];
    for (var i = 0; i < marginAccounts.length; i += constants.MAX_SETTLEMENT_ACCOUNTS) {
        let slice = marginAccounts.slice(i, i + constants.MAX_SETTLEMENT_ACCOUNTS);
        txs.push(new web3_js_1.Transaction().add(settlePositionsHaltedIx(asset, slice, admin)));
    }
    return txs;
}
exports.settlePositionsHaltedTxs = settlePositionsHaltedTxs;
function settlePositionsHaltedIx(asset, marginAccounts, admin) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    return exchange_1.exchange.program.instruction.settlePositionsHalted({
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: subExchange.zetaGroupAddress,
            greeks: subExchange.greeksAddress,
            admin,
        },
        remainingAccounts: marginAccounts,
    });
}
exports.settlePositionsHaltedIx = settlePositionsHaltedIx;
function settleSpreadPositionsHaltedIx(asset, spreadAccounts, admin) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    return exchange_1.exchange.program.instruction.settleSpreadPositionsHalted({
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: subExchange.zetaGroupAddress,
            greeks: subExchange.greeksAddress,
            admin,
        },
        remainingAccounts: spreadAccounts,
    });
}
exports.settleSpreadPositionsHaltedIx = settleSpreadPositionsHaltedIx;
function cleanZetaMarketsIx(asset, marketAccounts) {
    return exchange_1.exchange.program.instruction.cleanZetaMarkets({
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
        },
        remainingAccounts: marketAccounts,
    });
}
exports.cleanZetaMarketsIx = cleanZetaMarketsIx;
function cleanZetaMarketsHaltedIx(asset, marketAccounts) {
    return exchange_1.exchange.program.instruction.cleanZetaMarketsHalted({
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
        },
        remainingAccounts: marketAccounts,
    });
}
exports.cleanZetaMarketsHaltedIx = cleanZetaMarketsHaltedIx;
function updatePricingHaltedIx(asset, expiryIndex, admin) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let marketData = exchange_1.exchange.getPerpMarket(asset);
    return exchange_1.exchange.program.instruction.updatePricingHalted(expiryIndex, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: subExchange.zetaGroupAddress,
            greeks: subExchange.greeksAddress,
            admin,
            perpMarket: marketData.address,
            perpBids: subExchange.markets.perpMarket.serumMarket.bidsAddress,
            perpAsks: subExchange.markets.perpMarket.serumMarket.asksAddress,
        },
    });
}
exports.updatePricingHaltedIx = updatePricingHaltedIx;
function cleanMarketNodesIx(asset, expiryIndex) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let head = expiryIndex * constants.PRODUCTS_PER_EXPIRY;
    let remainingAccounts = subExchange.greeks.nodeKeys
        .map((x) => {
        return {
            pubkey: x,
            isSigner: false,
            isWritable: true,
        };
    })
        .slice(head, head + constants.PRODUCTS_PER_EXPIRY);
    return exchange_1.exchange.program.instruction.cleanMarketNodes(expiryIndex, {
        accounts: {
            zetaGroup: subExchange.zetaGroupAddress,
            greeks: subExchange.greeksAddress,
        },
        remainingAccounts,
    });
}
exports.cleanMarketNodesIx = cleanMarketNodesIx;
function cancelOrderHaltedIx(asset, marketIndex, marginAccount, openOrders, orderId, side) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let marketData = exchange_1.exchange.getMarket(asset, marketIndex);
    return exchange_1.exchange.program.instruction.cancelOrderHalted(types.toProgramSide(side), orderId, {
        accounts: {
            cancelAccounts: {
                zetaGroup: subExchange.zetaGroupAddress,
                state: exchange_1.exchange.stateAddress,
                marginAccount,
                dexProgram: constants.DEX_PID[exchange_1.exchange.network],
                serumAuthority: exchange_1.exchange.serumAuthority,
                openOrders,
                market: marketData.address,
                bids: marketData.serumMarket.bidsAddress,
                asks: marketData.serumMarket.asksAddress,
                eventQueue: marketData.serumMarket.eventQueueAddress,
            },
        },
    });
}
exports.cancelOrderHaltedIx = cancelOrderHaltedIx;
function haltZetaGroupIx(asset, zetaGroupAddress, admin) {
    return exchange_1.exchange.program.instruction.haltZetaGroup({
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: zetaGroupAddress,
            greeks: exchange_1.exchange.getSubExchange(asset).greeksAddress,
            admin,
        },
    });
}
exports.haltZetaGroupIx = haltZetaGroupIx;
function unhaltZetaGroupIx(asset, admin) {
    return exchange_1.exchange.program.instruction.unhaltZetaGroup({
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: exchange_1.exchange.getZetaGroupAddress(asset),
            admin,
            greeks: exchange_1.exchange.getSubExchange(asset).greeksAddress,
        },
    });
}
exports.unhaltZetaGroupIx = unhaltZetaGroupIx;
function updateHaltStateIx(zetaGroupAddress, args, admin) {
    return exchange_1.exchange.program.instruction.updateHaltState(args, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: zetaGroupAddress,
            admin,
        },
    });
}
exports.updateHaltStateIx = updateHaltStateIx;
function updateVolatilityIx(asset, args, admin) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    return exchange_1.exchange.program.instruction.updateVolatility(args, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            greeks: subExchange.greeksAddress,
            zetaGroup: subExchange.zetaGroupAddress,
            admin,
        },
    });
}
exports.updateVolatilityIx = updateVolatilityIx;
function updateInterestRateIx(asset, args, admin) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    return exchange_1.exchange.program.instruction.updateInterestRate(args, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            greeks: subExchange.greeksAddress,
            zetaGroup: subExchange.zetaGroupAddress,
            admin,
        },
    });
}
exports.updateInterestRateIx = updateInterestRateIx;
function updateAdminIx(admin, newAdmin) {
    return exchange_1.exchange.program.instruction.updateAdmin({
        accounts: {
            state: exchange_1.exchange.stateAddress,
            admin,
            newAdmin,
        },
    });
}
exports.updateAdminIx = updateAdminIx;
function updateReferralsAdminIx(admin, newReferralsAdmin) {
    return exchange_1.exchange.program.instruction.updateReferralsAdmin({
        accounts: {
            state: exchange_1.exchange.stateAddress,
            admin,
            newAdmin: newReferralsAdmin,
        },
    });
}
exports.updateReferralsAdminIx = updateReferralsAdminIx;
function expireSeriesOverrideIx(asset, admin, settlementAccount, args) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    return exchange_1.exchange.program.instruction.expireSeriesOverride(args, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: subExchange.zetaGroupAddress,
            settlementAccount: settlementAccount,
            admin: admin,
            systemProgram: web3_js_1.SystemProgram.programId,
            greeks: subExchange.greeksAddress,
        },
    });
}
exports.expireSeriesOverrideIx = expireSeriesOverrideIx;
function initializeSpreadAccountIx(zetaGroup, spreadAccount, user) {
    return exchange_1.exchange.program.instruction.initializeSpreadAccount({
        accounts: {
            zetaGroup,
            spreadAccount,
            authority: user,
            payer: user,
            zetaProgram: exchange_1.exchange.programId,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
    });
}
exports.initializeSpreadAccountIx = initializeSpreadAccountIx;
function closeSpreadAccountIx(zetaGroup, spreadAccount, user) {
    return exchange_1.exchange.program.instruction.closeSpreadAccount({
        accounts: {
            zetaGroup,
            spreadAccount,
            authority: user,
        },
    });
}
exports.closeSpreadAccountIx = closeSpreadAccountIx;
function positionMovementIx(asset, zetaGroup, marginAccount, spreadAccount, user, greeks, oracle, movementType, movements) {
    return exchange_1.exchange.program.instruction.positionMovement(types.toProgramMovementType(movementType), movements, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup,
            marginAccount,
            spreadAccount,
            authority: user,
            greeks,
            oracle,
        },
    });
}
exports.positionMovementIx = positionMovementIx;
function transferExcessSpreadBalanceIx(zetaGroup, marginAccount, spreadAccount, user) {
    return exchange_1.exchange.program.instruction.transferExcessSpreadBalance({
        accounts: {
            zetaGroup,
            marginAccount,
            spreadAccount,
            authority: user,
        },
    });
}
exports.transferExcessSpreadBalanceIx = transferExcessSpreadBalanceIx;
function settleDexFundsTxs(asset, marketKey, vaultOwner, remainingAccounts) {
    let market = exchange_1.exchange.getSubExchange(asset).markets.getMarket(marketKey);
    let accounts = {
        state: exchange_1.exchange.stateAddress,
        market: market.address,
        zetaBaseVault: market.baseVault,
        zetaQuoteVault: market.quoteVault,
        dexBaseVault: market.serumMarket.baseVaultAddress,
        dexQuoteVault: market.serumMarket.quoteVaultAddress,
        vaultOwner,
        mintAuthority: exchange_1.exchange.mintAuthority,
        serumAuthority: exchange_1.exchange.serumAuthority,
        dexProgram: constants.DEX_PID[exchange_1.exchange.network],
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
    };
    let txs = [];
    for (var j = 0; j < remainingAccounts.length; j += constants.MAX_SETTLE_ACCOUNTS) {
        let tx = new web3_js_1.Transaction();
        let slice = remainingAccounts.slice(j, j + constants.MAX_SETTLE_ACCOUNTS);
        tx.add(exchange_1.exchange.program.instruction.settleDexFunds({
            accounts,
            remainingAccounts: slice,
        }));
        txs.push(tx);
    }
    return txs;
}
exports.settleDexFundsTxs = settleDexFundsTxs;
function settleDexFundsIx(asset, marketKey, vaultOwner, openOrders) {
    let market = exchange_1.exchange.getSubExchange(asset).markets.getMarket(marketKey);
    let accounts = {
        state: exchange_1.exchange.stateAddress,
        market: market.address,
        zetaBaseVault: market.baseVault,
        zetaQuoteVault: market.quoteVault,
        dexBaseVault: market.serumMarket.baseVaultAddress,
        dexQuoteVault: market.serumMarket.quoteVaultAddress,
        vaultOwner,
        mintAuthority: exchange_1.exchange.mintAuthority,
        serumAuthority: exchange_1.exchange.serumAuthority,
        dexProgram: constants.DEX_PID[exchange_1.exchange.network],
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
    };
    let remainingAccounts = [
        {
            pubkey: openOrders,
            isSigner: false,
            isWritable: true,
        },
    ];
    return exchange_1.exchange.program.instruction.settleDexFunds({
        accounts,
        remainingAccounts,
    });
}
exports.settleDexFundsIx = settleDexFundsIx;
function burnVaultTokenTx(asset, marketKey) {
    let market = exchange_1.exchange.getSubExchange(asset).markets.getMarket(marketKey);
    let tx = new web3_js_1.Transaction();
    tx.add(exchange_1.exchange.program.instruction.burnVaultTokens({
        accounts: {
            state: exchange_1.exchange.stateAddress,
            mint: market.serumMarket.quoteMintAddress,
            vault: market.quoteVault,
            serumAuthority: exchange_1.exchange.serumAuthority,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    }));
    tx.add(exchange_1.exchange.program.instruction.burnVaultTokens({
        accounts: {
            state: exchange_1.exchange.stateAddress,
            mint: market.serumMarket.baseMintAddress,
            vault: market.baseVault,
            serumAuthority: exchange_1.exchange.serumAuthority,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        },
    }));
    return tx;
}
exports.burnVaultTokenTx = burnVaultTokenTx;
function overrideExpiryIx(zetaGroup, args) {
    return exchange_1.exchange.program.instruction.overrideExpiry(args, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            admin: exchange_1.exchange.state.admin,
            zetaGroup,
        },
    });
}
exports.overrideExpiryIx = overrideExpiryIx;
async function toggleMarketMakerIx(isMarketMaker, zetaGroup, user) {
    let [marginAccount, _nonce] = await utils.getMarginAccount(exchange_1.exchange.programId, zetaGroup, user);
    return exchange_1.exchange.program.instruction.toggleMarketMaker(isMarketMaker, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            admin: exchange_1.exchange.state.admin,
            marginAccount,
        },
    });
}
exports.toggleMarketMakerIx = toggleMarketMakerIx;
