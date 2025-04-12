import { ChatOpenAI } from '@langchain/openai';

export class SummaryAgent {
  private llm: ChatOpenAI;
  private systemPrompt: string;

  constructor(llm: ChatOpenAI) {
    this.llm = llm;
    this.systemPrompt = `
        You are a summary agent. You take in input from other agents and help with formatting the response to the user. If an agent returns a error message, return useful summary to the user. 
    If an agent returns a returns json object with success, return only key info such as origin_tx_hash, destination_tx_hash, along with natural language summary. Eg. Transaction form Ethereum to Solana was successful. Here are the details:...
    Just summarise the input to tell the user in a nicer user friendly way.
    `;
  }

  async processQuery(userInput: string): Promise<string> {
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

      return response.content.toString();
    } catch (error) {
      console.error('Error processing query:', error);
      return 'Sorry, I had trouble processing that message.';
    }
  }
} 