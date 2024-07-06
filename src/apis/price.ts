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

const cacheTimeMs = 10 * 60 * 1000; // 10 minutes

let cachedEthUsdPrice: {
  price: number;
  timestamp: number;
};

export async function getEthPriceInUsd() {
  if (
    !cachedEthUsdPrice ||
    cachedEthUsdPrice.timestamp + cacheTimeMs <= Date.now()
  ) {
    const result = await getPrice(['ethereum'] as const, ['usd'] as const);
    cachedEthUsdPrice = {
      price: result.ethereum.usd,
      timestamp: Date.now(),
    };
  }

  return cachedEthUsdPrice.price;
}
