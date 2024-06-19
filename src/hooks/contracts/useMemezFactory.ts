import { Address } from 'viem';
import { MemezFactory$Type } from '../../../artifacts/contracts/MemezFactory.sol/MemezFactory';
import MemezFactoryJSON from '../../../artifacts/contracts/MemezFactory.sol/MemezFactory.json';

const factoryAddress = '0xE2D86305cBaC188A33D25F47e434BeB8c39817E3' as Address;

export const useMemezFactoryConfig = () => {
  return {
    address: factoryAddress,
    abi: MemezFactoryJSON.abi as MemezFactory$Type['abi'],
  } as const;
};
