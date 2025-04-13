import { PublicKey } from "@solana/web3.js";
import Big from "big.js";
export declare enum TakerSide {
    Buy = "Buy",
    Sell = "Sell"
}
export declare enum PoolType {
    NFT = "NFT",
    Token = "Token",
    Trade = "Trade"
}
export declare enum CurveType {
    Linear = "Linear",
    Exponential = "Exponential"
}
export type PoolConfig = {
    poolType: PoolType;
    curveType: CurveType;
    startingPrice: Big;
    delta: Big;
    mmCompoundFees: boolean;
    mmFeeBps: number | null;
};
export type ParsedAccount = {
    name?: string | undefined;
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
};
export type InstructionDisplay = {
    args: {
        name: string;
        type: string;
        data: string;
    }[];
    accounts: {
        name?: string;
        pubkey: PublicKey;
        isSigner: boolean;
        isWritable: boolean;
    }[];
};
//# sourceMappingURL=types.d.ts.map