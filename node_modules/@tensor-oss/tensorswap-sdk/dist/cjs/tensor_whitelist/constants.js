"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_PROOF_LEN = exports.TLIST_OWNER = exports.TLIST_COSIGNER = exports.TLIST_ADDR = void 0;
const web3_js_1 = require("@solana/web3.js");
exports.TLIST_ADDR = new web3_js_1.PublicKey(process.env.TLIST_ADDR || "TL1ST2iRBzuGTqLn1KXnGdSnEow62BzPnGiqyRXhWtW");
exports.TLIST_COSIGNER = new web3_js_1.PublicKey(process.env.TLIST_COSIGNER || "5aB7nyNJTuQZdKnhZXQHNhT16tBNevCuLRp14btvANxu");
exports.TLIST_OWNER = new web3_js_1.PublicKey(process.env.TLIST_OWNER || "99cmWwQMqMFzMPx85rvZYKwusGSjZUDsu6mqYV4iisiz");
exports.MAX_PROOF_LEN = 28;
//# sourceMappingURL=constants.js.map