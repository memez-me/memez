import { Address } from 'viem';
import { MemezFactory$Type } from '../../../artifacts/contracts/MemezFactory.sol/MemezFactory';
import MemezFactoryJSON from '../../../artifacts/contracts/MemezFactory.sol/MemezFactory.json';
import { useMemo } from 'react';

const factoryAddress = '0x4Cb7b915F150dC0AF306B9a01cA0401FF91be087' as Address;

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
