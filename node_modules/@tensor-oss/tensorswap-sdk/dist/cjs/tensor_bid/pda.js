"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNftTempPDA = exports.findBidStatePda = void 0;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("./constants");
const findBidStatePda = ({ program, mint, owner, }) => {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("bid_state"), owner.toBytes(), mint.toBytes()], program ?? constants_1.TBID_ADDR);
};
exports.findBidStatePda = findBidStatePda;
const findNftTempPDA = ({ program, nftMint, }) => {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("nft_temp_acc"), nftMint.toBytes()], program ?? constants_1.TBID_ADDR);
};
exports.findNftTempPDA = findNftTempPDA;
//# sourceMappingURL=pda.js.map