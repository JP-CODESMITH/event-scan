import { cn } from '../../lib/utils';

interface ProgressProps {
  value: number;
  max: number;
  label: string;
  className?: string;
  tone?: 'accent' | 'success' | 'ink';
}

export function Progress({ value, max, label, className, tone = 'accent' }: ProgressProps) {
  const safeMax = Math.max(max, 1);
  const percent = Math.min(Math.round((value / safeMax) * 100), 100);
  const fill = tone === 'success' ? 'bg-success' : tone === 'ink' ? 'bg-ink' : 'bg-accent';

  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden bg-sunken', className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className={cn('h-full transition-[width] duration-slow ease-out', fill)} style={{ width: `${percent}%` }} />
    </div>
  );
}
