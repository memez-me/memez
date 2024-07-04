import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { fraxtal, fraxtalTestnet, hardhat } from 'wagmi/chains';

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) throw new Error('Project ID is not defined');

const metadata = {
  name: 'memez',
  description: 'memez memecoins app',
  url: 'https://memez.me',
  icons: ['https://memez.me/icon.svg'],
};

const chains = [
  fraxtal,
  ...(process.env.NODE_ENV === 'development' ? [fraxtalTestnet, hardhat] : []),
] as const;

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  enableEmail: true,
});
