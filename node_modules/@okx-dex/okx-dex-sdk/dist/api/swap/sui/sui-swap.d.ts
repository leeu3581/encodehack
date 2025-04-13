import { SwapExecutor } from "../types";
import { SwapParams, SwapResponseData, SwapResult, ChainConfig, OKXConfig } from "../../../types";
export declare class SuiSwapExecutor implements SwapExecutor {
    private readonly config;
    private readonly networkConfig;
    private readonly client;
    private readonly wallet;
    private readonly DEFAULT_GAS_BUDGET;
    constructor(config: OKXConfig, networkConfig: ChainConfig);
    executeSwap(swapData: SwapResponseData, params: SwapParams): Promise<SwapResult>;
    private executeSuiTransaction;
    private formatSwapResult;
}
