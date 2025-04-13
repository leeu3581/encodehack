import Mexp from "math-expression-evaluator";
// pNFTs can be very expensive: just over allocate.
export const DEFAULT_XFER_COMPUTE_UNITS = 800000;
export const DEFAULT_RULESET_ADDN_COMPUTE_UNITS = 400000;
export const DEFAULT_MICRO_LAMPORTS = 10000;
export const evalMathExpr = (str) => {
    const mexp = new Mexp();
    return mexp.eval(str, [], {});
};
//# sourceMappingURL=common.js.map