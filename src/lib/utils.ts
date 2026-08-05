import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

export function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(dateStr: string) {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'BLOCKED': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'FINISHED': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function getEntryStatus(used: number, max: number) {
  if (max === 0) return 'finished';
  const ratio = used / max;
  if (used === 0) return 'unused';
  if (ratio >= 1) return 'finished';
  if (ratio >= 0.66) return 'used-twice';
  if (ratio >= 0.33) return 'used-once';
  return 'started';
}

export function getEntryStatusLabel(used: number, max: number): string {
  const status = getEntryStatus(used, max);
  switch (status) {
    case 'unused': return 'Unused';
    case 'used-once': return 'Used Once';
    case 'used-twice': return 'Used Twice';
    case 'finished': return 'Completed';
    case 'started': return 'Started';
    default: return String(used);
  }
}

export function formatRemaining(used: number, max: number) {
  const rem = max - used;
  return rem < 0 ? 0 : rem;
}

export function getInitials(name: string) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function truncate(str: string, len: number) {
  if (!str || str.length <= len) return str;
  return str.slice(0, len) + '...';
}
