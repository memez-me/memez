import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { trimAddress } from '../utils';
import { Address, formatEther } from 'viem';

type MemeCoinCardProps = {
  className?: string;
  balance: bigint;
  cap: bigint;
  icon?: string;
  name: string;
  symbol: string;
  address: string;
  description?: string;
  creatorAddress: Address;
  creatorNickname?: string;
  creatorProfilePicture?: string;
};

function MemeCoinCard({
  className,
  balance,
  cap,
  icon,
  name,
  symbol,
  address,
  description,
  creatorAddress,
  creatorNickname,
  creatorProfilePicture,
}: MemeCoinCardProps) {
  return (
    <div className={`flex flex-row gap-x1 ${className}`}>
      <Image
        className="rounded-full object-contain"
        src={icon || '/icon.png'}
        alt={`${name} (${symbol}) icon`}
        width={128}
        height={128}
      />
      <div className="flex flex-col w-[280px] overflow-auto">
        <h3 className="text-main-accent">
          Created by{' '}
          <Link
            href={`/profile?address=${creatorAddress}`}
            passHref
            rel="noreferrer"
            className="disabled:shadow hover:font-bold hover:text-main-light focus:text-main-light active:text-main-shadow"
          >
            <Image
              className="inline ounded-full object-contain"
              src={creatorProfilePicture || '/icon.png'}
              alt={`${creatorAddress} icon`}
              width={16}
              height={16}
            />{' '}
            {creatorNickname ?? trimAddress(creatorAddress)}
          </Link>
        </h3>
        <p className="text-main-light">
          {cap > 0n
            ? `Cap: ${formatEther(balance)}/${formatEther(cap)} ETH`
            : 'Already listed'}
        </p>
        <p className="font-bold">
          <Link
            href={`/coin?address=${address}`}
            passHref
            rel="noreferrer"
            className="disabled:shadow hover:font-bold hover:text-main-light focus:text-main-light active:text-main-shadow"
          >
            <b>{name}</b> <b>({symbol})</b>
          </Link>
        </p>
        {description && <p className="font-regular">{description}</p>}
      </div>
    </div>
  );
}

export default MemeCoinCard;
