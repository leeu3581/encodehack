import { PublicKey } from "@solana/web3.js";
export declare const findWhitelistAuthPDA: ({ program }: {
    program?: PublicKey | undefined;
}) => [PublicKey, number];
export declare const findWhitelistPDA: ({ program, uuid, }: {
    program?: PublicKey | undefined;
    uuid: number[];
}) => [PublicKey, number];
export declare const findMintProofPDA: ({ program, mint, whitelist, }: {
    program?: PublicKey | undefined;
    mint: PublicKey;
    whitelist: PublicKey;
}) => [PublicKey, number];
//# sourceMappingURL=pda.d.ts.map