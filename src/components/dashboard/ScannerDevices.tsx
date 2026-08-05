import { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  Monitor,
  Wifi,
  WifiOff,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  MapPin,
  Globe,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn, formatTime } from '../../lib/utils';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import type { ScannerDevice } from '../../types';

function BatteryIcon({ level }: { level: number }) {
  if (level >= 75) return <BatteryFull className="h-4 w-4 text-emerald-400" />;
  if (level >= 50) return <BatteryMedium className="h-4 w-4 text-amber-400" />;
  if (level >= 25) return <BatteryLow className="h-4 w-4 text-orange-400" />;
  return <BatteryWarning className="h-4 w-4 text-red-400" />;
}

function DeviceCard({ device }: { device: ScannerDevice }) {
  return (
    <Card className="group relative border-0 overflow-hidden bg-white/5 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-2xl hover:shadow-black/20">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Smartphone className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{device.name}</p>
              <p className="text-xs text-white/50">{device.browser}</p>
            </div>
          </div>
          <div
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              device.online
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'
            )}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-white/50 mb-3">
          <Globe className="h-3 w-3" />
          <span>{device.ip}</span>
          <MapPin className="h-3 w-3 ml-2" />
          <span>{device.gate}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BatteryIcon level={device.battery} />
            <span className="text-xs text-white/60">{device.battery}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            {device.online ? (
              <Wifi className="h-3 w-3 text-emerald-400" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-400" />
            )}
            <span className="text-xs text-white/40">{formatTime(device.lastSeen)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="border-0 bg-white/5 backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-white/10 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
            </div>
          </div>
          <div className="h-2.5 w-2.5 rounded-full bg-white/10 animate-pulse" />
        </div>
        <div className="h-3 w-40 rounded bg-white/10 animate-pulse mb-3" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 rounded bg-white/10 animate-pulse" />
          <div className="h-3 w-12 rounded bg-white/10 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-white/40">
      <Smartphone className="h-16 w-16 mb-4 opacity-30" />
      <p className="text-sm font-medium">No scanner devices connected</p>
      <p className="text-xs mt-1">Scanners will appear here once they connect</p>
    </div>
  );
}

export default function ScannerDevices() {
  const [devices, setDevices] = useState<ScannerDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDevices = useCallback(async () => {
    try {
      const data = await api.scannerDevices();
      setDevices(Array.isArray(data) ? data : data?.devices ?? []);
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices, refreshKey]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('scanner-devices-update', (data: ScannerDevice[]) => {
      setDevices(Array.isArray(data) ? data : []);
    });

    socket.on('scanner-devices-refresh', (key: number) => {
      setRefreshKey(key);
    });

    return () => {
      socket.off('scanner-devices-update');
      socket.off('scanner-devices-refresh');
    };
  }, []);

  if (loading) {
    return (
      <Card className="border-0 bg-white/5 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/60">
            <Smartphone className="h-4 w-4 text-cyan-400" />
            Scanner Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
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
          <Smartphone className="h-4 w-4 text-cyan-400" />
          Scanner Devices
          {devices.length > 0 && (
            <span className="ml-auto text-xs text-white/40">
              {devices.length} device{devices.length !== 1 ? 's' : ''}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.length === 0 ? (
            <EmptyState />
          ) : (
            devices.map((device) => <DeviceCard key={device.id} device={device} />)
          )}
        </div>
      </CardContent>
    </Card>
  );
}
