import { Address } from 'viem';
import { MockMEMEZ$Type } from '../../../artifacts/contracts/MockMEMEZ.sol/MockMEMEZ';
import MockMEMEZJSON from '../../../artifacts/contracts/MockMEMEZ.sol/MockMEMEZ.json';
import { useMemo } from 'react';

const memezAddress = '0xfE10E7DA183900Df7F6dd235E0Bc1567EA7a3490' as Address;

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
