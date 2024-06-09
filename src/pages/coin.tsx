import React, { useMemo } from 'react';
import PageHead from '../components/PageHead';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemeCoinConfig } from '../hooks';
import { Address, formatEther, isAddress, zeroAddress } from 'viem';
import { useReadContracts } from 'wagmi';

export function Coin() {
  const router = useRouter();

  const memeCoinAddress = useMemo(
    () =>
      isAddress(router?.query?.address?.toString() ?? '')
        ? (router?.query?.address as Address)
        : zeroAddress,
    [router],
  );

  const memeCoinConfig = useMemeCoinConfig(memeCoinAddress);

  const { data, isError } = useReadContracts({
    contracts: [
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
    ],
  });

  return (
    <>
      <PageHead
        title="memez"
        subtitle={data?.[1]?.result ?? 'Memecoin'}
        description={`memez ${data?.[0]?.result} memecoin`}
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
                Token name: <span>{data[0].result}</span>
              </p>
              <p>
                Token symbol: <span>{data[1].result}</span>
              </p>
              <p>
                Token cap: <span>{formatEther(data[2].result ?? 0n)}</span>
              </p>
            </>
          ) : (
            <p className="text-text-error">
              Error: cannot get token information!
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default Coin;
