import React, { useRef, useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  QrCode,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn, formatTime } from '../../lib/utils';

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

function ScanItem({ scan, isNew }: { scan: Scan; isNew: boolean }) {
  const isSuccess = scan.result === 'SUCCESS';
  const name = scan.ticketName || scan.ticket_name;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 border-l-4 transition-all duration-300',
        isSuccess
          ? 'border-l-emerald-500 hover:bg-white/5'
          : 'border-l-red-500 hover:bg-white/5',
        isNew && 'animate-slide-in'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          isSuccess ? 'bg-emerald-500/20' : 'bg-red-500/20'
        )}
      >
        {isSuccess ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <XCircle className="h-4 w-4 text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white truncate">
            {scan.ticketNumber}
          </span>
          {name && (
            <span className="flex items-center gap-1 text-xs text-white/50 truncate">
              <User className="h-3 w-3 shrink-0" />
              {name}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(scan.time)}
          </span>
          <span>
            {scan.gate} · {scan.device}
          </span>
        </div>
        {isSuccess && scan.entriesUsed > 0 && (
          <div className="mt-1.5 text-xs text-emerald-400/70">
            Entry {scan.entriesUsed}
            {scan.remaining > 0 ? ` · ${scan.remaining} remaining` : ''}
          </div>
        )}
      </div>
      <Badge
        variant={isSuccess ? 'success' : 'destructive'}
        className="shrink-0"
      >
        {isSuccess ? 'SUCCESS' : 'DENIED'}
      </Badge>
    </div>
  );
}

function ScanItemSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 border-l-4 border-white/5">
      <div className="h-8 w-8 rounded-lg bg-white/10 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-white/10 animate-pulse" />
        <div className="h-3 w-48 rounded bg-white/10 animate-pulse" />
      </div>
      <div className="h-5 w-20 rounded-full bg-white/10 animate-pulse shrink-0" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-white/40">
      <QrCode className="h-12 w-12 mb-3 opacity-50" />
      <p className="text-sm font-medium">No scans yet</p>
      <p className="text-xs mt-1">Scan a ticket to see it appear here</p>
    </div>
  );
}

export default function LiveFeed({ scans, loading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(scans.length);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const prevLen = prevLengthRef.current;
    prevLengthRef.current = scans.length;

    if (scans.length > prevLen && prevLen > 0) {
      const newScanIds = new Set(
        scans.slice(0, scans.length - prevLen).map((s) => s.id)
      );
      setNewIds(newScanIds);
      const timer = setTimeout(() => setNewIds(new Set()), 600);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return () => clearTimeout(timer);
    }
  }, [scans]);

  if (loading) {
    return (
      <Card className="border-0 bg-white/5 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/60">
            <Clock className="h-4 w-4 text-cyan-400" />
            Live Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {Array.from({ length: 5 }).map((_, i) => (
              <ScanItemSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/5 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/60">
          <Clock className="h-4 w-4 text-cyan-400" />
          Live Feed
          {scans.length > 0 && (
            <span className="ml-auto text-xs text-white/40">
              {scans.length} scan{scans.length !== 1 ? 's' : ''}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="max-h-[420px] overflow-y-auto scrollbar-thin"
        >
          {scans.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-white/5">
              {scans.map((scan) => (
                <ScanItem
                  key={scan.id}
                  scan={scan}
                  isNew={newIds.has(scan.id)}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
