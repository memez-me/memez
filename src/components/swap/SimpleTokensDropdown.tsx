import React, { useMemo, useState } from 'react';
import { Address, formatEther, zeroAddress } from 'viem';
import { CoinIcon } from '../icons';

export type TokenInfo = {
  address: Address;
  symbol: string;
  name: string;
  balance?: bigint;
  src?: string;
};

export type SimpleTokensDropdownProps = {
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  tokens: TokenInfo[];
  selected: Address;
  disabled?: boolean;
  isSmall?: boolean;
  isError?: boolean;
  onSelect: (token: Address) => void;
};

function SimpleTokensDropdown({
  className,
  buttonClassName,
  dropdownClassName,
  tokens,
  selected,
  disabled,
  isSmall,
  isError,
  onSelect,
}: SimpleTokensDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedToken = useMemo(
    () => tokens.find(({ address }) => address === selected)!,
    [selected, tokens],
  );

  return (
    <div
      className={`relative flex flex-row items-center justify-start ${className}`}
    >
      <button
        className={`flex flex-row gap-x2 p-x2 items-center w-full ${isSmall ? 'h-x6' : 'h-x9'} bg-main-black bg-opacity-10 font-medium text-title text-main-accent placeholder:text-main-shadow border-2 border-main-shadow ${
          isError ? 'border-second-error' : 'enabled:hover:border-main-accent'
        } rounded-x1 backdrop-blur transition-all
          disabled:bg-main-black disabled:bg-opacity-30 disabled:border-main-gray disabled:text-main-light disabled:text-opacity-40 disabled:placeholder:text-main-gray
          enabled:hover:bg-main-grey enabled:hover:bg-opacity-50
          enabled:focus:bg-main-grey enabled:focus:bg-opacity-50 enabled:focus:border-main-accent enabled:focus:shadow-element enabled:focus:placeholder:text-transparent
          enabled:active:bg-main-grey enabled:active:bg-opacity-50 enabled:active:border-main-accent enabled:active:shadow-element enabled:active:placeholder:text-transparent
          ${buttonClassName}
        `}
        disabled={disabled}
        onClick={disabled ? undefined : () => setIsOpen((old) => !old)}
      >
        <CoinIcon
          symbol={selectedToken.symbol}
          address={selectedToken.address}
          src={selectedToken.src}
          size={isSmall ? 24 : 40}
        />
        <span>{isOpen ? '⏶' : '⏷'}</span>
      </button>
      {isOpen && (
        <div
          className={`absolute top-full mt-[-1px] min-w-full z-10 rounded-x1 bg-main-gray border border-main-shadow backdrop-blur ${dropdownClassName}`}
        >
          {tokens.map(({ address, symbol, name, src, balance }) => (
            <div
              key={address}
              className="flex flex-row items-center gap-x2 p-x1 rounded-x1 backdrop-blur cursor-pointer border border-transparent hover:border-main-shadow active:border-main-shadow hover:bg-gradient-to-b active:bg-gradient-to-t from-main-accent/16"
              onClick={() => {
                onSelect(address);
                setIsOpen(false);
              }}
            >
              <div className="shrink-0">
                <CoinIcon
                  symbol={symbol}
                  address={address}
                  src={src}
                  size={isSmall ? 24 : 40}
                />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="text-main-light text-body font-medium tracking-body">
                  {symbol}
                </div>
                <div className="overflow-hidden overflow-ellipsis text-footnote font-bold tracking-footnote">
                  {name}
                </div>
              </div>
              <div className="flex flex-col shrink-0 min-w-0 text-footnote font-bold tracking-footnote">
                <div>Balance:</div>
                <div className="overflow-hidden overflow-ellipsis text-right">
                  {balance !== undefined
                    ? Number(formatEther(balance)).toFixed(3)
                    : 'unknown'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SimpleTokensDropdown;
