import { ChangeEvent, useMemo } from 'react';

type RangeInputProps = {
  id?: string;
  value: number;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  isError?: boolean;
  min?: number;
  max?: number;
  step?: number;
  isLogarithmic?: boolean;
};

function RangeInput({
  id,
  value,
  onChange,
  className,
  inputClassName,
  disabled,
  isError,
  min = 0,
  max = 100,
  step,
  isLogarithmic,
}: RangeInputProps) {
  const internal = useMemo(
    () =>
      isLogarithmic
        ? {
            min: Math.log10(min),
            max: Math.log10(max),
            step: step ? Math.log10(step) : 'any',
            value: Math.log10(value),
            onChange: (event: ChangeEvent<HTMLInputElement>) =>
              onChange?.({
                ...event,
                target: {
                  ...event.target,
                  value: (10 ** Number(event.target.value)).toFixed(
                    Math.max(
                      Math.ceil(Math.abs(Math.log10(min))),
                      Math.ceil(Math.abs(Math.log10(max))),
                    ),
                  ),
                },
              }),
          }
        : {
            min,
            max,
            step: step ?? 'any',
            value,
            onChange,
          },
    [isLogarithmic, min, max, step, value, onChange],
  );

  return (
    <div
      className={`relative flex flex-row min-h-x4 items-center ${className}`}
    >
      <input
        id={id}
        className={`w-full ${isError ? 'error' : disabled ? 'disabled' : ''} ${inputClassName}`}
        type="range"
        disabled={disabled}
        value={internal.value}
        onChange={internal.onChange}
        min={internal.min}
        max={internal.max}
        step={internal.step}
      />
      <div
        className={`absolute left-0 inset-y-0 my-auto h-x1 ${isError ? 'bg-second-error' : 'bg-main-accent'} rounded-x1 pointer-events-none shadow-element`}
        style={{
          width:
            ((internal.value - internal.min) / (internal.max - internal.min)) *
              100 +
            '%',
        }}
      />
    </div>
  );
}

export default RangeInput;
