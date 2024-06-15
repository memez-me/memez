import React from 'react';

type BuySellSwitchProps = {
  isBuy: boolean;
  onChange: (isBuy: boolean) => void;
};

function BuySellSwitch({ isBuy, onChange }: BuySellSwitchProps) {
  return (
    <div className="flex flex-row gap-x1">
      <div
        className={`relative inline-flex gap-x1 flex-shrink-0 rounded-x1 items-center justify-center flex-1 transition-all px-x2 py-x1 h-x9 font-medium text-headline-2 ${isBuy ? 'bg-main-light text-main-black' : 'bg-main-black bg-opacity-30 text-main-accent'}`}
      >
        <input
          id="buy-radio"
          className="hidden"
          type="radio"
          value="buy"
          checked={isBuy}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <label
          className="absolute inset-0 text-center content-center cursor-pointer"
          htmlFor="buy-radio"
        >
          Buy
        </label>
      </div>
      <div
        className={`relative inline-flex gap-x1 flex-shrink-0 rounded-x1 items-center justify-center flex-1 transition-all px-x2 py-x1 h-x9 font-medium text-headline-2 ${!isBuy ? 'bg-second-sell text-main-black' : 'bg-main-black bg-opacity-30 text-main-accent'}`}
      >
        <input
          id="sell-radio"
          className="hidden"
          type="radio"
          value="sell"
          checked={!isBuy}
          onChange={(e) => onChange?.(!e.target.checked)}
        />
        <label
          className="absolute inset-0 text-center content-center cursor-pointer"
          htmlFor="sell-radio"
        >
          Sell
        </label>
      </div>
    </div>
  );
}

export default BuySellSwitch;
