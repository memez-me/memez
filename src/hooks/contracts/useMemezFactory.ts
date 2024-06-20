import { Address } from 'viem';
import { MemezFactory$Type } from '../../../artifacts/contracts/MemezFactory.sol/MemezFactory';
import MemezFactoryJSON from '../../../artifacts/contracts/MemezFactory.sol/MemezFactory.json';

const factoryAddress = '0x629cB34AD792Cc43e4b156E4ca537edcea13190b' as Address;

export const useMemezFactoryConfig = () => {
  return {
    address: factoryAddress,
    abi: MemezFactoryJSON.abi as MemezFactory$Type['abi'],
  } as const;
};
