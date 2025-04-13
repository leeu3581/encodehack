"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurveType = exports.PoolType = exports.TakerSide = void 0;
//the side of the trade that the trader is taking
var TakerSide;
(function (TakerSide) {
    TakerSide["Buy"] = "Buy";
    TakerSide["Sell"] = "Sell";
})(TakerSide = exports.TakerSide || (exports.TakerSide = {}));
var PoolType;
(function (PoolType) {
    PoolType["NFT"] = "NFT";
    PoolType["Token"] = "Token";
    PoolType["Trade"] = "Trade";
})(PoolType = exports.PoolType || (exports.PoolType = {}));
var CurveType;
(function (CurveType) {
    CurveType["Linear"] = "Linear";
    CurveType["Exponential"] = "Exponential";
})(CurveType = exports.CurveType || (exports.CurveType = {}));
//# sourceMappingURL=types.js.map