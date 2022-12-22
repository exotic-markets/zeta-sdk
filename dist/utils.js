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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClockData = exports.parseError = exports.processTransaction = exports.simulateTransaction = exports.commitmentConfig = exports.defaultCommitment = exports.getAssociatedTokenAddress = exports.getTokenAccountInfo = exports.getTokenMint = exports.convertDecimalToNativeLotSize = exports.convertNativeLotSizeToDecimal = exports.convertNativeBNToDecimal = exports.convertNativeIntegerToDecimal = exports.getTradeEventPrice = exports.convertDecimalToNativeInteger = exports.sortMarketKeys = exports.sortOpenOrderKeys = exports.getSerumVaultOwnerAndNonce = exports.getReferrerAliasAddress = exports.getReferralAccountAddress = exports.getReferrerAccountAddress = exports.getSocializedLossAccount = exports.getMarketUninitialized = exports.getSpreadAccount = exports.getMarginAccount = exports.getQuoteMint = exports.getBaseMint = exports.getMarketIndexes = exports.getPerpSyncQueue = exports.getGreeks = exports.getUnderlying = exports.getZetaGroup = exports.getUserWhitelistTradingFeesAccount = exports.getUserWhitelistInsuranceAccount = exports.getUserWhitelistDepositAccount = exports.getUserInsuranceDepositAccount = exports.getZetaReferralsRewardsWallet = exports.getZetaTreasuryWallet = exports.getZetaInsuranceVault = exports.getZetaVault = exports.getSerumVault = exports.getVault = exports.getMintAuthority = exports.getSerumAuthority = exports.getOpenOrdersMap = exports.createOpenOrdersAddress = exports.getOpenOrders = exports.getSettlement = exports.getMarketNode = exports.getState = void 0;
exports.isOrderExpired = exports.getTIFOffset = exports.getProductLedger = exports.applyPerpFunding = exports.convertBufferToTrimmedString = exports.fetchReferrerAliasAccount = exports.objectEquals = exports.toAssets = exports.getOrCreateKeypair = exports.calculateMovementFees = exports.cancelExpiredOrdersAndCleanMarkets = exports.burnVaultTokens = exports.settleAndBurnVaultTokens = exports.settleAndBurnVaultTokensByMarket = exports.getAllOpenOrdersAccountsByMarket = exports.getAllProgramAccountAddresses = exports.writeKeypair = exports.getCancelAllIxs = exports.getMutMarketAccounts = exports.getMostRecentExpiredIndex = exports.expireSeries = exports.crankMarket = exports.settleUsers = exports.cleanZetaMarketsHalted = exports.cleanZetaMarkets = exports.getNextStrikeInitialisationTs = exports.getMarginFromOpenOrders = exports.displayState = exports.getGreeksIndex = exports.getDirtySeriesIndices = exports.getOrderedMarketIndexes = exports.sleep = exports.splitIxsIntoTx = exports.getSeqNumFromSerumOrderKey = exports.getPriceFromSerumOrderKey = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const buffer_layout_1 = __importDefault(require("buffer-layout"));
const BN = anchor.BN;
const bs58 = __importStar(require("bs58"));
const assets_1 = require("./assets");
const fs = __importStar(require("fs"));
const constants = __importStar(require("./constants"));
const errors = __importStar(require("./errors"));
const exchange_1 = require("./exchange");
const types = __importStar(require("./types"));
const instructions = __importStar(require("./program-instructions"));
const decimal_1 = require("./decimal");
const oracle_utils_1 = require("./oracle-utils");
const _1 = require(".");
async function getState(programId) {
    return await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("state"))], programId);
}
exports.getState = getState;
async function getMarketNode(programId, zetaGroup, marketIndex) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("market-node")),
        zetaGroup.toBuffer(),
        Buffer.from([marketIndex]),
    ], programId);
}
exports.getMarketNode = getMarketNode;
async function getSettlement(programId, underlyingMint, expirationTs) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("settlement")),
        underlyingMint.toBuffer(),
        expirationTs.toArrayLike(Buffer, "le", 8),
    ], programId);
}
exports.getSettlement = getSettlement;
async function getOpenOrders(programId, market, userKey) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("open-orders")),
        constants.DEX_PID[exchange_1.exchange.network].toBuffer(),
        market.toBuffer(),
        userKey.toBuffer(),
    ], programId);
}
exports.getOpenOrders = getOpenOrders;
async function createOpenOrdersAddress(programId, market, userKey, nonce) {
    return await web3_js_1.PublicKey.createProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("open-orders")),
        constants.DEX_PID[exchange_1.exchange.network].toBuffer(),
        market.toBuffer(),
        userKey.toBuffer(),
        Buffer.from([nonce]),
    ], programId);
}
exports.createOpenOrdersAddress = createOpenOrdersAddress;
async function getOpenOrdersMap(programId, openOrders) {
    return await anchor.web3.PublicKey.findProgramAddress([openOrders.toBuffer()], programId);
}
exports.getOpenOrdersMap = getOpenOrdersMap;
async function getSerumAuthority(programId) {
    return await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("serum"))], programId);
}
exports.getSerumAuthority = getSerumAuthority;
async function getMintAuthority(programId) {
    return await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("mint-auth"))], programId);
}
exports.getMintAuthority = getMintAuthority;
async function getVault(programId, zetaGroup) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("vault")),
        zetaGroup.toBuffer(),
    ], programId);
}
exports.getVault = getVault;
async function getSerumVault(programId, mint) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("serum-vault")),
        mint.toBuffer(),
    ], programId);
}
exports.getSerumVault = getSerumVault;
async function getZetaVault(programId, mint) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("zeta-vault")),
        mint.toBuffer(),
    ], programId);
}
exports.getZetaVault = getZetaVault;
async function getZetaInsuranceVault(programId, zetaGroup) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("zeta-insurance-vault")),
        zetaGroup.toBuffer(),
    ], programId);
}
exports.getZetaInsuranceVault = getZetaInsuranceVault;
async function getZetaTreasuryWallet(programId, mint) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("zeta-treasury-wallet")),
        mint.toBuffer(),
    ], programId);
}
exports.getZetaTreasuryWallet = getZetaTreasuryWallet;
async function getZetaReferralsRewardsWallet(programId, mint) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("zeta-referrals-rewards-wallet")),
        mint.toBuffer(),
    ], programId);
}
exports.getZetaReferralsRewardsWallet = getZetaReferralsRewardsWallet;
async function getUserInsuranceDepositAccount(programId, zetaGroup, userKey) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("user-insurance-deposit")),
        zetaGroup.toBuffer(),
        userKey.toBuffer(),
    ], programId);
}
exports.getUserInsuranceDepositAccount = getUserInsuranceDepositAccount;
async function getUserWhitelistDepositAccount(programId, userKey) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("whitelist-deposit")),
        userKey.toBuffer(),
    ], programId);
}
exports.getUserWhitelistDepositAccount = getUserWhitelistDepositAccount;
async function getUserWhitelistInsuranceAccount(programId, userKey) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("whitelist-insurance")),
        userKey.toBuffer(),
    ], programId);
}
exports.getUserWhitelistInsuranceAccount = getUserWhitelistInsuranceAccount;
async function getUserWhitelistTradingFeesAccount(programId, userKey) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("whitelist-trading-fees")),
        userKey.toBuffer(),
    ], programId);
}
exports.getUserWhitelistTradingFeesAccount = getUserWhitelistTradingFeesAccount;
async function getZetaGroup(programId, mint) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("zeta-group")),
        mint.toBuffer(),
    ], programId);
}
exports.getZetaGroup = getZetaGroup;
async function getUnderlying(programId, underlyingIndex) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("underlying")),
        Buffer.from([underlyingIndex]),
    ], programId);
}
exports.getUnderlying = getUnderlying;
async function getGreeks(programId, zetaGroup) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("greeks")),
        zetaGroup.toBuffer(),
    ], programId);
}
exports.getGreeks = getGreeks;
async function getPerpSyncQueue(programId, zetaGroup) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("perp-sync-queue")),
        zetaGroup.toBuffer(),
    ], programId);
}
exports.getPerpSyncQueue = getPerpSyncQueue;
async function getMarketIndexes(programId, zetaGroup) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("market-indexes")),
        zetaGroup.toBuffer(),
    ], programId);
}
exports.getMarketIndexes = getMarketIndexes;
async function getBaseMint(programId, market) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("base-mint")),
        market.toBuffer(),
    ], programId);
}
exports.getBaseMint = getBaseMint;
async function getQuoteMint(programId, market) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("quote-mint")),
        market.toBuffer(),
    ], programId);
}
exports.getQuoteMint = getQuoteMint;
async function getMarginAccount(programId, zetaGroup, userKey) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("margin")),
        zetaGroup.toBuffer(),
        userKey.toBuffer(),
    ], programId);
}
exports.getMarginAccount = getMarginAccount;
async function getSpreadAccount(programId, zetaGroup, userKey) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("spread")),
        zetaGroup.toBuffer(),
        userKey.toBuffer(),
    ], programId);
}
exports.getSpreadAccount = getSpreadAccount;
async function getMarketUninitialized(programId, zetaGroup, marketIndex) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("market")),
        zetaGroup.toBuffer(),
        Buffer.from([marketIndex]),
    ], programId);
}
exports.getMarketUninitialized = getMarketUninitialized;
async function getSocializedLossAccount(programId, zetaGroup) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("socialized-loss")),
        zetaGroup.toBuffer(),
    ], programId);
}
exports.getSocializedLossAccount = getSocializedLossAccount;
async function getReferrerAccountAddress(programId, referrer) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("referrer")),
        referrer.toBuffer(),
    ], programId);
}
exports.getReferrerAccountAddress = getReferrerAccountAddress;
async function getReferralAccountAddress(programId, user) {
    return await anchor.web3.PublicKey.findProgramAddress([Buffer.from(anchor.utils.bytes.utf8.encode("referral")), user.toBuffer()], programId);
}
exports.getReferralAccountAddress = getReferralAccountAddress;
async function getReferrerAliasAddress(programId, alias) {
    return await anchor.web3.PublicKey.findProgramAddress([
        Buffer.from(anchor.utils.bytes.utf8.encode("referrer-alias")),
        Buffer.from(alias),
    ], programId);
}
exports.getReferrerAliasAddress = getReferrerAliasAddress;
/**
 * Returns the expected PDA by serum to own the serum vault
 * Serum uses a u64 as nonce which is not the same as
 * normal solana PDA convention and goes 0 -> 255
 */
