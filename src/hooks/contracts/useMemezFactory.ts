import { Address } from 'viem';
import { MemezFactory$Type } from '../../../artifacts/contracts/MemezFactory.sol/MemezFactory';
import MemezFactoryJSON from '../../../artifacts/contracts/MemezFactory.sol/MemezFactory.json';
import { useMemo } from 'react';

const factoryAddress = '0xB9FC95Dc0E6465788a17e545f7fd175b2805b6f7' as Address;

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
