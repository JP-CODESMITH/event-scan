import { cn } from '../../lib/utils';

export interface SegmentOption {
  value: string;
  label: string;
  count?: number;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, label, className }: SegmentedControlProps) {
  return (
    <div
      className={cn('flex w-full overflow-hidden rounded-sm border border-border bg-surface sm:w-auto', className)}
      role="group"
      aria-label={label}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-3 text-tiny transition-colors duration-fast focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus sm:flex-none',
              index > 0 && 'border-l border-border',
              active
                ? 'bg-ink font-medium text-bg'
                : 'text-ink-secondary hover:bg-sunken hover:text-ink'
            )}
          >
            <span>{option.label}</span>
            {typeof option.count === 'number' && (
              <span className={cn('font-mono tabular text-[10px]', active ? 'text-bg/60' : 'text-ink-tertiary')}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
