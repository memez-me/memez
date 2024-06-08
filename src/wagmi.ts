import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { fraxtal, fraxtalTestnet } from 'wagmi/chains';

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) throw new Error('Project ID is not defined');

const metadata = {
  name: 'memez',
  description: 'memez memecoins app',
  url: 'https://qwadratic.github.io/memez',
  icons: ['https://qwadratic.github.io/memez/icon.png'],
};

// Create wagmiConfig
const chains = [fraxtal, fraxtalTestnet] as const;
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  enableEmail: true,
});
