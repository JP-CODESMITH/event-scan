import { cn } from '../../lib/utils';

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-ink text-bg',
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none">
        <circle cx="7" cy="12" r="1.4" fill="currentColor" />
        <circle cx="17" cy="12" r="1.4" fill="currentColor" />
        <path d="M9 12.4l2 2 4.2-4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
        <path d="M4 8.5h16M4 15.5h16" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 2" opacity="0.45" />
      </svg>
    </span>
  );
}

export function Brand({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <BrandMark />
      {!compact && (
        <span className="font-display text-[1.3rem] font-medium leading-none tracking-[-0.035em] text-ink">
          Event <span className="italic text-accent-strong">Scan</span>
        </span>
      )}
    </span>
  );
}