async function getSerumVaultOwnerAndNonce(market, dexPid) {
    const nonce = new BN(0);
    while (nonce.toNumber() < 255) {
        try {
            const vaultOwner = await web3_js_1.PublicKey.createProgramAddress([market.toBuffer(), nonce.toArrayLike(Buffer, "le", 8)], dexPid);
            return [vaultOwner, nonce];
        }
        catch (e) {
            nonce.iaddn(1);
        }
    }
    throw new Error("Unable to find nonce");
}
exports.getSerumVaultOwnerAndNonce = getSerumVaultOwnerAndNonce;
/**
 * Serum interprets publickeys as [u64; 4]
 * Which requires swap64 sorting.
 */
function sortOpenOrderKeys(keys) {
    return keys.sort((a, b) => a.toBuffer().swap64().compare(b.toBuffer().swap64()));
}
exports.sortOpenOrderKeys = sortOpenOrderKeys;
/**
 * Normal sorting of keys
 */
function sortMarketKeys(keys) {
    return keys.sort((a, b) => a.toBuffer().compare(b.toBuffer()));
}
exports.sortMarketKeys = sortMarketKeys;
/**
 * Converts a decimal number to native fixed point integer of precision 6.
 */
function convertDecimalToNativeInteger(amount) {
    return parseInt((amount * Math.pow(10, constants.PLATFORM_PRECISION)).toFixed(0));
}
exports.convertDecimalToNativeInteger = convertDecimalToNativeInteger;
/**
 * Returns the trade event price. This may return a number that
 * does not divide perfectly by tick size (0.0001) if your order traded
 * against orders at different prices.
 */
