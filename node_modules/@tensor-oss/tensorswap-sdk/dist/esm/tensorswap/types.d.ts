import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { CurveType, PoolConfig, PoolType } from "../types";
export declare const PoolTypeAnchor: {
    Token: {
        token: {};
    };
    NFT: {
        nft: {};
    };
    Trade: {
        trade: {};
    };
};
type PoolTypeAnchor = typeof PoolTypeAnchor[keyof typeof PoolTypeAnchor];
export declare const poolTypeU8: (poolType: PoolTypeAnchor) => 0 | 1 | 2;
export declare const castPoolTypeAnchor: (poolType: PoolTypeAnchor) => PoolType;
export declare const castPoolType: (poolType: PoolType) => PoolTypeAnchor;
export declare const CurveTypeAnchor: {
    Linear: {
        linear: {};
    };
    Exponential: {
        exponential: {};
    };
};
type CurveTypeAnchor = typeof CurveTypeAnchor[keyof typeof CurveTypeAnchor];
export declare const curveTypeU8: (curveType: CurveTypeAnchor) => 0 | 1;
export declare const castCurveTypeAnchor: (curveType: CurveTypeAnchor) => CurveType;
export declare const castCurveType: (curveType: CurveType) => CurveTypeAnchor;
export type TSwapConfigAnchor = {
    feeBps: number;
};
export type PoolConfigAnchor = {
    poolType: PoolTypeAnchor;
    curveType: CurveTypeAnchor;
    startingPrice: BN;
    delta: BN;
    mmCompoundFees: boolean;
    mmFeeBps: number | null;
};
export declare const castPoolConfigAnchor: (config: PoolConfigAnchor) => PoolConfig;
export declare const castPoolConfig: (config: PoolConfig) => PoolConfigAnchor;
export declare enum OrderType {
    Standard = 0,
    Sniping = 1
}
export type Frozen = {
    amount: BN;
    time: BN;
};
export type PoolStatsAnchor = {
    takerSellCount: number;
    takerBuyCount: number;
    accumulatedMmProfit: BN;
};
export type PoolAnchor = {
    version: number;
    bump: number[];
    solEscrowBump: number[];
    createdUnixSeconds: BN;
    config: PoolConfigAnchor;
    tswap: PublicKey;
    owner: PublicKey;
    whitelist: PublicKey;
    solEscrow: PublicKey;
    takerSellCount: number;
    takerBuyCount: number;
    nftsHeld: number;
    nftAuthority: PublicKey;
    stats: PoolStatsAnchor;
    margin: PublicKey | null;
    isCosigned: boolean;
    orderType: OrderType;
    frozen: Frozen | null;
    lastTransactedSeconds: BN;
    maxTakerSellCount: number;
};
export type SolEscrowAnchor = {};
export type TSwapAnchor = {
    version: number;
    bump: number[];
    config: TSwapConfigAnchor;
    owner: PublicKey;
    feeVault: PublicKey;
    cosigner: PublicKey;
};
export type NftDepositReceiptAnchor = {
    bump: number;
    nftAuthority: PublicKey;
    nftMint: PublicKey;
    nftEscrow: PublicKey;
};
export type NftAuthorityAnchor = {
    randomSeed: number[];
    bump: number[];
    pool: PublicKey;
};
export type MarginAccountAnchor = {
    owner: PublicKey;
    name: number[];
    nr: number;
    bump: number[];
    poolsAttached: number;
};
export type SingleListingAnchor = {
    owner: PublicKey;
    nftMint: PublicKey;
    price: BN;
    bump: number[];
};
export type TensorSwapPdaAnchor = PoolAnchor | SolEscrowAnchor | TSwapAnchor | NftDepositReceiptAnchor | NftAuthorityAnchor | MarginAccountAnchor | SingleListingAnchor;
export type TaggedTensorSwapPdaAnchor = {
    name: "pool";
    account: PoolAnchor;
} | {
    name: "solEscrow";
    account: SolEscrowAnchor;
} | {
    name: "tSwap";
    account: TSwapAnchor;
} | {
    name: "nftDepositReceipt";
    account: NftDepositReceiptAnchor;
} | {
    name: "nftAuthority";
    account: NftAuthorityAnchor;
} | {
    name: "marginAccount";
    account: MarginAccountAnchor;
} | {
    name: "singleListing";
    account: SingleListingAnchor;
};
export {};
//# sourceMappingURL=types.d.ts.map