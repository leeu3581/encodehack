"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// example.ts or test.ts
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
        // Get supported chains
        const chains = await client.dex.getChainData("784");
        console.log('Supported chains:', JSON.stringify(chains, null, 2));
    }
    catch (error) {
        console.error('Error:', error);
    }
}
main();
