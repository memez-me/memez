import { MemezFactory$Type } from '../../../artifacts/contracts/MemezFactory.sol/MemezFactory';
import MemezFactoryJSON from '../../../artifacts/contracts/MemezFactory.sol/MemezFactory.json';
import { useMemo } from 'react';
import { ADDRESSES } from '../../constants';

const factoryAddress = ADDRESSES.MEMEZ_FACTORY;

export const useMemezFactoryConfig = () => {
  return useMemo(
    () =>
      ({
        address: factoryAddress,
        abi: MemezFactoryJSON.abi as MemezFactory$Type['abi'],
      }) as const,
    [],
  );
};
