import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Roboto_Mono } from 'next/font/google';
import { useWeb3Modal, useWeb3ModalState } from '@web3modal/wagmi/react';
import { useAccount, useReadContract } from 'wagmi';
import { LinkButton, PrimaryButton, SecondaryButton } from './buttons';
import { trimAddress } from '../utils';
import { useRouter } from 'next/router';
import AnimatedLogo from './AnimatedLogo';
import { CoinIcon, ProfileIcon } from './icons';
import { formatEther, zeroAddress } from 'viem';
import {
  useFraxswapFactoryConfig,
  useFraxswapPairConfig,
  useMemezConfig,
} from '../hooks';
import { getEthPriceInUsd } from '../apis';
import { ADDRESSES } from '../constants';

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal'],
});

const wethAddress = ADDRESSES.WETH;

export function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { open } = useWeb3Modal();
  const { open: isOpen, loading } = useWeb3ModalState();
  const { address } = useAccount();
  const [ethUsdPrice, setEthUsdPrice] = useState<number>();

  const fraxswapFactoryConfig = useFraxswapFactoryConfig();
  const fraxswapPairConfig = useFraxswapPairConfig(zeroAddress); // address will be overridden
  const { address: memezAddress } = useMemezConfig();

  const { data: pairAddress } = useReadContract({
    ...fraxswapFactoryConfig,
    functionName: 'getPair',
    args: [memezAddress, wethAddress],
  });

  const { data: pairReserves } = useReadContract({
    ...fraxswapPairConfig,
    address: pairAddress,
    functionName: 'getReserves',
    query: {
      enabled: !!pairAddress,
      refetchInterval: 5000,
    },
  });

  const [memezReserves, wethReserves] = useMemo(() => {
    if (!pairReserves) return [1n, 1n];
    const [reserve0, reserve1] = pairReserves as [bigint, bigint, number];
    return BigInt(memezAddress) < BigInt(wethAddress)
      ? [reserve0, reserve1]
      : [reserve1, reserve0];
  }, [memezAddress, pairReserves]);

  const memezUsdPrice = useMemo(
    () =>
      !!pairReserves && !!ethUsdPrice
        ? (ethUsdPrice * Number(formatEther(wethReserves))) /
          Number(formatEther(memezReserves))
        : null,
    [pairReserves, memezReserves, wethReserves, ethUsdPrice],
  );

  useEffect(() => {
    if (!ethUsdPrice) {
      getEthPriceInUsd().then(setEthUsdPrice);
    } else {
      const interval = setInterval(
        () => getEthPriceInUsd().then(setEthUsdPrice),
        5000,
      );
      return () => clearInterval(interval);
    }
  }, [ethUsdPrice]);

  return (
    <>
      <div
        className={`flex flex-col w-full h-full z-[1] ${robotoMono.className}`}
      >
        <div className="flex landscape:flex-row portrait:flex-col items-center self-stretch gap-x2 px-x4 lg:px-x11 py-x2 rounded-b-[20px] bg-main-grey bg-opacity-50">
          <Link
            href="/"
            passHref
            rel="noreferrer"
            className="disabled:shadow hover:font-bold hover:text-main-light focus:text-main-light active:text-main-shadow"
          >
            <AnimatedLogo />
          </Link>
          <div className="flex flex-row portrait:hidden flex-1 justify-around mx-auto max-w-[640px]">
            <LinkButton
              className={`text-title ${router.route === '/' ? 'text-main-light text-shadow' : ''}`}
              href="/"
            >
              Memecoins
            </LinkButton>
            <LinkButton
              className={`text-title ${router.route === '/create' ? 'text-main-light text-shadow' : ''}`}
              href="/create"
            >
              Create
            </LinkButton>
            <LinkButton
              className={`text-title ${router.route === '/pools' ? 'text-main-light text-shadow' : ''}`}
              href="/pools"
            >
              Pools
            </LinkButton>
          </div>
          <div className="flex flex-row items-center gap-x2 text-title font-bold text-left">
            <CoinIcon
              className="inline"
              symbol={'MEMEZ'}
              address={memezAddress}
              size={32}
              src={'/icon.svg'}
            />
            MEMEZ:{' '}
            {memezUsdPrice
              ? '$' + Number(memezUsdPrice.toFixed(4))
              : 'Loading...'}
          </div>
          <div className="flex flex-col gap-2">
            {address ? (
              <SecondaryButton
                onClick={() => router.push(`/profile?address=${address}`)}
              >
                <ProfileIcon address={address} size={32} />
                <span className="text-body-2 font-medium tracking-body">
                  {trimAddress(address)}
                </span>
              </SecondaryButton>
            ) : (
              <PrimaryButton onClick={() => open({ view: 'Connect' })}>
                {isOpen || loading ? 'Connecting...' : 'Connect Wallet'}
              </PrimaryButton>
            )}
          </div>
        </div>
        <div
          id="main"
          className="flex flex-col flex-1 p-4 md:p-8 overflow-auto"
        >
          {children}
        </div>
      </div>
      <svg
        className="absolute inset-x-0 bottom-0 w-screen h-[53vh] pointer-events-none z-0"
        xmlns="http://www.w3.org/2000/svg"
        width="1920"
        height="575"
        viewBox="0 0 1920 575"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          opacity="0.5"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1920 0L1812.8 21.5185C1707.2 43.037 1492.8 86.0741 1280 182.907C1067.2 279.741 852.8 430.37 640 451.889C427.2 473.407 212.8 365.815 107.2 312.019L0.00012207 258.222V581H107.2C212.8 581 427.2 581 640 581C852.8 581 1067.2 581 1280 581C1492.8 581 1707.2 581 1812.8 581H1920V0Z"
          fill="url(#paint0_linear_376_926)"
          fillOpacity="0.2"
        />
        <defs>
          <linearGradient
            id="paint0_linear_376_926"
            x1="960"
            y1="0"
            x2="960"
            y2="581"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#92FFCB" stopOpacity="0.8" />
            <stop offset="1" stopColor="#58997A" stopOpacity="0.02" />
          </linearGradient>
        </defs>
      </svg>
      <div id="modals-container" />
    </>
  );
}
