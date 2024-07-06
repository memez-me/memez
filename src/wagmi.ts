import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { fraxtal } from 'wagmi/chains';
import { ADDRESSES } from './constants';

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) throw new Error('Project ID is not defined');

const metadata = {
  name: 'memez',
  description: 'memez memecoins app',
  url: 'https://memez.me',
  icons: ['https://memez.me/icon.svg'],
};

const fraxtalVirtual = {
  id: 252,
  name: 'Fraxtal Virtual TestNet',
  nativeCurrency: { name: 'Frax Ether', symbol: 'frxETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://virtual.fraxtal.rpc.tenderly.co/e3156da7-ba03-40d3-b8cb-d8da12a27239',
      ],
    },
  },

  contracts: {
    multicall3: {
      address: ADDRESSES.MULTICALL3,
    },
  },
} as any as typeof fraxtal;

const chains = [
  process.env.NEXT_PUBLIC_GIT_BRANCH === 'main' ? fraxtal : fraxtalVirtual,
] as const;

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  enableEmail: true,
});
