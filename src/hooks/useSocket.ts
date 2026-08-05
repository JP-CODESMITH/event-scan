import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '../lib/socket';
import type { ScanResult, Stats } from '../types';

export function useSocketStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleStatsUpdate = () => {
      fetch('/api/stats')
        .then(r => r.json())
        .then(setStats)
        .catch(console.error);
    };

    const handleScanResult = (result: ScanResult) => {
      setLastScan(result);
    };

    socket.on('stats-update', handleStatsUpdate);
    socket.on('scan-result', handleScanResult);

    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);

    return () => {
      socket.off('stats-update', handleStatsUpdate);
      socket.off('scan-result', handleScanResult);
    };
  }, []);

  return { stats, lastScan };
}

export function useSocketTickets() {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = () => setRefreshKey(k => k + 1);
    socket.on('tickets-update', handleUpdate);
    return () => { socket.off('tickets-update', handleUpdate); };
  }, []);

  return refreshKey;
}

export function useSocketScans() {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = () => setRefreshKey(k => k + 1);
    socket.on('recent-scans-update', handleUpdate);
    socket.on('stats-update', handleUpdate);
    return () => {
      socket.off('recent-scans-update', handleUpdate);
      socket.off('stats-update', handleUpdate);
    };
  }, []);

  return refreshKey;
}

export function useSocketLastScan() {
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const handleScan = (result: ScanResult) => setLastScan(result);
    socket.on('scan-result', handleScan);
    return () => { socket.off('scan-result', handleScan); };
  }, []);

  return lastScan;
}
