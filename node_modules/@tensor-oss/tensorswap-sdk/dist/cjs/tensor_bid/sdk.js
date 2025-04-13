"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TensorBidSDK = exports.APPROX_BID_STATE_RENT = exports.BID_STATE_SIZE = exports.MAX_EXPIRY_SEC = exports.TBID_TAKER_FEE_BPS = exports.CURRENT_TBID_VERSION = exports.triageBidIDL = exports.TBidIDL_latest_EffSlot_Devnet = exports.TBidIDL_latest_EffSlot_Mainnet = exports.TBidIDL_latest = exports.TBidIDL_v0_1_0_EffSlot_Mainnet = exports.TBidIDL_v0_1_0 = void 0;
const anchor_1 = require("@coral-xyz/anchor");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const tensor_common_1 = require("@tensor-hq/tensor-common");
const common_1 = require("../common");
const token2022_1 = require("../token2022");
const tensorswap_1 = require("../tensorswap");
const constants_1 = require("./constants");
const pda_1 = require("./pda");
// ---------------------------------------- Versioned IDLs for backwards compat when parsing.
const tensor_bid_v0_1_0_1 = require("./idl/tensor_bid_v0_1_0");
const tensor_bid_1 = require("./idl/tensor_bid");
// initial deployment: https://explorer.solana.com/tx/2pLEU4Bvvd6xtRasDMQa9pRjhEsJKzqRoaQ4oDBG38AWadHUPudi8WjNACrB4neR5ap1GAxK6kvgcMuYYRvSVg11
exports.TBidIDL_v0_1_0 = tensor_bid_v0_1_0_1.IDL;
exports.TBidIDL_v0_1_0_EffSlot_Mainnet = 183865849;
// remove margin funding during bidding: https://solscan.io/tx/5A7XWvgicH1hDYAPtWhZd2SX7WCvUB2jjKDFqyRr6MwtfnGuTyfPkngTvQ7dFfcSTvjihLuBSETftPo1u5iixpp
exports.TBidIDL_latest = tensor_bid_1.IDL;
exports.TBidIDL_latest_EffSlot_Mainnet = 184669012;
exports.TBidIDL_latest_EffSlot_Devnet = 203536603;
// Use this function to figure out which IDL to use based on the slot # of historical txs.
const triageBidIDL = (slot, cluster) => {
    switch (cluster) {
        case tensor_common_1.Cluster.Mainnet:
            if (slot < exports.TBidIDL_v0_1_0_EffSlot_Mainnet)
                return null;
            if (slot < exports.TBidIDL_latest_EffSlot_Mainnet)
                return exports.TBidIDL_v0_1_0;
            return exports.TBidIDL_latest;
        case tensor_common_1.Cluster.Devnet:
            if (slot < exports.TBidIDL_latest_EffSlot_Devnet)
                return null;
            return exports.TBidIDL_latest;
    }
};
exports.triageBidIDL = triageBidIDL;
// --------------------------------------- constants
exports.CURRENT_TBID_VERSION = +tensor_bid_1.IDL.constants.find((c) => c.name === "CURRENT_TBID_VERSION").value;
exports.TBID_TAKER_FEE_BPS = +tensor_bid_1.IDL.constants.find((c) => c.name === "TBID_TAKER_FEE_BPS").value;
exports.MAX_EXPIRY_SEC = +tensor_bid_1.IDL.constants.find((c) => c.name === "MAX_EXPIRY_SEC").value;
exports.BID_STATE_SIZE = (0, common_1.evalMathExpr)(tensor_bid_1.IDL.constants.find((c) => c.name === "BID_STATE_SIZE").value);
exports.APPROX_BID_STATE_RENT = (0, tensor_common_1.getRentSync)(exports.BID_STATE_SIZE);
// --------------------------------------- sdk
class TensorBidSDK {
    program;
    discMap;
    coder;
    eventParser;
    constructor({ idl = tensor_bid_1.IDL, addr = constants_1.TBID_ADDR, provider, coder, }) {
        this.program = new anchor_1.Program(idl, addr, provider, coder);
        this.discMap = (0, tensor_common_1.genAcctDiscHexMap)(idl);
        this.coder = new anchor_1.BorshCoder(idl);
        this.eventParser = new anchor_1.EventParser(addr, this.coder);
    }
    // --------------------------------------- fetchers
    async fetchBidState(bidState, commitment) {
        return (await this.program.account.bidState.fetch(bidState, commitment));
    }
    // --------------------------------------- account methods
    decode(acct) {
        if (!acct.owner.equals(this.program.programId))
            return null;
        return (0, tensor_common_1.decodeAnchorAcct)(acct, this.discMap);
    }
    // --------------------------------------- ixs
    async bid({ bidder, nftMint, lamports, margin = null, expireIn = null, }) {
        const [bidState, bidStateBump] = (0, pda_1.findBidStatePda)({
            mint: nftMint,
            owner: bidder,
        });
        const [tswapPda, tswapPdaBump] = (0, tensorswap_1.findTSwapPDA)({});
        const builder = this.program.methods.bid(lamports, expireIn).accounts({
            nftMint,
            bidder,
            bidState,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            systemProgram: web3_js_1.SystemProgram.programId,
            tswap: tswapPda,
            //optional, as a default pick another mutable account
            marginAccount: margin ?? bidder,
        });
        return {
            builder,
            tx: { ixs: [await builder.instruction()], extraSigners: [] },
            bidState,
            bidStateBump,
            tswapPda,
            tswapPdaBump,
        };
    }
    async takeBid({ bidder, seller, nftMint, lamports, tokenProgram, margin = null, nftSellerAcc, meta, authData, compute = common_1.DEFAULT_XFER_COMPUTE_UNITS, priorityMicroLamports = common_1.DEFAULT_MICRO_LAMPORTS, optionalRoyaltyPct = null, takerBroker = null, }) {
        const [bidState, bidStateBump] = (0, pda_1.findBidStatePda)({
            mint: nftMint,
            owner: bidder,
        });
        const [tswapPda, tswapPdaBump] = (0, tensorswap_1.findTSwapPDA)({});
        const swapSdk = new tensorswap_1.TensorSwapSDK({
            provider: this.program.provider,
        });
        const tSwapAcc = await swapSdk.fetchTSwap(tswapPda);
        const [tempPda, tempPdaBump] = (0, pda_1.findNftTempPDA)({ nftMint });
        const destAta = (0, spl_token_1.getAssociatedTokenAddressSync)(nftMint, bidder, true, tokenProgram);
        //prepare 2 pnft account sets
        const { meta: newMeta, creators, ownerTokenRecordBump, ownerTokenRecordPda, destTokenRecordBump: tempDestTokenRecordBump, destTokenRecordPda: tempDestTokenRecordPda, ruleSet, nftEditionPda, authDataSerialized, } = await (0, tensor_common_1.prepPnftAccounts)({
            connection: this.program.provider.connection,
            meta,
            nftMint,
            destAta: tempPda,
            authData,
            sourceAta: nftSellerAcc,
        });
        meta = newMeta;
        const { destTokenRecordBump: destTokenRecordBump, destTokenRecordPda: destTokenRecordPda, } = await (0, tensor_common_1.prepPnftAccounts)({
            connection: this.program.provider.connection,
            meta,
            nftMint,
            destAta,
            authData,
            sourceAta: tempPda,
        });
        const builder = this.program.methods
            .takeBid(lamports, !!ruleSet, authDataSerialized, optionalRoyaltyPct)
            .accounts({
            nftMint,
            tswap: tswapPda,
            feeVault: tSwapAcc.feeVault,
            bidState,
            bidder,
            nftSellerAcc,
            nftMetadata: meta.address,
            nftBidderAcc: destAta,
            nftTempAcc: tempPda,
            seller,
            tensorswapProgram: tensorswap_1.TENSORSWAP_ADDR,
            tokenProgram,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            nftEdition: nftEditionPda,
            bidderTokenRecord: destTokenRecordPda,
            sellerTokenRecord: ownerTokenRecordPda,
            tempTokenRecord: tempDestTokenRecordPda,
            marginAccount: margin ?? seller,
            authRules: ruleSet ?? web3_js_1.SystemProgram.programId,
            takerBroker: takerBroker ?? tSwapAcc.feeVault,
            pnftShared: {
                authorizationRulesProgram: tensor_common_1.AUTH_PROGRAM_ID,
                tokenMetadataProgram: tensor_common_1.TMETA_PROGRAM_ID,
                instructions: web3_js_1.SYSVAR_INSTRUCTIONS_PUBKEY,
            },
        })
            .remainingAccounts(creators.map((c) => ({
            pubkey: c.address,
            isWritable: c.share > 0,
            isSigner: false,
        })));
        return {
            builder,
            tx: {
                ixs: (0, tensor_common_1.prependComputeIxs)([await builder.instruction()], compute, priorityMicroLamports),
                extraSigners: [],
            },
            bidState,
            bidStateBump,
            tswapPda,
            tswapPdaBump,
            tempPda,
            tempPdaBump,
            meta,
            ownerTokenRecordBump,
            ownerTokenRecordPda,
            destTokenRecordBump,
            destTokenRecordPda,
            tempDestTokenRecordBump,
            tempDestTokenRecordPda,
            ruleSet,
            nftEditionPda,
            authDataSerialized,
            nftbidderAcc: destAta,
        };
    }
    async cancelBid({ bidder, nftMint, }) {
        const [bidState, bidStateBump] = (0, pda_1.findBidStatePda)({
            mint: nftMint,
            owner: bidder,
        });
        const builder = this.program.methods.cancelBid().accounts({
            nftMint,
            bidder,
            bidState,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            systemProgram: web3_js_1.SystemProgram.programId,
        });
        return {
            builder,
            tx: { ixs: [await builder.instruction()], extraSigners: [] },
            bidState,
            bidStateBump,
        };
    }
    async closeExpiredBid({ bidder, nftMint, }) {
        const [bidState, bidStateBump] = (0, pda_1.findBidStatePda)({
            mint: nftMint,
            owner: bidder,
        });
        const builder = this.program.methods.closeExpiredBid().accounts({
            nftMint,
            bidder,
            bidState,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            systemProgram: web3_js_1.SystemProgram.programId,
        });
        return {
            builder,
            tx: { ixs: [await builder.instruction()], extraSigners: [] },
            bidState,
            bidStateBump,
        };
    }
    // --------------------------------------- T22
    async takeBidT22({ bidder, seller, nftMint, lamports, margin = null, nftSellerAcc, compute = common_1.DEFAULT_XFER_COMPUTE_UNITS, priorityMicroLamports = common_1.DEFAULT_MICRO_LAMPORTS, takerBroker = null, }) {
        const [bidState, bidStateBump] = (0, pda_1.findBidStatePda)({
            mint: nftMint,
            owner: bidder,
        });
        const [tswapPda, tswapPdaBump] = (0, tensorswap_1.findTSwapPDA)({});
        const swapSdk = new tensorswap_1.TensorSwapSDK({
            provider: this.program.provider,
        });
        const tSwapAcc = await swapSdk.fetchTSwap(tswapPda);
        const [tempPda, tempPdaBump] = (0, pda_1.findNftTempPDA)({ nftMint });
        const destAta = (0, spl_token_1.getAssociatedTokenAddressSync)(nftMint, bidder, true, spl_token_1.TOKEN_2022_PROGRAM_ID);
        const builder = this.program.methods.takeBidT22(lamports).accounts({
            nftMint,
            tswap: tswapPda,
            feeVault: tSwapAcc.feeVault,
            bidState,
            bidder,
            nftSellerAcc,
            nftBidderAcc: destAta,
            seller,
            tensorswapProgram: tensorswap_1.TENSORSWAP_ADDR,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            marginAccount: margin ?? seller,
            takerBroker: takerBroker ?? tSwapAcc.feeVault,
        });
        return {
            builder,
            tx: {
                ixs: (0, tensor_common_1.prependComputeIxs)([await builder.instruction()], compute, priorityMicroLamports),
                extraSigners: [],
            },
            bidState,
            bidStateBump,
            tswapPda,
            tswapPdaBump,
            tempPda,
            tempPdaBump,
            nftbidderAcc: destAta,
        };
    }
    // --------------------------------------- WNS
    async wnsTakeBid({ bidder, seller, nftMint, lamports, margin = null, nftSellerAcc, collectionMint, compute = common_1.DEFAULT_XFER_COMPUTE_UNITS, priorityMicroLamports = common_1.DEFAULT_MICRO_LAMPORTS, takerBroker = null, }) {
        const [bidState, bidStateBump] = (0, pda_1.findBidStatePda)({
            mint: nftMint,
            owner: bidder,
        });
        const [tswapPda, tswapPdaBump] = (0, tensorswap_1.findTSwapPDA)({});
        const swapSdk = new tensorswap_1.TensorSwapSDK({
            provider: this.program.provider,
        });
        const tSwapAcc = await swapSdk.fetchTSwap(tswapPda);
        const [tempPda, tempPdaBump] = (0, pda_1.findNftTempPDA)({ nftMint });
        const destAta = (0, spl_token_1.getAssociatedTokenAddressSync)(nftMint, bidder, true, spl_token_1.TOKEN_2022_PROGRAM_ID);
        const approveAccount = (0, token2022_1.getApprovalAccount)(nftMint);
        const distribution = (0, token2022_1.getDistributionAccount)(collectionMint);
        const extraMetas = (0, spl_token_1.getExtraAccountMetaAddress)(nftMint, token2022_1.WNS_PROGRAM_ID);
        const builder = this.program.methods.wnsTakeBid(lamports).accounts({
            nftMint,
            tswap: tswapPda,
            feeVault: tSwapAcc.feeVault,
            bidState,
            bidder,
            nftSellerAcc,
            nftBidderAcc: destAta,
            seller,
            tensorswapProgram: tensorswap_1.TENSORSWAP_ADDR,
            tokenProgram: spl_token_1.TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
            rent: web3_js_1.SYSVAR_RENT_PUBKEY,
            marginAccount: margin ?? seller,
            takerBroker: takerBroker ?? tSwapAcc.feeVault,
            approveAccount,
            distribution,
            distributionProgram: token2022_1.WNS_DISTRIBUTION_PROGRAM_ID,
            wnsProgram: token2022_1.WNS_PROGRAM_ID,
            extraMetas,
        });
        return {
            builder,
            tx: {
                ixs: (0, tensor_common_1.prependComputeIxs)([await builder.instruction()], compute, priorityMicroLamports),
                extraSigners: [],
            },
            bidState,
            bidStateBump,
            tswapPda,
            tswapPdaBump,
            tempPda,
            tempPdaBump,
            nftbidderAcc: destAta,
        };
    }
    // --------------------------------------- helpers
    async getBidStateRent() {
        return await (0, tensor_common_1.getRent)(this.program.provider.connection, this.program.account.bidState);
    }
    getError(name) {
        //@ts-ignore (throwing weird ts errors for me)
        return this.program.idl.errors.find((e) => e.name === name);
    }
    getErrorCodeHex(name) {
        return (0, tensor_common_1.hexCode)(this.getError(name).code);
    }
    // --------------------------------------- parsing raw txs
    /** This only works for the latest IDL. This is intentional: otherwise we'll need to switch/case all historical deprecated ixs downstream. */
    parseIxs(tx) {
        return (0, tensor_common_1.parseAnchorIxs)({
            tx,
            coder: this.coder,
            eventParser: this.eventParser,
            programId: this.program.programId,
        });
    }
    getFeeAmount(ix) {
        switch (ix.ix.name) {
            case "takeBid":
            case "takeBidT22":
            case "wnsTakeBid": {
                const event = ix.events[0].data;
                return event.tswapFee.add(event.creatorsFee);
            }
            case "bid":
            case "cancelBid":
            case "closeExpiredBid":
                return null;
        }
    }
    getSolAmount(ix) {
        switch (ix.ix.name) {
            case "takeBid":
            case "takeBidT22":
            case "wnsTakeBid":
            case "bid":
                return ix.ix.data.lamports;
            case "cancelBid":
            case "closeExpiredBid":
                return null;
        }
    }
    // FYI: accounts under InstructioNDisplay is the space-separated capitalized
    // version of the fields for the corresponding #[Accounts].
    // eg sol_escrow -> "Sol Escrow', or tswap -> "Tswap"
    // shared.sol_escrow -> "Shared > Sol Escrow"
    getAccountByName(ix, name) {
        // We use endsWith since composite nested accounts (eg shared.sol_escrow)
        // will prefix it as "Shared > Sol Escrow"
        return ix.formatted?.accounts.find((acc) => acc.name?.endsWith(name));
    }
}
exports.TensorBidSDK = TensorBidSDK;
//# sourceMappingURL=sdk.js.map