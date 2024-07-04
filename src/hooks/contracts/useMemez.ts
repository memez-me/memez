import { Address } from 'viem';
import { MockMEMEZ$Type } from '../../../artifacts/contracts/MockMEMEZ.sol/MockMEMEZ';
import MockMEMEZJSON from '../../../artifacts/contracts/MockMEMEZ.sol/MockMEMEZ.json';
import { useMemo } from 'react';

const memezAddress = '0x1460541B607dE6b9a376138856cC60d7D2dEb726' as Address;

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
