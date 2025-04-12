import React, { useState, useEffect } from 'react';
import WormholeApp from './WormholeApp';
import { getBestLiquidStaking } from '../services/staking-rewards';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  widget?: {
    fromChain: "Ethereum" | "Solana";
    toChain: "Ethereum" | "Solana";
    fromToken: string;
    toToken: string;
    amount?: number;
  };
  stakingData?: any; // Will hold staking rewards data
}

function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // If user asks about staking
      if (input.toLowerCase().includes('staking')) {
        const stakingData = await getBestLiquidStaking(5); // Get top 3 options
        
        const response: Message = {
          role: 'assistant',
          content: 'Here are the best liquid staking options:',
          stakingData: stakingData.data.rewardOptions
        };
        
        setMessages(prev => [...prev, response]);
      } else {
        // Existing widget logic
        const mockResponse: Message = {
          role: 'assistant',
          content: 'I can help you transfer tokens.',
          widget: {
            fromChain: 'Ethereum',
            toChain: 'Solana',
            fromToken: 'ETH',
            toToken: 'WETH',
            amount: 0.1
          }
        };
        setMessages(prev => [...prev, mockResponse]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.'
      }]);
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
            ':hover': {
              transform: 'translateY(-2px)',
              background: '#3a3a3a'
            }
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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        height: '500px', 
        overflowY: 'auto',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        {messages.map((message, index) => (
          <div key={index} style={{ 
            marginBottom: '20px',
            textAlign: message.role === 'user' ? 'right' : 'left' 
          }}>
            <div style={{
              background: message.role === 'user' ? '#2b5876' : '#333',
              padding: '10px 15px',
              borderRadius: '10px',
              display: 'inline-block',
              maxWidth: '70%'
            }}>
              {message.content}
            </div>
            {message.widget && (
              <div style={{ marginTop: '10px' }}>
                <WormholeApp {...message.widget} />
              </div>
            )}
            {message.stakingData && renderStakingData(message.stakingData)}
          </div>
        ))}
        {isLoading && <div>Loading...</div>}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
  );
}

export default Chat;