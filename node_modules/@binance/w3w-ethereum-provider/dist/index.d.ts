import { SignClient } from '@binance/w3w-sign-client';
import { IWCEthRpcConnectionOptions } from '@binance/w3w-types';
import { IEthereumProvider, RequestArguments, ProviderAccounts } from 'eip1193-provider';

declare class BinanceW3WProvider implements IEthereumProvider {
    events: any;
    private signClient;
    private rpc;
    private httpClient;
    private optsChainId;
    private lng;
    private showQrCodeModal?;
    constructor(opts?: IWCEthRpcConnectionOptions);
    get connected(): boolean;
    get connector(): SignClient;
    get accounts(): string[];
    get chainId(): string;
    get rpcUrl(): string;
    request(args: RequestArguments): Promise<any>;
    signMessage(message: string): Promise<string>;
    sendAsync(args: RequestArguments, callback: (error: Error | null, response: any) => void): void;
    setLng(lng: string): void;
    enable(chainId?: number): Promise<ProviderAccounts>;
    private switchChain;
    private connect;
    disconnect(): void;
    on(event: any, listener: any): void;
    once(event: string, listener: any): void;
    removeListener(event: string, listener: any): void;
    off(event: string, listener: any): void;
    get isWalletConnect(): boolean;
    private registerEventListeners;
    private setHttpProvider;
}
declare const getProvider: (opts?: IWCEthRpcConnectionOptions) => BinanceW3WProvider;

export { BinanceW3WProvider as default, getProvider };