function getTradeEventPrice(event) {
    let decimalCostOfTrades = convertNativeBNToDecimal(event.costOfTrades);
    let decimalSize = convertNativeLotSizeToDecimal(event.size.toNumber());
    return decimalCostOfTrades / decimalSize;
}
exports.getTradeEventPrice = getTradeEventPrice;
/**
 * Converts a native fixed point integer of precision 6 to decimal.
 */
function convertNativeIntegerToDecimal(amount) {
    return amount / Math.pow(10, constants.PLATFORM_PRECISION);
}
exports.convertNativeIntegerToDecimal = convertNativeIntegerToDecimal;
/**
 * Converts a program BN to a decimal number.
 * @param pricing   whether the BN you are converting is a pricing BN - defaults to false.
 */
function convertNativeBNToDecimal(number, precision = constants.PLATFORM_PRECISION) {
    // Note 53 bits - max number is slightly larger than 9 * 10 ^ 9 with decimals.
    let precisionBn = new anchor.BN(Math.pow(10, precision));
    return (
    // Integer
    number.div(precisionBn).toNumber() +
        // Decimal
        number.mod(precisionBn).toNumber() / precisionBn.toNumber());
}
exports.convertNativeBNToDecimal = convertNativeBNToDecimal;
/**
 * Converts a native lot size where 1 unit = 0.001 lots to human readable decimal
 * @param amount
 */
function convertNativeLotSizeToDecimal(amount) {
    return amount / Math.pow(10, constants.POSITION_PRECISION);
}
exports.convertNativeLotSizeToDecimal = convertNativeLotSizeToDecimal;
/**
 * Converts a native lot size where 1 unit = 0.001 lots to human readable decimal
 * @param amount
 */
function convertDecimalToNativeLotSize(amount) {
    return parseInt((amount * Math.pow(10, constants.POSITION_PRECISION)).toFixed(0));
}
exports.convertDecimalToNativeLotSize = convertDecimalToNativeLotSize;
async function getTokenMint(connection, key) {
    let info = await getTokenAccountInfo(connection, key);
    return new web3_js_1.PublicKey(info.mint);
}
exports.getTokenMint = getTokenMint;
/**
 * Copied from @solana/spl-token but their version requires you to
 * construct a Token object which is completely unnecessary
 */
