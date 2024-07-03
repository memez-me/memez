import React, { useMemo, useState } from 'react';
import SimpleTokensDropdown, { TokenInfo } from './SimpleTokensDropdown';
import TextInput from '../TextInput';
import { formatEther, parseEther, zeroAddress } from 'viem';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { useFraxswapRouterConfig } from '../../hooks';
import { PrimaryButton } from '../buttons';
import _ from 'lodash';

export type SwapInterfaceProps = {
  className?: string;
  tokens: Omit<TokenInfo, 'balance'>[];
};

const multicallGetEthBalancePartialAbi = [
  {
    type: 'function',
    name: 'getEthBalance',
    stateMutability: 'view',
    inputs: [
      {
        name: 'addr',
        type: 'address',
      },
    ],
    outputs: [
      {
        name: 'balance',
        type: 'uint256',
      },
    ],
  },
] as const;

const erc20BalanceOfPartialAbi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [
      {
        name: 'account',
        type: 'address',
      },
    ],
    outputs: [
      {
        type: 'uint256',
      },
    ],
  },
] as const;

function SwapInterface({ className, tokens }: SwapInterfaceProps) {
  const { address: userAddress } = useAccount();
  const [isExactInput, setIsExactInput] = useState(true);
  const [tokenAddressFrom, setTokenAddressFrom] = useState(tokens[0].address);
  const [tokenAddressTo, setTokenAddressTo] = useState(
    tokens[tokens.length - 1].address,
  );
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');

  const fraxswapRouterConfig = useFraxswapRouterConfig();

  const { data: balancesData } = useReadContracts({
    contracts: tokens.map(({ address }) =>
      address === zeroAddress
        ? ({
            address: '0xcA11bde05977b3631167028862bE2a173976CA11',
            abi: multicallGetEthBalancePartialAbi,
            functionName: 'getEthBalance',
            args: [userAddress],
          } as const)
        : ({
            address,
            abi: erc20BalanceOfPartialAbi,
            functionName: 'balanceOf',
            args: [userAddress],
          } as const),
    ),
    query: {
      enabled: !!userAddress,
    },
  });

  const tokensWithBalances = useMemo<TokenInfo[]>(
    () =>
      balancesData
        ? tokens.map((token, i) => ({
            ...token,
            balance: balancesData[i].result,
          }))
        : tokens,
    [tokens, balancesData],
  );

  const tokenFrom = useMemo(
    () =>
      tokensWithBalances.find(({ address }) => address === tokenAddressFrom)!,
    [tokensWithBalances, tokenAddressFrom],
  );
  const tokenTo = useMemo(
    () => tokensWithBalances.find(({ address }) => address === tokenAddressTo)!,
    [tokensWithBalances, tokenAddressTo],
  );

  // const { data, error } = useReadContract({
  //   ...fraxswapRouterConfig,
  //   functionName: 'getAmountsOut',
  //   args: [parseEther(amountFrom || '0'), [tokenAddressFrom, tokenAddressTo]],
  //   query: {
  //     enabled: !!amountFrom && Number(amountFrom) > 0,
  //   },
  // });
  //
  // console.log({
  //   data,
  //   error,
  //   amountFrom,
  //   path: [tokenAddressFrom, tokenAddressTo],
  // });

  return (
    <div className={`flex flex-col gap-x1 ${className}`}>
      <div className="relative flex flex-row items-center">
        <SimpleTokensDropdown
          className="!static shrink-0"
          buttonClassName="border-r-0 rounded-r-none pr-x1"
          dropdownClassName="z-20"
          tokens={tokensWithBalances}
          selected={tokenAddressFrom}
          onSelect={(address) => {
            setTokenAddressFrom(address);
            setTokenAddressTo((old) =>
              old === address
                ? _.find(tokens, (token) => token.address !== address)!.address
                : old,
            );
          }}
        />
        <TextInput
          className="flex-1"
          inputClassName="border-l-0 rounded-l-none pl-x1"
          value={amountFrom}
          placeholder={`0.0 ${tokenFrom.symbol}`}
          type="number"
          min={0}
          step={0.001}
          onChange={(e) => {
            setAmountFrom(
              e.target.value.toString().replaceAll(/[^0-9.,]/g, ''),
            );
            setIsExactInput(true);
            setAmountTo('');
          }}
          onMax={() => {
            setAmountFrom(formatEther(tokenFrom.balance ?? 0n));
            setIsExactInput(true);
            setAmountTo('');
          }}
        />
      </div>
      <div className="relative flex flex-row items-center">
        <SimpleTokensDropdown
          className="!static shrink-0"
          buttonClassName="border-r-0 rounded-r-none pr-x1"
          tokens={tokensWithBalances}
          selected={tokenAddressTo}
          onSelect={(address) => {
            setTokenAddressTo(address);
            setTokenAddressFrom((old) =>
              old === address
                ? _.find(tokens, (token) => token.address !== address)!.address
                : old,
            );
          }}
        />
        <TextInput
          className="flex-1"
          inputClassName="border-l-0 rounded-l-none pl-x1"
          value={amountTo}
          placeholder={`0.0 ${tokenTo.symbol}`}
          type="number"
          min={0}
          step={0.001}
          onChange={(e) => {
            setAmountTo(e.target.value.toString().replaceAll(/[^0-9.,]/g, ''));
            setIsExactInput(false);
            setAmountFrom('');
          }}
        />
      </div>
      <PrimaryButton
        className={`h-x9 ${
          !isExactInput
            ? 'bg-main-light disabled:bg-main-light disabled:bg-opacity-40 enabled:hover:bg-main-accent enabled:focus:bg-main-accent enabled:active:bg-main-light enabled:active:bg-opacity-40'
            : 'bg-second-sell disabled:bg-second-sell disabled:bg-opacity-40 enabled:hover:bg-second-error enabled:focus:bg-second-error enabled:active:bg-second-sell enabled:active:bg-opacity-40'
        }`}
        disabled={!userAddress}
        onClick={() => alert('Sorry, not implemented yet!') /*TODO*/}
      >
        {!isExactInput ? `Buy ${tokenTo.symbol}` : `Sell ${tokenFrom.symbol}`}
      </PrimaryButton>
    </div>
  );
}

export default SwapInterface;
