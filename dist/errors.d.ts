import * as anchor from "@project-serum/anchor";
export declare const DEX_ERRORS: Map<number, string>;
export declare enum NATIVE_ERROR_CODES {
    ZeroLamportsBalance = 10000,
    InsufficientLamports = 10001,
    UnconfirmedTransaction = 10002,
    FailedToGetRecentBlockhash = 10003
}
export declare const NATIVE_ERRORS: Map<number, [string, string]>;
export declare function parseIdlErrors(idl: anchor.Idl): Map<number, string>;
/**
 * Extract error code from custom non-anchor errors
 */
export declare function parseCustomError(untranslatedError: string): anchor.ProgramError;
export declare class NativeError extends Error {
    readonly code: number;
    readonly msg: string;
    readonly data: Object;
    constructor(code: number, msg: string, data?: Object, ...params: any[]);
    static parse(error: any): NativeError | null;
    static parseTransactionSignature(error: string): string | null;
    toString(): string;
}
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
export declare class NativeAnchorError extends Error {
    readonly code: number;
    readonly msg: string;
    readonly logs: string[];
    readonly errorLogs: string[];
    constructor(code: number, msg: string, logs: string[], errorLogs: string[]);
    static parse(error: anchor.AnchorError): NativeAnchorError;
    toString(): string;
}
export declare const idlErrors: Map<number, string>;
