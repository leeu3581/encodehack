import { ChatOpenAI } from '@langchain/openai';

interface BridgeTransferParams {
  fromChain: "Ethereum" | "Solana";
  toChain: "Ethereum" | "Solana";
  fromToken: string;
  toToken: string;
  amount?: number;
}

interface BridgeResponse {
  message: string;
  params: BridgeTransferParams;
  status: 'complete' | 'need_input';
}

export class BridgeTransferAgent {
  private llm: ChatOpenAI;
  private systemPrompt: string;
  private conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];

  constructor(llm: ChatOpenAI) {
    this.llm = llm;
    this.systemPrompt = `
    You are a bridge transfer specialist that helps users transfer tokens between chains.
    
    Given a transfer request:
    1. Extract the source chain, destination chain, fromToken, toToken, and amount if provided
    2. if this is not available, ask the user for the information and say status need_input
    
    Respond with a JSON object (no markdown, no code blocks) in this exact format:
    {
      "message": "what is the chain youre transferring from? or generating transfer interface... (when complete)",
      "params": {
        "fromChain": "source chain (Ethereum or Solana only)",
        "toChain": "destination chain (Ethereum or Solana only)",
        "fromToken": "source token",
        "toToken": "destination token",
        "amount": number or null
      },
      "status": "complete" or "need_input"
    }

    if need_input, ask specific questions to the user in short messages, 'what is the source chain?', 'what is the destination chain?', 'what is the source token?', 'what is the destination token?',
    `;
  }

  async processQuery(context: string): Promise<{message: string, widget: BridgeTransferParams, status: 'complete' | 'need_input'}> {
    try {
      this.conversationHistory.push({ role: 'user', content: context });

      const response = await this.llm.invoke([
        { role: 'system', content: this.systemPrompt },
        ...this.conversationHistory
      ]);

      // Convert response content to string before adding to history
      const responseString = response.content.toString();
      this.conversationHistory.push({ role: 'assistant', content: responseString });

      const cleanedContent = this.cleanResponseContent(responseString);
      const parsedResponse = JSON.parse(cleanedContent) as BridgeResponse;
      
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
        const retryParsedResponse = JSON.parse(retryCleanedContent) as BridgeResponse;

        return {
          message: `I noticed some issues with the previous response. ${retryParsedResponse.message}`,
          widget: retryParsedResponse.params,
          status: retryParsedResponse.status
        };
      }

      return {
        message: parsedResponse.message,
        widget: parsedResponse.params,
        status: parsedResponse.status
      };

    } catch (error) {
      console.error('Error in bridge transfer agent:', error);
      throw new Error('Failed to process bridge transfer request');
    }
  }

  private cleanResponseContent(content: string): string {
    // Remove any markdown code block syntax
    let cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // If the content starts with a newline or any other characters before {, clean them
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) {
      cleaned = cleaned.slice(firstBrace);
    }
    
    // If the content has anything after the last }, remove it
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < cleaned.length - 1) {
      cleaned = cleaned.slice(0, lastBrace + 1);
    }
    
    return cleaned;
  }

  private validateResponse(response: BridgeResponse): void {
    // Validate basic structure
    if (!response.message || !response.params || !response.status) {
      this.conversationHistory.push({
        role: 'user',
        content: 'The response was missing required fields. Please provide a complete response with message, params, and status.'
      });
      throw new Error('Invalid response format: missing required fields');
    }

    // Only validate chains if status is complete
    if (response.status === 'complete') {
      const validChains = ['Ethereum', 'Solana'] as const;
      if (!response.params.fromChain || !validChains.includes(response.params.fromChain)) {
        this.conversationHistory.push({
          role: 'user',
          content: 'The source chain was invalid or missing. Please specify either Ethereum or Solana as the source chain.'
        });
        throw new Error('Invalid source chain specified');
      }
      if (!response.params.toChain || !validChains.includes(response.params.toChain)) {
        this.conversationHistory.push({
          role: 'user',
          content: 'The destination chain was invalid or missing. Please specify either Ethereum or Solana as the destination chain.'
        });
        throw new Error('Invalid destination chain specified');
      }
      if (!response.params.fromToken || !response.params.toToken) {
        this.conversationHistory.push({
          role: 'user',
          content: 'Token information was missing. Please specify both source and destination tokens.'
        });
        throw new Error('Missing token information');
      }
    }
  }
} 