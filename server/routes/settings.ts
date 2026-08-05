import { Server as SocketIOServer } from 'socket.io';
import { sqliteDb } from '../db/index';

export async function handleSettings(req: Request, subpath: string, io: SocketIOServer) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if ((subpath === '' || subpath === '/') && req.method === 'GET') {
    const rows = sqliteDb.query('SELECT * FROM settings').all() as Array<{ key: string; value: string }>;
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return new Response(JSON.stringify(settings), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if ((subpath === '' || subpath === '/') && req.method === 'PUT') {
    const body = await req.json();
    for (const [key, value] of Object.entries(body)) {
      sqliteDb.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
    }
    sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['UPDATE_SETTINGS', 'Updated event settings']);
    io.emit('settings-update');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (subpath === '/default-entries' && req.method === 'POST') {
    const body = await req.json();
    const { defaultEntries, applyTo } = body;

    sqliteDb.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['defaultEntries', String(defaultEntries)]);

    if (applyTo === 'all') {
      sqliteDb.run('UPDATE tickets SET max_entries = ?, updated_at = datetime("now")', [defaultEntries]);
      sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['UPDATE_DEFAULT_ENTRIES_ALL', `Updated all tickets to ${defaultEntries} entries`]);
    } else {
      sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['UPDATE_DEFAULT_ENTRIES_NEW', `Set default entries to ${defaultEntries} for new tickets`]);
    }

    io.emit('tickets-update');
    io.emit('stats-update');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
