"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TensorWhitelistSDK = exports.APPROX_MINT_PROOF_RENT = exports.APPROX_AUTHORITY_RENT = exports.APPROX_WHITELIST_RENT = exports.MINT_PROOF_SIZE = exports.AUTHORITY_SIZE = exports.WHITELIST_SIZE = exports.triageWhitelistIDL = exports.TensorWhitelistIDL_latest_EffSlot_Devnet = exports.TensorWhitelistIDL_latest_EffSlot_Mainnet = exports.TensorWhitelistIDL_latest = exports.TensorWhitelistIDL_v0_1_0_EffSlot = exports.TensorWhitelistIDL_v0_1_0 = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const constants_1 = require("./constants");
const pda_1 = require("./pda");
const uuid_1 = require("uuid");
const merkletreejs_1 = __importDefault(require("merkletreejs"));
const keccak256_1 = __importDefault(require("keccak256"));
const common_1 = require("../common");
// ---------------------------------------- Versioned IDLs for backwards compat when parsing.
const tensor_whitelist_v0_1_0_1 = require("./idl/tensor_whitelist_v0_1_0");
const tensor_whitelist_1 = require("./idl/tensor_whitelist");
const tensor_common_1 = require("@tensor-hq/tensor-common");
//a non-breaking update to migrate account space to exportable constants: https://explorer.solana.com/tx/5czMUGttDttcXwhTTGH8QzyTffwcVfeUAQbY2FzSh8WGxRFBQAmdrYeGBQxfEfS1bog4CfTvqPvXmvxdygQ5aJKE
exports.TensorWhitelistIDL_v0_1_0 = tensor_whitelist_v0_1_0_1.IDL;
exports.TensorWhitelistIDL_v0_1_0_EffSlot = 0; //todo find slot
// added 3 types of verification: https://solscan.io/tx/55gtoZSTKf96XL6XDD5e9F4nkoiPqXHtP4mJoYNT6eZVwtHw2FRRhVxfg9jHADMLrVS2FmNRh2VAWVCqnTxrX3Ro
exports.TensorWhitelistIDL_latest = tensor_whitelist_1.IDL;
exports.TensorWhitelistIDL_latest_EffSlot_Mainnet = 172170872;
exports.TensorWhitelistIDL_latest_EffSlot_Devnet = 203539290;
// Use this function to figure out which IDL to use based on the slot # of historical txs.
const triageWhitelistIDL = (slot, cluster) => {
    switch (cluster) {
        case tensor_common_1.Cluster.Mainnet:
            //cba to parse really old txs, this was before public launch
            if (slot < exports.TensorWhitelistIDL_v0_1_0_EffSlot)
                return null;
            if (slot < exports.TensorWhitelistIDL_latest_EffSlot_Mainnet)
                return exports.TensorWhitelistIDL_v0_1_0;
            return exports.TensorWhitelistIDL_latest;
        case tensor_common_1.Cluster.Devnet:
            if (slot < exports.TensorWhitelistIDL_latest_EffSlot_Devnet)
                return exports.TensorWhitelistIDL_v0_1_0;
            return exports.TensorWhitelistIDL_latest;
    }
};
exports.triageWhitelistIDL = triageWhitelistIDL;
// --------------------------------------- constants
exports.WHITELIST_SIZE = (0, common_1.evalMathExpr)(tensor_whitelist_1.IDL.constants.find((c) => c.name === "WHITELIST_SIZE").value);
exports.AUTHORITY_SIZE = (0, common_1.evalMathExpr)(tensor_whitelist_1.IDL.constants.find((c) => c.name === "AUTHORITY_SIZE").value);
exports.MINT_PROOF_SIZE = (0, common_1.evalMathExpr)(tensor_whitelist_1.IDL.constants.find((c) => c.name === "MINT_PROOF_SIZE").value);
exports.APPROX_WHITELIST_RENT = (0, tensor_common_1.getRentSync)(exports.WHITELIST_SIZE);
exports.APPROX_AUTHORITY_RENT = (0, tensor_common_1.getRentSync)(exports.AUTHORITY_SIZE);
exports.APPROX_MINT_PROOF_RENT = (0, tensor_common_1.getRentSync)(exports.MINT_PROOF_SIZE);
// --------------------------------------- sdk
class TensorWhitelistSDK {
    program;
    discMap;
    constructor({ idl = tensor_whitelist_1.IDL, addr = constants_1.TLIST_ADDR, provider, coder, }) {
        this.program = new anchor_1.Program(idl, addr, provider, coder);
        this.discMap = (0, tensor_common_1.genAcctDiscHexMap)(idl);
    }
    // --------------------------------------- fetchers
    async fetchAuthority(authority, commitment) {
        return (await this.program.account.authority.fetch(authority, commitment));
    }
    async fetchWhitelist(whitelist, commitment) {
        return (await this.program.account.whitelist.fetch(whitelist, commitment));
    }
    async fetchMintProof(mintProof, commitment) {
        return (await this.program.account.mintProof.fetch(mintProof, commitment));
    }
    // --------------------------------------- account methods
    decode(acct) {
        if (!acct.owner.equals(this.program.programId))
            return null;
        return (0, tensor_common_1.decodeAnchorAcct)(acct, this.discMap);
    }
    // --------------------------------------- authority methods
    //main signature: cosigner
    async initUpdateAuthority({ cosigner = constants_1.TLIST_COSIGNER, owner = constants_1.TLIST_OWNER, newCosigner, newOwner, }) {
        const [authPda] = (0, pda_1.findWhitelistAuthPDA)({});
        const builder = this.program.methods
            .initUpdateAuthority(newCosigner, newOwner)
            .accounts({
            whitelistAuthority: authPda,
            owner,
            cosigner,
            systemProgram: web3_js_1.SystemProgram.programId,
        });
        return {
            builder,
            tx: { ixs: [await builder.instruction()], extraSigners: [] },
            authPda,
        };
    }
    // --------------------------------------- whitelist methods
    //main signature: cosigner
    async initUpdateWhitelist({ cosigner = constants_1.TLIST_COSIGNER, owner, //can't pass default here, coz then it'll be auto-included in rem accs
    uuid, rootHash = null, name = null, voc = null, fvc = null, compute = null, priorityMicroLamports = common_1.DEFAULT_MICRO_LAMPORTS, }) {
        const [authPda] = (0, pda_1.findWhitelistAuthPDA)({});
        const [whitelistPda] = (0, pda_1.findWhitelistPDA)({
            uuid,
        });
        //only needed for frozen whitelists
        const remAcc = owner
            ? [
                {
                    pubkey: owner,
                    isWritable: false,
                    isSigner: true,
                },
            ]
            : [];
        const builder = this.program.methods
            .initUpdateWhitelist(uuid, rootHash, name, voc, fvc)
            .accounts({
            whitelist: whitelistPda,
            whitelistAuthority: authPda,
            cosigner,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .remainingAccounts(remAcc);
        return {
            builder,
            tx: {
                ixs: (0, tensor_common_1.prependComputeIxs)([await builder.instruction()], compute, priorityMicroLamports),
                extraSigners: [],
            },
            authPda,
            whitelistPda,
        };
    }
    //main signature: cosigner
    async freezeWhitelist({ uuid, cosigner = constants_1.TLIST_COSIGNER, }) {
        const [authPda] = (0, pda_1.findWhitelistAuthPDA)({});
        const [whitelistPda] = (0, pda_1.findWhitelistPDA)({
            uuid,
        });
        const builder = this.program.methods.freezeWhitelist().accounts({
            whitelist: whitelistPda,
            whitelistAuthority: authPda,
            cosigner,
            systemProgram: web3_js_1.SystemProgram.programId,
        });
        return {
            builder,
            tx: { ixs: [await builder.instruction()], extraSigners: [] },
            authPda,
            whitelistPda,
        };
    }
    //main signature: owner
    async unfreezeWhitelist({ uuid, owner = constants_1.TLIST_OWNER, }) {
        const [authPda] = (0, pda_1.findWhitelistAuthPDA)({});
        const [whitelistPda] = (0, pda_1.findWhitelistPDA)({
            uuid,
        });
        const builder = this.program.methods.unfreezeWhitelist().accounts({
            whitelist: whitelistPda,
            whitelistAuthority: authPda,
            owner,
            systemProgram: web3_js_1.SystemProgram.programId,
        });
        return {
            builder,
            tx: { ixs: [await builder.instruction()], extraSigners: [] },
            authPda,
            whitelistPda,
        };
    }
    // --------------------------------------- mint proof methods
    //main signature: user
    async initUpdateMintProof({ user, mint, whitelist, proof, }) {
        const [mintProofPda] = (0, pda_1.findMintProofPDA)({ mint, whitelist });
        const builder = this.program.methods.initUpdateMintProof(proof).accounts({
            whitelist,
            mint,
            user,
            mintProof: mintProofPda,
            systemProgram: web3_js_1.SystemProgram.programId,
        });
        return {
            builder,
            tx: { ixs: [await builder.instruction()], extraSigners: [] },
            mintProofPda,
        };
    }
    // --------------------------------------- reallocs
    async reallocAuthority({ cosigner = constants_1.TLIST_COSIGNER, }) {
        const [authPda] = (0, pda_1.findWhitelistAuthPDA)({});
        const builder = this.program.methods.reallocAuthority().accounts({
            whitelistAuthority: authPda,
            cosigner,
            systemProgram: web3_js_1.SystemProgram.programId,
        });
        return {
            builder,
            tx: { ixs: [await builder.instruction()], extraSigners: [] },
            authPda,
        };
    }
    async reallocWhitelist({ uuid, cosigner = constants_1.TLIST_COSIGNER, }) {
        const [authPda] = (0, pda_1.findWhitelistAuthPDA)({});
        const [whitelistPda] = (0, pda_1.findWhitelistPDA)({
            uuid,
        });
        const builder = this.program.methods.reallocWhitelist().accounts({
            whitelist: whitelistPda,
            whitelistAuthority: authPda,
            cosigner,
            systemProgram: web3_js_1.SystemProgram.programId,
        });
        return {
            builder,
            tx: { ixs: [await builder.instruction()], extraSigners: [] },
            authPda,
            whitelistPda,
        };
    }
    // --------------------------------------- helper methods
    async getWhitelistRent() {
        return await (0, tensor_common_1.getRent)(this.program.provider.connection, this.program.account.whitelist);
    }
    async getAuthorityRent() {
        return await (0, tensor_common_1.getRent)(this.program.provider.connection, this.program.account.authority);
    }
    async getMintProofRent() {
        return await (0, tensor_common_1.getRent)(this.program.provider.connection, this.program.account.mintProof);
    }
    getError(name) {
        //@ts-ignore (throwing weird ts errors for me)
        return this.program.idl.errors.find((e) => e.name === name);
    }
    getErrorCodeHex(name) {
        return (0, tensor_common_1.hexCode)(this.getError(name).code);
    }
    static uuidToBuffer = (uuid) => {
        return Buffer.from(uuid.replaceAll("-", "")).toJSON().data;
    };
    static bufferToUuid = (buffer) => {
        const raw = String.fromCharCode(...buffer);
        return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
    };
    // NB: this truncates names to 32 bytes (32 chars if ascii, < if unicode).
    static nameToBuffer = (name) => {
        return Buffer.from(name.padEnd(32, "\0")).toJSON().data.slice(0, 32);
    };
    static bufferToName = (buffer) => {
        return (0, tensor_common_1.removeNullBytes)(String.fromCharCode(...buffer));
    };
    // Generates a Merkle tree + root hash + proofs for a set of mints.
    static createTreeForMints = (mints, skipVerify = false) => {
        const buffers = mints.map((m) => m.toBuffer());
        // Create hashes
        const leaves = buffers.map(keccak256_1.default);
        // Create an array of { leaf, mint } to preserve mapping
        const leafMintPairs = leaves.map((leaf, index) => {
            return { leaf: leaf, mint: mints[index] };
        });
        // Presort the array based on the leaves, so that original leaves remain in the same order after tree construction
        const sortedLeafMintPairs = leafMintPairs.slice().sort((a, b) => Buffer.compare(a.leaf, b.leaf));
        // Extract only the leaves from sortedLeafMintPairs
        const sortedLeaves = sortedLeafMintPairs.map(pair => pair.leaf);
        const tree = new merkletreejs_1.default(sortedLeaves, keccak256_1.default, {
            sortPairs: true,
        });
        const rootHash = tree.getRoot();
        // Get all proofs (order should be same as leaves)
        const allProofs = tree.getProofs();
        // This assumes proofs indices align with mints indices (which appears to be the case).
        const proofs = sortedLeafMintPairs.map((val, index) => {
            const proof = allProofs[index];
            const mint = val.mint;
            if (!skipVerify && !tree.verify(proof, (0, keccak256_1.default)(mint.toBuffer()), rootHash)) {
                throw new Error(`Invalid proof for mint at index ${index}`);
            }
            const validProof = proof.map((p) => p.data);
            return { mint, proof: validProof };
        });
        return { tree, root: tree.getRoot().toJSON().data, proofs };
    };
    genWhitelistUUID() {
        return (0, uuid_1.v4)().toString();
    }
}
exports.TensorWhitelistSDK = TensorWhitelistSDK;
//# sourceMappingURL=sdk.js.map