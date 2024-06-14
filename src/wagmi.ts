import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { fraxtal, fraxtalTestnet, hardhat } from 'wagmi/chains';

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) throw new Error('Project ID is not defined');

const metadata = {
  name: 'memez',
  description: 'memez memecoins app',
  url: 'https://memez.me',
  icons: ['https://memez.me/icon.png'],
};

const fraxtalVirtual = {
  id: 252,
  name: 'Fraxtal',
  nativeCurrency: { name: 'Frax Ether', symbol: 'frxETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://virtual.fraxtal.rpc.tenderly.co/2f735ee1-a1a0-4d37-bba6-9c855264c462',
      ],
    },
  },

  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
    },
  },
} as any as typeof fraxtal;

const chains = [
  //fraxtal,
  fraxtalVirtual,
  ...(process.env.NODE_ENV === 'development' ? [fraxtalTestnet, hardhat] : []),
] as const;

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  enableEmail: true,
});
