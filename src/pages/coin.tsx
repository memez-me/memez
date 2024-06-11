import React, { useState, useMemo, useEffect } from 'react';
import PageHead from '../components/PageHead';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemeCoinConfig, useMemezFactoryConfig } from '../hooks';
import { Address, formatEther, isAddress, parseEther, zeroAddress } from 'viem';
import {
  useAccount,
  useBalance,
  useReadContracts,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import Button from '../components/Button';
import TextInput from '../components/TextInput';

export function Coin() {
  const { address } = useAccount();
  const router = useRouter();
  const [isBuy, setIsBuy] = useState(true);
  const [amount, setAmount] = useState<string | number>(0);

  const memeCoinAddress = useMemo(
    () =>
      isAddress(router?.query?.address?.toString() ?? '')
        ? (router?.query?.address as Address)
        : zeroAddress,
    [router],
  );

  const memezFactoryConfig = useMemezFactoryConfig();
  const memeCoinConfig = useMemeCoinConfig(memeCoinAddress);

  const {
    data,
    isError,
    refetch: refetchData,
  } = useReadContracts({
    contracts: [
      {
        ...memezFactoryConfig,
        functionName: 'isMemeCoinLegit',
        args: [memeCoinAddress],
      },
      {
        ...memeCoinConfig,
        functionName: 'name',
      },
      {
        ...memeCoinConfig,
        functionName: 'symbol',
      },
      {
        ...memeCoinConfig,
        functionName: 'cap',
      },
      {
        ...memeCoinConfig,
        functionName: 'totalSupply',
      },
      {
        ...memeCoinConfig,
        functionName: 'balanceOf',
        args: [address ?? zeroAddress],
      },
    ],
  });

  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: memeCoinAddress,
  });

  const {
    data: mintData,
    error: mintError,
    refetch: refetchMint,
  } = useSimulateContract({
    ...memeCoinConfig,
    functionName: 'mint',
    value: parseEther((amount ?? 0).toString()),
    query: {
      enabled: isBuy,
    },
  });

  const {
    data: retireData,
    error: retireError,
    refetch: refetchRetire,
  } = useSimulateContract({
    ...memeCoinConfig,
    functionName: 'retire',
    args: [parseEther((amount ?? 0).toString())],
    query: {
      enabled: !isBuy,
    },
  });

  const currentSimulationError = useMemo(
    () => (isBuy ? mintError : retireError),
    [isBuy, mintError, retireError],
  );

  const simulationErrorMessage = useMemo(
    () =>
      currentSimulationError
        ? (currentSimulationError.cause as any)?.reason ??
          currentSimulationError.message
        : null,
    [currentSimulationError],
  );

  const { data: hash, writeContract, isPending, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!isConfirmed) return;
    const timer = setTimeout(() => {
      reset();
      Promise.all([
        refetchData(),
        refetchBalance(),
        refetchMint(),
        refetchRetire(),
      ]);
    }, 3000);
    return () => clearTimeout(timer);
  }, [
    isConfirmed,
    reset,
    refetchData,
    refetchBalance,
    refetchMint,
    refetchRetire,
  ]);

  return (
    <>
      <PageHead
        title="memez"
        subtitle={data?.[2]?.result ?? 'Memecoin'}
        description={`memez ${data?.[1]?.result} memecoin`}
      />
      <div className="flex flex-col h-full justify-center items-center">
        <Link
          href="/"
          passHref
          rel="noreferrer"
          className="hover:font-bold hover:text-text-hovered"
        >
          [go back]
        </Link>
        <div className="flex flex-col gap-4 w-full max-w-[420px] mt-6">
          {data && data.every((d) => d.status === 'success') && !isError ? (
            <>
              <p>
                Token name: <span>{data[1].result}</span>
              </p>
              <p>
                Token symbol: <span>{data[2].result}</span>
              </p>
              <p>
                Token cap: <span>{formatEther(data[3].result ?? 0n)}</span>{' '}
                <span className="font-bold">ETH</span>
              </p>
              <p>
                Current cap:{' '}
                <span>{formatEther(balanceData?.value ?? 0n)}</span>{' '}
                <span className="font-bold">ETH</span>
              </p>
              <p>
                Token supply: <span>{formatEther(data[4].result ?? 0n)}</span>{' '}
                <span className="font-bold">{data[2].result}</span>
              </p>
              {!!address && (
                <p>
                  My balance: <span>{formatEther(data[5].result ?? 0n)}</span>{' '}
                  <span className="font-bold">{data[2].result}</span>
                </p>
              )}
              <div className="flex flex-col gap-4">
                <div className="flex flex-row gap-4">
                  <Button
                    className="text-text-success border-text-success flex-1"
                    onClick={() => setIsBuy(true)}
                    disabled={isBuy || isPending || isConfirming || isConfirmed}
                  >
                    Buy
                  </Button>
                  <Button
                    className="text-text-error border-text-error flex-1"
                    onClick={() => setIsBuy(false)}
                    disabled={
                      !isBuy || isPending || isConfirming || isConfirmed
                    }
                  >
                    Sell
                  </Button>
                </div>
                <div className="flex flex-row gap-2">
                  <TextInput
                    className="flex-1"
                    value={amount}
                    placeholder="Amount"
                    type="number"
                    min={0}
                    step={0.001}
                    disabled={isPending || isConfirming || isConfirmed}
                    onChange={(e) =>
                      setAmount(
                        e.target.value.toString().replaceAll(/[^0-9.,]/g, ''),
                      )
                    }
                  />
                  <span className="font-extrabold self-center">
                    {isBuy ? 'ETH' : data[2].result}
                  </span>
                </div>
                <Button
                  disabled={
                    !!currentSimulationError ||
                    isPending ||
                    isConfirming ||
                    isConfirmed
                  }
                  onClick={
                    isBuy
                      ? () => writeContract(mintData!.request)
                      : () => writeContract(retireData!.request)
                  }
                >
                  {isBuy
                    ? isPending || isConfirming
                      ? 'Buying...'
                      : 'Buy'
                    : isPending || isConfirming
                      ? 'Selling...'
                      : 'Sell'}
                </Button>
                {isConfirmed && (
                  <p className="text-text-success">Transaction confirmed!</p>
                )}
                {!!simulationErrorMessage && (
                  <p className="text-text-error">
                    Error: {simulationErrorMessage}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-text-error">
              Error:
              {data && data[0].status === 'success' && !data[0].result
                ? ' token address is not legit!'
                : ' cannot get token information!'}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default Coin;
