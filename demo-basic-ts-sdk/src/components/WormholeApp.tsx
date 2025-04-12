import React from 'react';
import WormholeConnect, {
  WormholeConnectConfig,
} from '@wormhole-foundation/wormhole-connect';

type ChainName = "Ethereum" | "Solana" | "Terra" | "Bsc" | "Polygon" | "Avalanche" | "Oasis" | "Algorand" | "Aurora" | "Fantom" | "Karura" | "Acala" | "Klaytn" | "Celo" | "Near" | "Moonbeam" | "Neon";

interface WormholeAppProps {
  fromChain?: ChainName;
  toChain?: ChainName;
  fromToken?: string;
  toToken?: string;
  amount?: number;
}

function WormholeApp({ 
  fromChain = 'Ethereum',
  toChain = 'Solana',
  fromToken = 'WETH',
  toToken = 'WETH',
  amount,
}: WormholeAppProps) {
  const config: WormholeConnectConfig = {
    network: 'Mainnet',
    chains: ['Ethereum', 'Solana'],
    tokens: ['ETH', 'WETH', 'USDC'],

    ui: {
      defaultInputs: {
        fromChain,
        toChain,
        fromToken,
        toToken,
      },
    },
  };

  return (
    <div style={{ height: '600px', padding: '20px' }}>
      <WormholeConnect config={config} />
    </div>
  );
}

export default WormholeApp; 