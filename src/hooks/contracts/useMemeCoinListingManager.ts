import { Address } from 'viem';
import { MemeCoinListingManager$Type } from '../../../artifacts/contracts/MemeCoinListingManager.sol/MemeCoinListingManager';
import MemeCoinListingManagerJSON from '../../../artifacts/contracts/MemeCoinListingManager.sol/MemeCoinListingManager.json';
import { useMemo } from 'react';

const listingManagerAddress =
  '0x84cF83ccd4A028a500632Cbb32A687Cc2aFfAAEA' as Address;

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
