import * as dotenv from 'dotenv';
import type { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox-viem';
import 'hardhat-chai-matchers-viem';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.24',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000000,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: 'https://rpc.frax.com',
      },
    },
    fraxtal: {
      url: 'https://rpc.mainnet.frax.com/',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : undefined,
    },
  },
  ignition: {
    requiredConfirmations: 1,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY,
    customChains: [
      {
        network: 'fraxtal',
        chainId: 252,
        urls: {
          apiURL: 'https://api.fraxscan.com/api',
          browserURL: 'https://fraxscan.com',
        },
      },
    ],
  },
};

export default config;
