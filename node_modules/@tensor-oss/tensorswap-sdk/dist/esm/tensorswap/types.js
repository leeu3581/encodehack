import Big from "big.js";
import BN from "bn.js";
import { CurveType, PoolType } from "../types";
// --------------------------------------- pool type
export const PoolTypeAnchor = {
    Token: { token: {} },
    NFT: { nft: {} },
    Trade: { trade: {} },
};
export const poolTypeU8 = (poolType) => {
    const order = {
        token: 0,
        nft: 1,
        trade: 2,
    };
    return order[Object.keys(poolType)[0]];
};
export const castPoolTypeAnchor = (poolType) => ({
    0: PoolType.Token,
    1: PoolType.NFT,
    2: PoolType.Trade,
}[poolTypeU8(poolType)]);
export const castPoolType = (poolType) => poolType === PoolType.NFT
    ? PoolTypeAnchor.NFT
    : poolType === PoolType.Token
        ? PoolTypeAnchor.Token
        : PoolTypeAnchor.Trade;
// --------------------------------------- curve type
export const CurveTypeAnchor = {
    Linear: { linear: {} },
    Exponential: { exponential: {} },
};
export const curveTypeU8 = (curveType) => {
    const order = {
        linear: 0,
        exponential: 1,
    };
    return order[Object.keys(curveType)[0]];
};
export const castCurveTypeAnchor = (curveType) => ({
    0: CurveType.Linear,
    1: CurveType.Exponential,
}[curveTypeU8(curveType)]);
export const castCurveType = (curveType) => curveType === CurveType.Linear
    ? CurveTypeAnchor.Linear
    : CurveTypeAnchor.Exponential;
export const castPoolConfigAnchor = (config) => ({
    poolType: castPoolTypeAnchor(config.poolType),
    curveType: castCurveTypeAnchor(config.curveType),
    startingPrice: new Big(config.startingPrice.toString()),
    delta: new Big(config.delta.toString()),
    mmCompoundFees: config.mmCompoundFees,
    mmFeeBps: config.mmFeeBps,
});
export const castPoolConfig = (config) => ({
    poolType: castPoolType(config.poolType),
    curveType: castCurveType(config.curveType),
    startingPrice: new BN(config.startingPrice.round().toString()),
    delta: new BN(config.delta.round().toString()),
    mmCompoundFees: config.mmCompoundFees,
    mmFeeBps: config.mmFeeBps,
});
// --------------------------------------- rest
export var OrderType;
(function (OrderType) {
    OrderType[OrderType["Standard"] = 0] = "Standard";
    OrderType[OrderType["Sniping"] = 1] = "Sniping";
})(OrderType || (OrderType = {}));
//# sourceMappingURL=types.js.map