async function getTokenAccountInfo(connection, key) {
    let info = await connection.getAccountInfo(key);
    if (info === null) {
        throw Error(`Token account ${key.toString()} doesn't exist.`);
    }
    if (info.data.length != spl_token_1.AccountLayout.span) {
        throw new Error(`Invalid account size`);
    }
    const data = Buffer.from(info.data);
    const accountInfo = spl_token_1.AccountLayout.decode(data);
    accountInfo.address = key;
    accountInfo.mint = new web3_js_1.PublicKey(accountInfo.mint);
    accountInfo.owner = new web3_js_1.PublicKey(accountInfo.owner);
    accountInfo.amount = spl_token_1.u64.fromBuffer(accountInfo.amount);
    if (accountInfo.delegateOption === 0) {
        accountInfo.delegate = null;
        accountInfo.delegatedAmount = 0;
    }
    else {
        accountInfo.delegate = new web3_js_1.PublicKey(accountInfo.delegate);
        accountInfo.delegatedAmount = spl_token_1.u64.fromBuffer(accountInfo.delegatedAmount);
    }
    accountInfo.isInitialized = accountInfo.state !== 0;
    accountInfo.isFrozen = accountInfo.state === 2;
    if (accountInfo.isNativeOption === 1) {
        accountInfo.rentExemptReserve = spl_token_1.u64.fromBuffer(accountInfo.isNative);
        accountInfo.isNative = true;
    }
    else {
        accountInfo.rentExemptReserve = null;
        accountInfo.isNative = false;
    }
    if (accountInfo.closeAuthorityOption === 0) {
        accountInfo.closeAuthority = null;
    }
    else {
        accountInfo.closeAuthority = new web3_js_1.PublicKey(accountInfo.closeAuthority);
    }
    return accountInfo;
}
exports.getTokenAccountInfo = getTokenAccountInfo;
async function getAssociatedTokenAddress(mint, owner) {
    return (await web3_js_1.PublicKey.findProgramAddress([owner.toBuffer(), spl_token_1.TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID))[0];
}
exports.getAssociatedTokenAddress = getAssociatedTokenAddress;
function defaultCommitment() {
    return {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        commitment: "confirmed",
    };
}
exports.defaultCommitment = defaultCommitment;
function commitmentConfig(commitment) {
    return {
        skipPreflight: false,
        preflightCommitment: commitment,
        commitment,
    };
}
exports.commitmentConfig = commitmentConfig;
async function simulateTransaction(provider, tx) {
    let response;
    try {
        response = await provider.simulate(tx);
    }
    catch (err) {
        let parsedErr = parseError(err);
        throw parsedErr;
    }
    if (response === undefined) {
        throw new Error("Unable to simulate transaction");
    }
    const logs = response.logs;
    if (!logs) {
        throw new Error("Simulated logs not found");
    }
    let parser = new anchor.EventParser(exchange_1.exchange.programId, exchange_1.exchange.program.coder);
    let events = [];
    parser.parseLogs(response.logs, (event) => {
        events.push(event);
    });
    return { events, raw: logs };
}
exports.simulateTransaction = simulateTransaction;
async function processTransaction(provider, tx, signers, opts, useLedger = false, blockhash) {
    let txSig;
    if (blockhash == undefined) {
        const recentBlockhash = await provider.connection.getRecentBlockhash();
        tx.recentBlockhash = recentBlockhash.blockhash;
    }
    else {
        tx.recentBlockhash = blockhash;
    }
    tx.feePayer = useLedger
        ? exchange_1.exchange.ledgerWallet.publicKey
        : provider.wallet.publicKey;
    if (signers === undefined) {
        signers = [];
    }
    signers
        .filter((s) => s !== undefined)
        .forEach((kp) => {
        tx.partialSign(kp);
    });
    if (useLedger) {
        tx = await exchange_1.exchange.ledgerWallet.signTransaction(tx);
    }
    else {
        tx = await provider.wallet.signTransaction(tx);
    }
    try {
        txSig = await (0, web3_js_1.sendAndConfirmRawTransaction)(provider.connection, tx.serialize(), opts || commitmentConfig(provider.connection.commitment));
        return txSig;
    }
    catch (err) {
        let parsedErr = parseError(err);
        throw parsedErr;
    }
}
exports.processTransaction = processTransaction;
function parseError(err) {
    const anchorError = anchor.AnchorError.parse(err.logs);
    if (anchorError) {
        // Parse Anchor error into another type such that it's consistent.
        return errors.NativeAnchorError.parse(anchorError);
    }
    const programError = anchor.ProgramError.parse(err, errors.idlErrors);
    if (programError) {
        return programError;
    }
    let customErr = errors.parseCustomError(err);
    if (customErr != null) {
        return customErr;
    }
    let nativeErr = errors.NativeError.parse(err);
    if (nativeErr != null) {
        return nativeErr;
    }
    if (err.simulationResponse) {
        let simulatedError = anchor.AnchorError.parse(err.simulationResponse.logs);
        if (simulatedError) {
            return errors.NativeAnchorError.parse(simulatedError);
        }
    }
    return err;
}
exports.parseError = parseError;
const uint64 = (property = "uint64") => {
    return buffer_layout_1.default.blob(8, property);
};
const int64 = (property = "int64") => {
    return buffer_layout_1.default.blob(8, property);
};
const SystemClockLayout = buffer_layout_1.default.struct([
    uint64("slot"),
    int64("epochStartTimestamp"),
    uint64("epoch"),
    uint64("leaderScheduleEpoch"),
    int64("unixTimestamp"),
]);
function getClockData(accountInfo) {
    let info = SystemClockLayout.decode(accountInfo.data);
    return {
        timestamp: Number((0, oracle_utils_1.readBigInt64LE)(info.unixTimestamp, 0)),
        slot: Number((0, oracle_utils_1.readBigInt64LE)(info.slot, 0)),
    };
}
exports.getClockData = getClockData;
function getPriceFromSerumOrderKey(key) {
    return key.ushrn(64);
}
exports.getPriceFromSerumOrderKey = getPriceFromSerumOrderKey;
function getSeqNumFromSerumOrderKey(key, isBid) {
    let lower = key.maskn(64);
    if (isBid) {
        let x = lower.notn(64);
        return x;
    }
    else {
        return lower;
    }
}
exports.getSeqNumFromSerumOrderKey = getSeqNumFromSerumOrderKey;
function splitIxsIntoTx(ixs, ixsPerTx) {
    let txs = [];
    for (var i = 0; i < ixs.length; i += ixsPerTx) {
        let tx = new web3_js_1.Transaction();
        let slice = ixs.slice(i, i + ixsPerTx);
        for (let j = 0; j < slice.length; j++) {
            tx.add(slice[j]);
        }
        txs.push(tx);
    }
    return txs;
}
exports.splitIxsIntoTx = splitIxsIntoTx;
async function sleep(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms, undefined));
}
exports.sleep = sleep;
// Returns the market indices ordered such that front expiry indexes are first.
function getOrderedMarketIndexes(asset) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let indexes = Array.from(Array(subExchange.zetaGroup.products.length).keys());
    let frontExpiryIndex = subExchange.zetaGroup.frontExpiryIndex;
    let backExpiryIndex = (frontExpiryIndex + 1) % 2;
    let frontStart = frontExpiryIndex * constants.PRODUCTS_PER_EXPIRY;
    let backStart = backExpiryIndex * constants.PRODUCTS_PER_EXPIRY;
    indexes = indexes
        .slice(frontStart, frontStart + constants.PRODUCTS_PER_EXPIRY)
        .concat(indexes.slice(backStart, backStart + constants.PRODUCTS_PER_EXPIRY));
    return indexes;
}
exports.getOrderedMarketIndexes = getOrderedMarketIndexes;
function getDirtySeriesIndices(asset) {
    let dirtyIndices = [];
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    for (var i = 0; i < subExchange.zetaGroup.expirySeries.length; i++) {
        if (subExchange.zetaGroup.expirySeries[i].dirty) {
            dirtyIndices.push(i);
        }
    }
    return dirtyIndices;
}
exports.getDirtySeriesIndices = getDirtySeriesIndices;
/**
 * Given a market index, return the index to access the greeks.productGreeks.
 */
