import { SwapExecutor } from "../types";
import { SwapParams, SwapResponseData, SwapResult, ChainConfig, OKXConfig } from "../../../types";
export declare class SolanaSwapExecutor implements SwapExecutor {
    private readonly config;
    private readonly networkConfig;
    constructor(config: OKXConfig, networkConfig: ChainConfig);
    executeSwap(swapData: SwapResponseData, params: SwapParams): Promise<SwapResult>;
    private executeSolanaTransaction;
    private prepareTransaction;
    private formatSwapResult;
}
