import Button, { ButtonProps } from './Button';

type PrimaryButtonProps = {
  isSmall?: boolean;
} & ButtonProps;

function PrimaryButton({
  className,
  isSmall,
  children,
  ...props
}: PrimaryButtonProps) {
  return (
    <Button
      className={`px-x2 py-x1 h-x6 bg-main-accent ${isSmall ? 'text-body font-regular tracking-body' : 'font-bold text-title'} text-main-black disabled:bg-main-shadow enabled:hover:bg-main-light enabled:focus:bg-main-light enabled:active:bg-main-shadow ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}

export default PrimaryButton;
