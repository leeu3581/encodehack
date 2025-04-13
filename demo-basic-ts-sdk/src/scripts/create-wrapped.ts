import { Wormhole, signSendWait, wormhole, TokenId } from '@wormhole-foundation/sdk';
import evm from '@wormhole-foundation/sdk/evm';
import solana from '@wormhole-foundation/sdk/solana';
import sui from '@wormhole-foundation/sdk/sui';
import { inspect } from 'util';
import { getSigner } from '../helpers/helpers';
import { SolanaAgentKit, createSolanaTools } from "solana-agent-kit";

export type { TokenId };
export type CreateWrappedResult = { chain: string; address: string };

async function waitForWrappedAsset(tbDest: any, tokenId: TokenId, destChain: any) {
	while (true) {
		try {
			const wrapped = await tbDest.getWrappedAsset(tokenId);
			return { chain: destChain.chain, address: wrapped };
		} catch (e) {
			console.error('Wrapped asset not found yet. Retrying...');
		}
		console.log('Waiting before checking again...');
		await new Promise((r) => setTimeout(r, 2000));
	}
}

export const createWrappedToken = async (
	sourceChainName: string,
	destChainName: string,
	tokenAddress: string,
): Promise<CreateWrappedResult> => {


	const wh = await wormhole('Testnet', [evm, solana, sui]);
	console.log("🚀 ~ create-wrapped.ts:10 ~ wh:", wh)

	// Define the source and destination chains
	const origChain = wh.getChain(sourceChainName as "Ethereum" | "Solana");
	const destChain = wh.getChain(destChainName as "Ethereum" | "Solana");

	// Retrieve the token ID for the provided token address
	const tokenId: TokenId = Wormhole.tokenId(origChain.chain, tokenAddress);
	console.log(`Token ID for ${sourceChainName}:`, tokenId);

	// Retrieve the token ID(for native)from the source chain
	// const token = await origChain.getNativeWrappedTokenId();

	// Destination chain signer setup
	const gasLimit = BigInt(2_500_000); // Optional for EVM Chains
	const { signer: destSigner } = await getSigner(destChain, gasLimit);
	const tbDest = await destChain.getTokenBridge();

	// Check if the token is already wrapped on the destination chain
	try {
		const wrapped = await tbDest.getWrappedAsset(tokenId);
		console.log(`Token already wrapped on ${destChain.chain}. Skipping attestation.`);
		return { chain: destChain.chain, address: wrapped.toString() };
	} catch (e) {
		console.log(`No wrapped token found on ${destChain.chain}. Proceeding with attestation.`);
	}

	// Source chain signer setup
	const { signer: origSigner } = await getSigner(origChain);
	const tbOrig = await origChain.getTokenBridge();

	// Create the attestation transaction
	const attestTxns = tbOrig.createAttestation(
		tokenId.address,
		Wormhole.parseAddress(origSigner.chain(), origSigner.address())
	);

	let txid: string;
	try {
		const txids = await signSendWait(origChain, attestTxns, origSigner);
		txid = txids[0]!.txid;
		console.log('Created attestation: ', txid);
	} catch (error: any) {
		console.error('Attestation failed:', error);
		throw error;
	}

	// Retrieve the Wormhole message ID from the attestation transaction
	const msgs = await origChain.parseTransaction(txid);
	console.log('Parsed Messages:', msgs);

	// Fetch the signed VAA
	const timeout = 25 * 60 * 1000;
	const vaa = await wh.getVaa(msgs[0]!, 'TokenBridge:AttestMeta', timeout);

	if (!vaa) {
		throw new Error('VAA not found after retries exhausted');
	}

	console.log('Token Address: ', vaa.payload.token.address);

	// Submit the attestation on the destination chain
	console.log('Attesting asset on destination chain...');

	const subAttestation = tbDest.submitAttestation(
		vaa,
		Wormhole.parseAddress(destSigner.chain(), destSigner.address())
	);

	// Send attestation transaction and log the transaction hash
	const tsx = await signSendWait(destChain, subAttestation, destSigner);
	console.log('Transaction hash: ', tsx);

	// Wait for wrapped asset
	const result = await waitForWrappedAsset(tbDest, tokenId, destChain);
	console.log('Wrapped Asset: ', result);
	return result;
};


