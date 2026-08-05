import { Server as SocketIOServer } from 'socket.io';
import { sqliteDb } from '../db/index';

export async function handleScans(req: Request, subpath: string, io: SocketIOServer) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if ((subpath === '' || subpath === '/') && req.method === 'GET') {
    const page = parseInt(new URL(req.url).searchParams.get('page') || '1');
    const limit = parseInt(new URL(req.url).searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const items = sqliteDb.query(`
      SELECT s.*, t.name as ticket_name
      FROM scans s
      LEFT JOIN tickets t ON s.ticket_id = t.id
      ORDER BY s.time DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = (sqliteDb.query('SELECT COUNT(*) as count FROM scans').get() as any).count;

    return new Response(JSON.stringify({ items, total, page, limit }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (subpath === '/history' && req.method === 'GET') {
    const ticketNumber = new URL(req.url).searchParams.get('ticketNumber');
    if (ticketNumber) {
      const items = sqliteDb.query(`
        SELECT s.*, t.name as ticket_name
        FROM scans s
        LEFT JOIN tickets t ON s.ticket_id = t.id
        WHERE s.ticket_number = ?
        ORDER BY s.time DESC
      `).all(ticketNumber);
      return new Response(JSON.stringify(items), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  if (subpath === '/recent') {
    const items = sqliteDb.query(`
      SELECT s.*, t.name as ticket_name
      FROM scans s
      LEFT JOIN tickets t ON s.ticket_id = t.id
      ORDER BY s.time DESC
      LIMIT 20
    `).all();
    return new Response(JSON.stringify(items), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (subpath === '/clear' && req.method === 'POST') {
    sqliteDb.run('DELETE FROM scans');
    sqliteDb.run('UPDATE tickets SET entries_used = 0, updated_at = datetime("now")');
    sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['CLEAR_SCANS', 'Cleared all scan history and reset tickets']);
    io.emit('stats-update');
    io.emit('tickets-update');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
