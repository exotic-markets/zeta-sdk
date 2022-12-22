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
exports.idlErrors = exports.NativeAnchorError = exports.NativeError = exports.parseCustomError = exports.parseIdlErrors = exports.NATIVE_ERRORS = exports.NATIVE_ERROR_CODES = exports.DEX_ERRORS = void 0;
const zeta_json_1 = __importDefault(require("./idl/zeta.json"));
const anchor = __importStar(require("@project-serum/anchor"));
exports.DEX_ERRORS = new Map([
    [41, "Client order ID not found"],
    [59, "Order doesn't exist"],
    [61, "Order would self-trade"],
]);
var NATIVE_ERROR_CODES;
(function (NATIVE_ERROR_CODES) {
    NATIVE_ERROR_CODES[NATIVE_ERROR_CODES["ZeroLamportsBalance"] = 10000] = "ZeroLamportsBalance";
    NATIVE_ERROR_CODES[NATIVE_ERROR_CODES["InsufficientLamports"] = 10001] = "InsufficientLamports";
    NATIVE_ERROR_CODES[NATIVE_ERROR_CODES["UnconfirmedTransaction"] = 10002] = "UnconfirmedTransaction";
    NATIVE_ERROR_CODES[NATIVE_ERROR_CODES["FailedToGetRecentBlockhash"] = 10003] = "FailedToGetRecentBlockhash";
})(NATIVE_ERROR_CODES = exports.NATIVE_ERROR_CODES || (exports.NATIVE_ERROR_CODES = {}));
exports.NATIVE_ERRORS = new Map([
    [
        10000,
        [
            "Attempt to debit an account but found no record of a prior credit.",
            "Zero SOL in wallet.",
        ],
    ],
    [10001, ["insufficient lamports", "Insufficient SOL in wallet."]],
    [
        10002,
        [
            "Transaction was not confirmed",
            "Transaction was not confirmed. Please check transaction signature.",
        ],
    ],
    [
        10003,
        [
            "failed to get recent blockhash",
            "Failed to get recent blockhash. Please retry.",
        ],
    ],
]);
function parseIdlErrors(idl) {
    const errors = new Map();
    if (idl.errors) {
        idl.errors.forEach((e) => {
            var _a;
            let msg = (_a = e.msg) !== null && _a !== void 0 ? _a : e.name;
            errors.set(e.code, msg);
        });
    }
    return errors;
}
exports.parseIdlErrors = parseIdlErrors;
/**
 * Extract error code from custom non-anchor errors
 */
function parseCustomError(untranslatedError) {
    let components = untranslatedError.toString().split("custom program error: ");
    if (components.length !== 2) {
        return null;
    }
    let errorCode;
    try {
        errorCode = parseInt(components[1]);
    }
    catch (parseErr) {
        return null;
    }
    // Parse user error.
    let errorMsg = exports.DEX_ERRORS.get(errorCode);
    if (errorMsg !== undefined) {
        return new anchor.ProgramError(errorCode, errorMsg);
    }
    return null;
}
exports.parseCustomError = parseCustomError;
class NativeError extends Error {
    constructor(code, msg, data = null, ...params) {
        super(...params);
        this.code = code;
        this.msg = msg;
        this.data = data;
    }
    static parse(error) {
        let errorString = error.toString();
        if (error.logs) {
            errorString += error.logs.join(" ");
        }
        for (const [code, [errorSubstring, msg]] of exports.NATIVE_ERRORS.entries()) {
            if (errorString.includes(errorSubstring)) {
                if (code == NATIVE_ERROR_CODES.UnconfirmedTransaction) {
                    return new NativeError(code, msg, {
                        transactionSignature: NativeError.parseTransactionSignature(errorString),
                    });
                }
                else {
                    return new NativeError(code, msg);
                }
            }
        }
        return null;
    }
    static parseTransactionSignature(error) {
        let components = error.split("Check signature ");
        if (components.length != 2) {
            return null;
        }
        try {
            let txSig = components[1].split(" ")[0];
            return txSig;
        }
        catch (e) {
            return null;
        }
    }
    toString() {
        return this.msg;
    }
}
exports.NativeError = NativeError;
/**
 * Example Anchor error.
    {
      errorLogs: [
        'Program log: AnchorError thrown in programs/zeta/src/lib.rs:1008. Error Code: StrikeInitializationNotReady. Error Number: 6036. Error Message: Strike initialization not ready.'
      ],
      logs: [
        'Program BG3oRikW8d16YjUEmX3ZxHm9SiJzrGtMhsSR8aCw1Cd7 invoke [1]',
        'Program log: Instruction: InitializeMarketStrikes',
        'Program log: ClockTs=1651837190, StrikeInitTs=1651837207',
        'Program log: AnchorError thrown in programs/zeta/src/lib.rs:1008. Error Code: StrikeInitializationNotReady. Error Number: 6036. Error Message: Strike initialization not ready.',
        'Program BG3oRikW8d16YjUEmX3ZxHm9SiJzrGtMhsSR8aCw1Cd7 consumed 7006 of 1400000 compute units',
        'Program BG3oRikW8d16YjUEmX3ZxHm9SiJzrGtMhsSR8aCw1Cd7 failed: custom program error: 0x1794'
      ],
      error: {
        errorCode: { code: 'StrikeInitializationNotReady', number: 6036 },
        errorMessage: 'Strike initialization not ready',
        comparedValues: undefined,
        origin: { file: 'programs/zeta/src/lib.rs', line: 1008 }
      },
      _programErrorStack: ProgramErrorStack { stack: [ [PublicKey] ] }
    }
 * Anchor error is rich but in information but breaks the assumptions on errors by existing clients.
 */
class NativeAnchorError extends Error {
    constructor(code, msg, logs, errorLogs) {
        super(errorLogs.join("\n"));
        this.code = code;
        this.msg = msg;
        this.logs = logs;
        this.errorLogs = errorLogs;
    }
    static parse(error) {
        let err = new NativeAnchorError(error.error.errorCode.number, error.error.errorMessage, error.logs, error.errorLogs);
        return err;
    }
    toString() {
        return this.msg;
    }
}
exports.NativeAnchorError = NativeAnchorError;
exports.idlErrors = parseIdlErrors(zeta_json_1.default);
