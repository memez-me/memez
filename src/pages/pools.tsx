import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageHead from '../components/PageHead';
import {
  useFraxswapFactoryConfig,
  useFraxswapPairConfig,
  useMemeCoinConfig,
  useMemeCoinListingManagerConfig,
  useMemezConfig,
} from '../hooks';
import { Address, BlockTag, formatEther, getAbiItem, zeroAddress } from 'viem';
import { useClient, useReadContracts } from 'wagmi';
import _ from 'lodash';
import { getLogs } from 'viem/actions';
import { getEthPriceInUsd } from '../apis';
import { CoinIcon } from '../components/icons';
import { trimAddress } from '../utils';
import Link from 'next/link';
import { ADDRESSES, BLOCK_TO_FETCH_EVENTS_FROM } from '../constants';

const wethAddress = ADDRESSES.WETH;

export function Pools() {
  const client = useClient();
  const [ethUsdPrice, setEthUsdPrice] = useState<number>();
  const [blockToFetchFrom, setBlockToFetchFrom] = useState<bigint | BlockTag>(
    BLOCK_TO_FETCH_EVENTS_FROM,
  );
  const [listedMemecoins, setListedMemecoins] = useState<Address[]>([]);

  const listingManagerConfig = useMemeCoinListingManagerConfig();
  const fraxswapFactoryConfig = useFraxswapFactoryConfig();
  const fraxswapPairConfig = useFraxswapPairConfig(zeroAddress); // address will be overridden
  const memeCoinConfig = useMemeCoinConfig(zeroAddress); // address will be overridden
  const { address: memezAddress } = useMemezConfig();

  const { data: symbolsData } = useReadContracts({
    contracts: listedMemecoins.map(
      (address) =>
        ({
          ...memeCoinConfig,
          address,
          functionName: 'symbol',
        }) as const,
    ),
    query: {
      enabled: listedMemecoins.length > 0,
    },
  });

  const symbolsMapping = useMemo(
    () => ({
      ..._.fromPairs(
        symbolsData?.map(({ result }, i) => [listedMemecoins[i], result]) ?? [],
      ),
      [wethAddress]: 'wfrxETH',
      [memezAddress]: 'MEMEZ',
    }),
    [listedMemecoins, symbolsData, memezAddress],
  );

  const pairsTokensAddresses = useMemo<[Address, Address][]>(
    () => [
      [memezAddress, wethAddress],
      ...listedMemecoins.flatMap(
        (memecoinAddress) =>
          [
            [memecoinAddress, memezAddress],
            [memecoinAddress, wethAddress],
          ] as [Address, Address][],
      ),
    ],
    [memezAddress, listedMemecoins],
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

  const { data: pairReservesData } = useReadContracts({
    contracts:
      poolsAddresses.map(
        (address) =>
          ({
            ...fraxswapPairConfig,
            address,
            functionName: 'getReserves',
          }) as const,
      ) ?? [],
    query: {
      enabled: !!pairsAddressesData,
    },
  });

  const sortedReserves = useMemo(
    () =>
      pairReservesData?.map<[bigint, bigint]>(({ result: reserves }, i) => {
        if (!reserves) return [0n, 0n];
        const [reserve0, reserve1] = reserves as [bigint, bigint, number];
        const [tokenA, tokenB] = pairsTokensAddresses[i];
        return BigInt(tokenA) < BigInt(tokenB)
          ? [reserve0, reserve1]
          : [reserve1, reserve0];
      }) ?? [],
    [pairsTokensAddresses, pairReservesData],
  );

  const memezUsdPrice = useMemo(
    () =>
      sortedReserves.length > 0 && !!ethUsdPrice
        ? (ethUsdPrice * Number(formatEther(sortedReserves[0][1]))) /
          Number(formatEther(sortedReserves[0][0]))
        : null,
    [sortedReserves, ethUsdPrice],
  );

  const poolsData = useMemo(() => {
    return poolsAddresses.map((poolAddress, i) => ({
      poolAddress,
      tokenA: {
        address: pairsTokensAddresses[i][0],
        symbol: symbolsMapping[pairsTokensAddresses[i][0]],
        reserve: formatEther(sortedReserves[i]?.[0] ?? 0n),
      },
      tokenB: {
        address: pairsTokensAddresses[i][1],
        symbol: symbolsMapping[pairsTokensAddresses[i][1]],
        reserve: formatEther(sortedReserves[i]?.[1] ?? 0n),
      },
      tvl:
        pairsTokensAddresses[i][1] === wethAddress && !!ethUsdPrice
          ? ethUsdPrice * Number(formatEther(sortedReserves[i]?.[1] ?? 0n)) * 2
          : pairsTokensAddresses[i][1] === memezAddress && !!memezUsdPrice
            ? memezUsdPrice *
              Number(formatEther(sortedReserves[i]?.[1] ?? 0n)) *
              2
            : null,
    }));
  }, [
    poolsAddresses,
    pairsTokensAddresses,
    symbolsMapping,
    sortedReserves,
    ethUsdPrice,
    memezUsdPrice,
    memezAddress,
  ]);

  const totalTvl = useMemo(
    () => poolsData.reduce((sum, { tvl }) => sum + (tvl ?? 0), 0),
    [poolsData],
  );

  const fetchListedMemecoinsAsync = useCallback(
    async (fromBlock?: bigint | BlockTag) => {
      if (!client || !listingManagerConfig) return;

      return await getLogs(client, {
        address: listingManagerConfig.address,
        event: getAbiItem({
          abi: listingManagerConfig.abi,
          name: 'MemeCoinListed',
        }),
        strict: true,
        fromBlock: fromBlock ?? BLOCK_TO_FETCH_EVENTS_FROM,
      }).then((listedEvents) => {
        if (listedEvents.length > 0) {
          const blockNumber = _.last(listedEvents)!.blockNumber;
          if (blockNumber) setBlockToFetchFrom(blockNumber + 1n);
        }
        return listedEvents.map((event) => event.args.memecoin);
      });
    },
    [client, listingManagerConfig],
  );

  useEffect(() => {
    if (!ethUsdPrice) {
      getEthPriceInUsd().then(setEthUsdPrice);
    }
  }, [ethUsdPrice]);

  useEffect(() => {
    if (!client || !listingManagerConfig) return;
    fetchListedMemecoinsAsync().then((memecoins) =>
      setListedMemecoins(memecoins ?? []),
    );
  }, [client, listingManagerConfig, fetchListedMemecoinsAsync]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchListedMemecoinsAsync(blockToFetchFrom)
        .then((res) =>
          setListedMemecoins((old) =>
            res && res.length > 0 ? [...old!, ...res] : old,
          ),
        )
        .catch((e) => console.error(e));
    }, 10000);

    return () => clearInterval(intervalId);
  }, [blockToFetchFrom, fetchListedMemecoinsAsync]);

  return (
    <>
      <PageHead
        title="memez"
        subtitle="Listed pools"
        description="Listed pools of memez memecoins app"
      />
      <div className="flex flex-col gap-x4 justify-center items-center">
        <div className="container flex flex-col gap-x6 pt-x2">
          <div className="flex flex-row gap-x3 flex-wrap w-full justify-around">
            <h3 className="text-headline font-bold text-left self-start">
              Listed pools:{' '}
              {pairsAddressesData ? poolsAddresses.length : 'Loading...'}
            </h3>
            <h3 className="text-headline font-bold text-left self-start">
              Total TVL: {totalTvl ? '$' + totalTvl.toFixed(2) : 'Loading...'}
            </h3>
            <h3 className="flex flex-row items-center gap-x2 text-headline font-bold text-left self-start">
              <CoinIcon
                className="inline"
                symbol={'MEMEZ'}
                address={memezAddress}
                size={40}
                src={'/icon.svg'}
              />
              MEMEZ price:{' '}
              {memezUsdPrice
                ? '$' + Number(memezUsdPrice.toFixed(4))
                : 'Loading...'}
            </h3>
          </div>
        </div>
        <div className="container overflow-x-auto">
          <table className="w-full px-x3 border-collapse border-spacing-0 bg-main-black bg-opacity-30 backdrop-blur rounded-x1">
            <thead>
              <tr>
                <th className="px-x3 py-x2 text-shadow text-title font-bold">
                  #
                </th>
                <th className="px-x3 py-x2 text-shadow text-title font-bold">
                  Pool
                </th>
                <th className="px-x3 py-x2 text-shadow text-title font-bold">
                  Assets
                </th>
                <th className="px-x3 py-x2 text-shadow text-title font-bold">
                  TVL
                </th>
                <th className="px-x3 py-x2 text-shadow text-title font-bold">
                  Liquidity
                </th>
              </tr>
            </thead>
            <tbody>
              {poolsData.map(({ poolAddress, tokenA, tokenB, tvl }, i) => (
                <tr key={poolAddress}>
                  <td className="px-x3 py-x2 font-bold">{i + 1}</td>
                  <td className="px-x3 py-x2" title={poolAddress}>
                    {trimAddress(poolAddress!)}
                  </td>
                  <td className="px-x3 py-x2">
                    <div className="flex flex-row items-center gap-x2 min-w-0 overflow-hidden">
                      <div className="flex flex-row shrink-0">
                        <CoinIcon
                          symbol={tokenA.symbol ?? '???'}
                          address={tokenA.address}
                          size={32}
                          src={
                            tokenA.address === memezAddress
                              ? '/icon.svg'
                              : undefined
                          }
                        />
                        <CoinIcon
                          className="-ml-x2"
                          symbol={tokenB.symbol ?? '???'}
                          address={tokenB.address}
                          size={32}
                          src={
                            tokenB.address === wethAddress
                              ? '/native.svg'
                              : tokenB.address === memezAddress
                                ? '/icon.svg'
                                : undefined
                          }
                        />
                      </div>
                      <span>
                        {tokenA.address !== memezAddress ? (
                          <Link
                            href={`/?coin=${tokenA.address}`}
                            passHref
                            rel="noreferrer"
                            className="disabled:shadow hover:font-bold hover:text-main-light focus:text-main-light active:text-main-shadow"
                          >
                            {tokenA.symbol ?? '???'}
                          </Link>
                        ) : (
                          tokenA.symbol ?? '???'
                        )}{' '}
                        / {tokenB.symbol ?? '???'}
                      </span>
                    </div>
                  </td>
                  <td className="px-x3 py-x2">
                    {tvl ? '$' + tvl.toFixed(2) : 'Loading...'}
                  </td>
                  <td className="px-x3 py-x2">
                    {Number(Number(tokenA.reserve).toFixed(3))}{' '}
                    {tokenA.symbol ?? '???'} /{' '}
                    {Number(Number(tokenB.reserve).toFixed(3))}{' '}
                    {tokenB.symbol ?? '???'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Pools;
