import { MouseEvent, ReactNode, useCallback } from 'react';

export type ButtonProps = {
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
      className={`inline-flex gap-x1 flex-shrink-0 rounded-x1 backdrop-blur items-center justify-center transition-all ${className}`}
      onClick={clickHandler}
    >
      {children}
    </button>
  );
}

export default Button;
