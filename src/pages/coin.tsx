import React, { useMemo } from 'react';
import PageHead from '../components/PageHead';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemeCoinConfig, useMemezFactoryConfig } from '../hooks';
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

  const memezFactoryConfig = useMemezFactoryConfig();
  const memeCoinConfig = useMemeCoinConfig(memeCoinAddress);

  const { data, isError } = useReadContracts({
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
    ],
  });

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
                Token cap: <span>{formatEther(data[3].result ?? 0n)}</span>
              </p>
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