function getGreeksIndex(marketIndex) {
    let expirySeries = Math.floor(marketIndex / constants.PRODUCTS_PER_EXPIRY);
    let modIndex = marketIndex % constants.PRODUCTS_PER_EXPIRY;
    return (expirySeries * constants.NUM_STRIKES + (modIndex % constants.NUM_STRIKES));
}
exports.getGreeksIndex = getGreeksIndex;
function printMarkets(markets, subExchange) {
    for (var j = 0; j < markets.length; j++) {
        let market = markets[j];
        // Custom log for perps
        if (market.kind == types.Kind.PERP) {
            let markPrice = subExchange.getMarkPrice(market.marketIndex);
            console.log(`[MARKET] INDEX: ${constants.PERP_INDEX} KIND: ${market.kind} MARK_PRICE ${markPrice.toFixed(6)}`);
            return;
        }
        let greeksIndex = getGreeksIndex(market.marketIndex);
        let markPrice = subExchange.getMarkPrice(market.marketIndex);
        let delta = 1;
        let sigma = 0;
        let vega = 0;
        if (market.kind != types.Kind.FUTURE) {
            delta = convertNativeBNToDecimal(subExchange.greeks.productGreeks[greeksIndex].delta, constants.PRICING_PRECISION);
            sigma = decimal_1.Decimal.fromAnchorDecimal(subExchange.greeks.productGreeks[greeksIndex].volatility).toNumber();
            vega = decimal_1.Decimal.fromAnchorDecimal(subExchange.greeks.productGreeks[greeksIndex].vega).toNumber();
        }
        console.log(`[MARKET] INDEX: ${market.marketIndex} KIND: ${market.kind} STRIKE: ${market.strike} MARK_PRICE: ${markPrice.toFixed(6)} DELTA: ${delta.toFixed(2)} IV: ${sigma.toFixed(6)} VEGA: ${vega.toFixed(6)}`);
    }
}
function displayState() {
    let subExchanges = exchange_1.exchange.subExchanges;
    for (var [asset, subExchange] of subExchanges) {
        let orderedIndexes = [
            subExchange.zetaGroup.frontExpiryIndex,
            getMostRecentExpiredIndex(asset),
        ];
        console.log(`[EXCHANGE ${(0, assets_1.assetToName)(subExchange.asset)}] Display market state...`);
        // Products with expiries, ie options and futures
        for (var i = 0; i < orderedIndexes.length; i++) {
            let index = orderedIndexes[i];
            let expirySeries = subExchange.markets.expirySeries[index];
            console.log(`Active @ ${new Date(expirySeries.activeTs * 1000)}, Expiration @ ${new Date(expirySeries.expiryTs * 1000)} Live: ${expirySeries.isLive()}`);
            let interestRate = convertNativeBNToDecimal(subExchange.greeks.interestRate[index], constants.PRICING_PRECISION);
            console.log(`Interest rate: ${interestRate}`);
            printMarkets(subExchange.markets.getMarketsByExpiryIndex(index), subExchange);
        }
        // Products without expiries, ie perps
        printMarkets([subExchange.markets.perpMarket], subExchange);
    }
}
exports.displayState = displayState;
async function getMarginFromOpenOrders(asset, openOrders, market) {
    const [openOrdersMap, _openOrdersMapNonce] = await getOpenOrdersMap(exchange_1.exchange.programId, openOrders);
    let openOrdersMapInfo = (await exchange_1.exchange.program.account.openOrdersMap.fetch(openOrdersMap));
    const [marginAccount, _marginNonce] = await getMarginAccount(exchange_1.exchange.programId, market.zetaGroup, openOrdersMapInfo.userKey);
    return marginAccount;
}
exports.getMarginFromOpenOrders = getMarginFromOpenOrders;
function getNextStrikeInitialisationTs(asset) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    // If front expiration index is uninitialized
    let frontExpirySeries = subExchange.markets.expirySeries[subExchange.markets.frontExpiryIndex];
    if (!frontExpirySeries.strikesInitialized) {
        return (frontExpirySeries.activeTs -
            exchange_1.exchange.state.strikeInitializationThresholdSeconds);
    }
    // Checks for the first uninitialized back expiry series after our front expiry index
    let backExpiryTs = 0;
    let expiryIndex = subExchange.markets.frontExpiryIndex;
    for (var i = 0; i < subExchange.markets.expirySeries.length; i++) {
        // Wrap around
        if (expiryIndex == subExchange.markets.expirySeries.length) {
            expiryIndex = 0;
        }
        if (!subExchange.markets.expirySeries[expiryIndex].strikesInitialized) {
            return (subExchange.markets.expirySeries[expiryIndex].activeTs -
                exchange_1.exchange.state.strikeInitializationThresholdSeconds);
        }
        backExpiryTs = Math.max(backExpiryTs, subExchange.markets.expirySeries[expiryIndex].expiryTs);
        expiryIndex++;
    }
    return (backExpiryTs -
        exchange_1.exchange.state.strikeInitializationThresholdSeconds -
        subExchange.zetaGroup.newExpiryThresholdSeconds);
}
exports.getNextStrikeInitialisationTs = getNextStrikeInitialisationTs;
async function cleanZetaMarkets(asset, marketAccountTuples) {
    let txs = [];
    for (var i = 0; i < marketAccountTuples.length; i += constants.CLEAN_MARKET_LIMIT) {
        let tx = new web3_js_1.Transaction();
        let slice = marketAccountTuples.slice(i, i + constants.CLEAN_MARKET_LIMIT);
        tx.add(instructions.cleanZetaMarketsIx(asset, slice.flat()));
        txs.push(tx);
    }
    await Promise.all(txs.map(async (tx) => {
        await processTransaction(exchange_1.exchange.provider, tx);
    }));
}
exports.cleanZetaMarkets = cleanZetaMarkets;
async function cleanZetaMarketsHalted(asset, marketAccountTuples) {
    let txs = [];
    for (var i = 0; i < marketAccountTuples.length; i += constants.CLEAN_MARKET_LIMIT) {
        let tx = new web3_js_1.Transaction();
        let slice = marketAccountTuples.slice(i, i + constants.CLEAN_MARKET_LIMIT);
        tx.add(instructions.cleanZetaMarketsHaltedIx(asset, slice.flat()));
        txs.push(tx);
    }
    await Promise.all(txs.map(async (tx) => {
        await processTransaction(exchange_1.exchange.provider, tx);
    }));
}
exports.cleanZetaMarketsHalted = cleanZetaMarketsHalted;
async function settleUsers(asset, keys, expiryTs, accountType = types.ProgramAccountType.MarginAccount) {
    let [settlement, settlementNonce] = await getSettlement(exchange_1.exchange.programId, exchange_1.exchange.getSubExchange(asset).zetaGroup.underlyingMint, expiryTs);
    let remainingAccounts = keys.map((key) => {
        return { pubkey: key, isSigner: false, isWritable: true };
    });
    let txs = [];
    for (var i = 0; i < remainingAccounts.length; i += constants.MAX_SETTLEMENT_ACCOUNTS) {
        let tx = new web3_js_1.Transaction();
        let slice = remainingAccounts.slice(i, i + constants.MAX_SETTLEMENT_ACCOUNTS);
        tx.add(accountType == types.ProgramAccountType.MarginAccount
            ? instructions.settlePositionsIx(asset, expiryTs, settlement, settlementNonce, slice)
            : instructions.settleSpreadPositionsIx(asset, expiryTs, settlement, settlementNonce, slice));
        txs.push(tx);
    }
    await Promise.all(txs.map(async (tx) => {
        let txSig = await processTransaction(exchange_1.exchange.provider, tx);
        console.log(`Settling users - TxId: ${txSig}`);
    }));
}
exports.settleUsers = settleUsers;
/*
 * Allows you to pass in a map that may have cached values for openOrdersAccounts
 */
