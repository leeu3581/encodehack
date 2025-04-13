"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMintProofPDA = exports.findWhitelistPDA = exports.findWhitelistAuthPDA = void 0;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("./constants");
const findWhitelistAuthPDA = ({ program }) => {
    return web3_js_1.PublicKey.findProgramAddressSync([], program ?? constants_1.TLIST_ADDR);
};
exports.findWhitelistAuthPDA = findWhitelistAuthPDA;
const findWhitelistPDA = ({ program, uuid, }) => {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(uuid)], program ?? constants_1.TLIST_ADDR);
};
exports.findWhitelistPDA = findWhitelistPDA;
const findMintProofPDA = ({ program, mint, whitelist, }) => {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("mint_proof"), mint.toBytes(), whitelist.toBytes()], program ?? constants_1.TLIST_ADDR);
};
exports.findMintProofPDA = findMintProofPDA;
//# sourceMappingURL=pda.js.map