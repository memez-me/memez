import Button, { ButtonProps } from './Button';

function PrimaryButton({ className, children, ...props }: ButtonProps) {
  return (
    <Button
      className={`px-x2 py-x1 h-x6 bg-main-accent font-bold text-title text-main-black disabled:bg-main-shadow enabled:hover:bg-main-light enabled:focus:bg-main-light enabled:active:bg-main-shadow ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}

export default PrimaryButton;
