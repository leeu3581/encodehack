"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSingleListingPDA = exports.findNftAuthorityPDA = exports.findSolEscrowPDA = exports.findNftDepositReceiptPDA = exports.findNftEscrowPDA = exports.findNextFreeMarginNr = exports.findMarginPDA = exports.findTSwapPDA = exports.findPoolPDA = void 0;
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const constants_1 = require("./constants");
const findPoolPDA = ({ program, tswap, owner, whitelist, poolType, curveType, startingPrice, delta, }) => {
    return web3_js_1.PublicKey.findProgramAddressSync([
        tswap.toBytes(),
        owner.toBytes(),
        whitelist.toBytes(),
        //u8s, hence 1 byte each
        new bn_js_1.default(poolType).toArrayLike(Uint8Array, "le", 1),
        new bn_js_1.default(curveType).toArrayLike(Uint8Array, "le", 1),
        //u64s, hence 8 bytes each
        startingPrice.toArrayLike(Uint8Array, "le", 8),
        delta.toArrayLike(Uint8Array, "le", 8),
    ], program ?? constants_1.TENSORSWAP_ADDR);
};
exports.findPoolPDA = findPoolPDA;
const findTSwapPDA = ({ program }) => {
    return web3_js_1.PublicKey.findProgramAddressSync([], program ?? constants_1.TENSORSWAP_ADDR);
};
exports.findTSwapPDA = findTSwapPDA;
const findMarginPDA = ({ tswap, owner, marginNr, program, }) => {
    return web3_js_1.PublicKey.findProgramAddressSync([
        Buffer.from("margin"),
        tswap.toBytes(),
        owner.toBytes(),
        //u16, hence 2 bytes
        new bn_js_1.default(marginNr).toArrayLike(Uint8Array, "le", 2),
    ], program ?? constants_1.TENSORSWAP_ADDR);
};
exports.findMarginPDA = findMarginPDA;
const findNextFreeMarginNr = async ({ connection, startNr, tswap, owner, program, }) => {
    let marginNr = startNr ?? 0;
    let marginPda;
    let marginBump;
    let account = null;
    while (marginNr < 2 ** 16) {
        [marginPda, marginBump] = (0, exports.findMarginPDA)({
            tswap,
            owner,
            marginNr,
            program,
        });
        account = await connection.getAccountInfo(marginPda);
        if (!account) {
            return { marginNr, marginPda, marginBump };
        }
        marginNr++;
    }
    throw new Error("margin number > u16::MAX");
};
exports.findNextFreeMarginNr = findNextFreeMarginNr;
const findNftEscrowPDA = ({ program, nftMint, }) => {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("nft_escrow"), nftMint.toBytes()], program ?? constants_1.TENSORSWAP_ADDR);
};
exports.findNftEscrowPDA = findNftEscrowPDA;
const findNftDepositReceiptPDA = ({ program, nftMint, }) => {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("nft_receipt"), nftMint.toBytes()], program ?? constants_1.TENSORSWAP_ADDR);
};
exports.findNftDepositReceiptPDA = findNftDepositReceiptPDA;
const findSolEscrowPDA = ({ program, pool, }) => {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("sol_escrow"), pool.toBytes()], program ?? constants_1.TENSORSWAP_ADDR);
};
exports.findSolEscrowPDA = findSolEscrowPDA;
const findNftAuthorityPDA = ({ program, authSeed, }) => {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("nft_auth"), Buffer.from(authSeed)], program ?? constants_1.TENSORSWAP_ADDR);
};
exports.findNftAuthorityPDA = findNftAuthorityPDA;
const findSingleListingPDA = ({ program, nftMint, }) => {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("single_listing"), nftMint.toBytes()], program ?? constants_1.TENSORSWAP_ADDR);
};
exports.findSingleListingPDA = findSingleListingPDA;
//# sourceMappingURL=pda.js.map