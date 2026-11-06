import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'btn-press inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-sm border text-small font-medium transition-[background-color,border-color,color,transform] duration-fast ease-out focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        primary:
          'border-ink bg-ink text-bg hover:bg-ink/90 active:bg-ink',
        accent:
          'border-accent bg-accent text-paper hover:bg-accent-strong active:bg-accent-strong',
        outline:
          'border-border-strong bg-transparent text-ink hover:border-ink hover:bg-surface active:bg-sunken',
        secondary:
          'border-transparent bg-sunken text-ink hover:bg-sunken/70',
        ghost:
          'border-transparent bg-transparent text-ink-secondary hover:bg-sunken hover:text-ink',
        danger:
          'border-danger bg-danger text-bg hover:bg-danger/90',
        'danger-quiet':
          'border-transparent bg-transparent text-danger hover:bg-danger-soft',
        link:
          'border-transparent bg-transparent text-accent-strong underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-4',
        sm: 'h-9 px-3 text-tiny',
        lg: 'h-12 px-6 text-base',
        icon: 'h-11 w-11 px-0',
        'icon-sm': 'h-9 w-9 px-0',
        'icon-lg': 'h-12 w-12 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <span
              aria-hidden="true"
              className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
            />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
