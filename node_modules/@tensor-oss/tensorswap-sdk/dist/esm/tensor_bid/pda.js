import { PublicKey } from "@solana/web3.js";
import { TBID_ADDR } from "./constants";
export const findBidStatePda = ({ program, mint, owner, }) => {
    return PublicKey.findProgramAddressSync([Buffer.from("bid_state"), owner.toBytes(), mint.toBytes()], program ?? TBID_ADDR);
};
export const findNftTempPDA = ({ program, nftMint, }) => {
    return PublicKey.findProgramAddressSync([Buffer.from("nft_temp_acc"), nftMint.toBytes()], program ?? TBID_ADDR);
};
//# sourceMappingURL=pda.js.map