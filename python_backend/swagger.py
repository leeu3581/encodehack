import requests
from langchain.tools import tool
import os
from dotenv import load_dotenv

from langchain.agents import initialize_agent, AgentType
from langchain_openai import ChatOpenAI

# Load environment variables
load_dotenv()

# Mapping of chain names to numeric IDs
chain_name_to_id = {
    "Ethereum": 2,
    "Solana": 1,
    "Acala": 12,
    "Algorand": 8,
    "Aptos": 22,
    "Arbitrum": 23,
    "Avalanche": 6,
    "Base": 30,
    "Berachain": 39,
    "Blast": 36,
    "BNB Smart Chain": 4,
    "Celestia": 4004,
    "Celo": 14,
    "Cosmos Hub": 4000,
    "Dymension": 4007,
    "Evmos": 4001,
    "Fantom": 10,
    "Gnosis": 25,
    "HyperEVM": 47,
    "Injective": 19,
    "Ink": 46,
    "Kaia": 13,
    "Karura": 11,
    "Kujira": 4002,
    "Linea": 38,
    "Mantle": 35,
    "Mezo": 50,
    "Monad": 48,
    "Moonbeam": 16,
    "NEAR": 15,
    "Neon": 17,
    "Neutron": 4003,
    "Noble": 4009,
    "Oasis": 7,
    "Optimism": 24,
    "Osmosis": 20,
    "Polygon": 5,
    "Provenance": 4008,
    "Pythnet": 26,
    "Scroll": 34,
    "SEDA": 4006,
    "Sei": 32,
    "Seievm": 40,
    "SNAXchain": 43,
    "Stargaze": 4005,
    "Sui": 21,
    "Terra": 3,
    "Terra 2.0": 18,
    "Unichain": 44,
    "World Chain": 45,
    "X Layer": 37,
    "XPLA": 28
}

id_to_chain_name = {v: k for k, v in chain_name_to_id.items()}

# Create system prompt with chain mapping information
system_prompt = [
    {
        "role": "system",
        "content": f"""You are a helpful assistant for the Wormhole blockchain bridge. 
You have access to tools that can fetch data about cross-chain transactions and activities.

Chain ID Mapping:
{chain_name_to_id}

When processing responses that contain chain IDs, you should:
1. Convert numeric chain IDs to their corresponding chain names using the mapping above in the response
2. Present the data in a user-friendly format with chain names instead of IDs in the response
3. If you see a chain ID that's not in the mapping, keep it as is in the response

For example:
- If you see Chain 2, you should display it as "Ethereum"
- If you see Chain 1, you should display it as "Solana"

When discussing the number of transactions and the volume, or the amount of volume:
1. Always use the get_cross_chain_activity tool to get the data
2. Always use the timespan parameter to get the data for the time range you are interested in
3. Always use the from_time and to_time parameters to get the data for the time range you are interested in

"""
    }
]

# Initialize OpenAI LLM with system prompt
llm = ChatOpenAI(
    model="gpt-4",
    temperature=0,
    messages=system_prompt
)

swagger_url = "https://api.wormholescan.io/swagger.json"
swagger = requests.get(swagger_url).json()


from langchain.tools import tool
import requests

@tool
def get_observations_by_tx(
    page: int = 1,
    pageSize: int = 10,
    txHash: str = "2hoQ7Bav8SqZkK6SYMNMu187NcFqGQRkAJuc6xNon9FhoZKs9mAUQAq3mndbJd7Ttef6pq1i6w5mM1sfCE5onFgL",

    sortOrder: str = "DESC"
) -> dict:
    """
    Fetch observations from the WormholeScan API using a specific transaction hash.

    Parameters:
    - page (int): Page number to fetch (default: 1)
    - pageSize (int): Number of results per page (default: 10)
    - txHash (str): Transaction hash to filter by
    - sortOrder (str): 'ASC' or 'DESC' (default: 'DESC')

    Returns:
    - A dictionary containing observation data or an error message.
    """
    url = "https://api.wormholescan.io/api/v1/observations"
    params = {
        "page": page,
        "pageSize": pageSize,
        "txHash": txHash,
        "sortOrder": sortOrder
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()  # Raises HTTPError if the status is 4xx/5xx
        data = response.json()
        cleaned = []

        for obs in data["observations"]:
            cleaned.append({
                "Emitter Chain": obs.get("emitterChain"),
                "Emitter Address": obs.get("emitterAddress"),
                "Sequence": obs.get("sequence"),
                "Guardian Address": obs.get("guardianAddress"),
                "Tx Hash": obs.get("txHash"),
                "Timestamp": datetime.fromtimestamp(obs.get("timestamp", 0)).strftime('%Y-%m-%d %H:%M:%S'),
                "Signature": obs.get("signature")[:10] + "..." if obs.get("signature") else None
            })

        return cleaned

    except Exception as e:
        return {
            "error": str(e),
            "status_code": response.status_code if 'response' in locals() else None
        }


@tool
def get_cross_chain_activity(
    timespan: str = "1d",
    from_time: str = "2025-04-10T15:04:05Z",
    to_time: str = "2025-04-13T15:04:04Z",
    appId=None, sourceChain=None, targetChain=None
) -> dict:
    """
    Query the WormholeScan API for top cross-chain activity given a time range, app ID, and chain IDs.

    Parameters:
    - timespan: Timespan string like "1d", "1h", "7d"
    - from_time: UTC-formatted string timestamp (e.g. 'UTC Time 2025-04-11T15:04:05Z')
    - to_time: UTC-formatted string timestamp (e.g. 'UTC Time 2025-04-12T15:04:04Z')
    - appId: App ID used in the query
    - sourceChain: Source chain ID or identifier
    - targetChain: Destination chain ID or identifier
    """
    url = "https://api.wormholescan.io/api/v1/x-chain-activity/tops"
    params = {
        "timespan": timespan,
        "from": from_time,
        "to": to_time,
    }
    
    # Add optional parameters if they are provided
    if appId:
        params["appId"] = appId

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        return data
    
    except Exception as e:
        return {
            "error": str(e),
            "status_code": response.status_code if 'response' in locals() else None
        }



@tool
def get_last_wormhole_transactions(timespan=None, sampleRate=None):
    """
    Fetch the latest Wormhole transactions from the WormholeScan API.

    Args:
        timespan (str, optional): Time window to sample transactions from (e.g., '1h', '24h').
        sampleRate (int, optional): Sampling rate (e.g., 1 for all, 10 for every 10th tx).

    Returns:
        list: A list of transaction data or an error dictionary.
    """
    url = "https://api.wormholescan.io/api/v1/last-txs"
    params = {}

    if timespan:
        params["timespan"] = timespan
    if sampleRate:
        params["sampleRate"] = sampleRate

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # If data is a list, return it directly
        if isinstance(data, list):
            return data
        # If data is a dictionary with a "data" key, return that
        elif isinstance(data, dict) and "data" in data:
            return data["data"]
        # Otherwise return the data as is
        return data
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

agent = initialize_agent(
    tools=[get_observations_by_tx, get_cross_chain_activity, get_last_wormhole_transactions],  # Add other tools here too
    llm=llm,
    agent=AgentType.OPENAI_FUNCTIONS,
    verbose=True
)

