import { Wormhole, signSendWait, wormhole, TokenId } from '@wormhole-foundation/sdk';
import evm from '@wormhole-foundation/sdk/evm';
import solana from '@wormhole-foundation/sdk/solana';
import sui from '@wormhole-foundation/sdk/sui';
import { inspect } from 'util';
import { getSigner } from '../helpers/helpers';
import { SolanaAgentKit, createSolanaTools } from "solana-agent-kit";

(async function () {
	const wh = await wormhole('Testnet', [evm, solana, sui]);
	console.log("🚀 ~ create-wrapped.ts:10 ~ wh:", wh)

	// Define the source and destination chains
	const origChain = wh.getChain('Sepolia');

	// funds on the destination chain needed!
	const destChain = wh.getChain('Solana');

	// if (!process.env.SOLANA_PRIVATE_KEY) {
	// 	throw new Error("SOLANA_PRIVATE_KEY is required");
	// }

	// const agent = new SolanaAgentKit(
	// 	process.env.SOLANA_PRIVATE_KEY,
	// 	"https://api.mainnet-beta.solana.com",
	// 	{ OPENAI_API_KEY: process.env.OPENAI_API_KEY } // optional config
	//   );
	  
	//   // Create LangChain tools
	// const tools = createSolanaTools(agent);

	// console.log(tools);

	// Retrieve the token ID(for ERC-20)from the source chain
	const erc20TokenAddress = '0xD8C1a4680ac117Abe7Be8f55c2c8Fa5a73ffdedF'; // Custom ERC-20 Token Address
    const erc20TokenId: TokenId = Wormhole.tokenId(origChain.chain, erc20TokenAddress);
    console.log('ERC20 Token ID for Avalanche Sepolia (Example):', erc20TokenId);

	// Retrieve the token ID(for native)from the source chain
	// const token = await origChain.getNativeWrappedTokenId();

	// Destination chain signer setup
	const gasLimit = BigInt(2_500_000); // Optional for EVM Chains
	const { signer: destSigner } = await getSigner(destChain, gasLimit);
	const tbDest = await destChain.getTokenBridge();


	// Check if the token is already wrapped on the destination chain
	try {
		const wrapped = await tbDest.getWrappedAsset(erc20TokenId);
		console.log(`Token already wrapped on ${destChain.chain}. Skipping attestation.`);

		return { chain: destChain.chain, address: wrapped };
	} catch (e) {
		console.log(`No wrapped token found on ${destChain.chain}. Proceeding with attestation.`);
	}

	// Source chain signer setup
	const { signer: origSigner } = await getSigner(origChain);

	// Add validation before attestation
	const tbOrig = await origChain.getTokenBridge();

	// Validate the token contract exists
	try {
		const tokenContract = await origChain.getTokenContract(erc20TokenAddress);
		console.log('Token contract found:', tokenContract.address);
	} catch (e) {
		throw new Error(`Token contract not found at ${erc20TokenAddress}. Please verify the address.`);
	}

	// Check signer balance
	const balance = await origSigner.getBalance();
	if (balance === 0n) {
		throw new Error('Signer has no ETH for gas. Please fund the account first.');
	}

	// Create the attestation transaction
	const attestTxns = tbOrig.createAttestation(
		erc20TokenAddress,
		Wormhole.parseAddress(origSigner.chain(), origSigner.address())
	);

	// Submit the attestation transaction
	try {
		const txids = await signSendWait(origChain, attestTxns, origSigner);
		console.log('txids: ', inspect(txids, { depth: null }));
		const txid = txids[0]!.txid;
		console.log('Created attestation (save this): ', txid);
	} catch (error: any) {
		console.error('Attestation failed:', error);
		if (error.receipt) {
			console.error('Transaction receipt:', {
				status: error.receipt.status,
				gasUsed: error.receipt.gasUsed.toString(),
				blockNumber: error.receipt.blockNumber
			});
		}
		throw error;
	}

	// Retrieve the Wormhole message ID from the attestation transaction
	const msgs = await origChain.parseTransaction(txid);
	console.log('Parsed Messages:', msgs);

	// Fetch the signed VAA
	const timeout = 25 * 60 * 1000;
	const vaa = await wh.getVaa(msgs[0]!, 'TokenBridge:AttestMeta', timeout);

	if (!vaa) {
		throw new Error('VAA not found after retries exhausted. Try extending the timeout.');
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
})().catch((e) => console.error(e));
