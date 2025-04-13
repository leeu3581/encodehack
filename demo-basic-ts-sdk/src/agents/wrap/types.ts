export interface WrapResponse {
  message: string;
  params?: {
    originChain: string;
    destinationChain: string;
    token: string;
  };
  status: 'complete' | 'need_input';
  exists: boolean;
}

export interface WrapParams {
  originChain: string;
  destinationChain: string;
  token: string;
} 