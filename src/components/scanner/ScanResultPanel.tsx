import {
  ArrowRight,
  Ban,
  Check,
  RotateCcw,
  SearchX,
  UserX,
  WifiOff,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import type { ScanUIResult } from './types';

interface ScanResultPanelProps {
  result: ScanUIResult;
  onNext: () => void;
  duration: number;
}

const icons: Record<ScanUIResult['tone'], LucideIcon> = {
  valid: Check,
  used: RotateCcw,
  blocked: Ban,
  unauthorized: UserX,
  invalid: SearchX,
  offline: WifiOff,
};

export default function ScanResultPanel({ result, onNext, duration }: ScanResultPanelProps) {
  const Icon = icons[result.tone];
  const valid = result.tone === 'valid';
  const time = result.time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div
      className={cn(
        'gate gate-screen relative flex min-h-[100dvh] flex-col',
        valid ? 'bg-[hsl(var(--slip))] text-[hsl(var(--slip-ink))]' : 'bg-bg text-ink'
      )}
    >
      <p role="status" aria-live="assertive" className="sr-only">
        {result.headline}. {result.name ? `${result.name}, ` : ''}
        {result.ticketNumber ? `ticket ${result.ticketNumber}. ` : ''}
        {result.note}
        {result.instruction ? ` ${result.instruction}` : ''}
      </p>

      <div
        aria-hidden="true"
        className={cn(
          'h-1.5 w-full',
          valid ? 'bg-success' : result.tone === 'offline' ? 'bg-warning' : 'bg-danger'
        )}
      />

      <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-[520px]">
          <div
            className={cn(
              'flex items-center justify-between border-b pb-3 font-mono text-[10px] uppercase tracking-[0.12em]',
              valid
                ? 'border-[hsl(var(--slip-border))] text-[hsl(var(--slip-secondary))]'
                : 'border-border text-ink-tertiary'
            )}
          >
            <span>{result.gate || 'Back of the Church'}</span>
            <span className="tabular">{time}</span>
          </div>

          <div key={`${result.ticketNumber}-${result.headline}`} className="animate-stamp-in">
            <div className="mt-10 flex items-center gap-3">
              <span
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-sm border',
                  valid
                    ? 'border-success/30 bg-success-soft text-success'
                    : result.tone === 'offline'
                      ? 'border-warning/30 bg-warning-soft text-warning'
                      : 'border-danger/30 bg-danger-soft text-danger'
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </span>
              <p
                className={cn(
                  'font-mono text-[10px] uppercase tracking-[0.14em]',
                  valid ? 'text-[hsl(var(--slip-secondary))]' : 'text-ink-tertiary'
                )}
              >
                {valid ? 'Entry granted' : 'Entry refused'}
              </p>
            </div>

            <h1
              className={cn(
                'mt-5 font-display text-stamp font-medium',
                valid ? 'text-[hsl(var(--slip-ink))]' : 'text-ink'
              )}
            >
              {result.headline}
            </h1>

            <p
              className={cn(
                'mt-4 text-[1.35rem] font-medium leading-snug tracking-[-0.02em]',
                valid ? 'text-[hsl(var(--slip-ink))]' : 'text-ink'
              )}
            >
              {result.name || (result.ticketNumber ? `Ticket ${result.ticketNumber}` : 'Unknown ticket')}
            </p>
            <p
              className={cn(
                'mt-1 font-mono text-small tabular',
                valid ? 'text-[hsl(var(--slip-secondary))]' : 'text-ink-secondary'
              )}
            >
              {result.ticketNumber ? `Ticket ${result.ticketNumber}` : 'No ticket read'}
            </p>

            <p
              className={cn(
                'mt-6 max-w-[42ch] text-small leading-relaxed',
                valid ? 'text-[hsl(var(--slip-secondary))]' : 'text-ink-secondary'
              )}
            >
              {result.note}
            </p>

            {result.instruction && (
              <p
                className={cn(
                  'mt-4 border-l-2 pl-3 text-small',
                  result.tone === 'offline' ? 'border-warning text-ink-secondary' : 'border-danger text-ink-secondary'
                )}
              >
                {result.instruction}
              </p>
            )}
          </div>

          <dl
            className={cn(
              'mt-10 grid grid-cols-3 gap-3 border-y py-4',
              valid ? 'border-[hsl(var(--slip-border))]' : 'border-border'
            )}
          >
            <div>
              <dt className={cn('font-mono text-[9px] uppercase tracking-[0.12em]', valid ? 'text-[hsl(var(--slip-secondary))]' : 'text-ink-tertiary')}>
                Entry
              </dt>
              <dd className="mt-1 font-mono text-base font-medium tabular">
                {result.entryNumber !== undefined && result.maxEntries !== undefined
                  ? `${result.entryNumber} of ${result.maxEntries}`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className={cn('font-mono text-[9px] uppercase tracking-[0.12em]', valid ? 'text-[hsl(var(--slip-secondary))]' : 'text-ink-tertiary')}>
                Remaining
              </dt>
              <dd className="mt-1 font-mono text-base font-medium tabular">
                {result.remaining !== undefined ? result.remaining : '—'}
              </dd>
            </div>
            <div>
              <dt className={cn('font-mono text-[9px] uppercase tracking-[0.12em]', valid ? 'text-[hsl(var(--slip-secondary))]' : 'text-ink-tertiary')}>
                Gate
              </dt>
              <dd className="mt-1 truncate text-tiny font-medium">{result.gate || 'Door'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div
        className={cn(
          'border-t px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-10',
          valid ? 'border-[hsl(var(--slip-border))]' : 'border-border'
        )}
      >
        <div className="mx-auto flex w-full max-w-[520px] items-center gap-4">
          <div
            className={cn(
              'h-[3px] flex-1 overflow-hidden',
              valid ? 'bg-[hsl(var(--slip-border))]' : 'bg-sunken'
            )}
            aria-hidden="true"
          >
            <div
              className={cn('drain-bar h-full', valid ? 'bg-success' : result.tone === 'offline' ? 'bg-warning' : 'bg-danger')}
              style={{ animationDuration: `${duration}ms` }}
            />
          </div>
          <Button onClick={onNext} size="lg" className="shrink-0">
            Scan next
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
