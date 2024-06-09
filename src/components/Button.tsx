import { MouseEvent, ReactNode, useCallback } from 'react';

type ButtonProps = {
  onClick?: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
};

function Button({
  children,
  onClick,
  disabled = false,
  className,
  id,
}: ButtonProps) {
  const clickHandler = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      onClick?.(event);
    },
    [disabled, onClick],
  );

  return (
    <button
      id={id}
      disabled={disabled}
      type="button"
      className={`px-3 py-2 rounded-lg disabled:opacity-50 border-2 border-text enabled:focus:border-text-hovered enabled:active:border-text-hovered font-inter font-bold text-sm lg:text-base text-text enabled:hover:text-text-hovered enabled:focus:text-text-hovered enabled:active:text-text-hovered transition-all ${className}`}
      onClick={clickHandler}
    >
      {children}
    </button>
  );
}

export default Button;
