import { Address } from 'viem';
import { MemezFactory$Type } from '../../../artifacts/contracts/MemezFactory.sol/MemezFactory';
import MemezFactoryJSON from '../../../artifacts/contracts/MemezFactory.sol/MemezFactory.json';

const factoryAddress = '0x4Bbe3E1dBFe8bFC9e62F996D1167847e5428732b' as Address;

export const useMemezFactoryConfig = () => {
  return {
    address: factoryAddress,
    abi: MemezFactoryJSON.abi as MemezFactory$Type['abi'],
  } as const;
};
