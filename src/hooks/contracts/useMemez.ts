import { MockMEMEZ$Type } from '../../../artifacts/contracts/MockMEMEZ.sol/MockMEMEZ';
import MockMEMEZJSON from '../../../artifacts/contracts/MockMEMEZ.sol/MockMEMEZ.json';
import { useMemo } from 'react';
import { ADDRESSES } from '../../constants';

const memezAddress = ADDRESSES.MEMEZ;

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
