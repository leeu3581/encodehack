import { Core } from '@binance/w3w-core';
import { PrivateEthJsonRpc } from '@binance/w3w-types';
import { Events } from '@binance/w3w-utils';

declare class SignClient extends Events {
    accounts: string[];
    coreConnection: Core | null;
    constructor();
    get chainId(): string;
    get connected(): boolean;
    get connecting(): boolean;
    open({ requestChainId, lng, showQrCodeModal, }: {
        requestChainId?: string;
        lng?: string;
        showQrCodeModal?: boolean;
    }): Promise<void>;
    request<T extends keyof PrivateEthJsonRpc>(payload: PrivateEthJsonRpc[T]['request']): Promise<PrivateEthJsonRpc[T]['response']['result']>;
    disconnect(): void;
    private register;
    private subscribeEvents;
    private onClose;
}

export { SignClient };
