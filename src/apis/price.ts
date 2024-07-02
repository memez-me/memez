import axios from 'axios';

const API_URL = 'https://api.coingecko.com/api/v3/simple/price';

const priceAxiosApi = axios.create({
  baseURL: API_URL,
});

export async function getPrice<
  TCoin extends readonly string[],
  TCurrency extends readonly string[],
>(coins: TCoin, currencies: TCurrency) {
  const res = await priceAxiosApi.get<
    Record<TCoin[number], Record<TCurrency[number], number>>
  >(`?ids=${coins.join(',')}&vs_currencies=${currencies.join(',')}`);
  return res?.data ?? {};
}

export async function getEthPriceInUsd() {
  const result = await getPrice(['ethereum'] as const, ['usd'] as const);
  return result.ethereum.usd;
}
