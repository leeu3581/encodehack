"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/get-supported-chains.ts
const index_1 = require("../../index");
require("dotenv/config");
const client = new index_1.OKXDexClient({
    apiKey: process.env.OKX_API_KEY,
    secretKey: process.env.OKX_SECRET_KEY,
    apiPassphrase: process.env.OKX_API_PASSPHRASE,
    projectId: process.env.OKX_PROJECT_ID
});
async function main() {
    try {
        const chainId = '607'; // Ton Chain ID
        const chain = await client.dex.getChainData(chainId);
        console.log('Supported chain:', JSON.stringify(chain, null, 2));
    }
    catch (error) {
        console.error('Error:', error);
    }
}
main();
