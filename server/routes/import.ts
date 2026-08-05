import { Server as SocketIOServer } from 'socket.io';
import { sqliteDb } from '../db/index';

export async function handleImport(req: Request, subpath: string, io: SocketIOServer) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (subpath === '/csv' && req.method === 'POST') {
    try {
      const body = await req.text();
      const lines = body.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        return new Response(JSON.stringify({ success: false, message: 'CSV must have header and at least one row' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const header = lines[0].toLowerCase();
      const hasTicketNum = header.includes('ticket') && (header.includes('number') || header.includes('#'));
      const hasName = header.includes('name');
      const hasPhone = header.includes('phone');
      const hasEmail = header.includes('email');

      if (!hasTicketNum) {
        return new Response(JSON.stringify({ success: false, message: 'CSV must have a Ticket Number column' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const cols = lines[0].split(',').map(c => c.trim().toLowerCase());
      const tIdx = cols.findIndex(c => c.includes('ticket'));
      const nIdx = cols.findIndex(c => c.includes('name'));
      const pIdx = cols.findIndex(c => c.includes('phone'));
      const eIdx = cols.findIndex(c => c.includes('email'));

      let imported = 0;
      let updated = 0;

      const insertStmt = sqliteDb.prepare(`
        INSERT INTO tickets (ticket_number, name, phone, email, max_entries, entries_used, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 3, 0, 'ACTIVE', datetime('now'), datetime('now'))
        ON CONFLICT(ticket_number) DO UPDATE SET
          name = excluded.name,
          phone = excluded.phone,
          email = excluded.email,
          updated_at = datetime('now')
      `);

      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
        const ticketNum = vals[tIdx]?.trim();
        if (!ticketNum) continue;

        const existing = sqliteDb.query('SELECT id FROM tickets WHERE ticket_number = ?').get(ticketNum);
        if (existing) {
          const name = nIdx >= 0 ? vals[nIdx] || '' : '';
          const phone = pIdx >= 0 ? vals[pIdx] || '' : '';
          const email = eIdx >= 0 ? vals[eIdx] || '' : '';
          sqliteDb.run('UPDATE tickets SET name = ?, phone = ?, email = ?, updated_at = datetime("now") WHERE ticket_number = ?',
            [name, phone, email, ticketNum]);
          updated++;
        } else {
          const name = nIdx >= 0 ? vals[nIdx] || '' : '';
          const phone = pIdx >= 0 ? vals[pIdx] || '' : '';
          const email = eIdx >= 0 ? vals[eIdx] || '' : '';
          insertStmt.run(ticketNum, name, phone, email);
          imported++;
        }
      }

      sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))',
        ['IMPORT_CSV', `Imported ${imported} new, updated ${updated} tickets from CSV`]);
      io.emit('tickets-update');
      io.emit('stats-update');

      return new Response(JSON.stringify({ success: true, imported, updated }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, message: 'Failed to parse CSV' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
