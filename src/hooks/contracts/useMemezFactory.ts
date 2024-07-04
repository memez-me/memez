import { Address } from 'viem';
import { MemezFactory$Type } from '../../../artifacts/contracts/MemezFactory.sol/MemezFactory';
import MemezFactoryJSON from '../../../artifacts/contracts/MemezFactory.sol/MemezFactory.json';
import { useMemo } from 'react';

const factoryAddress = '0x42e093CE88e62B0426eF6B381Dc54038CD598c4D' as Address;

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
