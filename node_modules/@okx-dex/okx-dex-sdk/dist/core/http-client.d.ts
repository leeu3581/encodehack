import { OKXConfig } from '../types';
export declare class HTTPClient {
    private readonly config;
    constructor(config: OKXConfig);
    private getHeaders;
    private handleErrorResponse;
    request<T>(method: string, path: string, params?: Record<string, string | undefined>): Promise<T>;
}
