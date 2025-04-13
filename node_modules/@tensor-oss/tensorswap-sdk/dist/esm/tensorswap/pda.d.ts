import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
export declare const findPoolPDA: ({ program, tswap, owner, whitelist, poolType, curveType, startingPrice, delta, }: {
    program?: PublicKey | undefined;
    tswap: PublicKey;
    owner: PublicKey;
    whitelist: PublicKey;
    poolType: number;
    curveType: number;
    startingPrice: BN;
    delta: BN;
}) => [PublicKey, number];
export declare const findTSwapPDA: ({ program }: {
    program?: PublicKey | undefined;
}) => [PublicKey, number];
export type FindMarginArgs = {
    tswap: PublicKey;
    owner: PublicKey;
    marginNr: number;
    program?: PublicKey;
};
export declare const findMarginPDA: ({ tswap, owner, marginNr, program, }: FindMarginArgs) => [PublicKey, number];
export declare const findNextFreeMarginNr: ({ connection, startNr, tswap, owner, program, }: {
    connection: Connection;
    startNr?: number | undefined;
} & Omit<FindMarginArgs, "marginNr">) => Promise<{
    marginNr: number;
    marginPda: any;
    marginBump: any;
}>;
export declare const findNftEscrowPDA: ({ program, nftMint, }: {
    program?: PublicKey | undefined;
    nftMint: PublicKey;
}) => [PublicKey, number];
export declare const findNftDepositReceiptPDA: ({ program, nftMint, }: {
    program?: PublicKey | undefined;
    nftMint: PublicKey;
}) => [PublicKey, number];
export declare const findSolEscrowPDA: ({ program, pool, }: {
    program?: PublicKey | undefined;
    pool: PublicKey;
}) => [PublicKey, number];
export declare const findNftAuthorityPDA: ({ program, authSeed, }: {
    program?: PublicKey | undefined;
    authSeed: number[];
}) => [PublicKey, number];
export declare const findSingleListingPDA: ({ program, nftMint, }: {
    program?: PublicKey | undefined;
    nftMint: PublicKey;
}) => [PublicKey, number];
//# sourceMappingURL=pda.d.ts.map