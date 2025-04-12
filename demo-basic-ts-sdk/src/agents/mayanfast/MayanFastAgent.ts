import { ChatOpenAI } from '@langchain/openai';
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
    MayanRouteSWIFT,
  } from '@mayanfinance/wormhole-sdk-route';

import {
	ChainAddress,
	ChainContext,
	// Network,
	Signer,
	Chain,
	isTokenId,
    routes,
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

export interface TransferParams {
    sourceChain: string;
    destinationChain: string;
    token: string;
    amount: string;
    recipientAddress: string;
}

export interface TransferResponse {
    message: string;
    params?: TransferParams;
    status: 'complete' | 'need_input';
}

export interface TransferResult {
    status: 'success' | 'error';
    message: string;
    txHash?: string;
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

export class MayanFastAgent {
  private llm: ChatOpenAI;
  private systemPrompt: string;
  private conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];
  public static logEmitter = new EventEmitter();

  constructor(llm: ChatOpenAI) {
    this.llm = llm;
    this.systemPrompt = `
    You are an agent that helps users perform fast finality transfers between chains.
    
    Respond with a JSON object (no markdown, no code blocks) in this exact format:
    {
      "message": "your message to the user",
      "params": {
        "sourceChain": "chain name (Ethereum or Solana only)",
        "destinationChain": "chain name (Ethereum or Solana only)",
        "token": "token address",
        "amount": "amount to transfer",
        "recipientAddress": "recipient address"
      },
      "status": "complete" or "need_input"
    }

    Or if you need more information:
    {
        "message": "your question to the user",
        "status": "need_input"
    }

    Always use double quotes for property names and string values. Never include comments or additional text outside the JSON object.`;
  }

  private log(message: string, type: 'info' | 'error' | 'success' = 'info') {
    const logMessage: LogMessage = {
        timestamp: Date.now(),
        message,
        type
    };
    MayanFastAgent.logEmitter.emit('log', logMessage);
    console.log(logMessage);
  }

  async processTransfer(context: string): Promise<{message: string, transferData?: TransferParams, status: 'complete' | 'need_input'}> {
    try {
      this.conversationHistory.push({ role: 'user', content: context });

      const response = await this.llm.invoke([
        { role: 'system', content: this.systemPrompt },
        ...this.conversationHistory
      ]);

      const responseString = response.content.toString();
      this.conversationHistory.push({ role: 'assistant', content: responseString });

      const cleanedContent = this.cleanResponseContent(responseString);
      const parsedResponse = JSON.parse(cleanedContent) as TransferResponse;
      
      if (parsedResponse.status === 'complete' && parsedResponse.params) {
        const result = await this.executeTransfer(parsedResponse.params);
        
        return {
          message: result.message,
          transferData: parsedResponse.params,
          status: 'complete'
        };
      }

      return {
        message: parsedResponse.message,
        transferData: parsedResponse.params,
        status: parsedResponse.status
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error in transfer agent:', errorMessage);
      throw new Error('Failed to process transfer request');
    }
  }

  private async executeTransfer(params: TransferParams): Promise<TransferResult> {
    try {
        const customConfig = {
        chains: {
            Ethereum: { rpc: eth_rpcUrl },
            Solana: { rpc: sol_rpcUrl }
        }
        };

        this.log('Initializing Wormhole with custom configuration...');
        const wh = await wormhole('Mainnet', [evm, solana], customConfig);
        
        const sourceChain = wh.getChain(params.sourceChain as any);
        const destChain = wh.getChain(params.destinationChain as any);



        // Doing transaction of native ETH on Ethereum to native SOL on Solana
        const source = Wormhole.tokenId(sourceChain.chain, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
        const destination = Wormhole.tokenId(destChain.chain, "So11111111111111111111111111111111111111112");

        // Create a new Wormhole route resolver, adding the Mayan route to the default list
        // @ts-ignore
        const resolver = wh.resolver([MayanRouteSWIFT]);

        // Show supported tokens
        // // const srcTokens = await resolver.supportedSourceTokens(sendChain);
        // const srcTokens = await resolver.(source, sourceChain, destChain)
        
        // console.log(srcTokens.slice(0, 5));

        const dstTokens = await resolver.supportedDestinationTokens(
            source,
            sourceChain,
            destChain
        );
        console.log(dstTokens.slice(0, 5));
        this.log("Supported destination tokens: " + dstTokens.slice(0, 5).toString(), 'info');

        // Pull private keys from env for testing purposes
        const sender = await getSigner(sourceChain);
        const receiver = await getSigner(destChain);

        // Creating a transfer request fetches token details
        // since all routes will need to know about the tokens
        const tr = await routes.RouteTransferRequest.create(wh, {
            source,
            destination,
        });

        // resolve the transfer request to a set of routes that can perform it
        const foundRoutes = await resolver.findRoutes(tr);
        const bestRoute = foundRoutes[0]!;

        // Specify the amount as a decimal string
        const transferParams = {
            amount: "0.0026",
            options: bestRoute.getDefaultOptions(),
        };

        // validate the queries route
        let validated = await bestRoute.validate(tr, transferParams);
        if (!validated.valid) {
            console.error(validated.error);
            return {
                status: 'error',
                message: `Error validating route: ${validated.error}`
            };
        }
        console.log("Validated: ", validated);
        this.log("Validated the queries route: " + validated, 'info');


        const quote = await bestRoute.quote(tr, validated.params);
        if (!quote.success) {
            console.error(`Error fetching a quote: ${quote.error.message}`);
            return {
                status: 'error',
                message: `Error fetching a quote: ${quote.error.message}`
            };
        }
        console.log("Quote: ", quote);
        this.log("Successfully fetched quote: " + quote, 'info');

        await new Promise(resolve => setTimeout(resolve, 2000));

        // initiate the transfer
        const receipt = await bestRoute.initiate(
            tr,
            sender.signer,
            quote,
            receiver.address
        );
        console.log("Initiated transfer with receipt: ", receipt);
        this.log("Initiated transfer with receipt: " + receipt, 'info');
        // wait 3s before checking the transfer
        await new Promise(resolve => setTimeout(resolve, 3000));

        const completed = await routes.checkAndCompleteTransfer(
            bestRoute,
            receipt,
            receiver.signer,
            15 * 60 * 1000
        );
        console.log("Completed transfer: ", completed);
        this.log("Completed transfer: " + completed, 'info');
        return {
            status: 'success',
            message: `Transfer successful. Full transfer details: ${JSON.stringify(completed, null, 2)}`
        };
    } catch (error) {
        console.error('Error in executeTransfer:', error);
        this.log("Error in executeTransfer: " + error, 'error');
        return {
            status: 'error',
            message: `Error executing transfer: ${error instanceof Error ? error.message : String(error)}`
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
   