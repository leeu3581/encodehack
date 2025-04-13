import { PublicKey } from "@solana/web3.js";
export declare const findBidStatePda: ({ program, mint, owner, }: {
    program?: PublicKey | undefined;
    mint: PublicKey;
    owner: PublicKey;
}) => [PublicKey, number];
export declare const findNftTempPDA: ({ program, nftMint, }: {
    program?: PublicKey | undefined;
    nftMint: PublicKey;
}) => [PublicKey, number];
//# sourceMappingURL=pda.d.ts.map