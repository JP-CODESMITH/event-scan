import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Skeleton } from '../ui/skeleton';

interface ChartData {
  hourlyEntries: Array<{ hour: string; count: number }>;
  entriesByGate: Array<{ gate: string; count: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
  entriesUsed: number;
  remaining: number;
}

interface Props {
  data: ChartData | null;
}

const axisStyle = {
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: 9,
  fill: 'hsl(var(--ink-tertiary))',
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border border-border-strong bg-raised px-3 py-2 shadow-float">
      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-tertiary">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="mt-0.5 font-mono text-small tabular text-ink">
          {entry.value} <span className="text-ink-tertiary">{entry.name === 'count' ? 'entries' : entry.name}</span>
        </p>
      ))}
    </div>
  );
}

function EmptyChart({ height, message }: { height: number; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-center" style={{ height }}>
      <span className="h-px w-10 bg-border-strong" aria-hidden="true" />
      <p className="text-tiny text-ink-tertiary">{message}</p>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  aside,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  aside?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3 className="mt-1 text-small font-medium text-ink">{title}</h3>
        </div>
        {aside && <p className="font-mono text-tiny tabular text-ink-secondary">{aside}</p>}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function GateBars({ data }: { data: ChartData['entriesByGate'] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  if (data.length === 0) {
    return <p className="px-2 py-12 text-center text-tiny text-ink-tertiary">No gate activity yet</p>;
  }
  return (
    <ul className="space-y-4 px-1 py-2">
      {data.map((gate) => (
        <li key={gate.gate}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-small text-ink-secondary">{gate.gate}</span>
            <span className="font-mono text-small font-medium tabular text-ink">{gate.count}</span>
          </div>
          <div className="mt-1.5 h-[5px] w-full bg-sunken" aria-hidden="true">
            <div className="h-full bg-ink" style={{ width: `${(gate.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function UsageDonut({ used, remaining }: { used: number; remaining: number }) {
  const total = used + remaining;
  const data = [
    { name: 'Used', value: used },
    { name: 'Remaining', value: remaining },
  ];
  const percent = total > 0 ? Math.round((used / total) * 100) : 0;

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={78}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill="hsl(var(--accent))" />
            <Cell fill="hsl(var(--sunken))" />
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-mono text-[1.75rem] font-medium leading-none tabular text-ink">{percent}%</p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-tertiary">used</p>
      </div>
      <div className="flex items-center justify-center gap-5 pb-2 text-tiny text-ink-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 bg-accent" aria-hidden="true" />
          {used} used
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 bg-sunken" aria-hidden="true" />
          {remaining} left
        </span>
      </div>
    </div>
  );
}

export default function Charts({ data }: Props) {
  if (!data) {
    return (
      <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-[190px] w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
      <Panel
        eyebrow="Throughput"
        title="Entries by hour"
        aside={`${data.entriesUsed} total`}
        className="bg-surface sm:col-span-2"
      >
        {data.hourlyEntries.length === 0 ? (
          <EmptyChart height={210} message="No entries recorded today" />
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={data.hourlyEntries} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} strokeDasharray="2 4" />
              <XAxis dataKey="hour" tick={axisStyle} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} dy={6} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(var(--border-strong))', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="count"
                name="count"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                fill="hsl(var(--accent) / 0.12)"
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--accent))', stroke: 'hsl(var(--surface))', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Panel>

      <Panel eyebrow="Distribution" title="Entries per gate" className="bg-surface">
        <GateBars data={data.entriesByGate} />
      </Panel>

      <Panel
        eyebrow="Capacity"
        title="Ticket usage"
        aside={`${data.entriesUsed + data.remaining} entries`}
        className="bg-surface"
      >
        <UsageDonut used={data.entriesUsed} remaining={data.remaining} />
      </Panel>

      <Panel eyebrow="Trend" title="Last 7 days" className="bg-surface sm:col-span-2">
        {data.dailyActivity.length === 0 ? (
          <EmptyChart height={170} message="No activity in the last week" />
        ) : (
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={data.dailyActivity} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} strokeDasharray="2 4" />
              <XAxis dataKey="date" tick={axisStyle} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} dy={6} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--sunken) / 0.6)' }} />
              <Bar dataKey="count" fill="hsl(var(--ink))" radius={[1, 1, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>
    </div>
  );
}
