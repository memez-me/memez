import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageHead from '../components/PageHead';
import Link from 'next/link';
import { useMemeCoinConfig, useMemezFactoryConfig } from '../hooks';
import { Address, isAddress, zeroAddress } from 'viem';
import {
  useInfiniteReadContracts,
  useReadContract,
  useReadContracts,
} from 'wagmi';
import _ from 'lodash';
import MemeCoinCard from '../components/MemeCoinCard';
import { SecondaryButton } from '../components/buttons';
import { useRouter } from 'next/router';
import { CoinInfo } from '../components/panels';

//const paginationLimit = 50;
const paginationLimit = 10;

type AccountPartialInfo = {
  nickname: string;
  profilePicture: string;
};

type MemeCoinData = {
  name: string;
  symbol: string;
  description: string | '';
  image: string | '';
  cap: bigint | 0n;
  reserveBalance: bigint | 0n;
  owner: Address;
};

const memecoinFunctionsToCall = [
  'name',
  'symbol',
  'description',
  'image',
  'cap',
  'reserveBalance',
  'owner',
] as (keyof MemeCoinData)[];

export function Index() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [cachedMemecoinsPages, setCachedMemecoinsPages] = useState<
    (MemeCoinData & { address: Address })[][]
  >([]);
  const [accounts, setAccounts] = useState<Record<Address, AccountPartialInfo>>(
    {},
  );

  const memeCoinAddress = useMemo(
    () =>
      isAddress(router?.query?.coin?.toString() ?? '')
        ? (router?.query?.coin as Address)
        : null,
    [router],
  );

  const memezFactoryConfig = useMemezFactoryConfig();
  const memeCoinConfig = useMemeCoinConfig(zeroAddress); // address will be overridden

  const { data: count } = useReadContract({
    ...memezFactoryConfig,
    functionName: 'allMemecoinsCount',
    query: {
      refetchInterval: 2000,
    },
  });

  const { data: addresses, fetchNextPage: fetchNextAddressesPage } =
    useInfiniteReadContracts({
      cacheKey: `memecoinsAddresses-${(count ?? '').toString()}`,
      contracts(pageParam) {
        return [
          ...new Array(Math.max(0, Math.min(pageParam + 1, paginationLimit))),
        ].map(
          (_, i) =>
            ({
              ...memezFactoryConfig,
              functionName: 'allMemecoins',
              args: [BigInt(pageParam - i)],
            }) as const,
        );
      },
      query: {
        enabled: !!count,
        initialPageParam: Number(count ?? 0) - 1,
        getNextPageParam: (_lastPage, _allPages, lastPageParam) => {
          return lastPageParam - paginationLimit;
        },
        getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
          return firstPageParam + paginationLimit;
        },
      },
    });

  const {
    data: memecoinsData,
    fetchNextPage: fetchNextDataPage,
    refetch: refetchDataPage,
  } = useInfiniteReadContracts({
    cacheKey: `memecoinsData-${(count ?? '').toString()}`,
    contracts(pageParam) {
      const addressesArr = (addresses as any)?.pages?.[pageParam]?.map(
        ({ result }: { result: Address }) => result,
      );
      return addressesArr.flatMap((address: Address) =>
        memecoinFunctionsToCall.map((functionName) => ({
          ...memeCoinConfig,
          address,
          functionName,
        })),
      );
    },
    query: {
      enabled: !!addresses,
      refetchInterval: 5000,
      initialPageParam: 0,
      getNextPageParam: (_lastPage, _allPages, lastPageParam) => {
        return lastPageParam + 1;
      },
      getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
        return firstPageParam - 1;
      },
    },
  });

  const memecoinsPages = useMemo(
    () =>
      ((memecoinsData as any)?.pages ?? []).map(
        (page: { result: any }[], i: number) =>
          _.chunk(page, memecoinFunctionsToCall.length).map(
            (memecoinData, j) => ({
              ...(_.fromPairs(
                _.zip(
                  memecoinFunctionsToCall,
                  memecoinData.map((data) => data.result),
                ),
              ) as MemeCoinData),
              address: (addresses as any).pages[i][j].result as Address,
            }),
          ),
      ) as (MemeCoinData & { address: Address })[][],
    [addresses, memecoinsData],
  );

  useEffect(() => {
    setCachedMemecoinsPages((old) =>
      memecoinsPages?.length > 0 ? memecoinsPages : old,
    );
  }, [memecoinsPages]);

  const allCreatorsAddresses = useMemo(
    () =>
      new Set(
        memecoinsPages.flatMap((page) =>
          page.map((memecoin) => memecoin.owner),
        ),
      ),
    [memecoinsPages],
  );

  const notCachedCreators = useMemo(
    () => [...allCreatorsAddresses].filter((address) => !accounts[address]),
    [accounts, allCreatorsAddresses],
  );

  const { data: fetchedCreators } = useReadContracts({
    contracts: notCachedCreators.map(
      (profileAddress) =>
        ({
          ...memezFactoryConfig,
          functionName: 'accounts',
          args: [profileAddress],
        }) as const,
    ),
    query: {
      enabled: notCachedCreators.length > 0,
    },
  });

  useEffect(() => {
    if (!fetchedCreators) return;
    const newCreators = _.fromPairs(
      _.zip(
        notCachedCreators,
        fetchedCreators.map(({ result }) =>
          result
            ? ({
                nickname: result[0],
                profilePicture: result[1],
              } as AccountPartialInfo)
            : undefined,
        ),
      ),
    );
    setAccounts((previous) => ({
      ...previous,
      ...newCreators,
    }));
  }, [notCachedCreators, fetchedCreators]);

  const goBack = useCallback(() => {
    setIsLoading(true);
    setCurrentPage((old) => old - 1);
    setIsLoading(false);
  }, []);

  const goForward = useCallback(() => {
    setIsLoading(true);
    if ((memecoinsData as any)?.pageParams?.length <= currentPage + 1) {
      fetchNextAddressesPage().then(() =>
        refetchDataPage().then(() =>
          fetchNextDataPage().then(() => {
            setCurrentPage((old) => old + 1);
            setIsLoading(false);
          }),
        ),
      );
    } else {
      setCurrentPage((old) => old + 1);
      setIsLoading(false);
    }
  }, [
    currentPage,
    fetchNextAddressesPage,
    fetchNextDataPage,
    memecoinsData,
    refetchDataPage,
  ]);

  return (
    <>
      <PageHead title="memez" description="memez memecoins app" />
      <div className="flex flex-col justify-center items-center overflow-hidden">
        <h3 className="text-title font-medium text-center">
          Total memecoins: {count !== undefined ? Number(count) : 'loading...'}
        </h3>
        <Link
          href="/create"
          passHref
          rel="noreferrer"
          className="disabled:shadow hover:font-bold hover:text-main-light focus:text-main-light active:text-main-shadow"
        >
          [create memecoin]
        </Link>
        <div className="flex flex-row w-full justify-center items-center overflow-hidden">
          <div className="flex flex-col gap-x0.5 max-h-full overflow-auto">
            {cachedMemecoinsPages
              ?.flat()
              ?.map(
                ({
                  name,
                  symbol,
                  description,
                  image,
                  cap,
                  reserveBalance,
                  owner,
                  address,
                }) => (
                  <MemeCoinCard
                    key={address}
                    balance={reserveBalance}
                    cap={cap}
                    icon={image}
                    name={name}
                    symbol={symbol}
                    address={address}
                    description={description}
                    creatorAddress={owner}
                    creatorNickname={accounts[owner]?.nickname}
                    creatorProfilePicture={accounts[owner]?.profilePicture}
                    isDescriptionHidden={!!memeCoinAddress}
                    isSelected={memeCoinAddress === address}
                  />
                ),
              )}
            <div className="flex flex-row gap-x2 justify-center items-center self-stretch">
              <SecondaryButton
                className="w-full"
                disabled={
                  isLoading ||
                  !memecoinsPages[currentPage] ||
                  memecoinsPages[currentPage].length < paginationLimit
                }
                onClick={goForward}
              >
                Load more
              </SecondaryButton>
            </div>
          </div>
          {!!memeCoinAddress && (
            <CoinInfo
              key={memeCoinAddress}
              className="flex-1 h-full overflow-auto"
              memeCoinAddress={memeCoinAddress}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default Index;
