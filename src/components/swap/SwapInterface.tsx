import React, { useCallback, useMemo, useState } from 'react';
import SimpleTokensDropdown, { TokenInfo } from './SimpleTokensDropdown';
import TextInput from '../TextInput';
import {
  ContractFunctionExecutionError,
  erc20Abi,
  formatEther,
  Hex,
  parseEther,
  zeroAddress,
} from 'viem';
import {
  useAccount,
  useConfig,
  useReadContracts,
  useWriteContract,
} from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import {
  useFraxswapFactoryConfig,
  useFraxswapPairConfig,
  useFraxswapRouterConfig,
} from '../../hooks';
import { PrimaryButton } from '../buttons';
import _ from 'lodash';
import { VirtualFraxswapRouter } from '../../utils';
import { ADDRESSES } from '../../constants';

export type SwapInterfaceProps = {
  className?: string;
  tokens: Omit<TokenInfo, 'balance'>[];
};

const wethAddress = ADDRESSES.WETH;

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

function SwapInterface({ className, tokens }: SwapInterfaceProps) {
  const config = useConfig();
  const { address: userAddress } = useAccount();
  const [isExactInput, setIsExactInput] = useState(true);
  const [tokenAddressFrom, setTokenAddressFrom] = useState(tokens[0].address);
  const [tokenAddressTo, setTokenAddressTo] = useState(
    tokens[tokens.length - 1].address,
  );
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isIncreasingAllowance, setIsIncreasingAllowance] = useState(false);

  const fraxswapRouterConfig = useFraxswapRouterConfig();
  const fraxswapFactoryConfig = useFraxswapFactoryConfig();
  const fraxswapPairConfig = useFraxswapPairConfig(zeroAddress); // address will be overridden

  const {
    data: balancesAndApprovalsData,
    refetch: refetchBalancesAndApprovals,
  } = useReadContracts({
    contracts: tokens.flatMap(({ address }) => [
      address === zeroAddress
        ? ({
            address: ADDRESSES.MULTICALL3,
            abi: multicallGetEthBalancePartialAbi,
            functionName: 'getEthBalance',
            args: [userAddress],
          } as const)
        : ({
            address,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [userAddress],
          } as const),
      address === zeroAddress
        ? ({
            address: ADDRESSES.MULTICALL3,
            abi: multicallGetEthBalancePartialAbi,
            functionName: 'getEthBalance',
            args: [userAddress],
          } as const)
        : ({
            address,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [userAddress, fraxswapRouterConfig.address],
          } as const),
    ]),
    query: {
      enabled: !!userAddress,
    },
  });

  const tokensWithBalances = useMemo<(TokenInfo & { allowance?: bigint })[]>(
    () =>
      balancesAndApprovalsData
        ? tokens.map((token, i) => ({
            ...token,
            balance: balancesAndApprovalsData[2 * i].result,
            allowance: balancesAndApprovalsData[2 * i + 1].result,
          }))
        : tokens,
    [tokens, balancesAndApprovalsData],
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

  const pairsTokensAddresses = useMemo(
    () =>
      tokens
        .slice(0, -1)
        .flatMap((tokenA, i) =>
          tokens
            .slice(i + 1)
            .map(
              (tokenB) =>
                [
                  tokenA.address === zeroAddress ? wethAddress : tokenA.address,
                  tokenB.address === zeroAddress ? wethAddress : tokenB.address,
                ] as const,
            ),
        ),
    [tokens],
  );

  const { data: pairsAddressesData } = useReadContracts({
    contracts: pairsTokensAddresses.map(
      (args) =>
        ({
          ...fraxswapFactoryConfig,
          functionName: 'getPair',
          args,
        }) as const,
    ),
  });

  const poolsAddresses = useMemo(
    () => pairsAddressesData?.map(({ result }) => result) ?? [],
    [pairsAddressesData],
  );

  const { data: pairReservesAndFeesData, refetch: refetchPools } =
    useReadContracts({
      contracts:
        poolsAddresses.flatMap(
          (address) =>
            [
              {
                ...fraxswapPairConfig,
                address,
                functionName: 'getReserves',
              } as const,
              {
                ...fraxswapPairConfig,
                address,
                functionName: 'fee',
              } as const,
            ] as const,
        ) ?? [],
      query: {
        enabled: !!pairsAddressesData,
        refetchInterval: 5000,
      },
    });

  const poolsInfo = useMemo(
    () =>
      pairReservesAndFeesData
        ? _.chunk(pairReservesAndFeesData, 2).map(
            ([{ result: reserves }, { result: fee }], i) => ({
              reserve0: (reserves as bigint[])?.[0] ?? 0n,
              reserve1: (reserves as bigint[])?.[1] ?? 0n,
              fee: (fee as bigint) ?? 9970n,
              token0:
                BigInt(pairsTokensAddresses[i][0]) <
                BigInt(pairsTokensAddresses[i][1])
                  ? pairsTokensAddresses[i][0]
                  : pairsTokensAddresses[i][1],
            }),
          )
        : [],
    [pairReservesAndFeesData, pairsTokensAddresses],
  );

  const selectedPairInfo = useMemo(
    () =>
      poolsInfo[
        pairsTokensAddresses.findIndex(([token0, token1]) => {
          const addressFrom =
            tokenAddressFrom === zeroAddress ? wethAddress : tokenAddressFrom;
          const addressTo =
            tokenAddressTo === zeroAddress ? wethAddress : tokenAddressTo;
          return (
            (token0 === addressFrom && token1 === addressTo) ||
            (token1 === addressFrom && token0 === addressTo)
          );
        })
      ]!,
    [poolsInfo, tokenAddressFrom, tokenAddressTo, pairsTokensAddresses],
  );

  const tokenFromAmount = useMemo(
    () =>
      isExactInput
        ? amountFrom
        : amountTo
          ? formatEther(
              (VirtualFraxswapRouter.getAmountIn(
                selectedPairInfo.reserve0,
                selectedPairInfo.reserve1,
                selectedPairInfo.token0,
                selectedPairInfo.fee,
                parseEther(amountTo),
                tokenAddressTo === zeroAddress ? wethAddress : tokenAddressTo,
              ) *
                101n) /
                100n, // 1% slippage
            )
          : '',
    [isExactInput, amountFrom, amountTo, selectedPairInfo, tokenAddressTo],
  );

  const tokenToAmount = useMemo(
    () =>
      !isExactInput
        ? amountTo
        : amountFrom
          ? formatEther(
              (VirtualFraxswapRouter.getAmountOut(
                selectedPairInfo.reserve0,
                selectedPairInfo.reserve1,
                selectedPairInfo.token0,
                selectedPairInfo.fee,
                parseEther(amountFrom),
                tokenAddressFrom === zeroAddress
                  ? wethAddress
                  : tokenAddressFrom,
              ) *
                99n) /
                100n, // 1% slippage
            )
          : '',
    [isExactInput, amountTo, amountFrom, selectedPairInfo, tokenAddressFrom],
  );

  const isApprovalNeeded = useMemo(
    () =>
      tokenFrom.address !== zeroAddress &&
      (tokenFrom.allowance ?? 0n) < parseEther(tokenToAmount || '0'),
    [tokenFrom.address, tokenFrom.allowance, tokenToAmount],
  );

  const { writeContractAsync } = useWriteContract();

  const approve = useCallback(async () => {
    setIsIncreasingAllowance(true);
    try {
      const hash = await writeContractAsync({
        abi: erc20Abi,
        address: tokenFrom.address,
        functionName: 'approve',
        args: [fraxswapRouterConfig.address, parseEther(tokenFromAmount)],
      } as const);

      const transactionReceipt = await waitForTransactionReceipt(config, {
        hash,
        confirmations: 1,
      });

      console.log(transactionReceipt);
    } catch (e) {
      console.error(e);
      if (e instanceof ContractFunctionExecutionError) {
        alert(e.shortMessage);
      }
    } finally {
      await Promise.all([
        refetchBalancesAndApprovals(),
        refetchPools(),
      ]).finally(() => setIsIncreasingAllowance(false));
    }
  }, [
    fraxswapRouterConfig,
    writeContractAsync,
    config,
    tokenFrom,
    refetchBalancesAndApprovals,
    refetchPools,
    tokenFromAmount,
  ]);

  const swap = useCallback(async () => {
    setIsPending(true);
    try {
      const isFromNative = tokenAddressFrom === zeroAddress;
      const isToNative = tokenAddressTo === zeroAddress;
      const path = [
        isFromNative ? wethAddress : tokenAddressFrom,
        isToNative ? wethAddress : tokenAddressTo,
      ];
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3 * 60 * 60); // 3 hours

      let hash: Hex;
      if (isFromNative) {
        hash = await writeContractAsync({
          ...fraxswapRouterConfig,
          functionName: isExactInput
            ? 'swapExactETHForTokens'
            : 'swapETHForExactTokens',
          args: [parseEther(tokenToAmount), path, userAddress!, deadline],
          value: parseEther(tokenFromAmount),
        } as const);
      } else if (isToNative) {
        hash = await writeContractAsync({
          ...fraxswapRouterConfig,
          functionName: isExactInput
            ? 'swapExactTokensForETH'
            : 'swapTokensForExactETH',
          args: [
            parseEther(tokenFromAmount),
            parseEther(tokenToAmount),
            path,
            userAddress!,
            deadline,
          ],
        } as const);
      } else {
        hash = await writeContractAsync({
          ...fraxswapRouterConfig,
          functionName: isExactInput
            ? 'swapExactTokensForTokens'
            : 'swapTokensForExactTokens',
          args: [
            parseEther(tokenFromAmount),
            parseEther(tokenToAmount),
            path,
            userAddress!,
            deadline,
          ],
        } as const);
      }

      const transactionReceipt = await waitForTransactionReceipt(config, {
        hash,
        confirmations: 1,
      });

      console.log(transactionReceipt);

      setAmountTo('');
      setAmountFrom('');
    } catch (e) {
      console.error(e);
      if (e instanceof ContractFunctionExecutionError) {
        alert(e.shortMessage);
      }
    } finally {
      await Promise.all([
        refetchBalancesAndApprovals(),
        refetchPools(),
      ]).finally(() => setIsPending(false));
    }
  }, [
    refetchBalancesAndApprovals,
    refetchPools,
    writeContractAsync,
    fraxswapRouterConfig,
    isExactInput,
    tokenFromAmount,
    tokenToAmount,
    tokenAddressFrom,
    tokenAddressTo,
    userAddress,
    config,
  ]);

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
          value={tokenFromAmount.startsWith('-') ? '' : tokenFromAmount}
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
          value={tokenToAmount}
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
        disabled={
          !userAddress ||
          Number(tokenFromAmount) <= 0 ||
          Number(tokenToAmount) <= 0 ||
          isPending ||
          isIncreasingAllowance
        }
        onClick={isApprovalNeeded ? approve : swap}
      >
        {isApprovalNeeded
          ? `Approve ${tokenFrom.symbol}`
          : isIncreasingAllowance
            ? `Approving ${tokenFrom.symbol}...`
            : !isExactInput
              ? isPending
                ? `Buying ${tokenTo.symbol}...`
                : `Buy ${tokenTo.symbol}`
              : isPending
                ? `Selling ${tokenFrom.symbol}...`
                : `Sell ${tokenFrom.symbol}`}
      </PrimaryButton>
    </div>
  );
}

export default SwapInterface;
