import Database from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const dataDir = join(import.meta.dir, '../../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const sqliteDb = new Database(join(dataDir, 'event-scan.db'));
sqliteDb.run('PRAGMA journal_mode = WAL');
sqliteDb.run('PRAGMA foreign_keys = ON');

export const db = drizzle(sqliteDb, { schema });
export { schema };

export function initDatabase() {
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT NOT NULL UNIQUE,
      name TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      max_entries INTEGER NOT NULL DEFAULT 3,
      entries_used INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      authorized INTEGER DEFAULT 0,
      authorized_by TEXT DEFAULT '',
      authorization_time TEXT DEFAULT '',
      authorization_note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      time TEXT NOT NULL DEFAULT (datetime('now')),
      gate TEXT DEFAULT 'Gate A',
      device TEXT DEFAULT '',
      result TEXT NOT NULL DEFAULT 'SUCCESS',
      ticket_number TEXT NOT NULL,
      entries_used INTEGER DEFAULT 0,
      remaining INTEGER DEFAULT 0,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    )
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      time TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    )
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS scanner_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL UNIQUE,
      name TEXT DEFAULT '',
      browser TEXT DEFAULT '',
      ip TEXT DEFAULT '',
      gate TEXT DEFAULT 'Gate A',
      battery REAL DEFAULT 100,
      online INTEGER DEFAULT 1,
      last_seen TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    )
  `);

  sqliteDb.run(`
    CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);
  `);
  sqliteDb.run(`
    CREATE INDEX IF NOT EXISTS idx_scans_ticket_id ON scans(ticket_id);
  `);
  sqliteDb.run(`
    CREATE INDEX IF NOT EXISTS idx_scans_time ON scans(time);
  `);

  try { sqliteDb.run('ALTER TABLE tickets ADD COLUMN authorized INTEGER DEFAULT 0'); } catch {}
  try { sqliteDb.run('ALTER TABLE tickets ADD COLUMN authorized_by TEXT DEFAULT ""'); } catch {}
  try { sqliteDb.run('ALTER TABLE tickets ADD COLUMN authorization_time TEXT DEFAULT ""'); } catch {}
  try { sqliteDb.run('ALTER TABLE tickets ADD COLUMN authorization_note TEXT DEFAULT ""'); } catch {}

  const existingSettings = sqliteDb.query('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  if (existingSettings.count === 0) {
    const insertSetting = sqliteDb.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('eventName', 'Event Scan');
    insertSetting.run('defaultEntries', '3');
    insertSetting.run('capacity', '300');
    insertSetting.run('allowReEntry', 'true');
    insertSetting.run('theme', 'dark');
    insertSetting.run('organizationName', 'Event Scan');
  }
}

export { sqliteDb };
