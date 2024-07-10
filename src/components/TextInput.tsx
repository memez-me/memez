import { ChangeEvent, HTMLInputTypeAttribute } from 'react';

type TextInputProps = {
  id?: string;
  value?: string | number;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onMax?: (() => void) | undefined;
  placeholder?: string | undefined;
  className?: string;
  inputClassName?: string;
  type?: HTMLInputTypeAttribute;
  disabled?: boolean;
  isError?: boolean;
  isSmall?: boolean;
  min?: number;
  max?: number;
  step?: number;
  accept?: string;
};

function TextInput({
  id,
  value,
  onChange,
  onMax,
  placeholder,
  className,
  inputClassName,
  type = 'text',
  disabled,
  isError,
  isSmall,
  min = 0,
  max = undefined,
  step = 1,
  accept = undefined,
}: TextInputProps) {
  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        className={`p-x2 w-full ${isSmall ? 'small h-x6' : 'h-x9'} bg-main-black bg-opacity-10 font-medium text-title text-main-accent placeholder:text-main-shadow border-2 border-main-shadow ${
          isError ? 'border-second-error' : 'enabled:hover:border-main-accent'
        } ${
          type === 'file' ? 'py-0 content-center' : ''
        } rounded-x1 backdrop-blur transition-all
          disabled:bg-main-black disabled:bg-opacity-30 disabled:border-main-gray disabled:text-main-light disabled:text-opacity-40 disabled:placeholder:text-main-gray
          enabled:hover:bg-main-grey enabled:hover:bg-opacity-50
          enabled:focus:bg-main-grey enabled:focus:bg-opacity-50 enabled:focus:border-main-accent enabled:focus:shadow-element enabled:focus:placeholder:text-transparent
          enabled:active:bg-main-grey enabled:active:bg-opacity-50 enabled:active:border-main-accent enabled:active:shadow-element enabled:active:placeholder:text-transparent
          ${inputClassName}
        `}
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
      {onMax && (
        <button
          className={`absolute right-x2 inset-y-0 my-auto ${isSmall ? 'h-x4 px-x1 py-x0.5 text-body-2 font-medium tracking-body' : 'h-x5 px-x2 py-x1 text-title'} rounded-x1 transition-all
            bg-main-black bg-opacity-30 font-medium text-main-accent
            disabled:text-main-light disabled:text-opacity-40
            enabled:hover:bg-main-light enabled:hover:bg-opacity-40
            enabled:focus:bg-main-light enabled:focus:bg-opacity-40
            enabled:active:bg-main-black enabled:active:bg-opacity-30
          `}
          disabled={disabled}
          onClick={() => onMax()}
        >
          MAX
        </button>
      )}
    </div>
  );
}

export default TextInput;