async function crankMarket(asset, marketIndex, openOrdersToMargin, crankLimit) {
    let market = exchange_1.exchange.getMarket(asset, marketIndex);
    let eventQueue = await market.serumMarket.loadEventQueue(exchange_1.exchange.connection);
    if (eventQueue.length == 0) {
        return;
    }
    const openOrdersSet = new Set();
    // We pass in a couple of extra accounts for perps so the limit is lower
    let limit = market.kind == types.Kind.PERP
        ? constants.CRANK_PERP_ACCOUNT_LIMIT
        : constants.CRANK_ACCOUNT_LIMIT;
    // Manually defined crankLimit will override
    if (crankLimit) {
        limit = crankLimit;
    }
    for (var i = 0; i < eventQueue.length; i++) {
        openOrdersSet.add(eventQueue[i].openOrders.toString());
        if (openOrdersSet.size == limit) {
            break;
        }
    }
    const uniqueOpenOrders = sortOpenOrderKeys([...openOrdersSet].map((s) => new web3_js_1.PublicKey(s)));
    let remainingAccounts = new Array(uniqueOpenOrders.length * 2);
    await Promise.all(uniqueOpenOrders.map(async (openOrders, index) => {
        let marginAccount;
        if (openOrdersToMargin && !openOrdersToMargin.has(openOrders)) {
            marginAccount = await getMarginFromOpenOrders(asset, openOrders, market);
            openOrdersToMargin.set(openOrders, marginAccount);
        }
        else if (openOrdersToMargin && openOrdersToMargin.has(openOrders)) {
            marginAccount = openOrdersToMargin.get(openOrders);
        }
        else {
            marginAccount = await getMarginFromOpenOrders(asset, openOrders, market);
        }
        let openOrdersIndex = index * 2;
        remainingAccounts[openOrdersIndex] = {
            pubkey: openOrders,
            isSigner: false,
            isWritable: true,
        };
        remainingAccounts[openOrdersIndex + 1] = {
            pubkey: marginAccount,
            isSigner: false,
            isWritable: true,
        };
    }));
    if (marketIndex == constants.PERP_INDEX) {
        remainingAccounts.unshift({
            pubkey: exchange_1.exchange.getSubExchange(asset).greeksAddress,
            isSigner: false,
            isWritable: true,
        }, {
            pubkey: exchange_1.exchange.getSubExchange(asset).perpSyncQueueAddress,
            isSigner: false,
            isWritable: true,
        });
    }
    let tx = new web3_js_1.Transaction().add(instructions.crankMarketIx(asset, market.address, market.serumMarket.eventQueueAddress, constants.DEX_PID[exchange_1.exchange.network], remainingAccounts));
    await processTransaction(exchange_1.exchange.provider, tx);
}
exports.crankMarket = crankMarket;
async function expireSeries(asset, expiryTs) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    let [settlement, settlementNonce] = await getSettlement(exchange_1.exchange.programId, subExchange.zetaGroup.underlyingMint, expiryTs);
    // TODO add some looping mechanism if called early.
    let ix = exchange_1.exchange.program.instruction.expireSeries(settlementNonce, {
        accounts: {
            state: exchange_1.exchange.stateAddress,
            zetaGroup: subExchange.zetaGroupAddress,
            oracle: subExchange.zetaGroup.oracle,
            settlementAccount: settlement,
            payer: exchange_1.exchange.provider.wallet.publicKey,
            systemProgram: web3_js_1.SystemProgram.programId,
            greeks: subExchange.zetaGroup.greeks,
        },
    });
    let tx = new web3_js_1.Transaction().add(ix);
    await processTransaction(exchange_1.exchange.provider, tx);
}
exports.expireSeries = expireSeries;
/**
 * Get the most recently expired index
 */
