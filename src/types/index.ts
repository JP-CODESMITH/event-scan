export interface Ticket {
  id: number;
  ticketNumber: string;
  name: string;
  phone: string;
  email: string;
  maxEntries: number;
  entriesUsed: number;
  status: string;
  authorized: boolean;
  authorizedBy: string;
  authorizationTime: string;
  authorizationNote: string;
  createdAt: string;
  updatedAt: string;
  scanHistory?: Scan[];
}

export interface Scan {
  id: number;
  ticketId: number;
  time: string;
  gate: string;
  device: string;
  result: string;
  ticketNumber: string;
  entriesUsed: number;
  remaining: number;
  ticket_name?: string;
}

export interface Stats {
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
  recentScans: Scan[];
  currentTime: string;
}

export interface ChartData {
  hourlyEntries: Array<{ hour: string; count: number }>;
  entriesByGate: Array<{ gate: string; count: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
  entriesUsed: number;
  remaining: number;
}

export interface ScannerDevice {
  id: number;
  deviceId: string;
  name: string;
  browser: string;
  ip: string;
  gate: string;
  battery: number;
  online: boolean;
  lastSeen: string;
}

export interface AdminLog {
  id: number;
  action: string;
  description: string;
  time: string;
}

export interface Settings {
  eventName: string;
  defaultEntries: string;
  capacity: string;
  allowReEntry: string;
  theme: string;
  organizationName: string;
  [key: string]: string;
}

export interface ScanResult {
  success: boolean;
  message: string;
  ticketNumber?: string;
  name?: string;
  remaining?: number;
  entryNumber?: number;
  maxEntries?: number;
  gate?: string;
  device?: string;
  time?: string;
  type?: string;
}
