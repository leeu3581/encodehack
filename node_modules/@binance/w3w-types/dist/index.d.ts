import EventEmitter from 'eventemitter3';

interface IRPCMap {
    [chainId: number]: string;
}
interface IRpcConfig {
    infuraId: string;
    custom: IRPCMap;
}
interface IWCEthRpcConnectionOptions {
    chainId?: number;
    rpc?: IRPCMap;
    infuraId?: string;
    lng?: string;
    showQrCodeModal?: boolean;
}
interface AbstractProviderArguments {
    rpcMap?: IRPCMap;
}
interface RequestArguments<T = any> {
    method: string;
    params?: T;
}

type Any = any;
type Data = Record<string, unknown>;
type Maybe<T> = Partial<T> | null | undefined;
type ValueOf<T> = T[keyof T];

type JsonRpcVersion = '2.0';
type JsonRpcId = number;
interface ErrorResponse {
    code: number;
    message: string;
    data?: string;
}
interface JsonRpcRequest<Method = string, Params = Any> {
    jsonrpc: JsonRpcVersion;
    method: Method;
    id: JsonRpcId;
    params: Params extends undefined ? [] : Params;
}
interface JsonRpcResponseBase {
    jsonrpc: JsonRpcVersion;
    id: JsonRpcId;
}
interface JsonRpcSuccess<T = Any> extends JsonRpcResponseBase {
    result: Maybe<T>;
}
interface JsonRpcFailure extends JsonRpcResponseBase {
    error: ErrorResponse;
}
type JsonRpcResponse<T = any> = JsonRpcSuccess<T> | JsonRpcFailure;
interface JsonRpcProviderMessage<T = any> {
    type: string;
    data: T;
}
type JsonRpcPayload<P = any, R = any> = JsonRpcRequest<P> | JsonRpcResponse<R>;
interface JsonRpcValidationResult {
    valid: boolean;
    error?: string;
}
interface JsonRpcValidationValid extends JsonRpcValidationResult {
    valid: true;
}
interface JsonRpcValidationInvalid extends JsonRpcValidationResult {
    valid: false;
    error: string;
}
type JsonRpcValidation = JsonRpcValidationValid | JsonRpcValidationInvalid;
declare abstract class IEvents {
    events: EventEmitter;
    abstract on(event: string, listener: any): void;
    abstract once(event: string, listener: any): void;
    abstract off(event: string, listener: any): void;
    abstract removeListener(event: string, listener: any): void;
}
interface IJsonRpcConnection extends IEvents {
    connected: boolean;
    connecting: boolean;
    open(opts?: any): Promise<void>;
    close(): Promise<void>;
    send(payload: JsonRpcPayload, context?: any): Promise<void>;
}
declare abstract class IBaseJsonRpcProvider extends IEvents {
    abstract connect(params?: any): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract request<Result = any, Params = any>(request: RequestArguments<Params>, context?: any): Promise<Result>;
    protected abstract requestStrict<Result = any, Params = any>(request: JsonRpcRequest<Params>, context?: any): Promise<Result>;
}
declare abstract class IJsonRpcProvider extends IBaseJsonRpcProvider {
    connection: IJsonRpcConnection;
    abstract connect(connection?: string | IJsonRpcConnection): Promise<void>;
    protected abstract onPayload(payload: JsonRpcPayload): void;
    protected abstract open(connection?: string | IJsonRpcConnection): Promise<void>;
    protected abstract close(): Promise<void>;
}

