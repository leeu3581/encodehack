import React, { useState, useEffect } from 'react';
import WormholeApp from './WormholeApp';
import { getBestLiquidStaking } from '../services/staking-rewards';
import { ChatOpenAI } from '@langchain/openai';
import { AgentManager } from '../agents/manager/AgentManager';
import { BridgeTransferAgent } from '../agents/bridge/BridgeTransferAgent';
import { StakeAgent } from '../agents/stake/StakeAgent';
import { WrapAgent, LogMessage } from '../agents/wrap/WrapAgent';
import { MayanFastAgent } from '../agents/mayanfast/MayanFastAgent';
import { SummaryAgent } from '../agents/summary/SummaryAgent';

interface AgentStep {
  step: string;
  context: string;
}

interface AgentResponse {
  message: string;
  steps: AgentStep[];
  intent?: string;
}

interface ChatElement {
  type: 'message' | 'header' | 'step-indicator';
  content: string;
  role?: 'user' | 'assistant';
  widget?: {
    fromChain: "Ethereum" | "Solana";
    toChain: "Ethereum" | "Solana";
    fromToken: string;
    toToken: string;
    amount?: number;
  };
  stakingData?: any;
  isThinking?: boolean;
}

// Fix the ImportMeta type error by adding type declaration
declare global {
  interface ImportMeta {
    env: {
      VITE_OPENAI_API_KEY: string;
    };
  }
}

