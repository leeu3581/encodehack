import { ChatOpenAI } from '@langchain/openai';
import { WrapResponse, WrapParams } from './types';
import { Wormhole, signSendWait, wormhole, TokenId } from '@wormhole-foundation/sdk';
import evm from '@wormhole-foundation/sdk/evm';
import solana from '@wormhole-foundation/sdk/solana';
import { Alchemy } from "alchemy-sdk";
import { Network as WormholeNetwork } from '@wormhole-foundation/sdk';
import { Network as AlchemyNetwork } from 'alchemy-sdk';
import { Connection } from '@solana/web3.js';
import { JsonRpcProvider } from 'ethers';
import { Buffer } from 'buffer';
import { EventEmitter } from 'events';
import { Contract } from 'ethers';

import {
	ChainAddress,
	ChainContext,
	// Network,
	Signer,
	Chain,
	isTokenId,
} from '@wormhole-foundation/sdk';

if (typeof window !== 'undefined') {
    window.Buffer = Buffer;
}

export interface SignerStuff<N extends WormholeNetwork, C extends Chain> {
	chain: ChainContext<N, C>;
	signer: Signer<N, C>;
	address: ChainAddress<C>;
}

export interface LogMessage {
    timestamp: number;
    message: string;
    type: 'info' | 'error' | 'success';
}

const sol_rpcUrl = "https://solana-mainnet.g.alchemy.com/v2/_I8mVhAyz3zepZgI4bq7dD8oOmlTRaiu";
const eth_rpcUrl = "https://eth-mainnet.g.alchemy.com/v2/_I8mVhAyz3zepZgI4bq7dD8oOmlTRaiu";

// Signer setup function for different blockchain platforms
export async function getSigner<N extends WormholeNetwork, C extends Chain>(
	chain: ChainContext<N, C>,
	gasLimit?: bigint
): Promise<{ chain: ChainContext<N, C>; signer: Signer<N, C>; address: ChainAddress<C> }> {
	let signer: Signer;
	const platform = chain.platform.utils()._platform;

	try {
		switch (platform) {
			case 'Solana':
				const connection = new Connection(sol_rpcUrl, 'confirmed');
				// Test the connection

				
				signer = await (await solana()).getSigner(
					connection,
					import.meta.env.VITE_SOL_PRIVATE_KEY as string
				);
				break;

			case 'Evm':
				const evmSignerOptions = gasLimit ? { gasLimit } : {};
				const provider = new JsonRpcProvider(eth_rpcUrl);
				
				// Test the connection
				await provider.getNetwork()
					.catch(error => {
						throw new Error(`Failed to connect to Ethereum network: ${error.message}`);
					});

				signer = await (
					await evm()
				).getSigner(
					provider,
					import.meta.env.VITE_ETH_PRIVATE_KEY as string,
					evmSignerOptions
				);
				break;

			default:
				throw new Error('Unsupported platform: ' + platform);
		}

		return {
			chain,
			signer: signer as Signer<N, C>,
			address: Wormhole.chainAddress(chain.chain, signer.address()),
		};

	} catch (error) {
		console.error('Error in getSigner:', error);
		throw new Error(`Failed to initialize signer for ${platform}: ${error.message}`);
	}
}

export async function getTokenDecimals<N extends 'Mainnet' | 'Testnet' | 'Devnet'>(
	wh: Wormhole<N>,
	token: TokenId,
	sendChain: ChainContext<N, any>
): Promise<number> {
	return isTokenId(token)
		? Number(await wh.getDecimals(token.chain, token.address))
		: sendChain.config.nativeTokenDecimals;
}

export interface WrapResult {
    status: 'exists' | 'created' | 'error';
    message: string;
}

