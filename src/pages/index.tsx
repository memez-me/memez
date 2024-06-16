import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageHead from '../components/PageHead';
import Link from 'next/link';
import { useMemeCoinConfig, useMemezFactoryConfig } from '../hooks';
import { Address, zeroAddress } from 'viem';
import {
  useInfiniteReadContracts,
  useReadContract,
  useReadContracts,
} from 'wagmi';
import _ from 'lodash';
import MemeCoinCard from '../components/MemeCoinCard';
import { SecondaryButton } from '../components/buttons';

//const paginationLimit = 50;
const paginationLimit = 12;

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
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [cachedMemecoinsPages, setCachedMemecoinsPages] = useState<
    (MemeCoinData & { address: Address })[][]
  >([]);
  const [accounts, setAccounts] = useState<Record<Address, AccountPartialInfo>>(
    {},
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
      <div className="flex flex-col justify-center items-center">
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
        <div className="grid grid-col-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x4 my-x4">
          {cachedMemecoinsPages[currentPage]?.map(
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
              />
            ),
          )}
        </div>
        <div className="flex flex-row gap-x2 items-center">
          <SecondaryButton
            disabled={isLoading || currentPage === 0}
            onClick={goBack}
          >
            {'<'}
          </SecondaryButton>
          <span className="">{currentPage + 1}</span>
          <SecondaryButton
            disabled={
              isLoading ||
              !memecoinsPages[currentPage] ||
              memecoinsPages[currentPage].length < paginationLimit
            }
            onClick={goForward}
          >
            {'>'}
          </SecondaryButton>
        </div>
      </div>
    </>
  );
}

export default Index;
