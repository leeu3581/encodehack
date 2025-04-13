"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TSWAP_OWNER = exports.TSWAP_COSIGNER = exports.TSWAP_FEE_ACC = exports.TENSORSWAP_ADDR = exports.MAKER_REBATE_BPS = exports.TSWAP_TAKER_FEE_BPS = void 0;
const web3_js_1 = require("@solana/web3.js");
// constants separated from sdk.ts, used by the frontend
//(!) Keep in sync with Tensorswap contract and TBID_FEE_BPS
exports.TSWAP_TAKER_FEE_BPS = 150;
exports.MAKER_REBATE_BPS = 25;
exports.TENSORSWAP_ADDR = new web3_js_1.PublicKey(process.env.TENSORSWAP_ADDR || "TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN");
//@Deprecated, not used inside of Tswap anymore
exports.TSWAP_FEE_ACC = new web3_js_1.PublicKey(process.env.TSWAP_FEE_ACC || "4zdNGgAtFsW1cQgHqkiWyRsxaAgxrSRRynnuunxzjxue");
exports.TSWAP_COSIGNER = new web3_js_1.PublicKey(process.env.TSWAP_COSIGNER || "6WQvG9Z6D1NZM76Ljz3WjgR7gGXRBJohHASdQxXyKi8q");
exports.TSWAP_OWNER = new web3_js_1.PublicKey(process.env.TSWAP_OWNER || "99cmWwQMqMFzMPx85rvZYKwusGSjZUDsu6mqYV4iisiz");
//# sourceMappingURL=constants.js.map