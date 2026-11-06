import { formatClock, formatCount } from '../../lib/utils';
import { Skeleton } from '../ui/skeleton';
import type { Stats } from '../../types';

interface Props {
  stats: Stats | null;
  currentTime: Date;
}

export default function StatsCards({ stats, currentTime }: Props) {
  if (!stats) {
    return (
      <div className="overflow-hidden rounded-md border border-border bg-surface" aria-busy="true">
        <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface p-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-4 h-9 w-24" />
              <Skeleton className="mt-3 h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="border-t border-border px-5 py-3">
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
    );
  }

  const capacity = Math.max(stats.maxEntries, 0);
  const inside = Math.max(stats.peopleInside, 0);
  const fill = capacity > 0 ? Math.min((inside / capacity) * 100, 100) : 0;

  return (
    <section aria-label="Event totals" className="overflow-hidden rounded-md border border-border bg-surface">
      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-5">
        <div className="col-span-2 bg-surface p-5 lg:col-span-1">
          <p className="eyebrow">People inside</p>
          <p className="mt-3 font-mono text-[2.75rem] font-medium leading-none tabular text-ink">
            {formatCount(inside)}
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
            of {formatCount(capacity)} entries
          </p>
          <div className="mt-4 h-[3px] w-full overflow-hidden bg-sunken" aria-hidden="true">
            <div className="h-full bg-accent transition-[width] duration-slow ease-out" style={{ width: `${fill}%` }} />
          </div>
        </div>

        <Metric label="Entries used" value={formatCount(stats.entriesUsed)} detail={`${stats.uniqueTicketsScanned} ${stats.uniqueTicketsScanned === 1 ? 'ticket' : 'tickets'} scanned`} />
        <Metric label="Remaining" value={formatCount(stats.remainingEntries)} detail="entries left on all tickets" />
        <Metric
          label="Denied"
          value={formatCount(stats.deniedAttempts)}
          detail={`${formatCount(stats.deniedUnauthorized)} unauthorised`}
          tone={stats.deniedAttempts > 0 ? 'danger' : 'neutral'}
        />
        <Metric
          label="On the door"
          value={formatCount(stats.activeScanners)}
          detail={stats.activeScanners === 0 ? 'no scanners online' : stats.activeScanners === 1 ? 'scanner online' : 'scanners online'}
          tone={stats.activeScanners > 0 ? 'success' : 'neutral'}
          dot
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border bg-sunken/40 px-5 py-3 text-tiny text-ink-secondary">
        <span>
          <span className="font-mono tabular text-ink">{formatCount(stats.totalTickets)}</span> tickets
        </span>
        <span>
          <span className="font-mono tabular text-ink">{formatCount(stats.authorizedTickets)}</span> authorised
        </span>
        <span>
          <span className="font-mono tabular text-ink">{formatCount(stats.unauthorizedTickets)}</span> awaiting authorisation
        </span>
        <span className="ml-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
          <span className="status-dot bg-success" aria-hidden="true" />
          Live · {formatClock(currentTime)}
        </span>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
  tone = 'neutral',
  dot = false,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'success' | 'danger';
  dot?: boolean;
}) {
  return (
    <div className="bg-surface p-5">
      <p className="eyebrow">{label}</p>
      <p
        className={
          tone === 'danger'
            ? 'mt-3 font-mono text-[2rem] font-medium leading-none tabular text-danger'
            : 'mt-3 font-mono text-[2rem] font-medium leading-none tabular text-ink'
        }
      >
        {value}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-tiny text-ink-tertiary">
        {dot && (
          <span
            aria-hidden="true"
            className={tone === 'success' ? 'status-dot bg-success' : 'status-dot bg-ink-tertiary'}
          />
        )}
        {detail}
      </p>
    </div>
  );
}
