import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn, formatTime } from '../../lib/utils';
import { Skeleton } from '../ui/skeleton';

interface Scan {
  id: number;
  ticketNumber: string;
  time: string;
  gate: string;
  device: string;
  result: string;
  entriesUsed: number;
  remaining: number;
  ticket_name?: string;
  ticketName?: string;
}

interface Props {
  scans: Scan[];
  loading?: boolean;
}

export default function LiveFeed({ scans, loading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(scans.length);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const prevLen = prevLengthRef.current;
    prevLengthRef.current = scans.length;

    if (scans.length > prevLen && prevLen > 0) {
      const newScanIds = new Set(scans.slice(0, scans.length - prevLen).map((s) => s.id));
      setNewIds(newScanIds);
      const timer = setTimeout(() => setNewIds(new Set()), 900);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return () => clearTimeout(timer);
    }
  }, [scans]);

  return (
    <section aria-label="Live scan feed" className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="eyebrow">Live feed</p>
          <h3 className="mt-1 flex items-center gap-2 text-small font-medium text-ink">
            <span className="status-dot bg-success" aria-hidden="true" />
            The gate as it happens
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
          {scans.length} {scans.length === 1 ? 'scan' : 'scans'}
        </span>
      </div>

      <div ref={containerRef} className="scroll-thin max-h-[520px] flex-1 overflow-y-auto">
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="h-5 w-5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-sunken font-mono text-small text-ink-tertiary">
              00
            </span>
            <p className="mt-4 font-display text-[1.2rem] font-medium text-ink">The door is quiet</p>
            <p className="mt-1 text-small text-ink-secondary">Scans will appear here the moment a gate checks someone in.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {scans.map((scan) => {
              const isSuccess = scan.result === 'SUCCESS';
              const name = scan.ticketName || scan.ticket_name;
              return (
                <li
                  key={scan.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3.5 transition-colors',
                    newIds.has(scan.id) && 'animate-tick bg-sunken/50'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border',
                      isSuccess
                        ? 'border-success/25 bg-success-soft text-success'
                        : 'border-danger/25 bg-danger-soft text-danger'
                    )}
                  >
                    {isSuccess ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                    ) : (
                      <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate font-mono text-small font-medium tabular text-ink">
                        {scan.ticketNumber}
                      </p>
                      <time className="shrink-0 font-mono text-[10px] tabular text-ink-tertiary">
                        {formatTime(scan.time)}
                      </time>
                    </div>
                    <p className="mt-0.5 truncate text-tiny text-ink-secondary">
                      {name || (isSuccess ? 'Admitted' : 'Refused')}
                      {isSuccess && scan.entriesUsed > 0 && (
                        <span className="text-ink-tertiary">
                          {' '}· entry {scan.entriesUsed}
                          {scan.remaining > 0 ? `, ${scan.remaining} left` : ', final entry'}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
                      {scan.gate}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
