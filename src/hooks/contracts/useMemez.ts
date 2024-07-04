import { Address } from 'viem';
import { MockMEMEZ$Type } from '../../../artifacts/contracts/MockMEMEZ.sol/MockMEMEZ';
import MockMEMEZJSON from '../../../artifacts/contracts/MockMEMEZ.sol/MockMEMEZ.json';
import { useMemo } from 'react';

const memezAddress = '0x8B130cB448c15Ec8a88E85869EfB428f56748471' as Address;

export const useMemezConfig = () => {
  return useMemo(
    () =>
      ({
        address: memezAddress,
        abi: MockMEMEZJSON.abi as MockMEMEZ$Type['abi'],
      }) as const,
    [],
  );
};
