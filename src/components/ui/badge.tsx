import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 font-mono text-[10px] font-medium uppercase leading-none tracking-[0.08em]',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-sunken text-ink-secondary',
        success: 'border-success/25 bg-success-soft text-success',
        warning: 'border-warning/25 bg-warning-soft text-warning',
        danger: 'border-danger/25 bg-danger-soft text-danger',
        info: 'border-info/25 bg-info-soft text-info',
        accent: 'border-accent/25 bg-accent-soft text-accent-strong',
        outline: 'border-border-strong bg-transparent text-ink-secondary',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span aria-hidden="true" className="status-dot bg-current" />}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
