import { ChatOpenAI } from '@langchain/openai';

interface StakingParams {
  chain: "Ethereum" | "Solana";
  token: string;
  amount?: number;
  provider?: string;
}

interface StakeResponse {
  message: string;
  params: StakingParams;
  status: 'complete' | 'need_input';
}

export class StakeAgent {
  private llm: ChatOpenAI;
  private systemPrompt: string;
  private conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];

  constructor(llm: ChatOpenAI) {
    this.llm = llm;
    this.systemPrompt = `
    You are a staking specialist that helps users stake their tokens on various chains.
    
    Given a staking request:
    1. Extract the chain, token, amount, and preferred provider (if specified)
    2. If this information is not available, ask the user for the missing details and set status to need_input
    3. Once all information is available, set status to complete
    
    Respond with a JSON object (no markdown, no code blocks) in this exact format:
    {
      "message": "what token would you like to stake? or generating staking interface... (when complete)",
      "params": {
        "chain": "chain name (Ethereum or Solana only)",
        "token": "token to stake or null if user is open to any token",
        "amount": number or null,
        "provider": "preferred staking provider or null"
      },
      "status": "complete" or "need_input"
    }

    If need_input, ask specific questions to the user in short messages:
    - 'Which chain would you like to stake on?'
    - 'What token would you like to stake?'
    - 'How much would you like to stake?'
    - 'Do you have a preferred staking provider?'
    `;
  }

  async processQuery(context: string): Promise<{message: string, stakingData?: StakingParams, status: 'complete' | 'need_input'}> {
    try {
      this.conversationHistory.push({ role: 'user', content: context });

      const response = await this.llm.invoke([
        { role: 'system', content: this.systemPrompt },
        ...this.conversationHistory
      ]);

      const responseString = response.content.toString();
      this.conversationHistory.push({ role: 'assistant', content: responseString });

      const cleanedContent = this.cleanResponseContent(responseString);
      const parsedResponse = JSON.parse(cleanedContent) as StakeResponse;
      
      try {
        this.validateResponse(parsedResponse);
      } catch (validationError) {
        // If validation fails, try one more time with the updated conversation history
        const retryResponse = await this.llm.invoke([
          { role: 'system', content: this.systemPrompt },
          ...this.conversationHistory
        ]);

        const retryResponseString = retryResponse.content.toString();
        this.conversationHistory.push({ role: 'assistant', content: retryResponseString });

        const retryCleanedContent = this.cleanResponseContent(retryResponseString);
        const retryParsedResponse = JSON.parse(retryCleanedContent) as StakeResponse;

        return {
          message: `I noticed some issues with the previous response. ${retryParsedResponse.message}`,
          stakingData: retryParsedResponse.params,
          status: retryParsedResponse.status
        };
      }

      return {
        message: parsedResponse.message,
        stakingData: parsedResponse.params,
        status: parsedResponse.status
      };

    } catch (error) {
      console.error('Error in stake agent:', error);
      throw new Error('Failed to process staking request');
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

  private validateResponse(response: StakeResponse): void {
    if (!response.message || !response.params || !response.status) {
      this.conversationHistory.push({
        role: 'user',
        content: 'The response was missing required fields. Please provide a complete response with message, params, and status.'
      });
      throw new Error('Invalid response format: missing required fields');
    }

    if (response.status === 'complete') {
      const validChains = ['Ethereum', 'Solana'] as const;
      if (!response.params.chain || !validChains.includes(response.params.chain)) {
        this.conversationHistory.push({
          role: 'user',
          content: 'The chain was invalid or missing. Please specify either Ethereum or Solana.'
        });
        throw new Error('Invalid chain specified');
      }
     
    }
  }
} 