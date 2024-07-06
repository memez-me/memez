import { MemeCoinListingManager$Type } from '../../../artifacts/contracts/MemeCoinListingManager.sol/MemeCoinListingManager';
import MemeCoinListingManagerJSON from '../../../artifacts/contracts/MemeCoinListingManager.sol/MemeCoinListingManager.json';
import { useMemo } from 'react';
import { ADDRESSES } from '../../constants';

const listingManagerAddress = ADDRESSES.LISTING_MANAGER;

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
