import { Address } from 'viem';
import { MemezFactory$Type } from '../../../artifacts/contracts/MemezFactory.sol/MemezFactory';
import MemezFactoryJSON from '../../../artifacts/contracts/MemezFactory.sol/MemezFactory.json';

//const factoryAddress = process.env.NEXT_PUBLIC_MEMEZ_FACTORY_ADDRESS as Address;
const factoryAddress = '0x0a0b696da96b52dca9a85bb38074602d496966ac' as Address;

export const useMemezFactoryConfig = () => {
  return {
    address: factoryAddress,
    abi: MemezFactoryJSON.abi as MemezFactory$Type['abi'],
  } as const;
};
