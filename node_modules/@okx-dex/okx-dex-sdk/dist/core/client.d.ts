import { DexAPI } from "../api/dex";
import { BridgeAPI } from "../api/bridge";
import type { OKXConfig } from "../types";
export declare class OKXDexClient {
    private config;
    private httpClient;
    dex: DexAPI;
    bridge: BridgeAPI;
    constructor(config: OKXConfig);
}
