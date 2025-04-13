import {
	ChainAddress,
	ChainContext,
	Network,
	Signer,
	Wormhole,
	Chain,
	TokenId,
	isTokenId,
} from '@wormhole-foundation/sdk';
import evm from '@wormhole-foundation/sdk/evm';
import solana from '@wormhole-foundation/sdk/solana';
import sui from '@wormhole-foundation/sdk/sui';
import aptos from '@wormhole-foundation/sdk/aptos';


export interface SignerStuff<N extends Network, C extends Chain> {
	chain: ChainContext<N, C>;
	signer: Signer<N, C>;
	address: ChainAddress<C>;
}

// Signer setup function for different blockchain platforms
export async function getSigner<N extends Network, C extends Chain>(
	chain: ChainContext<N, C>,
	gasLimit?: bigint
): Promise<{ chain: ChainContext<N, C>; signer: Signer<N, C>; address: ChainAddress<C> }> {
	let signer: Signer;
	const platform = chain.platform.utils()._platform;

	switch (platform) {
		case 'Solana':
			signer = await (await solana()).getSigner(await chain.getRpc(), import.meta.env.'VITE_SOL_PRIVATE_KEY');
			break;
		case 'Evm':
			const evmSignerOptions = gasLimit ? { gasLimit } : {};
			signer = await (
				await evm()
			).getSigner(await chain.getRpc(), import.meta.env.'VITE_ETH_PRIVATE_KEY', evmSignerOptions);
			break;
		default:
			throw new Error('Unsupported platform: ' + platform);
	}

	return {
		chain,
		signer: signer as Signer<N, C>,
		address: Wormhole.chainAddress(chain.chain, signer.address()),
	};
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
