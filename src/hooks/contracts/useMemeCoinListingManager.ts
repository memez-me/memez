import { Address } from 'viem';
import { MemeCoinListingManager$Type } from '../../../artifacts/contracts/MemeCoinListingManager.sol/MemeCoinListingManager';
import MemeCoinListingManagerJSON from '../../../artifacts/contracts/MemeCoinListingManager.sol/MemeCoinListingManager.json';
import { useMemo } from 'react';

const listingManagerAddress =
  '0x0A0b696Da96B52dCa9a85bb38074602d496966aC' as Address;

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
