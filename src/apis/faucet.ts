import axios from 'axios';
import { Address } from 'viem';

const API_URL = 'https://pyrqgkqq4j.execute-api.us-east-1.amazonaws.com/faucet'; // fast CORS fix

const faucetAxiosApi = axios.create({
  baseURL: API_URL,
});

export async function addBalance(address: Address, amount: bigint) {
  await faucetAxiosApi.post(
    `/${process.env.NEXT_PUBLIC_TENDERLY_RPC_POSTFIX}`,
    {
      address,
      amount: amount.toString(),
    },
  );
}
