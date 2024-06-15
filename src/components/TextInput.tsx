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
      className={`px-x2 py-x1 h-x6 bg-main-shadow font-medium text-title text-main-accent placeholder:text-main-gray border-2 border-main-accent ${
        isError ? 'border-second-error' : ''
      } rounded-x1 disabled:bg-main-black disabled:bg-opacity-30 disabled:border-main-gray disabled:text-main-shadow enabled:focus:placeholder:opacity-50 enabled:active:placeholder:opacity-50 enabled:focus:border-main-light enabled:active:border-main-light ${className}`}
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
