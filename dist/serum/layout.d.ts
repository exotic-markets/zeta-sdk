import { Blob, Layout, UInt } from "buffer-layout";
import { PublicKey } from "@solana/web3.js";
declare class Zeros extends Blob {
    decode(b: any, offset: any): any;
}
export declare function zeros(length: any): Zeros;
declare class PublicKeyLayout extends Blob {
    constructor(property: any);
    decode(b: any, offset: any): PublicKey;
    encode(src: any, b: any, offset: any): any;
}
export declare function publicKeyLayout(property: any): PublicKeyLayout;
declare class BNLayout extends Blob {
    decode(b: any, offset: any): any;
    encode(src: any, b: any, offset: any): any;
}
export declare function u64(property?: any): BNLayout;
export declare function u16(property?: any): BNLayout;
export declare function u128(property?: any): BNLayout;
export declare class WideBits extends Layout {
    constructor(property: any);
    addBoolean(property: any): void;
    decode(b: any, offset?: number): any;
    encode(src: any, b: any, offset?: number): any;
}
export declare class VersionedLayout extends Layout {
    constructor(version: any, inner: any, property: any);
    decode(b: any, offset?: number): any;
    encode(src: any, b: any, offset?: number): any;
    getSpan(b: any, offset?: number): any;
}
declare class EnumLayout extends UInt {
    constructor(values: any, span: any, property: any);
    encode(src: any, b: any, offset: any): any;
    decode(b: any, offset: any): string;
}
export declare function sideLayout(property: any): EnumLayout;
export declare function orderTypeLayout(property: any): EnumLayout;
export declare function selfTradeBehaviorLayout(property: any): EnumLayout;
export declare function accountFlagsLayout(property?: string): any;
export declare function setLayoutDecoder(layout: any, decoder: any): void;
export declare function setLayoutEncoder(layout: any, encoder: any): any;
export {};
