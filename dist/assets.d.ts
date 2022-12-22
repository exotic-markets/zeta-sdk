import { PublicKey } from "@solana/web3.js";
export declare enum Asset {
    SOL = "SOL",
    BTC = "BTC",
    ETH = "ETH",
    UNDEFINED = "UNDEFINED"
}
export declare function isValidType(asset: Asset): boolean;
export declare function isValidStr(asset: string): boolean;
export declare function allAssets(): Asset[];
export declare function assetToName(asset: Asset): string | null;
export declare function nameToAsset(name: string): Asset;
export declare function getAssetMint(asset: Asset): PublicKey;
export declare function toProgramAsset(asset: Asset): {
    sol: {};
    btc?: undefined;
    eth?: undefined;
} | {
    btc: {};
    sol?: undefined;
    eth?: undefined;
} | {
    eth: {};
    sol?: undefined;
    btc?: undefined;
};
export declare function fromProgramAsset(asset: any): Asset;
export declare function indexToAsset(index: number): Asset;
export declare function assetToIndex(asset: Asset): number;
