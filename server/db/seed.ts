import { initDatabase, db, sqliteDb } from './index';
import { tickets } from './schema';

initDatabase();

const existingCount = sqliteDb.query('SELECT COUNT(*) as count FROM tickets').get() as { count: number };
if (existingCount.count > 0) {
  console.log(`Database already has ${existingCount.count} tickets. Skipping seed.`);
  process.exit(0);
}

const insert = sqliteDb.prepare(`
  INSERT INTO tickets (ticket_number, name, phone, email, max_entries, entries_used, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, 3, 0, 'ACTIVE', datetime('now'), datetime('now'))
`);

const insertMany = sqliteDb.transaction((items: Array<{ ticket: string; name: string; phone: string; email: string }>) => {
  for (const item of items) {
    insert.run(item.ticket, item.name, item.phone, item.email);
  }
});

const entries: Array<{ ticket: string; name: string; phone: string; email: string }> = [];
for (let i = 1; i <= 300; i++) {
  const num = i.toString().padStart(3, '0');
  entries.push({
    ticket: num,
    name: `Attendee ${num}`,
    phone: `+1${String(555000 + i).padStart(7, '0')}`,
    email: `attendee${num}@event.com`,
  });
}

insertMany(entries);
console.log(`Seeded ${entries.length} tickets successfully.`);
process.exit(0);
