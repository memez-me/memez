import { Address } from 'viem';
import { IFraxswapRouter$Type } from '../../../artifacts/contracts/interfaces/fraxswap/IFraxswapRouter.sol/IFraxswapRouter';
import IFraxswapRouterJSON from '../../../artifacts/contracts/interfaces/fraxswap/IFraxswapRouter.sol/IFraxswapRouter.json';
import { useMemo } from 'react';

const routerAddress = '0x39cd4db6460d8B5961F73E997E86DdbB7Ca4D5F6' as Address;

export const useFraxswapRouterConfig = () => {
  return useMemo(
    () =>
      ({
        address: routerAddress,
        abi: IFraxswapRouterJSON.abi as IFraxswapRouter$Type['abi'],
      }) as const,
    [],
  );
};
