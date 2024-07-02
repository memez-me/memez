import { Address } from 'viem';
import { MemeCoinListingManager$Type } from '../../../artifacts/contracts/MemeCoinListingManager.sol/MemeCoinListingManager';
import MemeCoinListingManagerJSON from '../../../artifacts/contracts/MemeCoinListingManager.sol/MemeCoinListingManager.json';
import { useMemo } from 'react';

const listingManagerAddress =
  '0x7B6206d4c0EC24BEb409Cb65A7425a18fDA3089f' as Address;

export const useMemeCoinListingManagerConfig = () => {
  return useMemo(
    () =>
      ({
        address: listingManagerAddress,
        abi: MemeCoinListingManagerJSON.abi as MemeCoinListingManager$Type['abi'],
      }) as const,
    [],
  );
};
