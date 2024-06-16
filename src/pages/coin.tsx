import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PageHead from '../components/PageHead';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useMemeCoinConfig, useMemezFactoryConfig } from '../hooks';
import { Address, formatEther, isAddress, parseEther, zeroAddress } from 'viem';
import {
  useAccount,
  useBalance,
  useReadContract,
  useReadContracts,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { PrimaryButton } from '../components/buttons';
import TextInput from '../components/TextInput';
import BuySellSwitch from '../components/BuySellSwitch';
import { trimAddress } from '../utils';

export function Coin() {
  const { address } = useAccount();
  const router = useRouter();
  const [isBuy, setIsBuy] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [coinIcon, setCoinIcon] = useState('');
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
      {
        ...memeCoinConfig,
        functionName: 'owner',
      },
      {
        ...memeCoinConfig,
        functionName: 'description',
      },
      {
        ...memeCoinConfig,
        functionName: 'image',
      },
    ],
  });

  useEffect(() => {
    if (!data) return;
    setDescription((old) => data[7].result || old);
    setCoinIcon((old) => data[8].result || old);
  }, [data]);

  const { data: ownerData } = useReadContract({
    ...memezFactoryConfig,
    functionName: 'accounts',
    args: [data?.[6]?.result ?? zeroAddress],
    query: {
      enabled: !!data && data[0].result && !!data[6].result,
    },
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
      enabled: isBuy && !!amount && Number(amount) > 0,
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
      enabled: !isBuy && !!amount && Number(amount) > 0,
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
      setAmount(0);
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

  const { data: updateData, error: updateError } = useSimulateContract({
    ...memeCoinConfig,
    functionName: 'updateMetadata',
    args: [description, coinIcon],
    query: {
      enabled: !!address && !!data && address === data[6].result && isEditing,
    },
  });

  const updateSimulationError = useMemo(
    () =>
      updateError
        ? (updateError.cause as any)?.reason ?? updateError.message
        : null,
    [updateError],
  );

  const {
    data: updateHash,
    writeContractAsync: writeUpdateContractAsync,
    isPending: isUpdatePending,
    reset: resetUpdate,
  } = useWriteContract();

  const { isLoading: isUpdateConfirming, isSuccess: isUpdateConfirmed } =
    useWaitForTransactionReceipt({ hash: updateHash });

  const updateDescription = useCallback(() => {
    writeUpdateContractAsync(updateData!.request)
      .then(() => {
        refetchData().then(() => {
          setIsEditing(false);
          resetUpdate();
        });
      })
      .catch((e) => console.error(e));
  }, [writeUpdateContractAsync, updateData, refetchData, resetUpdate]);

  return (
    <>
      <PageHead
        title="memez"
        subtitle={data?.[2]?.result ?? 'Memecoin'}
        description={`memez ${data?.[1]?.result} memecoin`}
      />
      <div className="flex flex-col justify-center items-center">
        <Link
          href="/"
          passHref
          rel="noreferrer"
          className="disabled:shadow hover:font-bold hover:text-main-light focus:text-main-light active:text-main-shadow"
        >
          [go back]
        </Link>
        <div className="flex flex-col gap-4 w-full max-w-[420px] mt-6 text-body tracking-body">
          {data && data.every((d) => d.status === 'success') && !isError ? (
            <>
              <Image
                className="rounded-full object-contain mx-auto"
                src={(isEditing ? coinIcon : data[8].result) || '/icon.png'}
                alt={`${data[1].result} (${data[2].result}) icon`}
                width={128}
                height={128}
              />
              <p>
                Token name: <span>{data[1].result}</span>
              </p>
              <p>
                Token symbol: <span>{data[2].result}</span>
              </p>
              <p>
                Token creator:{' '}
                <Link
                  href={`/profile?address=${data[6].result}`}
                  passHref
                  rel="noreferrer"
                  className="disabled:shadow hover:font-bold hover:text-main-light focus:text-main-light active:text-main-shadow"
                >
                  {!ownerData ? (
                    trimAddress(data[6].result ?? zeroAddress)
                  ) : (
                    <Link
                      href={`/profile?address=${data[6].result!}`}
                      passHref
                      rel="noreferrer"
                      className="disabled:shadow hover:font-bold hover:text-main-light focus:text-main-light active:text-main-shadow"
                    >
                      <Image
                        className="inline ounded-full object-contain"
                        src={ownerData[1] || '/icon.png'}
                        alt={`${data[6].result} icon`}
                        width={16}
                        height={16}
                      />{' '}
                      {ownerData[0] || trimAddress(data[6].result!)}
                    </Link>
                  )}{' '}
                  {address === data[6].result && <i>(You)</i>}
                </Link>
              </p>
              {(isEditing || data[7].result) && (
                <p className="max-h-x10 overflow-auto">
                  Description: {isEditing ? description : data[7].result}
                </p>
              )}
              {data[3].result && data[3].result > 0n ? (
                <>
                  <p>
                    Token cap: <span>{formatEther(data[3].result ?? 0n)}</span>{' '}
                    <span className="font-bold">ETH</span>
                  </p>
                  <p>
                    Current cap:{' '}
                    <span>{formatEther(balanceData?.value ?? 0n)}</span>{' '}
                    <span className="font-bold">ETH</span>
                  </p>
                </>
              ) : (
                <p>
                  Status: <b>Already listed</b>
                </p>
              )}
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
              {!!address &&
                address === data[6].result &&
                data[3].result &&
                data[3].result > 0n &&
                (isEditing ? (
                  <>
                    <TextInput
                      value={description}
                      placeholder="Description"
                      type="text"
                      disabled={isUpdatePending || isUpdateConfirming}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <PrimaryButton
                      disabled={
                        !updateData?.request ||
                        isUpdatePending ||
                        isUpdateConfirming
                      }
                      onClick={updateDescription}
                    >
                      {isUpdateConfirming || isUpdatePending
                        ? 'Updating description...'
                        : 'Update description'}
                    </PrimaryButton>
                    {isUpdateConfirmed && (
                      <p className="text-second-success">
                        Description updated!
                      </p>
                    )}
                    {updateSimulationError && (
                      <p className="text-second-error">
                        Error: {updateSimulationError}
                      </p>
                    )}
                  </>
                ) : (
                  <PrimaryButton onClick={() => setIsEditing(true)}>
                    Edit description
                  </PrimaryButton>
                ))}
              <div className="flex flex-col gap-4">
                <BuySellSwitch isBuy={isBuy} onChange={setIsBuy} />
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
                <PrimaryButton
                  disabled={
                    !!currentSimulationError ||
                    isPending ||
                    isConfirming ||
                    isConfirmed ||
                    !amount ||
                    Number(amount) <= 0
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
                </PrimaryButton>
                {isConfirmed && (
                  <p className="text-second-success">Transaction confirmed!</p>
                )}
                {!!simulationErrorMessage && (
                  <p className="text-second-error">
                    Error: {simulationErrorMessage}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-second-error">
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
