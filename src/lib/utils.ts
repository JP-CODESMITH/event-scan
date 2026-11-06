import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function parseDate(value: string | Date) {
  if (value instanceof Date) return value;
  if (!value) return null;
  const normalised = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalised);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTime(dateStr: string) {
  const date = parseDate(dateStr);
  if (!date) return '';
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatClock(date: Date) {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatDate(dateStr: string) {
  const date = parseDate(dateStr);
  if (!date) return '';
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string) {
  const date = parseDate(dateStr);
  if (!date) return '';
  return `${formatDate(dateStr)} · ${formatTime(dateStr)}`;
}

export function relativeTime(dateStr: string) {
  const date = parseDate(dateStr);
  if (!date) return '';
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatTime(dateStr);
}

export function formatCount(value: number) {
  return new Intl.NumberFormat('en-GB').format(value ?? 0);
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'border-success/30 bg-success-soft text-success';
    case 'BLOCKED':
      return 'border-danger/30 bg-danger-soft text-danger';
    case 'FINISHED':
      return 'border-warning/30 bg-warning-soft text-warning';
    default:
      return 'border-border bg-sunken text-ink-secondary';
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
    case 'unused':
      return 'Unused';
    case 'used-once':
      return 'Used Once';
    case 'used-twice':
      return 'Used Twice';
    case 'finished':
      return 'Completed';
    case 'started':
      return 'Started';
    default:
      return String(used);
  }
}

export function formatRemaining(used: number, max: number) {
  const rem = max - used;
  return rem < 0 ? 0 : rem;
}

export function getInitials(name: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, len: number) {
  if (!str || str.length <= len) return str;
  return str.slice(0, len) + '…';
}

export type ScanTone =
  | 'valid'
  | 'used'
  | 'blocked'
  | 'unauthorized'
  | 'invalid'
  | 'offline';

export interface ScanOutcomeCopy {
  tone: ScanTone;
  headline: string;
  note: string;
  instruction?: string;
}

export function getScanOutcome(
  success: boolean,
  remoteType?: string,
  message?: string
): ScanOutcomeCopy {
  if (success) {
    return {
      tone: 'valid',
      headline: 'Admitted',
      note: 'Entry recorded.',
    };
  }

  switch (remoteType) {
    case 'exhausted':
      return {
        tone: 'used',
        headline: 'Already used',
        note: 'Every entry on this ticket has been scanned.',
        instruction: 'Send the guest to the registration desk.',
      };
    case 'blocked':
      return {
        tone: 'blocked',
        headline: 'Blocked',
        note: 'This ticket was blocked by the organiser.',
        instruction: 'Do not admit. Call the registration desk.',
      };
    case 'unauthorized':
      return {
        tone: 'unauthorized',
        headline: 'Not on the list',
        note: 'This ticket has not been authorised for entry.',
        instruction: 'Send the guest to the registration desk.',
      };
    case 'invalid':
      return {
        tone: 'invalid',
        headline: 'Not found',
        note: 'No ticket matches that code.',
        instruction: 'Check the code, or try manual entry.',
      };
    case 'offline':
      return {
        tone: 'offline',
        headline: 'Not checked in',
        note: 'The gate could not reach the server.',
        instruction: 'Keep the guest here and try again when connected.',
      };
    default:
      return {
        tone: 'invalid',
        headline: 'Not admitted',
        note: message || 'The ticket could not be verified.',
        instruction: 'Try again, or use manual entry.',
      };
  }
}
