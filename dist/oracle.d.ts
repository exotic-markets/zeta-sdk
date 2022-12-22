import { PublicKey, Connection } from "@solana/web3.js";
import { Network } from "./network";
import { assets } from "./";
export declare class Oracle {
    private _connection;
    private _network;
    private _data;
    private _subscriptionIds;
    private _callback;
    constructor(network: Network, connection: Connection);
    getAvailablePriceFeeds(): string[];
    getPrice(asset: assets.Asset): OraclePrice;
    getPriceAge(asset: assets.Asset): number;
    fetchPrice(oracleKey: PublicKey): Promise<number>;
    pollPrice(asset: assets.Asset, triggerCallback?: boolean): Promise<OraclePrice>;
    subscribePriceFeeds(assetList: assets.Asset[], callback: (asset: assets.Asset, price: OraclePrice) => void): Promise<void>;
    close(): Promise<void>;
}
export interface OraclePrice {
    asset: assets.Asset;
    price: number;
    lastUpdatedTime: number;
    lastUpdatedSlot: bigint;
}
