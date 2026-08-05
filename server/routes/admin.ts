import { Server as SocketIOServer } from 'socket.io';
import { sqliteDb } from '../db/index';
import crypto from 'crypto';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

export async function handleAdmin(req: Request, subpath: string, io: SocketIOServer) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (subpath === '/login' && req.method === 'POST') {
    const body = await req.json();
    if (body.username === ADMIN_USER && body.password === ADMIN_PASS) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      sqliteDb.run('INSERT INTO sessions (token, username, created_at, expires_at) VALUES (?, ?, datetime("now"), ?)',
        [token, body.username, expiresAt]);
      return new Response(JSON.stringify({ success: true, token, username: body.username }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    return new Response(JSON.stringify({ success: false, message: 'Invalid credentials' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (subpath === '/verify' && req.method === 'POST') {
    const body = await req.json();
    const session = sqliteDb.query('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")').get(body.token);
    if (session) {
      return new Response(JSON.stringify({ valid: true, username: (session as any).username }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    return new Response(JSON.stringify({ valid: false }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (subpath === '/logout' && req.method === 'POST') {
    const body = await req.json();
    sqliteDb.run('DELETE FROM sessions WHERE token = ?', [body.token]);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (subpath === '/logs') {
    const page = parseInt(new URL(req.url).searchParams.get('page') || '1');
    const limit = parseInt(new URL(req.url).searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;

    const items = sqliteDb.query('SELECT * FROM admin_logs ORDER BY time DESC LIMIT ? OFFSET ?').all(limit, offset);
    const total = (sqliteDb.query('SELECT COUNT(*) as count FROM admin_logs').get() as any).count;

    return new Response(JSON.stringify({ items, total }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (subpath === '/reset-all' && req.method === 'POST') {
    sqliteDb.run('DELETE FROM scans');
    sqliteDb.run('UPDATE tickets SET entries_used = 0, status = "ACTIVE", updated_at = datetime("now")');
    sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['RESET_ALL', 'Reset entire event']);
    io.emit('stats-update');
    io.emit('tickets-update');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (subpath === '/reset-scans' && req.method === 'POST') {
    sqliteDb.run('DELETE FROM scans');
    sqliteDb.run('UPDATE tickets SET entries_used = 0, updated_at = datetime("now")');
    sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['RESET_SCANS', 'Reset scan history']);
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