function getMostRecentExpiredIndex(asset) {
    let subExchange = exchange_1.exchange.getSubExchange(asset);
    if (subExchange.markets.frontExpiryIndex - 1 < 0) {
        return constants.ACTIVE_EXPIRIES - 1;
    }
    else {
        return subExchange.markets.frontExpiryIndex - 1;
    }
}
exports.getMostRecentExpiredIndex = getMostRecentExpiredIndex;
function getMutMarketAccounts(asset, marketIndex) {
    let market = exchange_1.exchange.getMarket(asset, marketIndex);
    return [
        { pubkey: market.address, isSigner: false, isWritable: false },
        {
            pubkey: market.serumMarket.bidsAddress,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: market.serumMarket.asksAddress,
            isSigner: false,
            isWritable: false,
        },
    ];
}
exports.getMutMarketAccounts = getMutMarketAccounts;
async function getCancelAllIxs(asset, orders, expiration) {
    let ixs = [];
    await Promise.all(orders.map(async (order) => {
        const [openOrdersMap, _openOrdersMapNonce] = await getOpenOrdersMap(exchange_1.exchange.programId, order.owner);
        let openOrdersMapInfo = (await exchange_1.exchange.program.account.openOrdersMap.fetch(openOrdersMap));
        const [marginAccount, _marginNonce] = await getMarginAccount(exchange_1.exchange.programId, exchange_1.exchange.getZetaGroupAddress(asset), openOrdersMapInfo.userKey);
        let ix = expiration
            ? instructions.cancelExpiredOrderIx(asset, order.marketIndex, marginAccount, order.owner, order.orderId, order.side)
            : instructions.cancelOrderHaltedIx(asset, order.marketIndex, marginAccount, order.owner, order.orderId, order.side);
        ixs.push(ix);
    }));
    return ixs;
}
exports.getCancelAllIxs = getCancelAllIxs;
async function writeKeypair(filename, keypair) {
    let secret = "[" + keypair.secretKey.toString() + "]";
    fs.writeFileSync(filename, secret);
}
exports.writeKeypair = writeKeypair;
async function getAllProgramAccountAddresses(accountType, asset = undefined) {
    let filters = [
        {
            memcmp: {
                offset: 0,
                bytes: bs58.encode(anchor.BorshAccountsCoder.accountDiscriminator(accountType)),
            },
        },
    ];
    if (asset != undefined) {
        let assetOffset = 0;
        // From the account itself in account.rs
        if (accountType == types.ProgramAccountType.MarginAccount) {
            assetOffset = constants.MARGIN_ACCOUNT_ASSET_OFFSET;
        }
        else if (accountType == types.ProgramAccountType.SpreadAccount) {
            assetOffset = constants.SPREAD_ACCOUNT_ASSET_OFFSET;
        }
        filters.push({
            memcmp: {
                offset: assetOffset,
                bytes: bs58.encode([_1.assets.assetToIndex(asset)]),
            },
        });
    }
    let noDataAccounts = await exchange_1.exchange.provider.connection.getProgramAccounts(exchange_1.exchange.programId, {
        commitment: exchange_1.exchange.provider.connection.commitment,
        dataSlice: {
            offset: 0,
            length: 0,
        },
        filters: filters,
    });
    let pubkeys = [];
    for (let i = 0; i < noDataAccounts.length; i++) {
        pubkeys.push(noDataAccounts[i].pubkey);
    }
    return pubkeys;
}
exports.getAllProgramAccountAddresses = getAllProgramAccountAddresses;
async function getAllOpenOrdersAccountsByMarket(asset) {
    let openOrdersByMarketIndex = new Map();
    for (var market of exchange_1.exchange.getMarkets(asset)) {
        openOrdersByMarketIndex.set(market.marketIndex, []);
    }
    let marginAccounts = await exchange_1.exchange.program.account.marginAccount.all();
    await Promise.all(marginAccounts.map(async (acc) => {
        let marginAccount = acc.account;
        if (_1.assets.fromProgramAsset(marginAccount.asset) != asset) {
            return;
        }
        for (var market of exchange_1.exchange.getMarkets(asset)) {
            let nonce = marginAccount.openOrdersNonce[market.marketIndex];
            if (nonce == 0) {
                continue;
            }
            let [openOrders, _nonce] = await getOpenOrders(exchange_1.exchange.programId, market.address, marginAccount.authority);
            openOrdersByMarketIndex.get(market.marketIndex).push(openOrders);
        }
    }));
    return openOrdersByMarketIndex;
}
exports.getAllOpenOrdersAccountsByMarket = getAllOpenOrdersAccountsByMarket;
async function settleAndBurnVaultTokensByMarket(asset, provider, openOrdersByMarketIndex, marketIndex) {
    console.log(`Burning tokens for market index ${marketIndex}`);
    let market = exchange_1.exchange.getMarket(asset, marketIndex);
    let openOrders = openOrdersByMarketIndex.get(marketIndex);
    let remainingAccounts = openOrders.map((key) => {
        return { pubkey: key, isSigner: false, isWritable: true };
    });
    const [vaultOwner, _vaultSignerNonce] = await getSerumVaultOwnerAndNonce(market.address, constants.DEX_PID[exchange_1.exchange.network]);
    let txs = instructions.settleDexFundsTxs(asset, market.address, vaultOwner, remainingAccounts);
    for (var j = 0; j < txs.length; j += 5) {
        let txSlice = txs.slice(j, j + 5);
        await Promise.all(txSlice.map(async (tx) => {
            await processTransaction(provider, tx);
        }));
    }
    let burnTx = instructions.burnVaultTokenTx(asset, market.address);
    await processTransaction(provider, burnTx);
}
exports.settleAndBurnVaultTokensByMarket = settleAndBurnVaultTokensByMarket;
async function settleAndBurnVaultTokens(asset, provider) {
    let openOrdersByMarketIndex = await getAllOpenOrdersAccountsByMarket(asset);
    for (var market of exchange_1.exchange.getMarkets(asset)) {
        console.log(`Burning tokens for market index ${market.marketIndex}`);
        let openOrders = openOrdersByMarketIndex.get(market.marketIndex);
        let remainingAccounts = openOrders.map((key) => {
            return { pubkey: key, isSigner: false, isWritable: true };
        });
        const [vaultOwner, _vaultSignerNonce] = await getSerumVaultOwnerAndNonce(market.address, constants.DEX_PID[exchange_1.exchange.network]);
        let txs = instructions.settleDexFundsTxs(asset, market.address, vaultOwner, remainingAccounts);
        for (var j = 0; j < txs.length; j += 5) {
            let txSlice = txs.slice(j, j + 5);
            await Promise.all(txSlice.map(async (tx) => {
                await processTransaction(provider, tx);
            }));
        }
        let burnTx = instructions.burnVaultTokenTx(asset, market.address);
        await processTransaction(provider, burnTx);
    }
}
exports.settleAndBurnVaultTokens = settleAndBurnVaultTokens;
async function burnVaultTokens(asset, provider) {
    for (var market of exchange_1.exchange.getMarkets(asset)) {
        console.log(`Burning tokens for market index ${market.marketIndex}`);
        let burnTx = instructions.burnVaultTokenTx(asset, market.address);
        await processTransaction(provider, burnTx);
    }
}
exports.burnVaultTokens = burnVaultTokens;
async function cancelExpiredOrdersAndCleanMarkets(asset, expiryIndex) {
    let marketsToClean = exchange_1.exchange.getSubExchange(asset).markets.getMarketsByExpiryIndex(expiryIndex);
    let marketAccounts = await Promise.all(marketsToClean.map(async (market) => {
        await market.cancelAllExpiredOrders();
        return [
            { pubkey: market.address, isSigner: false, isWritable: false },
            {
                pubkey: market.serumMarket.bidsAddress,
                isSigner: false,
                isWritable: false,
            },
            {
                pubkey: market.serumMarket.asksAddress,
                isSigner: false,
                isWritable: false,
            },
        ];
    }));
    await cleanZetaMarkets(asset, marketAccounts);
}
exports.cancelExpiredOrdersAndCleanMarkets = cancelExpiredOrdersAndCleanMarkets;
/**
 * Calculates the total movement fees for a set of movements.
 * @param movements   list of position movements.
 * @param spotPrice   spot price in decimal
 * @param feeBps      fees charged in bps
 * @param decimal     whether to return fees in decimal or native integer (defaults to native integer)
 */
