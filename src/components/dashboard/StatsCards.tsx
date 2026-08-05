import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Users,
  DoorOpen,
  DoorClosed,
  Ban,
  Smartphone,
  Target,
  Clock,
  Calendar,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface StatsData {
  totalTickets: number;
  maxEntries: number;
  uniqueTicketsScanned: number;
  entriesUsed: number;
  remainingEntries: number;
  deniedAttempts: number;
  activeScanners: number;
  peopleInside: number;
  authorizedTickets: number;
  unauthorizedTickets: number;
  deniedUnauthorized: number;
}

interface Props {
  stats: StatsData | null;
  currentTime: Date;
}

function useAnimatedCounter(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    const start = performance.now();
    let frameId: number;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);
  return count;
}

interface StatCardConfig {
  label: string;
  key: keyof StatsData;
  icon: React.ReactNode;
  gradient: string;
}

const statCards: StatCardConfig[] = [
  {
    label: 'Total Tickets',
    key: 'totalTickets',
    icon: <Ticket className="h-5 w-5" />,
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    label: 'Max Entries',
    key: 'maxEntries',
    icon: <Target className="h-5 w-5" />,
    gradient: 'from-emerald-500 to-emerald-600',
  },
  {
    label: 'Unique Scanned',
    key: 'uniqueTicketsScanned',
    icon: <Users className="h-5 w-5" />,
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    label: 'People Inside',
    key: 'peopleInside',
    icon: <DoorOpen className="h-5 w-5" />,
    gradient: 'from-amber-500 to-amber-600',
  },
  {
    label: 'Entries Used',
    key: 'entriesUsed',
    icon: <DoorClosed className="h-5 w-5" />,
    gradient: 'from-rose-500 to-rose-600',
  },
  {
    label: 'Remaining Entries',
    key: 'remainingEntries',
    icon: <Clock className="h-5 w-5" />,
    gradient: 'from-cyan-500 to-cyan-600',
  },
  {
    label: 'Denied Attempts',
    key: 'deniedAttempts',
    icon: <Ban className="h-5 w-5" />,
    gradient: 'from-indigo-500 to-indigo-600',
  },
  {
    label: 'Active Scanners',
    key: 'activeScanners',
    icon: <Smartphone className="h-5 w-5" />,
    gradient: 'from-teal-500 to-teal-600',
  },
  {
    label: 'Authorized Tickets',
    key: 'authorizedTickets',
    icon: <ShieldCheck className="h-5 w-5" />,
    gradient: 'from-emerald-500 to-emerald-600',
  },
  {
    label: 'Unauthorized Tickets',
    key: 'unauthorizedTickets',
    icon: <ShieldX className="h-5 w-5" />,
    gradient: 'from-amber-500 to-amber-600',
  },
  {
    label: 'Denied (Unauthorized)',
    key: 'deniedUnauthorized',
    icon: <Ban className="h-5 w-5" />,
    gradient: 'from-red-500 to-red-600',
  },
];

function StatCardSkeleton() {
  return (
    <Card className="border-0 bg-white/5 backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/10 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
            <div className="h-6 w-16 rounded bg-white/10 animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  config,
  value,
}: {
  config: StatCardConfig;
  value: number;
}) {
  const animatedValue = useAnimatedCounter(value);

  return (
    <Card
      className={cn(
        'group relative border-0 overflow-hidden',
        'bg-white/5 backdrop-blur-xl',
        'transition-all duration-300',
        'hover:bg-white/10 hover:shadow-2xl hover:shadow-black/20',
        'hover:-translate-y-0.5'
      )}
    >
      <div
        className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100',
          'transition-opacity duration-300',
          `bg-gradient-to-br ${config.gradient}`
        )}
        style={{ maskImage: 'linear-gradient(to bottom right, transparent 60%, black 100%)' }}
      />
      <CardContent className="relative p-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              `bg-gradient-to-br ${config.gradient}`,
              'shadow-lg'
            )}
          >
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-white/60">
              {config.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-white tabular-nums">
              {animatedValue.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatsCards({ stats, currentTime }: Props) {
  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats
          ? statCards.map((card) => (
              <StatCard
                key={card.key}
                config={card}
                value={stats[card.key]}
              />
            ))
          : Array.from({ length: 8 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
      </div>

      <div className="flex items-center justify-center gap-6 py-3 px-5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="flex items-center gap-2 text-white/60">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-mono tabular-nums">
            {formatTime(currentTime)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/60">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">{formatDate(currentTime)}</span>
        </div>
      </div>
    </div>
  );
}
