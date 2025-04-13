# XchainGPT
What the program does overall:

This program creates a LangChain agent that interacts with the WormholeScan API to fetch blockchain bridge data (e.g., transactions and cross-chain activity).
Loads a chain ID name mapping. 
Sets up tools (API wrappers) to fetch data.
Formats results in human-readable form. 
Uses an OpenAI LLM (gpt-4) as the reasoning engine. 
Enables natural language queries via the agent. 

Key Parts & Their Purpose: 

1. **chain_name_to_id** / **id_to_chain_name** Maps blockchain names (like "Ethereum") to their numeric chain IDs used in API responses, and vice versa. 
2. **system_prompt** Provides instructions to the LLM on how to: Convert chain IDs to names in outputs. Use tools to fetch real-time data. Present data in a user-friendly way. 
3. **ChatOpenAI(...)** Initializes GPT-4 with the system prompt, giving the AI context and behavior rules. 
4. **get_observations_by_tx(...)** Purpose: Fetch observations (blockchain messages) based on a transaction hash. Key features: Hits /api/v1/observations. Cleans each observation: Shows readable timestamps. Truncates long signatures. Extracts chain, address, and sequence info. 
5. **get_cross_chain_activity(...)** Purpose: Gets top cross-chain app activity for a specific time range. Key features: Hits /api/v1/x-chain-activity/tops. Supports filtering by app, source chain, or target chain. Returns raw API data (can be extended to clean the result). 
6. **get_last_wormhole_transactions(...)** Purpose: Fetches recent Wormhole bridge transactions. Key features: Hits /api/v1/last-txs. Can filter by time and sample rate. Handles different response formats safely. 
7. **agent = initialize_agent(...)** Purpose: Initializes a LangChain OpenAI-powered agent with the three tools above. Behavior: Can take natural language questions like: “How many transactions happened on Ethereum yesterday?” “Show me observations from this transaction hash.” The agent decides which tool(s) to use to answer based on the prompt and the tools’ descriptions. 

**good queries:**
{"What is the observation for today of 1 page and a pagesize of 2?"}
(to test the get_observations_by_tx function)

{"query":"What was the cross chain activity of tokens from the past 1 days till now?"}
(to test the get_cross_chain_activity function)

{"query":"What is the total amount of transactions yesterday with a sample rate of 1 hour?"}
(to test the get_last_wormhole_transactions function)

{"query":"Show me the transactions in the past 9 hours"}
(to test the get_last_wormhole_transactions function)
