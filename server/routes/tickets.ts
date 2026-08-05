import { Server as SocketIOServer } from 'socket.io';
import { db, sqliteDb } from '../db/index';

export async function handleTickets(req: Request, subpath: string, io: SocketIOServer) {
  const url = new URL(req.url);
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (subpath === '' || subpath === '/') {
    if (req.method === 'GET') {
      const status = url.searchParams.get('status');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM tickets';
      let countQuery = 'SELECT COUNT(*) as count FROM tickets';
      const params: any[] = [];
      const countParams: any[] = [];

      if (status && status !== 'ALL') {
        query += ' WHERE status = ?';
        countQuery += ' WHERE status = ?';
        params.push(status);
        countParams.push(status);
      }

      const total = (sqliteDb.query(countQuery).get(...countParams) as any).count;

      query += ' ORDER BY ticket_number ASC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const items = sqliteDb.query(query).all(...params);

      return new Response(JSON.stringify({ items, total, page, limit }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  if (subpath === '/all') {
    const items = sqliteDb.query('SELECT * FROM tickets ORDER BY ticket_number ASC').all();
    return new Response(JSON.stringify(items), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (subpath.startsWith('/') && req.method === 'GET') {
    const id = subpath.split('/')[1];
    if (id && !isNaN(Number(id))) {
      const ticket = sqliteDb.query('SELECT * FROM tickets WHERE id = ?').get(parseInt(id));
      if (!ticket) {
        return new Response(JSON.stringify({ error: 'Ticket not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      const scanHistory = sqliteDb.query('SELECT * FROM scans WHERE ticket_id = ? ORDER BY time DESC').all(parseInt(id));
      return new Response(JSON.stringify({ ...ticket as any, scanHistory }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }

  if (subpath.startsWith('/') && req.method === 'PUT') {
    const id = parseInt(subpath.split('/')[1]);
    const body = await req.json();
    const { name, phone, email, maxEntries } = body;

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (maxEntries !== undefined) {
      updates.push('max_entries = ?');
      params.push(maxEntries);
    }
    updates.push('updated_at = datetime("now")');
    params.push(id);

    if (updates.length > 1) {
      sqliteDb.run(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`, params);
      sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['EDIT_TICKET', `Edited ticket #${id}`]);
      io.emit('tickets-update');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (subpath.endsWith('/reset') && req.method === 'POST') {
    const id = parseInt(subpath.split('/')[1]);
    sqliteDb.run('UPDATE tickets SET entries_used = 0, updated_at = datetime("now") WHERE id = ?', [id]);
    sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['RESET_TICKET', `Reset tickets #${id}`]);
    io.emit('tickets-update');
    io.emit('stats-update');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (subpath.endsWith('/block') && req.method === 'POST') {
    const id = parseInt(subpath.split('/')[1]);
    sqliteDb.run('UPDATE tickets SET status = "BLOCKED", updated_at = datetime("now") WHERE id = ?', [id]);
    sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['BLOCK_TICKET', `Blocked ticket #${id}`]);
    io.emit('tickets-update');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (subpath.endsWith('/unblock') && req.method === 'POST') {
    const id = parseInt(subpath.split('/')[1]);
    sqliteDb.run('UPDATE tickets SET status = "ACTIVE", updated_at = datetime("now") WHERE id = ?', [id]);
    sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['UNBLOCK_TICKET', `Unblocked ticket #${id}`]);
    io.emit('tickets-update');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (subpath.endsWith('/increase') && req.method === 'POST') {
    const id = parseInt(subpath.split('/')[1]);
    sqliteDb.run('UPDATE tickets SET max_entries = max_entries + 1, updated_at = datetime("now") WHERE id = ?', [id]);
    sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['INCREASE_ENTRIES', `Increased max entries for ticket #${id}`]);
    io.emit('tickets-update');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (subpath.endsWith('/decrease') && req.method === 'POST') {
    const id = parseInt(subpath.split('/')[1]);
    const ticket = sqliteDb.query('SELECT * FROM tickets WHERE id = ?').get(id) as any;
    if (ticket && ticket.max_entries > 1) {
      sqliteDb.run('UPDATE tickets SET max_entries = max_entries - 1, entries_used = MIN(entries_used, max_entries - 1), updated_at = datetime("now") WHERE id = ?', [id]);
      sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['DECREASE_ENTRIES', `Decreased max entries for ticket #${id}`]);
      io.emit('tickets-update');
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (subpath.endsWith('/delete') && req.method === 'DELETE') {
    const id = parseInt(subpath.split('/')[1]);
    sqliteDb.run('DELETE FROM scans WHERE ticket_id = ?', [id]);
    sqliteDb.run('DELETE FROM tickets WHERE id = ?', [id]);
    sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['DELETE_TICKET', `Deleted ticket #${id}`]);
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
