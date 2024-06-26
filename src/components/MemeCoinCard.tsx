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
  isDescriptionHidden?: boolean;
  isSelected?: boolean;
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
  isDescriptionHidden,
  isSelected,
}: MemeCoinCardProps) {
  return (
    <Link
      href={`/?coin=${address}`}
      passHref
      rel="noreferrer"
      className={`group flex flex-row shrink-0 overflow-hidden max-w-[530px] px-x3 ${isDescriptionHidden ? 'gap-0 border-2 py-x2' : 'gap-[28px] border-4 py-x3 active:border-2 active:p-[26px]'} rounded-x1 backdrop-blur ${isSelected ? 'bg-gradient-to-b shadow-element border-main-accent' : 'border-main-shadow active:border-main-accent active:shadow-element bg-gradient-to-t hover:bg-gradient-to-b'} from-main-accent/16 ${className}`}
    >
      <div className="flex flex-col gap-x2 items-center">
        {isDescriptionHidden && (
          <div
            className="text-title font-bold text-center text-shadow text-nowrap overflow-hidden overflow-ellipsis p-[20px] m-[-20px] max-w-[164px]"
            title={name}
          >
            {name}
          </div>
        )}
        <CoinIcon address={address} size={124} src={icon} symbol={symbol} />
        {isDescriptionHidden && (
          <div
            className="text-body font-medium tracking-body text-center text-nowrap overflow-hidden overflow-ellipsis p-[20px] m-[-20px] max-w-[164px]"
            title={symbol}
          >
            {symbol}
          </div>
        )}
      </div>
      {!isDescriptionHidden && (
        <div className="flex flex-col flex-1 py-[18px] gap-x2 min-w-0">
          <div className="flex flex-col">
            <h4 className="text-title font-bold text-nowrap overflow-hidden overflow-ellipsis p-[20px] m-[-20px] max-w-full group-hover:text-shadow group-active:text-shadow">
              {name} [{symbol}]
            </h4>
            <p className="text-second-success text-body font-medium tracking-body text-nowrap overflow-hidden overflow-ellipsis">
              {cap > 0n
                ? `Cap: ${Number(Number(formatEther(balance)).toFixed(3))}/${formatEther(cap)} ETH`
                : 'Already listed'}
            </p>
          </div>
          <h3 className="flex flex-row flex-nowrap items-center text-main-accent text-body font-medium tracking-body text-nowrap overflow-hidden overflow-ellipsis">
            <span className="mr-x2">Created by</span>
            <ProfileIcon
              className="inline shrink-0"
              address={creatorAddress}
              size={24}
              src={creatorProfilePicture}
            />{' '}
            <span className="ml-x1 text-footnote font-regular tracking-footnote text-main-shadow bg-main-accent rounded-x0.5 h-x3 px-x0.5 content-center overflow-hidden overflow-ellipsis">
              {creatorNickname || trimAddress(creatorAddress)}
            </span>
          </h3>
        </div>
      )}
    </Link>
  );
}

export default MemeCoinCard;
