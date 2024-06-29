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
      url: 'https://virtual.fraxtal.rpc.tenderly.co/2f735ee1-a1a0-4d37-bba6-9c855264c462',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : undefined,
    },
  },
  ignition: {
    requiredConfirmations: 1,
  },
};

export default config;