export class WrapAgent {
  private llm: ChatOpenAI;
  private systemPrompt: string;
  private conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];
  public static logEmitter = new EventEmitter();

  constructor(llm: ChatOpenAI) {
    this.llm = llm;
    this.systemPrompt = `
    You are an agent that helps users check and create wrapped tokens.
    
    Respond with a JSON object (no markdown, no code blocks) in this exact format:
    {
      "message": "your message to the user",
      "params": {
        "originChain": "chain name (Ethereum or Solana only)",
        "destinationChain": "chain name (Ethereum or Solana only)",
        "token": "token address"
      },
      "status": "complete" or "need_input",
      "exists": boolean
    }

    If need_input, ask specific questions to the user:
    - 'Which chain is the original token on?'
    - 'Which chain would you like to wrap to?'
    - 'What token would you like to wrap?'
    `;
  }

  private log(message: string, type: 'info' | 'error' | 'success' = 'info') {
    const logMessage: LogMessage = {
        timestamp: Date.now(),
        message,
        type
    };
    WrapAgent.logEmitter.emit('log', logMessage);
    console.log(logMessage);
  }

  async processQuery(context: string): Promise<{message: string, wrapData?: WrapParams, status: 'complete' | 'need_input'}> {
    try {
      this.conversationHistory.push({ role: 'user', content: context });

      const response = await this.llm.invoke([
        { role: 'system', content: this.systemPrompt },
        ...this.conversationHistory
      ]);

      const responseString = response.content.toString();
      this.conversationHistory.push({ role: 'assistant', content: responseString });

      const cleanedContent = this.cleanResponseContent(responseString);
      const parsedResponse = JSON.parse(cleanedContent) as WrapResponse;
      
      if (parsedResponse.status === 'complete' && parsedResponse.params) {
        const result = await this.createWrappedToken(parsedResponse.params);
        
        return {
          message: result.message,
          wrapData: parsedResponse.params,
          status: 'complete'
        };
      }

      return {
        message: parsedResponse.message,
        wrapData: parsedResponse.params,
        status: parsedResponse.status
      };

    } catch (error) {
      console.error('Error in wrap agent:', error);
      throw new Error('Failed to process wrapping request');
    }
  }

  private async createWrappedToken(params: WrapParams): Promise<WrapResult> {
    try {
        // Initialize custom network configuration
        const customConfig = {
            chains: {
                Ethereum: {
                    rpc: eth_rpcUrl,
                },
                Solana: {
                    rpc: sol_rpcUrl,
                }
            }
        };

        this.log('Initializing Wormhole with custom configuration...');
        const wh = await wormhole('Mainnet', [evm, solana], customConfig);
        
        const origChain = wh.getChain(params.originChain as any);
        const destChain = wh.getChain(params.destinationChain as any);


        const erc20TokenAddress = params.token;
        const erc20TokenId: TokenId = Wormhole.tokenId(origChain.chain, erc20TokenAddress);
        this.log(`ERC20 Token ID address: ${erc20TokenId}`, 'info');

        const gasLimit = BigInt(2_500_000);
        const { signer: destSigner } = await getSigner(destChain, gasLimit);
        const tbDest = await destChain.getTokenBridge();

        try {
            const wrapped = await tbDest.getWrappedAsset(erc20TokenId);
            this.log(`Token already wrapped on ${destChain.chain}. Skipping attestation.`, 'success');
            return {
                status: 'exists',
                message: `A wrapped version of ${params.token} already exists on ${params.destinationChain}. Would you like to lock and mint instead? `
            };
        } catch (e) {
            this.log(`No wrapped token found on ${destChain.chain}. Proceeding with attestation.`, 'info');
        }

        const { signer: origSigner } = await getSigner(origChain);
        const tbOrig = await origChain.getTokenBridge();
        
        this.log(`Creating attestation for ${erc20TokenId.address} on ${origChain.chain}...`, 'info');
        
        // Add token existence check
        // const provider = new JsonRpcProvider(eth_rpcUrl);
        // const tokenContract = new Contract(
        //     erc20TokenAddress,
        //     ['function symbol() view returns (string)'],
        //     provider
        // );

        // try {
        //     await tokenContract.symbol();
        // } catch (error) {
        //     this.log(`Token contract not found or invalid at ${params.token}`, 'error');
        //     return {
        //         status: 'error',
        //         message: `Invalid token address or contract not found at ${params.token}`
        //     };
        // }

     
        const attestTxns = tbOrig.createAttestation(
            erc20TokenAddress,
            Wormhole.parseAddress(origSigner.chain(), origSigner.address())
        );
        

        this.log(`Attestation transactions created: ${JSON.stringify(attestTxns, null, 2)}`, 'info');
        /////////

        const txids = await signSendWait(origChain, attestTxns, origSigner);
        this.log(`Transaction IDs: ${JSON.stringify(txids, null, 2)}`, 'info');
        
        const txid = txids[0]!.txid;
        this.log(`Created attestation: ${txid}`, 'success');

        const msgs = await origChain.parseTransaction(txid);
        this.log(`Parsed Messages: ${msgs}`, 'info');

        // Fetch the signed VAA
        const timeout = 25 * 60 * 1000;
        const vaa = await wh.getVaa(msgs[0]!, 'TokenBridge:AttestMeta', timeout);
        if (!vaa) {
            throw new Error('VAA not found after retries exhausted. Try extending the timeout.');
        }

        this.log('Token Address: '+ vaa.payload.token.address.toString() );

        // Submit the attestation on the destination chain
        this.log('Attesting asset on destination chain...' + vaa.toString() + destSigner.chain() + destSigner);

        const subAttestation = tbDest.submitAttestation(
            vaa,
            Wormhole.parseAddress(destSigner.chain(), destSigner.address())
        );

    // Send attestation transaction and log the transaction hash
        const tsx = await signSendWait(destChain, subAttestation, destSigner);
        this.log('Transaction hash: ' + tsx);

                // Poll for the wrapped asset until it's available
        async function waitForIt() {
            do {
                try {
                    const wrapped = await tbDest.getWrappedAsset(erc20TokenId);
                    return { chain: destChain.chain, address: wrapped };
                } catch (e) {
                    console.error('Wrapped asset not found yet. Retrying...');
                }
                console.log('Waiting before checking again...');
                await new Promise((r) => setTimeout(r, 2000));
            } while (true);
        }

        console.log('Wrapped Asset: ', await waitForIt());

        return {
            status: 'created',
            message: `Successfully created wrapped ${params.token} on ${params.destinationChain}.`
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.log(`Error creating wrapped token: ${errorMessage}`, 'error');
        return {
            status: 'error',
            message: `Failed to create wrapped token: ${error}`
        };
    }
  }

  private cleanResponseContent(content: string): string {
    let cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleaned = cleaned.trim();
    
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) {
      cleaned = cleaned.slice(firstBrace);
    }
    
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < cleaned.length - 1) {
      cleaned = cleaned.slice(0, lastBrace + 1);
    }
    
    return cleaned;
  }
} 
   