function calculateMovementFees(movements, spotPrice, feeBps, decimal = false) {
    let fees = 0;
    let totalContracts = 0;
    for (var i = 0; i < movements.length; i++) {
        totalContracts += convertNativeLotSizeToDecimal(Math.abs(movements[i].size.toNumber()));
    }
    let notionalValue = totalContracts * spotPrice;
    let fee = (notionalValue * feeBps) / constants.BPS_DENOMINATOR;
    return decimal ? fee : convertDecimalToNativeInteger(fee);
}
exports.calculateMovementFees = calculateMovementFees;
function getOrCreateKeypair(filename) {
    let keypair;
    if (fs.existsSync(filename)) {
        // File exists.
        keypair = web3_js_1.Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(filename, {
            encoding: "utf-8",
        }))));
    }
    else {
        // File does not exist
        keypair = web3_js_1.Keypair.generate();
        writeKeypair(filename, keypair);
    }
    return keypair;
}
exports.getOrCreateKeypair = getOrCreateKeypair;
function toAssets(assetsStr) {
    let assets = [];
    for (var asset of assetsStr) {
        assets.push((0, assets_1.nameToAsset)(asset));
    }
    return assets;
}
exports.toAssets = toAssets;
function objectEquals(a, b) {
    return JSON.stringify(a) == JSON.stringify(b);
}
exports.objectEquals = objectEquals;
async function fetchReferrerAliasAccount(referrer = undefined, alias = undefined) {
    if (!referrer && !alias) {
        return null;
    }
    let referrerAliases = await exchange_1.exchange.program.account.referrerAlias.all();
    for (var i = 0; i < referrerAliases.length; i++) {
        let acc = referrerAliases[i].account;
        if ((referrer && acc.referrer.equals(referrer)) ||
            (alias && convertBufferToTrimmedString(acc.alias) == alias)) {
            return acc;
        }
    }
    return null;
}
exports.fetchReferrerAliasAccount = fetchReferrerAliasAccount;
function convertBufferToTrimmedString(buffer) {
    let bufferString = Buffer.from(buffer).toString().trim();
    let splitIndex = bufferString.length;
    for (let index = 0; index < bufferString.length; ++index) {
        if (bufferString.charCodeAt(index) === 0) {
            splitIndex = index;
            break;
        }
    }
    return bufferString.substring(0, splitIndex);
}
exports.convertBufferToTrimmedString = convertBufferToTrimmedString;
async function applyPerpFunding(asset, keys) {
    let remainingAccounts = keys.map((key) => {
        return { pubkey: key, isSigner: false, isWritable: true };
    });
    let txs = [];
    for (var i = 0; i < remainingAccounts.length; i += constants.MAX_FUNDING_ACCOUNTS) {
        let tx = new web3_js_1.Transaction();
        let slice = remainingAccounts.slice(i, i + constants.MAX_FUNDING_ACCOUNTS);
        tx.add(instructions.applyPerpFundingIx(asset, slice));
        txs.push(tx);
    }
    await Promise.all(txs.map(async (tx) => {
        let txSig = await processTransaction(exchange_1.exchange.provider, tx);
    }));
}
exports.applyPerpFunding = applyPerpFunding;
function getProductLedger(marginAccount, index) {
    if (index == constants.PERP_INDEX) {
        return marginAccount.perpProductLedger;
    }
    return marginAccount.productLedgers[index];
}
exports.getProductLedger = getProductLedger;
function getTIFOffset(explicitTIF, tifOffset, currEpochStartTs, epochLength) {
    if (explicitTIF) {
        return tifOffset;
    }
    let now = exchange_1.exchange.clockTimestamp;
    let epochStartTsToUse = 0;
    if (currEpochStartTs + epochLength < now) {
        epochStartTsToUse = now - (now % epochLength);
    }
    else {
        epochStartTsToUse = currEpochStartTs;
    }
    return now - epochStartTsToUse + tifOffset;
}
exports.getTIFOffset = getTIFOffset;
function isOrderExpired(orderTIFOffset, orderSeqNum, epochStartTs, startEpochSeqNum) {
    if (orderTIFOffset == 0) {
        return false;
    }
    if (epochStartTs + orderTIFOffset < exchange_1.exchange.clockTimestamp) {
        return true;
    }
    if (startEpochSeqNum.gt(orderSeqNum)) {
        return true;
    }
    return false;
}
exports.isOrderExpired = isOrderExpired;
