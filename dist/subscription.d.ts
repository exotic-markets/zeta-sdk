import * as types from "./types";
import { PublicKey, Context } from "@solana/web3.js";
import { Asset } from "./assets";
export interface AccountSubscriptionData<T> {
    key: PublicKey;
    account: T;
    context: Context;
}
export declare function subscribeProgramAccounts<T>(asset: Asset, accountType: types.ProgramAccountType, callback?: (data: AccountSubscriptionData<T>) => void): void;
