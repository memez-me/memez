import axios from 'axios';
import { Address } from 'viem';

const API_URL = 'https://pyrqgkqq4j.execute-api.us-east-1.amazonaws.com/faucet';

const faucetAxiosApi = axios.create({
  baseURL: API_URL,
});

export async function addBalance(address: Address, amount: bigint) {
  if (process.env.NEXT_PUBLIC_GIT_BRANCH === 'main')
    throw new Error('No faucet available for mainnet!');
  await faucetAxiosApi.post('/', {
    address,
    amount: amount.toString(),
  });
}
