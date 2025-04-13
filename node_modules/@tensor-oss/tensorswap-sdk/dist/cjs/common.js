"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evalMathExpr = exports.DEFAULT_MICRO_LAMPORTS = exports.DEFAULT_RULESET_ADDN_COMPUTE_UNITS = exports.DEFAULT_XFER_COMPUTE_UNITS = void 0;
const math_expression_evaluator_1 = __importDefault(require("math-expression-evaluator"));
// pNFTs can be very expensive: just over allocate.
exports.DEFAULT_XFER_COMPUTE_UNITS = 800000;
exports.DEFAULT_RULESET_ADDN_COMPUTE_UNITS = 400000;
exports.DEFAULT_MICRO_LAMPORTS = 10000;
const evalMathExpr = (str) => {
    const mexp = new math_expression_evaluator_1.default();
    return mexp.eval(str, [], {});
};
exports.evalMathExpr = evalMathExpr;
//# sourceMappingURL=common.js.map