function Chat() {
  const [chatElements, setChatElements] = useState<ChatElement[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentHandler, setCurrentHandler] = useState<React.FormEventHandler | null>(null);
  const [logs, setLogs] = useState<LogMessage[]>([]);

  // Add ref for current input
  const inputRef = React.useRef('');

  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const llm = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.5,
    maxTokens: 1000,
    maxRetries: 3,
    apiKey: openaiApiKey
  });

  const managerAgent = new AgentManager(llm);
  const summaryAgent = new SummaryAgent(llm);
  const bridgeTransferAgent = new BridgeTransferAgent(llm);
  const stakeAgent = new StakeAgent(llm);
  const wrapTokenAgent = new WrapAgent(llm);
  const mayanFastAgent = new MayanFastAgent(llm);

  const addChatElement = (element: ChatElement) => {
    setChatElements(prev => [...prev, element]);
  };

  // Update ref when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    inputRef.current = e.target.value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    addChatElement({
      type: 'message',
      role: 'user',
      content: input
    });
    setInput('');
    setIsLoading(true);


    try {
      // Create agent instance and process query
   

      const aiResponse = await managerAgent.processQuery(input);
      
      const agentResponse: AgentResponse = JSON.parse(aiResponse.content);
      
      // Add understanding message
      if (agentResponse.intent) {
        addChatElement({
          type: 'header',
          content: `🤔 Understanding: ${agentResponse.intent}`
        });
      }
      
      // Add initial response
      addChatElement({
        type: 'message',
        role: 'assistant',
        content: agentResponse.message
      });

      // Add plan overview
      if (agentResponse.steps.length > 0) {
        addChatElement({
          type: 'header',
          content: `📋 Plan Overview`
        });
        
        agentResponse.steps.forEach((step, index) => {
          addChatElement({
            type: 'step-indicator',
            content: `Step ${index + 1}: ${step.step}`
          });
        });
      }

      // Process each step
      for (const [index, step] of agentResponse.steps.entries()) {
        // Add step header
        
        addChatElement({
          type: 'header',
          content: `Step ${index + 1}: ${step.step}`
        });

        switch (step.step) {
          case 'bridge_transfer_agent':
            let bridgeComplete = false;
            let bridgeContext = step.context;

            while (!bridgeComplete) {
              const bridgeResponse = await bridgeTransferAgent.processQuery(bridgeContext);
              
              if (bridgeResponse.status === 'complete') {
                bridgeComplete = true;
                addChatElement({
                  type: 'message',
                  role: 'assistant',
                  content: bridgeResponse.message,
                  widget: bridgeResponse.widget
                });
              } else {
                addChatElement({
                  type: 'message',
                  role: 'assistant',
                  content: bridgeResponse.message,
                });
                // Wait for user input
                const userInput = await new Promise<string>((resolve) => {
                  const handleUserResponse = (e: React.FormEvent) => {
                    if (e) e.preventDefault();
                    const currentValue = inputRef.current;
                    setInput('');
                    inputRef.current = '';
                    setCurrentHandler(null);
                    resolve(currentValue);
                  };
                  setCurrentHandler(() => handleUserResponse);
                });

                // Add user's response to chat
                addChatElement({
                  type: 'message',
                  role: 'user',
                  content: userInput
                });

                // Append new input to existing context
                bridgeContext = `${bridgeContext}\nUser: ${userInput}`;
              }
            }
            break;

          case 'stake_agent':
            let stakeComplete = false;
            let stakeContext = step.context;

            while (!stakeComplete) {
              const stakeResponse = await stakeAgent.processQuery(stakeContext);
              
              if (stakeResponse.status === 'complete') {
                stakeComplete = true;
                // Get and filter staking options based on the parameters
                const stakingData = await getBestLiquidStaking({
                  symbols: stakeResponse.stakingData?.token ? [stakeResponse.stakingData.token] : undefined,
                  typeKeys: stakeResponse.stakingData?.provider ? [stakeResponse.stakingData.provider] : undefined,
                  limit: 15
                });

                const summary = await summaryAgent.processQuery(stakeResponse.message)

                addChatElement({
                  type: 'message',
                  role: 'assistant',
                  content: summary,
                  stakingData: stakingData.data.rewardOptions
                });
              } else {
                const summary = await summaryAgent.processQuery(stakeResponse.message)
                addChatElement({
                  type: 'message',
                  role: 'assistant',
                  content: summary,
                });
                // Wait for user input
                const userInput = await new Promise<string>((resolve) => {
                  const handleUserResponse = (e: React.FormEvent) => {
                    if (e) e.preventDefault();
                    const currentValue = inputRef.current;
                    setInput('');
                    inputRef.current = '';
                    setCurrentHandler(null);
                    resolve(currentValue);
                  };
                  setCurrentHandler(() => handleUserResponse);
                });

                // Add user's response to chat
                addChatElement({
                  type: 'message',
                  role: 'user',
                  content: userInput
                });

                // Append new input to existing context
                stakeContext = `${stakeContext}\nUser: ${userInput}`;
              }
            }
            break;

          case 'wrap_token_agent':
            let wrapComplete = false;
            let wrapContext = step.context;

            while (!wrapComplete) {
              const wrapResponse = await wrapTokenAgent.processQuery(wrapContext);
              if (wrapResponse.status === 'complete') {
                wrapComplete = true;
                const summary = await summaryAgent.processQuery(wrapResponse.message)
                addChatElement({
                  type: 'message',
                  role: 'assistant',
                  content: summary
                });
              } else {
                const summary = await summaryAgent.processQuery(wrapResponse.message)
                addChatElement({
                  type: 'message',
                  role: 'assistant',
                  content: summary
                });
                // Wait for user input
                const userInput = await new Promise<string>((resolve) => {
                  const handleUserResponse = (e: React.FormEvent) => {
                    if (e) e.preventDefault();
                    const currentValue = inputRef.current;
                    setInput('');
                    inputRef.current = '';
                    setCurrentHandler(null);
                    resolve(currentValue);
                  };
                  setCurrentHandler(() => handleUserResponse);
                });

                // Add user's response to chat
                addChatElement({
                  type: 'message',
                  role: 'user',
                  content: userInput
                });

                // Append new input to existing context
                wrapContext = `${wrapContext}\nUser: ${userInput}`;
              }
            }
            break;

          case 'mayan_fast_agent':
            let mayanComplete = false;
            let mayanContext = step.context;

            while (!mayanComplete) {
              const mayanResponse = await mayanFastAgent.processTransfer(mayanContext);
              
              if (mayanResponse.status === 'complete') {
                mayanComplete = true;
                const summary = await summaryAgent.processQuery(mayanResponse.message)
                addChatElement({
                  type: 'message',
                  role: 'assistant',
                  content: summary,
                });
              } else {
                const summary = await summaryAgent.processQuery(mayanResponse.message)
                addChatElement({
                  type: 'message',
                  role: 'assistant',
                  content: summary
                });
                
                const userInput = await new Promise<string>((resolve) => {
                  const handleUserResponse = (e: React.FormEvent) => {
                    if (e) e.preventDefault();
                    const currentValue = inputRef.current;
                    setInput('');
                    inputRef.current = '';
                    setCurrentHandler(null);
                    resolve(currentValue);
                  };
                  setCurrentHandler(() => handleUserResponse);
                });

                addChatElement({
                  type: 'message',
                  role: 'user',
                  content: userInput
                });

                mayanContext = `${mayanContext}\nUser: ${userInput}`;
              }
            }
            break;

          default:
            console.log(`Unknown agent step: ${step.step}`);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      addChatElement({
        type: 'message',
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.'
      });
    }

    setIsLoading(false);
  };

  const handleStakingOptionClick = async (option: any) => {
    const assetName = option.outputAssets[0]?.symbol || '';
    const platform = option.providers[0]?.name || '';
    const message = `I want to stake ${assetName} on ${platform}`;
    
    // Set input and trigger submit
    setInput(message);
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent);
  };

  const renderStakingData = (data: any[]) => (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '15px',
      background: '#1a1a1a', 
      padding: '15px',
      borderRadius: '8px',
      marginTop: '10px'
    }}>
      {data.map((option, index) => (
        <div 
          key={index} 
          onClick={() => handleStakingOptionClick(option)}
          style={{ 
            background: '#2a2a2a',
            borderRadius: '12px',
            padding: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'transform 0.2s, background 0.2s',
          }}
        >
          <img 
            src={option.outputAssets[0]?.logoUrl} 
            alt={option.outputAssets[0]?.symbol}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%'
            }}
          />
          <div>
            <h4 style={{ 
              margin: '0 0 4px 0',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              {option.outputAssets[0]?.name} ({option.outputAssets[0]?.symbol})
            </h4>
            <p style={{ 
              margin: '0',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#4CAF50'
            }}>
              {option.metrics.find((m: any) => m.metricKey === 'reward_rate')?.defaultValue.toFixed(2)}%
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderChatElement = (element: ChatElement, index: number) => {
    switch (element.type) {
      case 'header':
        return (
          <div key={index} style={{
            padding: '10px 15px',
            margin: '10px 0',
            color: '#888',
            borderBottom: '1px solid #333',
            fontSize: '0.9em',
            fontWeight: 'bold'
          }}>
            {element.content}
          </div>
        );

      case 'step-indicator':
        return (
          <div key={index} style={{
            padding: '5px 15px',
            color: '#666',
            fontSize: '0.8em',
            marginLeft: '20px'
          }}>
            {element.content}
          </div>
        );

      case 'message':
        return (
          <div key={index} style={{ 
            marginBottom: '20px',
            textAlign: element.role === 'user' ? 'right' : 'left' 
          }}>
            <div style={{
              background: element.role === 'user' ? '#2b5876' : '#333',
              padding: '10px 15px',
              borderRadius: '10px',
              display: 'inline-block',
              maxWidth: '70%'
            }}>
              {element.content}
            </div>
            {element.widget && (
              <div style={{ marginTop: '10px' }}>
                <WormholeApp {...element.widget} />
              </div>
            )}
            {element.stakingData && renderStakingData(element.stakingData)}
          </div>
        );
    }
  };

  useEffect(() => {
    const logHandler = (log: LogMessage) => {
      setLogs(prev => [...prev, log]);
    };

    WrapAgent.logEmitter.on('log', logHandler);
    MayanFastAgent.logEmitter.on('log', logHandler);

    return () => {
      // Clean up both listeners
      WrapAgent.logEmitter.off('log', logHandler);
      MayanFastAgent.logEmitter.off('log', logHandler);
    };
  }, []);

  const renderLogPanel = () => {
    return (
      <div style={{
        width: '400px',
        height: '100vh',
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '15px',
        overflowY: 'auto',
        marginLeft: '20px',
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#fff' }}>Transaction Logs</h3>
        {logs.map((log, index) => (
          <div key={index} style={{
            padding: '8px',
            marginBottom: '8px',
            borderRadius: '4px',
            background: '#2a2a2a',
            borderLeft: `4px solid ${
              log.type === 'error' ? '#ff4444' :
              log.type === 'success' ? '#4CAF50' : '#2196F3'
            }`
          }}>
            <div style={{ fontSize: '0.8em', color: '#666' }}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </div>
            <div style={{ color: '#fff' }}>{log.message}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'flex',
      padding: '20px',
      height: '100vh',
      gap: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
      }}>
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          {chatElements.map((element, index) => renderChatElement(element, index))}
          {isLoading && <div>Loading...</div>}
        </div>

        <form onSubmit={currentHandler || handleSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #333',
              background: '#1a1a1a',
              color: 'white'
            }}
          />
          <button 
            type="submit"
            style={{
              padding: '10px 20px',
              borderRadius: '5px',
              border: 'none',
              background: '#2b5876',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Send
          </button>
        </form>
      </div>
      {renderLogPanel()}
    </div>
  );
}

export default Chat;