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
exports.InsuranceClient = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
const utils = __importStar(require("./utils"));
const exchange_1 = require("./exchange");
const web3_js_1 = require("@solana/web3.js");
const zeta_json_1 = __importDefault(require("./idl/zeta.json"));
const instructions = __importStar(require("./program-instructions"));
class InsuranceClient {
    /**
     * Returns the user wallet public key.
     */
    get publicKey() {
        return this._provider.wallet.publicKey;
    }
    /**
     * InsuranceCLient insurance vault deposit account to track how much they deposited / are allowed to withdraw
     */
    get insuranceDepositAccount() {
        return this._insuranceDepositAccount;
    }
    /**
     * InsuranceClient insurance vault deposit account address
     */
    get insuranceDepositAccountAddress() {
        return this._insuranceDepositAccountAddress;
    }
    /**
     * InsuranceClient white list insurance account address
     */
    get whitelistInsuranceAccountAddress() {
        return this._whitelistInsuranceAccountAddress;
    }
    /**
     * InsuranceClient usdc account address.
     */
    get usdcAccountAddress() {
        return this._usdcAccountAddress;
    }
    /**
     * The underlying asset the client is using
     */
    get asset() {
        return this._asset;
    }
    constructor(asset, connection, wallet, opts) {
        this._asset = asset;
        this._provider = new anchor.AnchorProvider(connection, wallet, opts);
        this._program = new anchor.Program(zeta_json_1.default, exchange_1.exchange.programId, this._provider);
        this._insuranceDepositAccount = null;
    }
    /**
     * Returns a new instance of InsuranceClient based of the Exchange singleton
     * Requires Exchange to be loaded
     */
    static async load(asset, connection, wallet, opts = utils.defaultCommitment()) {
        console.log(`Loading insurance client: ${wallet.publicKey.toString()}`);
        let insuranceClient = new InsuranceClient(asset, connection, wallet, opts);
        await insuranceClient.insuranceWhitelistCheck();
        let [insuranceDepositAccountAddress, _insuranceDepositAccountNonce] = await utils.getUserInsuranceDepositAccount(exchange_1.exchange.programId, exchange_1.exchange.getZetaGroupAddress(asset), wallet.publicKey);
        insuranceClient._insuranceDepositAccountAddress =
            insuranceDepositAccountAddress;
        insuranceClient._usdcAccountAddress = await utils.getAssociatedTokenAddress(exchange_1.exchange.usdcMintAddress, wallet.publicKey);
        try {
            await insuranceClient.updateInsuranceDepositAccount();
        }
        catch (e) { }
        return insuranceClient;
    }
    /**
     * @param amount the native amount to deposit to the insurance vault (6 d.p)
     */
    async deposit(amount) {
        await this.usdcAccountCheck();
        let tx = new web3_js_1.Transaction();
        if (this._insuranceDepositAccount === null) {
            console.log("User has no insurance vault deposit account. Creating insurance vault deposit account...");
            tx.add(await instructions.initializeInsuranceDepositAccountIx(this.asset, this.publicKey, this.whitelistInsuranceAccountAddress));
        }
        tx.add(instructions.depositInsuranceVaultIx(this.asset, amount, this._insuranceDepositAccountAddress, this._usdcAccountAddress, this.publicKey));
        let txId = await utils.processTransaction(this._provider, tx);
        console.log(`[DEPOSIT INSURANCE VAULT] $${utils.convertNativeIntegerToDecimal(amount)}. Transaction: ${txId}`);
        await this.updateInsuranceDepositAccount();
        return txId;
    }
    /**
     * @param percentageAmount the percentage amount to withdraw from the insurance vault (integer percentage)
     */
    async withdraw(percentageAmount) {
        let tx = new web3_js_1.Transaction();
        tx.add(instructions.withdrawInsuranceVaultIx(this.asset, percentageAmount, this._insuranceDepositAccountAddress, this._usdcAccountAddress, this.publicKey));
        let txId = await utils.processTransaction(this._provider, tx);
        console.log(`[WITHDRAW INSURANCE VAULT] ${percentageAmount}% of Deposit. Transaction: ${txId}`);
        await this.updateInsuranceDepositAccount();
        return txId;
    }
    async updateInsuranceDepositAccount() {
        try {
            this._insuranceDepositAccount =
                (await this._program.account.insuranceDepositAccount.fetch(this._insuranceDepositAccountAddress));
        }
        catch (e) {
            console.log("User has no insurance deposit account. Please deposit into the insurance vault if you are whitelisted.");
        }
    }
    async usdcAccountCheck() {
        try {
            let tokenAccountInfo = await utils.getTokenAccountInfo(this._provider.connection, this._usdcAccountAddress);
            console.log(`Found user USDC associated token account ${this._usdcAccountAddress.toString()}. Balance = $${utils.convertNativeBNToDecimal(tokenAccountInfo.amount)}.`);
        }
        catch (e) {
            throw Error("User has no USDC associated token account. Please create one and deposit USDC.");
        }
    }
    async insuranceWhitelistCheck() {
        let [whitelistInsuranceAccountAddress, _whitelistInsuranceAccountNonce] = await utils.getUserWhitelistInsuranceAccount(exchange_1.exchange.programId, this.publicKey);
        try {
            (await this._program.account.whitelistInsuranceAccount.fetch(whitelistInsuranceAccountAddress));
        }
        catch (e) {
            throw Error("User is not white listed for the insurance vault.");
        }
        this._whitelistInsuranceAccountAddress = whitelistInsuranceAccountAddress;
    }
}
exports.InsuranceClient = InsuranceClient;
