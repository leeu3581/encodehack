"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalAddress = getGlobalAddress;
exports.getGlobalVaultAddress = getGlobalVaultAddress;
const index_1 = require("../manifest/index");
const web3_js_1 = require("@solana/web3.js");
function getGlobalAddress(mint) {
    const [globalAddress, _unusedBump] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('global'), mint.toBuffer()], index_1.PROGRAM_ID);
    return globalAddress;
}
function getGlobalVaultAddress(mint) {
    const [globalVaultAddress, _unusedBump] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('global-vault'), mint.toBuffer()], index_1.PROGRAM_ID);
    return globalVaultAddress;
}
