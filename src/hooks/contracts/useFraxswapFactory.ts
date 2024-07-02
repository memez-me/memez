import { Address } from 'viem';
import { IFraxswapFactory$Type } from '../../../artifacts/contracts/interfaces/fraxswap/IFraxswapFactory.sol/IFraxswapFactory';
import IFraxswapFactoryJSON from '../../../artifacts/contracts/interfaces/fraxswap/IFraxswapFactory.sol/IFraxswapFactory.json';
import { useMemo } from 'react';

const factoryAddress = '0xE30521fe7f3bEB6Ad556887b50739d6C7CA667E6' as Address;

export const useFraxswapFactoryConfig = () => {
  return useMemo(
    () =>
      ({
        address: factoryAddress,
        abi: IFraxswapFactoryJSON.abi as IFraxswapFactory$Type['abi'],
      }) as const,
    [],
  );
};
