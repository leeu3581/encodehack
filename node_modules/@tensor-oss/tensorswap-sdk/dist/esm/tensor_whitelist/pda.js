import { PublicKey } from "@solana/web3.js";
import { TLIST_ADDR } from "./constants";
export const findWhitelistAuthPDA = ({ program }) => {
    return PublicKey.findProgramAddressSync([], program ?? TLIST_ADDR);
};
export const findWhitelistPDA = ({ program, uuid, }) => {
    return PublicKey.findProgramAddressSync([Buffer.from(uuid)], program ?? TLIST_ADDR);
};
export const findMintProofPDA = ({ program, mint, whitelist, }) => {
    return PublicKey.findProgramAddressSync([Buffer.from("mint_proof"), mint.toBytes(), whitelist.toBytes()], program ?? TLIST_ADDR);
};
//# sourceMappingURL=pda.js.map