import { PoolConfig, TakerSide } from "../types";
import Big from "big.js";
import BN from "bn.js";
export declare const HUNDRED_PCT_BPS = 10000;
export type ComputePriceArgs = {
    config: PoolConfig;
    takerSellCount: number;
    takerBuyCount: number;
    takerSide: TakerSide;
    maxTakerSellCount: number;
    statsTakerSellCount: number;
    statsTakerBuyCount: number;
    extraNFTsSelected: number;
    slippage?: number;
    marginated: boolean;
};
export declare const computeTakerDisplayPrice: (args: ComputePriceArgs) => Big | null;
export declare const computeTakerPrice: (args: ComputePriceArgs) => Big | null;
export declare const computeMakerAmountCount: ({ desired, maxCountWhenInfinite, ...priceArgs }: Omit<ComputePriceArgs, "slippage"> & {
    desired: {
        count: number;
    } | {
        total: BN;
    };
    maxCountWhenInfinite?: number | undefined;
}) => {
    totalAmount: BN;
    allowedCount: number;
    initialPrice: BN | null;
};
//# sourceMappingURL=prices.d.ts.map