import Button, { ButtonProps } from './Button';

function SecondaryButton({ className, children, ...props }: ButtonProps) {
  return (
    <Button
      className={`px-x2 py-x1 h-x6 bg-main-shadow border-2 border-main-shadow font-bold text-title text-main-accent disabled:bg-main-black disabled:border-main-black disabled:text-main-shadow [&>img]:disabled:opacity-50 [&>svg]:disabled:opacity-50 enabled:hover:border-main-accent enabled:focus:border-main-accent enabled:active:bg-main-black enabled:active:border-main-black enabled:active:text-main-shadow [&>img]:enabled:active:opacity-50 [&>svg]:enabled:active:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}

export default SecondaryButton;
