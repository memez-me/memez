import { ChangeEvent, HTMLInputTypeAttribute } from 'react';

type TextInputProps = {
  value?: string | number;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string | undefined;
  className?: string;
  type?: HTMLInputTypeAttribute;
  disabled?: boolean;
  isError?: boolean;
  min?: number;
  max?: number;
  step?: number;
  accept?: string;
};

function TextInput({
  value,
  onChange,
  placeholder,
  className,
  type = 'text',
  disabled,
  isError,
  min = 0,
  max = undefined,
  step = 1,
  accept = undefined,
}: TextInputProps) {
  return (
    <input
      className={`px-3 py-1.5 bg-input-background placeholder:text-input-placeholder border border-input-border ${
        isError ? 'border-text-error' : ''
      } rounded-lg text-base font-normal text-text disabled:opacity-50 enabled:focus:placeholder:opacity-50 enabled:active:placeholder:opacity-50 enabled:focus:border-text-hovered enabled:active:border-text-hovered ${className}`}
      type={type}
      disabled={disabled}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={type === 'number' ? min : undefined}
      max={type === 'number' ? max : undefined}
      step={type === 'number' ? step : undefined}
      accept={accept}
    />
  );
}

export default TextInput;
