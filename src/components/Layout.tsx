import React, { ReactNode } from 'react';
import Image from 'next/image';
import { Roboto_Mono } from 'next/font/google';
import { useWeb3Modal, useWeb3ModalState } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';
import { PrimaryButton, SecondaryButton } from './buttons';
import { trimAddress } from '../utils';
import { useRouter } from 'next/router';
import AnimatedLogo from './AnimatedLogo';

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal'],
});

export function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { open } = useWeb3Modal();
  const { open: isOpen, loading } = useWeb3ModalState();
  const { address } = useAccount();
  const profilePicture = '/icon.png'; // TODO: load picture

  return (
    <>
      <div className={`flex flex-col w-full h-full ${robotoMono.className}`}>
        <div className="flex landscape:flex-row portrait:flex-col items-center self-stretch gap-x2 p-x4 lg:px-x11 rounded-b-[20px] bg-main-grey bg-opacity-50">
          <AnimatedLogo />
          <div className="flex flex-col gap-2 ml-auto">
            {address ? (
              <SecondaryButton
                onClick={() => router.push(`/profile?address=${address}`)}
              >
                <Image
                  className="rounded-full object-contain flex-shrink-0"
                  src={profilePicture}
                  width={32}
                  height={32}
                  alt="Profile picture"
                />
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
        <div className="flex flex-col p-4 md:p-8 overflow-auto">{children}</div>
      </div>
      <div id="modals-container" />
    </>
  );
}
