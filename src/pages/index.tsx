import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageHead from '../components/PageHead';
import Link from 'next/link';
import {
  useMemeCoinConfig,
  useMemezFactoryConfig,
  useMemeCoinListingManagerConfig,
} from '../hooks';
import { Address, getAbiItem, isAddress, zeroAddress } from 'viem';
import {
  useClient,
  useInfiniteReadContracts,
  useReadContract,
  useReadContracts,
} from 'wagmi';
import _ from 'lodash';
import MemeCoinCard from '../components/MemeCoinCard';
import { useRouter } from 'next/router';
import { CoinInfo } from '../components/panels';
import InfiniteScroll from 'react-infinite-scroll-component';
import { LinkButton } from '../components/buttons';
import { getLogs } from 'viem/actions';

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
  const router = useRouter();
  const client = useClient();
  const [currentPage, setCurrentPage] = useState(0);
  const [listedCount, setListedCount] = useState<number>();
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
  const listingManagerConfig = useMemeCoinListingManagerConfig();
  const memeCoinConfig = useMemeCoinConfig(zeroAddress); // address will be overridden

  useEffect(() => {
    if (!client || !listingManagerConfig) return;

    getLogs(client, {
      address: listingManagerConfig.address,
      event: getAbiItem({
        abi: listingManagerConfig.abi,
        name: 'MemeCoinListed',
      }),
      strict: true,
      fromBlock: 6654447n,
    }).then((listedEvents) => setListedCount(listedEvents.length * 2 + 1));
  }, [client, listingManagerConfig]);

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

  const goForward = useCallback(async () => {
    setIsLoading(true);
    if ((memecoinsData as any)?.pageParams?.length <= currentPage + 1) {
      await fetchNextAddressesPage();
      await refetchDataPage();
      await fetchNextDataPage();
    }
    setCurrentPage((old) => old + 1);
    setIsLoading(false);
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
      <div
        className={`container self-center flex flex-col gap-x4 justify-center items-center ${!!memeCoinAddress ? 'overflow-hidden' : ''}`}
      >
        {!memeCoinAddress && (
          <div className="container flex flex-col gap-x6 pt-x2">
            <Link
              href="/create"
              passHref
              rel="noreferrer"
              className="group flex flex-row gap-x3 self-center p-x3 w-full max-w-[510px] border-2 border-main-accent rounded-x1 items-center backdrop-blur hover:shadow-element active:shadow-element hover:bg-gradient-to-b active:bg-gradient-to-t from-main-accent/16"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="124"
                height="124"
                viewBox="0 0 124 124"
                fill="none"
              >
                <path
                  d="M0.5 62C0.5 60.6471 0.543679 59.3044 0.629695 57.9734L0.130736 57.9411C0.30731 55.2087 0.660884 52.5246 1.18011 49.9L1.6706 49.997C2.19614 47.3405 2.89275 44.7456 3.74848 42.2241L3.275 42.0635C4.14974 39.486 5.1894 36.9847 6.38141 34.5721L6.82968 34.7936C8.02292 32.3786 9.3701 30.0531 10.8584 27.83L10.4429 27.5518C11.951 25.2993 13.6028 23.151 15.3851 21.1203L15.7609 21.4501C17.5317 19.4325 19.4325 17.5317 21.4501 15.7609L21.1203 15.3851C23.151 13.6028 25.2993 11.951 27.5518 10.4429L27.83 10.8584C30.0531 9.37011 32.3786 8.02292 34.7936 6.82968L34.5721 6.38141C36.9847 5.1894 39.486 4.14974 42.0635 3.275L42.2241 3.74848C44.7456 2.89275 47.3405 2.19614 49.997 1.6706L49.9 1.18011C52.5246 0.660884 55.2087 0.307309 57.9411 0.130735L57.9734 0.629695C59.3044 0.543679 60.6471 0.5 62 0.5C63.3529 0.5 64.6956 0.543679 66.0266 0.629695L66.0589 0.130736C68.7913 0.30731 71.4754 0.660884 74.1 1.18011L74.003 1.6706C76.6595 2.19614 79.2544 2.89275 81.7758 3.74848L81.9365 3.275C84.514 4.14974 87.0153 5.1894 89.4279 6.38141L89.2064 6.82968C91.6214 8.02292 93.9469 9.3701 96.17 10.8584L96.4482 10.4429C98.7007 11.951 100.849 13.6028 102.88 15.3851L102.55 15.7609C104.568 17.5317 106.468 19.4325 108.239 21.4501L108.615 21.1203C110.397 23.151 112.049 25.2993 113.557 27.5518L113.142 27.83C114.63 30.0531 115.977 32.3786 117.17 34.7936L117.619 34.5721C118.811 36.9847 119.85 39.486 120.725 42.0635L120.252 42.2241C121.107 44.7456 121.804 47.3405 122.329 49.997L122.82 49.9C123.339 52.5246 123.693 55.2087 123.869 57.9411L123.37 57.9734C123.456 59.3044 123.5 60.6471 123.5 62C123.5 63.3529 123.456 64.6956 123.37 66.0266L123.869 66.0589C123.693 68.7913 123.339 71.4754 122.82 74.1L122.329 74.003C121.804 76.6595 121.107 79.2544 120.252 81.7758L120.725 81.9365C119.85 84.514 118.811 87.0153 117.619 89.4279L117.17 89.2064C115.977 91.6214 114.63 93.9469 113.142 96.17L113.557 96.4482C112.049 98.7007 110.397 100.849 108.615 102.88L108.239 102.55C106.468 104.568 104.568 106.468 102.55 108.239L102.88 108.615C100.849 110.397 98.7007 112.049 96.4482 113.557L96.17 113.142C93.9469 114.63 91.6214 115.977 89.2064 117.17L89.4279 117.619C87.0153 118.811 84.514 119.85 81.9365 120.725L81.7758 120.252C79.2544 121.107 76.6595 121.804 74.003 122.329L74.1 122.82C71.4754 123.339 68.7913 123.693 66.0589 123.869L66.0266 123.37C64.6956 123.456 63.3529 123.5 62 123.5C60.6471 123.5 59.3044 123.456 57.9734 123.37L57.9411 123.869C55.2087 123.693 52.5246 123.339 49.9 122.82L49.997 122.329C47.3405 121.804 44.7456 121.107 42.2241 120.252L42.0635 120.725C39.486 119.85 36.9847 118.811 34.5721 117.619L34.7936 117.17C32.3786 115.977 30.0531 114.63 27.83 113.142L27.5518 113.557C25.2993 112.049 23.151 110.397 21.1203 108.615L21.4501 108.239C19.4325 106.468 17.5317 104.568 15.7609 102.55L15.3851 102.88C13.6028 100.849 11.951 98.7007 10.4429 96.4482L10.8584 96.17C9.37011 93.9469 8.02292 91.6214 6.82968 89.2064L6.38141 89.4279C5.1894 87.0153 4.14974 84.514 3.275 81.9365L3.74848 81.7758C2.89275 79.2544 2.19614 76.6595 1.6706 74.003L1.18011 74.1C0.660884 71.4754 0.307309 68.7913 0.130735 66.0589L0.629695 66.0266C0.543679 64.6956 0.5 63.3529 0.5 62Z"
                  stroke="#92FFCB"
                  strokeDasharray="8 8"
                />
                <path
                  d="M62 41V83M83 62L41 62"
                  stroke="#92FFCB"
                  strokeWidth="5.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="flex-1 text-center font-regular text-headline-2 leading-normal uppercase group-hover:text-shadow group-active:text-shadow">
                [create memecoin]
              </span>
            </Link>
            <div className="flex flex-row flex-wrap w-full justify-between">
              <h3 className="text-headline font-bold text-left self-start">
                Total{' '}
                <LinkButton className="text-headline font-bold !p-0" href="/">
                  memecoins
                </LinkButton>
                : {count !== undefined ? Number(count) : 'loading...'}
              </h3>
              <h3 className="text-headline font-bold text-right self-end">
                Listed{' '}
                <LinkButton
                  className="text-headline font-bold !p-0"
                  href="/pools"
                >
                  pools
                </LinkButton>
                :{' '}
                {listedCount !== undefined ? Number(listedCount) : 'loading...'}
              </h3>
            </div>
          </div>
        )}
        <div className="flex flex-row w-full justify-center overflow-hidden">
          <div id="cards-container" className="h-full shrink-0 overflow-auto">
            <InfiniteScroll
              key={!!memeCoinAddress + ''}
              className={`grid grid-cols-1 ${!!memeCoinAddress ? 'gap-x1' : 'xl:grid-cols-2 2xl:grid-cols-3 auto-rows-fr gap-x3'} px-x2 py-x0.5 max-h-full`}
              dataLength={
                cachedMemecoinsPages?.reduce(
                  (length, page) => length + page.length,
                  0,
                ) ?? 0
              }
              next={goForward}
              hasMore={
                (currentPage === 0 && !memecoinsPages[0]) ||
                (!memecoinsPages[currentPage] &&
                  currentPage > 0 &&
                  (memecoinsPages[currentPage - 1]?.length ?? 0) > 0) ||
                (memecoinsPages[currentPage]?.length ?? 0) >= paginationLimit
              }
              loader={
                <p
                  className={`text-center content-center bg-main-gray bg-opacity-50 rounded-x1 p-x3 ${!!memeCoinAddress ? 'max-w-[176px]' : ''}`}
                >
                  Loading...
                </p>
              }
              endMessage={
                <p
                  className={`text-center content-center bg-main-gray bg-opacity-50 rounded-x1 p-x3 ${!!memeCoinAddress ? 'max-w-[176px]' : ''}`}
                >
                  No more memecoins
                </p>
              }
              scrollableTarget={!!memeCoinAddress ? 'cards-container' : 'main'}
            >
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
            </InfiniteScroll>
          </div>
          {!!memeCoinAddress && (
            <CoinInfo
              key={memeCoinAddress}
              className="flex-1 h-full overflow-hidden portrait:overflow-auto"
              memeCoinAddress={memeCoinAddress}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default Index;
