import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const tickets = sqliteTable('tickets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticketNumber: text('ticket_number').notNull().unique(),
  name: text('name').default(''),
  phone: text('phone').default(''),
  email: text('email').default(''),
  maxEntries: integer('max_entries').notNull().default(3),
  entriesUsed: integer('entries_used').notNull().default(0),
  status: text('status').notNull().default('ACTIVE'),
  authorized: integer('authorized', { mode: 'boolean' }).default(false),
  authorizedBy: text('authorized_by').default(''),
  authorizationTime: text('authorization_time').default(''),
  authorizationNote: text('authorization_note').default(''),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
});

export const scans = sqliteTable('scans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id),
  time: text('time').notNull().default('CURRENT_TIMESTAMP'),
  gate: text('gate').default('Gate A'),
  device: text('device').default(''),
  result: text('result').notNull().default('SUCCESS'),
  ticketNumber: text('ticket_number').notNull(),
  entriesUsed: integer('entries_used').default(0),
  remaining: integer('remaining').default(0),
});

export const adminLogs = sqliteTable('admin_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  description: text('description').notNull(),
  time: text('time').notNull().default('CURRENT_TIMESTAMP'),
});

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});

export const scannerDevices = sqliteTable('scanner_devices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deviceId: text('device_id').notNull().unique(),
  name: text('name').default(''),
  browser: text('browser').default(''),
  ip: text('ip').default(''),
  gate: text('gate').default('Gate A'),
  battery: real('battery').default(100),
  online: integer('online', { mode: 'boolean' }).default(true),
  lastSeen: text('last_seen').notNull().default('CURRENT_TIMESTAMP'),
});

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  token: text('token').notNull().unique(),
  username: text('username').notNull(),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  expiresAt: text('expires_at').notNull(),
});

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;
export type AdminLog = typeof adminLogs.$inferSelect;
export type ScannerDevice = typeof scannerDevices.$inferSelect;
export type Session = typeof sessions.$inferSelect;
