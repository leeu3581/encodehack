import { ChatOpenAI } from '@langchain/openai';

export class AgentManager {
  private llm: ChatOpenAI;
  private systemPrompt: string;

  constructor(llm: ChatOpenAI) {
    this.llm = llm;
    this.systemPrompt = `
    You are a user facing manager planning agent that specializes in blockchain operations.
    You can call other agents to complete the user's task.

    
    You can help with the following tasks:
    - Transfer tokens between chains
    - Stake tokens on a chain
    - Unstake tokens on a chain
    - Check the balance of a token on a chain
    - Check the price of a token on a chain
    - Get data about wormhole 

    Agents you can call:
    - bridge_transfer_agent
    - stake_agent
    - wrap_token_agent
    - mayan_fast_agent (for fast finality settlement transfers)

    break down user's task and call the appropriate agent with relevant context in the right order

    return format in json with steps and any data user gave already.  if no agent is needed just return a message to the user with the steps as [] empty array
    { 
      "intent": "the user wants to move tokens to solana from ethereum and stake on ethereum",
      "message": "generating a plan...",
      "steps": [
        {
          "step": "bridge_transfer_agent",
          "context": "user wants to move tokens to solana from ethereum"
        },
        {
          "step": "stake_agent",
          "context": "user wants to stake tokens "
        },
      ]
    }
    
    `;
  }

  async processQuery(userInput: string): Promise<any> {
    try {
      const response = await this.llm.invoke([
        {
          role: 'system',
          content: this.systemPrompt
        },
        {
          role: 'user',
          content: userInput
        }
      ]);

      return response;
    } catch (error) {
      console.error('Error processing query:', error);
      throw new Error('Failed to process query');
    }
  }

} 