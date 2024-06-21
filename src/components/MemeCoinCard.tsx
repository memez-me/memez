import React from 'react';
import Link from 'next/link';
import { trimAddress } from '../utils';
import { Address, formatEther } from 'viem';
import { CoinIcon, ProfileIcon } from './icons';

type MemeCoinCardProps = {
  className?: string;
  balance: bigint;
  cap: bigint;
  icon?: string;
  name: string;
  symbol: string;
  address: Address;
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
      <Link
        href={`/coin?address=${address}`}
        passHref
        rel="noreferrer"
        className="disabled:shadow hover:font-bold hover:text-main-light focus:text-main-light active:text-main-shadow"
      >
        <CoinIcon address={address} size={128} src={icon} symbol={symbol} />
      </Link>
      <div className="flex flex-col w-[280px] max-h-[128px] leading-[25.5px] overflow-auto">
        <h3 className="text-main-accent">
          Created by{' '}
          <Link
            href={`/profile?address=${creatorAddress}`}
            passHref
            rel="noreferrer"
            className="disabled:shadow hover:font-bold hover:text-main-light focus:text-main-light active:text-main-shadow"
          >
            <ProfileIcon
              className="inline"
              address={creatorAddress}
              size={16}
              src={creatorProfilePicture}
            />{' '}
            {creatorNickname || trimAddress(creatorAddress)}
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