type Address = string;
type Message = string;
type SignedSignature = string;
type ChainIdHex = string;
interface EthTransaction {
    from: string;
    to: string;
    gas?: string;
    gasPrice?: string;
    maxFeePergas?: string;
    maxPriorityFeePergas?: string;
    value?: string;
    data: string;
    nonce?: string;
}
type SignedTransaction = string;
type TransactionHash = string;
interface AddEthereumChainParameter {
    chainId: ChainIdHex;
    chainName: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
    iconUrls?: string[];
}
interface SwitchEthereumChainParameter {
    chainId: ChainIdHex;
}
interface WatchAssetParameter {
    type: 'ERC20';
    options: {
        address: string;
    };
}
type PublicEthMethod = 'eth_coinbase' | 'net_version' | 'eth_call' | 'eth_newFilter' | 'eth_newBlockFilter' | 'eth_newPendingTransactionFilter' | 'eth_uninstallFilter' | 'eth_gasPrice' | 'eth_estimateGas' | 'eth_getTransactionCount';
type PrivateEthMethod = 'eth_requestAccounts' | 'eth_accounts' | 'eth_chainId' | 'eth_signTransaction' | 'eth_sendTransaction' | 'eth_sign' | 'personal_sign' | 'eth_signTypedData' | 'eth_signTypedData_v1' | 'eth_signTypedData_v2' | 'eth_signTypedData_v3' | 'eth_signTypedData_v4' | 'wallet_switchEthereumChain' | 'wallet_watchAsset';
interface PrivateJsonRpc<Method extends PrivateEthMethod, Params, Result> {
    request: JsonRpcRequest<Method, Params>;
    response: JsonRpcSuccess<Result>;
}
type PrivateEthJsonRpc = {
    eth_requestAccounts: PrivateJsonRpc<'eth_requestAccounts', [], Address[]>;
    eth_accounts: PrivateJsonRpc<'eth_accounts', [], Address[]>;
    eth_chainId: PrivateJsonRpc<'eth_chainId', [], ChainIdHex>;
    eth_signTransaction: PrivateJsonRpc<'eth_signTransaction', [
        EthTransaction
    ], SignedTransaction>;
    eth_sendTransaction: PrivateJsonRpc<'eth_sendTransaction', [
        EthTransaction
    ], TransactionHash>;
    eth_sign: PrivateJsonRpc<'eth_sign', [Address, Message], SignedSignature>;
    personal_sign: PrivateJsonRpc<'personal_sign', [
        Message,
        Address
    ], SignedSignature>;
    eth_signTypedData: PrivateJsonRpc<'eth_signTypedData', [
        Address,
        string
    ], SignedSignature>;
    eth_signTypedData_v1: PrivateJsonRpc<'eth_signTypedData_v1', [
        Address,
        string
    ], SignedSignature>;
    eth_signTypedData_v2: PrivateJsonRpc<'eth_signTypedData_v2', [
        Address,
        string
    ], SignedSignature>;
    eth_signTypedData_v3: PrivateJsonRpc<'eth_signTypedData_v3', [
        Address,
        string
    ], SignedSignature>;
    eth_signTypedData_v4: PrivateJsonRpc<'eth_signTypedData_v4', [
        Address,
        string
    ], SignedSignature>;
    wallet_switchEthereumChain: PrivateJsonRpc<'wallet_switchEthereumChain', [
        SwitchEthereumChainParameter
    ], null>;
    wallet_watchAsset: PrivateJsonRpc<'wallet_watchAsset', WatchAssetParameter, boolean>;
};
type PrivateEthJsonRpcValue = ValueOf<PrivateEthJsonRpc>;

interface ClientMetadata {
    description: string;
    url: string;
    icons: string[];
    name: string;
}

interface EncryptionPayload {
    data: string;
    hmac: string;
    iv: string;
}
interface SessionParams {
    approved: boolean;
    chainId: number | null;
    networkId: number | null;
    accounts: string[] | null;
    rpcUrl?: string | null;
    peerId?: string | null;
    peerMeta?: ClientMetadata | null;
}
interface Session {
    connected: boolean;
    accounts: string[];
    chainId: string;
    relay: string;
    key: string;
    clientId: string;
    clientMeta: ClientMetadata | null;
    peerId: string;
    peerMeta: ClientMetadata | null;
    handshakeId: number;
    handshakeTopic: string;
}
declare enum DisconnectType {
    DisconnectAtWallet = 0,
    DisconnectAtClient = 1,
    NetworkError = 2
}

interface SocketTransportOptions {
    version: number;
    subscriptions?: string[];
}
interface ITransportLib extends IEvents {
    connected: boolean;
    retryFailed: boolean;
    open: (urls: string[]) => void;
    close: () => void;
    send: (message: string, topic?: string, silent?: boolean) => void;
    subscribe: (topic: string) => void;
}
interface SocketMessage {
    topic: string;
    payload: string;
    silent: boolean;
    type: 'sub' | 'pub' | 'ack';
}

type LogData = unknown[];
interface ILog {
    debug(...data: LogData): void;
    info(...data: LogData): void;
    warn(...data: LogData): void;
    error(...data: LogData): void;
    setLogger?: (logger: ILog) => void;
}

interface QrcodeModal {
    open: (params: {
        cb: () => void;
        lng?: string;
    }) => void;
    ready: (uri: string) => void;
    close: () => void;
    fail: () => void;
}

export { AbstractProviderArguments, AddEthereumChainParameter, Any, ClientMetadata, Data, DisconnectType, EncryptionPayload, ErrorResponse, EthTransaction, IBaseJsonRpcProvider, IEvents, IJsonRpcConnection, IJsonRpcProvider, ILog, IRPCMap, IRpcConfig, ITransportLib, IWCEthRpcConnectionOptions, JsonRpcFailure, JsonRpcId, JsonRpcPayload, JsonRpcProviderMessage, JsonRpcRequest, JsonRpcResponse, JsonRpcSuccess, JsonRpcValidation, JsonRpcValidationInvalid, JsonRpcValidationResult, JsonRpcValidationValid, JsonRpcVersion, LogData, Maybe, PrivateEthJsonRpc, PrivateEthJsonRpcValue, PrivateEthMethod, PublicEthMethod, QrcodeModal, RequestArguments, Session, SessionParams, SignedSignature, SocketMessage, SocketTransportOptions, SwitchEthereumChainParameter, ValueOf };
