import { Address } from 'viem';
import { MemeCoin$Type } from '../../../artifacts/contracts/MemeCoin.sol/MemeCoin';
import MemeCoinJSON from '../../../artifacts/contracts/MemeCoin.sol/MemeCoin.json';
import { useMemo } from 'react';

export const useMemeCoinConfig = (coinAddress: Address) => {
  return useMemo(
    () =>
      ({
        address: coinAddress,
        abi: MemeCoinJSON.abi as MemeCoin$Type['abi'],
      }) as const,
    [coinAddress],
  );
};
