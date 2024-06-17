import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PageHead from '../components/PageHead';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import {
  useChartOptions,
  useMemeCoinConfig,
  useMemezFactoryConfig,
} from '../hooks';
import { Address, formatEther, isAddress, parseEther, zeroAddress } from 'viem';
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { PrimaryButton } from '../components/buttons';
import TextInput from '../components/TextInput';
import BuySellSwitch from '../components/BuySellSwitch';
import ApexChart from '../components/ApexChart';
import { trimAddress, Power } from '../utils';

const chartIntervalsCount = 50;

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
      {
        ...memeCoinConfig,
        functionName: 'reserveBalance',
      },
    ],
    query: {
      refetchInterval: 5000,
    },
  });

  const maxSupply = useMemo(() => {
    if (!data) return undefined; // calculatePurchaseReturn with deposit=cap and supply=0
    const cap = data[3].result;
    if (!cap) return data[4].result;
    const baseN = 1000n * cap;
    const { result, precision } = Power.power(baseN, 1n, 1n, 3n); //TODO: get coefficients from smart contract
    return (result - 1n) >> precision;
  }, [data]);

  const chartData = useMemo(() => {
    if (!maxSupply) return undefined;
    const zerosCount = maxSupply.toString().length - 1;
    const biggest10Pow = 10n ** BigInt(zerosCount);
    const nearestFlooredSupply = (maxSupply / biggest10Pow) * biggest10Pow;
    const supplyStep = nearestFlooredSupply / BigInt(chartIntervalsCount);

    return [
      ...[...new Array(chartIntervalsCount)].map(
        (_, i) => BigInt(i) * supplyStep,
      ),
      nearestFlooredSupply,
      maxSupply,
    ].map(
      (supply) =>
        [
          Number(formatEther(supply)),
          Number(formatEther((supply * supply) / 3000n)), //TODO: get coefficient from smart contract
        ] as [number, number],
    );
  }, [maxSupply]);

  const currentProgressPoint = useMemo(
    () =>
      !!data && !!data[4].result && !!data[3].result && !!data[9].result
        ? {
            x: Number(formatEther(data[4].result)),
            y: Number(formatEther((data[4].result * data[4].result) / 3000n)), //TODO: get coefficient from smart contract
            text:
              Number(
                (
                  Number((data[9].result * 10000n) / data[3].result) / 100
                ).toFixed(2),
              ) + '%',
          }
        : undefined,
    [data],
  );

  const chartOptions = useChartOptions({
    titleX: 'Supply',
    titleY: 'Price',
    point: currentProgressPoint,
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
      Promise.all([refetchData(), refetchMint(), refetchRetire()]);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isConfirmed, reset, refetchData, refetchMint, refetchRetire]);

  const setAmountToMax = useCallback(
    () =>
      setAmount(
        isBuy
          ? formatEther((data?.[3]?.result ?? 0n) - (data?.[9]?.result ?? 0n))
          : formatEther(data?.[5]?.result ?? 0n),
      ),
    [data, isBuy],
  );

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
              {data[3].result && data[3].result > 0n ? (
                chartData && (
                  <ApexChart
                    options={chartOptions}
                    series={[{ data: chartData }]}
                    type="area"
                    width="100%"
                    height="256"
                  />
                )
              ) : (
                <p>
                  Status: <b>Already listed</b>
                </p>
              )}
              {!!address && (
                <p>
                  My balance: <span>{formatEther(data[5].result ?? 0n)}</span>{' '}
                  <span className="font-bold">{data[2].result}</span>
                </p>
              )}
              {data[3].result && data[3].result > 0n && (
                <div className="flex flex-col gap-x3">
                  <div className="flex flex-row gap-x1">
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
                      onMax={data ? setAmountToMax : undefined}
                    />
                    <span className="text-title font-extrabold self-center">
                      {isBuy ? 'ETH' : data[2].result}
                    </span>
                  </div>
                  <div className="flex flex-col gap-x1 w-full">
                    <BuySellSwitch isBuy={isBuy} onChange={setIsBuy} />
                    <PrimaryButton
                      className={`h-x9 ${
                        isBuy
                          ? 'bg-main-light disabled:bg-main-light disabled:bg-opacity-40 enabled:hover:bg-main-accent enabled:focus:bg-main-accent enabled:active:bg-main-light enabled:active:bg-opacity-40'
                          : 'bg-second-sell disabled:bg-second-sell disabled:bg-opacity-40 enabled:hover:bg-second-error enabled:focus:bg-second-error enabled:active:bg-second-sell enabled:active:bg-opacity-40'
                      }`}
                      disabled={
                        !!currentSimulationError ||
                        isPending ||
                        isConfirming ||
                        isConfirmed ||
                        !amount ||
                        Number(amount) <= 0 ||
                        (isBuy ? !mintData : !retireData)
                      }
                      onClick={
                        isBuy
                          ? () => writeContract(mintData!.request)
                          : () => writeContract(retireData!.request)
                      }
                    >
                      {isPending || isConfirming
                        ? isBuy
                          ? 'Buying...'
                          : 'Selling...'
                        : 'Place trade'}
                    </PrimaryButton>
                    {isConfirmed && (
                      <p className="text-second-success">
                        Transaction confirmed!
                      </p>
                    )}
                    {!!simulationErrorMessage && (
                      <p className="text-second-error">
                        Error: {simulationErrorMessage}
                      </p>
                    )}
                  </div>
                </div>
              )}
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
