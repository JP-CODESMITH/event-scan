import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Radio,
  Smartphone,
} from 'lucide-react';
import { api, normalizeDevice } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { cn, formatTime } from '../../lib/utils';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import type { ScannerDevice } from '../../types';

function BatteryIcon({ level }: { level: number }) {
  const cls = 'h-3.5 w-3.5';
  if (level >= 75) return <BatteryFull className={cls} strokeWidth={1.7} aria-hidden="true" />;
  if (level >= 50) return <BatteryMedium className={cls} strokeWidth={1.7} aria-hidden="true" />;
  if (level >= 25) return <BatteryLow className={cls} strokeWidth={1.7} aria-hidden="true" />;
  return <BatteryWarning className={cn(cls, 'text-danger')} strokeWidth={1.7} aria-hidden="true" />;
}

export default function ScannerDevices() {
  const [devices, setDevices] = useState<ScannerDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    api
      .scannerDevices()
      .then((data) => {
        if (mounted) setDevices(Array.isArray(data) ? data : data?.devices ?? []);
      })
      .catch(() => {
        if (mounted) setDevices([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    const socket = getSocket();
    const onDevices = (data: ScannerDevice[]) => {
      if (Array.isArray(data) && data.length > 0) setDevices(data.map(normalizeDevice));
      else setRefreshKey((key) => key + 1);
    };
    const onRefresh = (key: number) => setRefreshKey(key);
    socket.on('scanner-devices-update', onDevices);
    socket.on('scanner-devices-refresh', onRefresh);
    return () => {
      socket.off('scanner-devices-update', onDevices);
      socket.off('scanner-devices-refresh', onRefresh);
    };
  }, []);

  const online = devices.filter((d) => d.online).length;

  return (
    <section aria-label="Scanner devices" className="overflow-hidden rounded-md border border-border bg-surface">
      <div className="flex items-end justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="eyebrow">Gates</p>
          <h3 className="mt-1 text-small font-medium text-ink">Scanner devices</h3>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
          {online} online · {devices.length} known
        </p>
      </div>

      {loading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-4">
              <Skeleton className="h-8 w-8" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-sm border border-border bg-sunken text-ink-secondary">
            <Radio className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
          </span>
          <p className="mt-4 font-display text-[1.3rem] font-medium text-ink">No scanners yet</p>
          <p className="mt-1 max-w-[40ch] text-small text-ink-secondary">
            Open the scanner on a gate phone and it will register itself here.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/scanner">Open scanner</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {devices.map((device) => (
            <li key={device.id} className="flex items-center gap-3 px-4 py-3.5">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border',
                  device.online
                    ? 'border-success/25 bg-success-soft text-success'
                    : 'border-border bg-sunken text-ink-tertiary'
                )}
              >
                <Smartphone className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-small font-medium text-ink">{device.name}</p>
                  <span
                    className={cn('status-dot', device.online ? 'bg-success' : 'bg-ink-tertiary')}
                    aria-label={device.online ? 'Online' : 'Offline'}
                  />
                </div>
                <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
                  {device.gate} · {device.browser}
                </p>
              </div>

              <div className="hidden items-center gap-1.5 text-tiny text-ink-secondary sm:flex">
                <BatteryIcon level={device.battery} />
                <span className="font-mono tabular">{device.battery}%</span>
              </div>

              <time className="w-16 shrink-0 text-right font-mono text-[10px] tabular text-ink-tertiary">
                {formatTime(device.lastSeen)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
