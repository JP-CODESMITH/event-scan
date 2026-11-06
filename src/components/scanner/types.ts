import type { ScanTone } from '../../lib/utils';

export interface ScanUIResult {
  tone: ScanTone;
  headline: string;
  note: string;
  instruction?: string;
  ticketNumber?: string;
  name?: string;
  entryNumber?: number;
  maxEntries?: number;
  remaining?: number;
  gate?: string;
  time?: string;
}
