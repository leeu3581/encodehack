"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderType = exports.castPoolConfig = exports.castPoolConfigAnchor = exports.castCurveType = exports.castCurveTypeAnchor = exports.curveTypeU8 = exports.CurveTypeAnchor = exports.castPoolType = exports.castPoolTypeAnchor = exports.poolTypeU8 = exports.PoolTypeAnchor = void 0;
const big_js_1 = __importDefault(require("big.js"));
const bn_js_1 = __importDefault(require("bn.js"));
const types_1 = require("../types");
// --------------------------------------- pool type
exports.PoolTypeAnchor = {
    Token: { token: {} },
    NFT: { nft: {} },
    Trade: { trade: {} },
};
const poolTypeU8 = (poolType) => {
    const order = {
        token: 0,
        nft: 1,
        trade: 2,
    };
    return order[Object.keys(poolType)[0]];
};
exports.poolTypeU8 = poolTypeU8;
const castPoolTypeAnchor = (poolType) => ({
    0: types_1.PoolType.Token,
    1: types_1.PoolType.NFT,
    2: types_1.PoolType.Trade,
}[(0, exports.poolTypeU8)(poolType)]);
exports.castPoolTypeAnchor = castPoolTypeAnchor;
const castPoolType = (poolType) => poolType === types_1.PoolType.NFT
    ? exports.PoolTypeAnchor.NFT
    : poolType === types_1.PoolType.Token
        ? exports.PoolTypeAnchor.Token
        : exports.PoolTypeAnchor.Trade;
exports.castPoolType = castPoolType;
// --------------------------------------- curve type
exports.CurveTypeAnchor = {
    Linear: { linear: {} },
    Exponential: { exponential: {} },
};
const curveTypeU8 = (curveType) => {
    const order = {
        linear: 0,
        exponential: 1,
    };
    return order[Object.keys(curveType)[0]];
};
exports.curveTypeU8 = curveTypeU8;
const castCurveTypeAnchor = (curveType) => ({
    0: types_1.CurveType.Linear,
    1: types_1.CurveType.Exponential,
}[(0, exports.curveTypeU8)(curveType)]);
exports.castCurveTypeAnchor = castCurveTypeAnchor;
const castCurveType = (curveType) => curveType === types_1.CurveType.Linear
    ? exports.CurveTypeAnchor.Linear
    : exports.CurveTypeAnchor.Exponential;
exports.castCurveType = castCurveType;
const castPoolConfigAnchor = (config) => ({
    poolType: (0, exports.castPoolTypeAnchor)(config.poolType),
    curveType: (0, exports.castCurveTypeAnchor)(config.curveType),
    startingPrice: new big_js_1.default(config.startingPrice.toString()),
    delta: new big_js_1.default(config.delta.toString()),
    mmCompoundFees: config.mmCompoundFees,
    mmFeeBps: config.mmFeeBps,
});
exports.castPoolConfigAnchor = castPoolConfigAnchor;
const castPoolConfig = (config) => ({
    poolType: (0, exports.castPoolType)(config.poolType),
    curveType: (0, exports.castCurveType)(config.curveType),
    startingPrice: new bn_js_1.default(config.startingPrice.round().toString()),
    delta: new bn_js_1.default(config.delta.round().toString()),
    mmCompoundFees: config.mmCompoundFees,
    mmFeeBps: config.mmFeeBps,
});
exports.castPoolConfig = castPoolConfig;
// --------------------------------------- rest
var OrderType;
(function (OrderType) {
    OrderType[OrderType["Standard"] = 0] = "Standard";
    OrderType[OrderType["Sniping"] = 1] = "Sniping";
})(OrderType = exports.OrderType || (exports.OrderType = {}));
//# sourceMappingURL=types.js.map