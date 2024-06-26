import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  useChartOptions,
  useMemeCoinConfig,
  useMemezFactoryConfig,
} from '../../hooks';
import {
  Address,
  BlockTag,
  formatEther,
  getAbiItem,
  parseEther,
  zeroAddress,
} from 'viem';
import {
  useAccount,
  useClient,
  useReadContract,
  useReadContracts,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
  useWriteContract,
} from 'wagmi';
import { PrimaryButton } from '../buttons';
import TextInput from '../TextInput';
import BuySellSwitch from '../BuySellSwitch';
import ApexChart from '../ApexChart';
import { trimAddress, Power, getPrice, utcTimestampToLocal } from '../../utils';
import { getLogs } from 'viem/actions';
import _ from 'lodash';
import LightweightChart from '../LightweightChart';
import type { UTCTimestamp } from 'lightweight-charts';
import { CoinIcon, ProfileIcon } from '../icons';
import Chat from '../Chat';

type CoinInfoProps = {
  memeCoinAddress: Address;
  className?: string;
};

const chartIntervalsCount = 100;
const mintRetireLogsPollingInterval = 2000;

export function CoinInfo({ memeCoinAddress, className }: CoinInfoProps) {
  const { address } = useAccount();
  const client = useClient();
  const [isBuy, setIsBuy] = useState(true);
  const [amount, setAmount] = useState<string | number>('');
  const [isEventLongPolling, setIsEventLongPolling] = useState(true); // it seems that Tenderly has some problems with events watching

  const memezFactoryConfig = useMemezFactoryConfig();
  const memeCoinConfig = useMemeCoinConfig(memeCoinAddress);

  const getMintRetireLogsAsync = useCallback(
    async (fromBlock?: bigint | BlockTag) => {
      if (
        !client ||
        !memezFactoryConfig ||
        !memeCoinConfig ||
        memeCoinConfig.address === zeroAddress
      )
        return null;

      if (fromBlock === undefined) {
        const deployedEvents = await getLogs(client, {
          address: memezFactoryConfig.address,
          event: getAbiItem({
            abi: memezFactoryConfig.abi,
            name: 'MemeCoinDeployed',
          }),
          args: {
            memecoin: memeCoinConfig.address,
          },
          strict: true,
          fromBlock: 'earliest',
        });

        if (!deployedEvents.length) return;
        fromBlock = deployedEvents[0].blockNumber;
      }

      return getLogs(client, {
        address: memeCoinConfig.address,
        events: [
          getAbiItem({ abi: memeCoinConfig.abi, name: 'Mint' }),
          getAbiItem({ abi: memeCoinConfig.abi, name: 'Retire' }),
        ],
        strict: true,
        fromBlock,
      });
    },
    [client, memezFactoryConfig, memeCoinConfig],
  );

  const [mintRetireLogs, setMintRetireLogs] =
    useState<Awaited<ReturnType<typeof getMintRetireLogsAsync>>>(null);

  const isAnyMintRetireLogsFetched = useMemo(
    () => !!mintRetireLogs,
    [mintRetireLogs],
  );

  const lastMintRetireBlock = useMemo(
    () => _.last(mintRetireLogs)?.blockNumber,
    [mintRetireLogs],
  );

  useEffect(() => {
    if (
      !client ||
      !memezFactoryConfig ||
      !memeCoinConfig ||
      memeCoinConfig.address === zeroAddress ||
      isAnyMintRetireLogsFetched
    )
      return;
    getMintRetireLogsAsync().then(setMintRetireLogs);
  }, [
    isAnyMintRetireLogsFetched,
    client,
    memezFactoryConfig,
    memeCoinConfig,
    getMintRetireLogsAsync,
  ]);

  useWatchContractEvent({
    address: memeCoinConfig.address,
    abi: memeCoinConfig.abi,
    eventName: 'Mint',
    enabled:
      memeCoinConfig.address !== zeroAddress &&
      isAnyMintRetireLogsFetched &&
      !isEventLongPolling,
    strict: true,
    pollingInterval: mintRetireLogsPollingInterval,
    onLogs: (logs) => {
      setMintRetireLogs((old) => [...old!, ...logs]);
    },
    onError: (error) => {
      console.error(error);
      setIsEventLongPolling(true);
    },
  });

  useWatchContractEvent({
    address: memeCoinConfig.address,
    abi: memeCoinConfig.abi,
    eventName: 'Retire',
    enabled:
      memeCoinConfig.address !== zeroAddress &&
      isAnyMintRetireLogsFetched &&
      !isEventLongPolling,
    strict: true,
    pollingInterval: mintRetireLogsPollingInterval,
    onLogs: (logs) => {
      setMintRetireLogs((old) => [...old!, ...logs]);
    },
    onError: (error) => {
      console.error(error);
      setIsEventLongPolling(true);
    },
  });

  useEffect(() => {
    if (!isAnyMintRetireLogsFetched || !isEventLongPolling) return;
    const intervalId = setInterval(() => {
      getMintRetireLogsAsync(
        lastMintRetireBlock ? lastMintRetireBlock + 1n : 'earliest',
      )
        .then((res) =>
          setMintRetireLogs((old) =>
            res && res.length > 0 ? [...old!, ...res] : old,
          ),
        )
        .catch((e) => console.error(e));
    }, mintRetireLogsPollingInterval);

    return () => clearInterval(intervalId);
  }, [
    getMintRetireLogsAsync,
    isAnyMintRetireLogsFetched,
    isEventLongPolling,
    lastMintRetireBlock,
  ]);

  const candlestickData = useMemo(() => {
    if (!mintRetireLogs?.length) return;
    const prices = mintRetireLogs.map((event) => ({
      open: Number(
        formatEther(
          getPrice(
            event.args.newSupply -
              event.args.amount * (event.eventName === 'Mint' ? 1n : -1n),
          ),
        ),
      ),
      close: Number(formatEther(getPrice(event.args.newSupply))),
      seconds: utcTimestampToLocal(
        Number(event.args.timestamp) as UTCTimestamp,
      ),
    }));

    const oneMinGroups = _.groupBy(
      prices,
      ({ seconds }) => (seconds - (seconds % 60)) / 60,
    );

    return _.entries(oneMinGroups).map(([minutes, prices]) => ({
      open: _.first(prices)!.open,
      high: _.max(_.map(prices, (price) => Math.max(price.open, price.close)))!,
      low: _.min(_.map(prices, (price) => Math.min(price.open, price.close)))!,
      close: _.last(prices)!.close,
      time: (Number(minutes) * 60) as UTCTimestamp,
    }));
  }, [mintRetireLogs]);

  const candlestickPriceFormat = useMemo(() => {
    if (!candlestickData) return;
    const highest = _.maxBy(candlestickData, 'high')!.high;
    const log10 = Math.floor(Math.log10(highest));
    if (log10 > -3) return;
    return {
      precision: -log10,
      minMove: 10 ** log10,
    };
  }, [candlestickData]);

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
    const supplyStep = maxSupply / BigInt(chartIntervalsCount);

    return [...new Array(chartIntervalsCount + 1)]
      .map((_, i) => BigInt(i) * supplyStep)
      .map(
        (supply) =>
          [
            Number(formatEther(supply)),
            Number(formatEther(getPrice(supply))), //TODO: get coefficient from smart contract
          ] as [number, number],
      );
  }, [maxSupply]);

  const currentProgressPoint = useMemo(
    () =>
      !!data &&
      data[4].result !== undefined &&
      !!data[3].result &&
      data[9].result !== undefined
        ? {
            x: Number(formatEther(data[4].result)),
            y: Number(formatEther(getPrice(data[4].result))), //TODO: get coefficient from smart contract
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

  return (
    <div
      className={`flex flex-row portrait:flex-col-reverse py-x1 px-x1 md:px-x3 lg:px-x7 xl:px-x11 gap-x3 rounded-x1 bg-transparent items-start ${className}`}
    >
      {data && data.every((d) => d.status === 'success') && !isError ? (
        <>
          <div className="flex flex-col flex-1 gap-x3 p-x1 landscape:overflow-auto landscape:h-full portrait:w-full">
            <h3 className="font-bold text-headline-2 text-shadow">
              {data[1].result} CANDLES
            </h3>
            <div className="w-full h-[52vh] portrait:h-[90vw] shrink-0 bg-main-gray bg-opacity-50 rounded-x1 content-center">
              {candlestickData ? (
                <LightweightChart
                  className="h-full"
                  data={candlestickData}
                  candlestickOptions={{
                    priceFormat: candlestickPriceFormat,
                  }}
                />
              ) : (
                <p className="text-center">
                  Not enough data for candlestick chart
                </p>
              )}
            </div>
            <Chat className="w-full" memecoin={memeCoinAddress} />
          </div>
          <div className="flex flex-col p-x1 landscape:overflow-auto landscape:h-full portrait:w-full">
            <div className="flex flex-col gap-x2 p-x3 w-[460px] max-w-full rounded-x1 bg-gradient-to-b from-main-accent/16 border-2 border-main-shadow backdrop-blur">
              <div className="flex flex-row portrait:flex-col gap-x4 portrait:gap-x2">
                <CoinIcon
                  className="mx-auto"
                  address={memeCoinAddress}
                  size={120}
                  symbol={data[2].result ?? '$$$'}
                  src={data[8].result}
                />
                <div className="flex flex-col gap-x2 flex-1 text-body font-medium tracking-body">
                  <h3 className="font-bold text-title text-shadow">
                    {data[1].result}
                  </h3>
                  <div className="flex flex-col gap-x0.5 text-body font-medium tracking-body">
                    <p className="text-body-2 font-medium tracking-body">
                      Symbol: <span>{data[2].result}</span>
                    </p>
                    <p className="flex flex-row flex-nowrap items-center gap-x2 text-nowrap overflow-hidden overflow-ellipsis">
                      <span>Created by</span>
                      <Link
                        href={`/profile?address=${data[6].result}`}
                        passHref
                        rel="noreferrer"
                        className="flex flex-row flex-1 flex-nowrap items-center gap-x1 text-nowrap overflow-hidden overflow-ellipsis disabled:shadow hover:font-bold hover:text-shadow focus:text-shadow active:text-shadow"
                      >
                        {!ownerData ? (
                          <span>
                            {trimAddress(data[6].result ?? zeroAddress)}
                          </span>
                        ) : (
                          <>
                            <ProfileIcon
                              className="inline shrink-0"
                              address={data[6].result ?? zeroAddress}
                              size={24}
                              src={ownerData[1]}
                            />
                            <span className="text-footnote font-regular tracking-footnote text-main-shadow bg-main-accent rounded-x0.5 h-x3 px-x0.5 content-center overflow-hidden overflow-ellipsis">
                              {ownerData[0] || trimAddress(data[6].result!)}
                            </span>
                          </>
                        )}
                      </Link>
                    </p>
                    <p>
                      Cap:{' '}
                      <span>
                        {data[3]?.result ? formatEther(data[3].result) : '???'}{' '}
                        ETH
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-x0.5 justify-around">
                <Link
                  href={`#TODO`}
                  passHref
                  rel="noreferrer"
                  className="inline-flex px-x1 py-x0.5 text-body font-medium tracking-body uppercase hover:text-shadow active:text-shadow active:text-main-light"
                >
                  [Website]{/*TODO: load links*/}
                </Link>
                <Link
                  href={`#TODO`}
                  passHref
                  rel="noreferrer"
                  className="inline-flex px-x1 py-x0.5 text-body font-medium tracking-body uppercase hover:text-shadow active:text-shadow active:text-main-light"
                >
                  [Telegram]{/*TODO: load links*/}
                </Link>
                <Link
                  href={`#TODO`}
                  passHref
                  rel="noreferrer"
                  className="inline-flex px-x1 py-x0.5 text-body font-medium tracking-body uppercase hover:text-shadow active:text-shadow active:text-main-light"
                >
                  [Twitter]{/*TODO: load links*/}
                </Link>
              </div>
              {data[7].result && (
                <p className="bg-main-black bg-opacity-30 rounded-x1 px-x3 py-x2 text-body-2 font-medium tracking-body">
                  {data[7].result}
                </p>
              )}
            </div>
            {data[3].result && data[3].result > 0n && (
              <>
                <div className="flex flex-col gap-x1 p-x3">
                  {!!address && (
                    <p className="font-bold text-headline-2 text-shadow mb-x1">
                      My balance:{' '}
                      <span>{formatEther(data[5].result ?? 0n)}</span>{' '}
                      <span className="font-bold">{data[2].result}</span>
                    </p>
                  )}
                  <TextInput
                    className="flex-1"
                    value={amount}
                    placeholder={`0.0 ${isBuy ? 'ETH' : data[2].result}`}
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
                {data[3].result && data[3].result > 0n ? (
                  <div className="flex flex-col gap-x2 p-x3">
                    <h3 className="font-bold text-headline-2 text-shadow">
                      Bonding curve progress
                    </h3>
                    <div className="w-full h-auto aspect-square p-x2 xl:p-x3 bg-main-gray bg-opacity-50 rounded-x1 content-center">
                      {chartData ? (
                        <ApexChart
                          options={chartOptions}
                          series={[{ data: chartData }]}
                          type="area"
                          width="100%"
                          height="100%"
                        />
                      ) : (
                        <p className="text-center">
                          Not enough data for bonding curve chart
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p>
                    Status: <b>Already listed</b>
                  </p>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <p className="w-full self-center text-second-error text-center text-body tracking-body">
          Error:
          {data && data[0].status === 'success' && !data[0].result
            ? ' token address is not legit!'
            : ' cannot get token information!'}
        </p>
      )}
    </div>
  );
}

export default CoinInfo;
