import { Address } from 'viem';
import { IFraxswapPairReserves$Type } from '../../../artifacts/contracts/interfaces/fraxswap/IFraxswapPairReserves.sol/IFraxswapPairReserves';
import IFraxswapPairReservesJSON from '../../../artifacts/contracts/interfaces/fraxswap/IFraxswapPairReserves.sol/IFraxswapPairReserves.json';
import { useMemo } from 'react';

export const useFraxswapPairConfig = (pairAddress: Address) => {
  return useMemo(
    () =>
      ({
        address: pairAddress,
        abi: IFraxswapPairReservesJSON.abi as IFraxswapPairReserves$Type['abi'],
      }) as const,
    [pairAddress],
  );
};
