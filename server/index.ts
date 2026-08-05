import { serve } from 'bun';
import { Server } from 'socket.io';
import { initDatabase, db, sqliteDb, schema } from './db/index';
import { getLanIp } from './utils/network';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { handleTickets } from './routes/tickets';
import { handleScans } from './routes/scans';
import { handleSettings } from './routes/settings';
import { handleAdmin } from './routes/admin';
import { handleExport } from './routes/export';
import { handleImport } from './routes/import';

try {
  const envPath = join(import.meta.dir, '../.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const value = trimmed.slice(eqIdx + 1).trim();
          process.env[key] = value;
        }
      }
    }
  }
} catch {}

const AUTH_PASSWORD = process.env.AUTHORIZATION_PASSWORD || 'Abraham123@';

initDatabase();

const lanIp = getLanIp();
const PORT = 3000;

const io = new Server(8080, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('register-scanner', (data) => {
    const { name, browser, ip, gate, battery, deviceId } = data;
    const existing = sqliteDb.query('SELECT id FROM scanner_devices WHERE device_id = ?').get(deviceId) as any;
    if (existing) {
      sqliteDb.run(
        'UPDATE scanner_devices SET name = ?, browser = ?, ip = ?, gate = ?, battery = ?, online = 1, last_seen = datetime("now") WHERE device_id = ?',
        [name, browser, ip, gate, battery, deviceId]
      );
    } else {
      sqliteDb.run(
        'INSERT INTO scanner_devices (device_id, name, browser, ip, gate, battery, online, last_seen) VALUES (?, ?, ?, ?, ?, ?, 1, datetime("now"))',
        [deviceId, name, browser, ip, gate, battery]
      );
    }
    io.emit('scanner-devices-update');
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });

  socket.on('scanner-ping', (data) => {
    const { deviceId } = data;
    if (deviceId) {
      sqliteDb.run(
        'UPDATE scanner_devices SET online = 1, last_seen = datetime("now") WHERE device_id = ?',
        [deviceId]
      );
    }
  });
});

setInterval(() => {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString().replace('T', ' ').split('.')[0];
  sqliteDb.run('UPDATE scanner_devices SET online = 0 WHERE last_seen < ?', [fiveMinAgo]);
}, 60000);

function ensureCert(): { key: string; cert: string } | null {
  const certDir = join(import.meta.dir, '../data');
  const keyPath = join(certDir, 'server.key');
  const certPath = join(certDir, 'server.crt');
  if (existsSync(keyPath) && existsSync(certPath)) {
    return { key: readFileSync(keyPath, 'utf-8'), cert: readFileSync(certPath, 'utf-8') };
  }
  try {
    const proc = Bun.spawnSync(['openssl', 'req', '-x509', '-newkey', 'rsa:2048',
      '-keyout', keyPath, '-out', certPath,
      '-days', '365', '-nodes', '-subj', '/CN=EventScan',
      '-addext', `subjectAltName=DNS:localhost,IP:${lanIp},IP:127.0.0.1`]);
    if (proc.exitCode === 0 && existsSync(keyPath) && existsSync(certPath)) {
      return { key: readFileSync(keyPath, 'utf-8'), cert: readFileSync(certPath, 'utf-8') };
    }
  } catch {}
  return null;
}

const tlsConfig = ensureCert();

const fetchHandler = async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (path.startsWith('/api/admin')) {
    return handleAdmin(req, path.replace('/api/admin', ''), io);
  }
  if (path.startsWith('/api/tickets')) {
    return handleTickets(req, path.replace('/api/tickets', ''), io);
  }
  if (path.startsWith('/api/scans')) {
    return handleScans(req, path.replace('/api/scans', ''), io);
  }
  if (path.startsWith('/api/settings')) {
    return handleSettings(req, path.replace('/api/settings', ''), io);
  }
  if (path.startsWith('/api/export')) {
    return handleExport(req, path.replace('/api/export', ''));
  }
  if (path.startsWith('/api/import')) {
    return handleImport(req, path.replace('/api/import', ''), io);
  }
  if (path === '/api/network') {
    return new Response(JSON.stringify({ ip: lanIp, port: PORT, httpsPort: tlsConfig ? 3443 : null }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  if (path === '/api/stats') {
    return getStats(io);
  }
  if (path === '/api/scanner-devices') {
    const devices = sqliteDb.query('SELECT * FROM scanner_devices ORDER BY last_seen DESC').all();
    return new Response(JSON.stringify(devices), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  if (path === '/api/chart-data') {
    return getChartData();
  }
  if (path === '/api/search') {
    const term = url.searchParams.get('q') || '';
    const results = sqliteDb.query(`
      SELECT * FROM tickets 
      WHERE ticket_number LIKE ? 
      OR name LIKE ? 
      OR phone LIKE ? 
      OR email LIKE ?
      LIMIT 50
    `).all(`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`);
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (path === '/api/scan' && req.method === 'POST') {
    return handleScanRequest(req, io);
  }

  if (path === '/api/bulk' && req.method === 'POST') {
    return handleBulkAction(req, io);
  }

  if (path === '/api/authorize' && req.method === 'POST') {
    return handleAuthorize(req, io);
  }
  if (path === '/api/authorize/bulk' && req.method === 'POST') {
    return handleBulkAuthorize(req, io);
  }
  if (path === '/api/authorize/deauthorize' && req.method === 'POST') {
    return handleDeauthorize(req, io);
  }
  if (path === '/api/authorize/verify-password' && req.method === 'POST') {
    return handleVerifyPassword(req);
  }

  if (path.startsWith('/socket.io/')) {
    const target = new URL(req.url);
    target.host = 'localhost:8080';
    target.protocol = 'http:';
    return fetch(target.toString(), {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    });
  }

  try {
    const filePath = join(import.meta.dir, '../dist', path === '/' ? 'index.html' : path);
    const file = Bun.file(filePath);
    if (await file.exists()) {
      const ext = filePath.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        html: 'text/html', css: 'text/css', js: 'application/javascript',
        ts: 'application/javascript', tsx: 'application/javascript',
        json: 'application/json', png: 'image/png', jpg: 'image/jpeg',
        jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml',
        ico: 'image/x-icon', webp: 'image/webp', woff: 'font/woff',
        woff2: 'font/woff2', ttf: 'font/ttf', eot: 'application/vnd.ms-fontobject',
        mp3: 'audio/mpeg', wav: 'audio/wav', webm: 'video/webm',
      };
      return new Response(file, {
        headers: { 'Content-Type': mimeTypes[ext || ''] || 'application/octet-stream', ...corsHeaders },
      });
    }
    const indexPath = join(import.meta.dir, '../dist/index.html');
    const indexFile = Bun.file(indexPath);
    if (await indexFile.exists()) {
      return new Response(indexFile, {
        headers: { 'Content-Type': 'text/html', ...corsHeaders },
      });
    }
  } catch {}
  return new Response('Not Found', { status: 404, headers: corsHeaders });
};

const server = serve({
  port: PORT,
  hostname: '0.0.0.0',
  fetch: fetchHandler,
});

if (tlsConfig) {
  serve({
    port: 3443,
    hostname: '0.0.0.0',
    tls: tlsConfig,
    fetch: fetchHandler,
  });
}

async function handleScanRequest(req: Request, io: Server) {
  const body = await req.json();
  const { ticketNumber, gate, device, deviceId } = body;

  if (!ticketNumber) {
    return new Response(JSON.stringify({ success: false, message: 'Ticket number required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ticket = sqliteDb.query('SELECT * FROM tickets WHERE ticket_number = ?').get(ticketNumber) as any;

  if (!ticket) {
    io.emit('scan-result', {
      success: false,
      message: 'Invalid Ticket',
      ticketNumber,
      gate,
      device,
      time: new Date().toISOString(),
    });
    io.emit('stats-update');
    return new Response(JSON.stringify({ success: false, message: 'Invalid Ticket', type: 'invalid' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (ticket.status === 'BLOCKED') {
    io.emit('scan-result', {
      success: false,
      message: 'Access Denied - Ticket Blocked',
      ticketNumber,
      gate,
      device,
      time: new Date().toISOString(),
    });
    sqliteDb.run(
      'INSERT INTO scans (ticket_id, gate, device, result, ticket_number, time) VALUES (?, ?, ?, ?, ?, datetime("now"))',
      [ticket.id, gate, device, 'DENIED', ticketNumber]
    );
    io.emit('stats-update');
    return new Response(JSON.stringify({ success: false, message: 'Access Denied - Ticket Blocked', type: 'blocked' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!ticket.authorized) {
    sqliteDb.run(
      'INSERT INTO scans (ticket_id, gate, device, result, ticket_number, time) VALUES (?, ?, ?, ?, ?, datetime("now"))',
      [ticket.id, gate, device, 'DENIED', ticketNumber]
    );
    io.emit('scan-result', {
      success: false,
      message: 'UNAUTHORIZED - This ticket has not been approved. Please proceed to the Registration Desk.',
      ticketNumber,
      gate,
      device,
      time: new Date().toISOString(),
    });
    io.emit('stats-update');
    return new Response(JSON.stringify({
      success: false,
      message: 'UNAUTHORIZED - This ticket has not been approved. Please proceed to the Registration Desk.',
      type: 'unauthorized',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (ticket.entries_used >= ticket.max_entries) {
    sqliteDb.run(
      'INSERT INTO scans (ticket_id, gate, device, result, ticket_number, entries_used, remaining, time) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))',
      [ticket.id, gate, device, 'DENIED', ticketNumber, ticket.entries_used, 0]
    );
    io.emit('scan-result', {
      success: false,
      message: 'Access Denied - Already Used All Entries',
      ticketNumber,
      gate,
      device,
      time: new Date().toISOString(),
    });
    io.emit('stats-update');
    return new Response(JSON.stringify({
      success: false,
      message: 'Access Denied - Already Used All Entries',
      type: 'exhausted',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const newEntriesUsed = ticket.entries_used + 1;
  const remaining = ticket.max_entries - newEntriesUsed;

  sqliteDb.run(
    'UPDATE tickets SET entries_used = ?, updated_at = datetime("now") WHERE id = ?',
    [newEntriesUsed, ticket.id]
  );

  sqliteDb.run(
    'INSERT INTO scans (ticket_id, gate, device, result, ticket_number, entries_used, remaining, time) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))',
    [ticket.id, gate, device, 'SUCCESS', ticketNumber, newEntriesUsed, remaining]
  );

  io.emit('scan-result', {
    success: true,
    message: 'Entry Granted',
    ticketNumber,
    name: ticket.name,
    remaining,
    entryNumber: newEntriesUsed,
    maxEntries: ticket.max_entries,
    gate,
    device,
    time: new Date().toISOString(),
  });
  io.emit('stats-update');
  io.emit('recent-scans-update');

  return new Response(JSON.stringify({
    success: true,
    message: 'Entry Granted',
    ticketNumber,
    name: ticket.name,
    remaining,
    entryNumber: newEntriesUsed,
    maxEntries: ticket.max_entries,
    type: 'success',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleBulkAction(req: Request, io: Server) {
  const body = await req.json();
  const { action, ticketIds, value } = body;

  if (action === 'increase-entries') {
    sqliteDb.run('UPDATE tickets SET entries_used = MAX(0, entries_used - 1), updated_at = datetime("now") WHERE id IN (' + ticketIds.join(',') + ')');
    const tickets = sqliteDb.query('SELECT * FROM tickets WHERE id IN (' + ticketIds.join(',') + ')').all();
    for (const t of tickets as any[]) {
      const remaining = t.max_entries - t.entries_used;
      sqliteDb.run(
        'INSERT INTO scans (ticket_id, gate, device, result, ticket_number, entries_used, remaining, time) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))',
        [t.id, 'System', 'Admin', 'ADJUSTMENT', t.ticket_number, t.entries_used, remaining]
      );
    }
    sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['BULK_INCREASE', `Increased entries for ${ticketIds.length} tickets`]);
  } else if (action === 'decrease-entries') {
    sqliteDb.run('UPDATE tickets SET entries_used = MIN(max_entries, entries_used + 1), updated_at = datetime("now") WHERE id IN (' + ticketIds.join(',') + ')');
    sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['BULK_DECREASE', `Decreased entries for ${ticketIds.length} tickets`]);
  } else if (action === 'block') {
    sqliteDb.run('UPDATE tickets SET status = "BLOCKED", updated_at = datetime("now") WHERE id IN (' + ticketIds.join(',') + ')');
    sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['BULK_BLOCK', `Blocked ${ticketIds.length} tickets`]);
  } else if (action === 'unblock') {
    sqliteDb.run('UPDATE tickets SET status = "ACTIVE", updated_at = datetime("now") WHERE id IN (' + ticketIds.join(',') + ')');
    sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['BULK_UNBLOCK', `Unblocked ${ticketIds.length} tickets`]);
  } else if (action === 'delete') {
    sqliteDb.run('DELETE FROM scans WHERE ticket_id IN (' + ticketIds.join(',') + ')');
    sqliteDb.run('DELETE FROM tickets WHERE id IN (' + ticketIds.join(',') + ')');
    sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['BULK_DELETE', `Deleted ${ticketIds.length} tickets`]);
  } else if (action === 'reset') {
    sqliteDb.run('UPDATE tickets SET entries_used = 0, status = "ACTIVE", updated_at = datetime("now") WHERE id IN (' + ticketIds.join(',') + ')');
    sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))', ['BULK_RESET', `Reset ${ticketIds.length} tickets`]);
  }

  io.emit('stats-update');
  io.emit('tickets-update');

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleAuthorize(req: Request, io: Server) {
  const body = await req.json();
  const { ticketId, password, authorizedBy, note } = body;

  if (password !== AUTH_PASSWORD) {
    sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))',
      ['AUTH_FAILED', `Wrong authorization password attempt for ticket #${ticketId}`]);
    return new Response(JSON.stringify({ success: false, message: 'Incorrect Authorization Password' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ticket = sqliteDb.query('SELECT * FROM tickets WHERE id = ?').get(ticketId) as any;
  if (!ticket) {
    return new Response(JSON.stringify({ success: false, message: 'Ticket not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = new Date().toISOString();
  sqliteDb.run(
    'UPDATE tickets SET authorized = 1, authorized_by = ?, authorization_time = ?, authorization_note = ?, updated_at = datetime("now") WHERE id = ?',
    [authorizedBy, now, note || '', ticketId]
  );

  sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))',
    ['TICKET_AUTHORIZED', `Ticket #${ticket.ticketNumber} authorized by ${authorizedBy}`]);

  io.emit('tickets-update');
  io.emit('stats-update');

  return new Response(JSON.stringify({ success: true, message: 'Ticket authorized successfully' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleBulkAuthorize(req: Request, io: Server) {
  const body = await req.json();
  const { ticketIds, password, authorizedBy } = body;

  if (password !== AUTH_PASSWORD) {
    return new Response(JSON.stringify({ success: false, message: 'Incorrect Authorization Password' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = new Date().toISOString();
  for (const id of ticketIds) {
    const ticket = sqliteDb.query('SELECT ticket_number FROM tickets WHERE id = ?').get(id) as any;
    if (ticket) {
      sqliteDb.run(
        'UPDATE tickets SET authorized = 1, authorized_by = ?, authorization_time = ?, updated_at = datetime("now") WHERE id = ?',
        [authorizedBy, now, id]
      );
    }
  }

  sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))',
    ['BULK_AUTHORIZE', `Authorized ${ticketIds.length} tickets by ${authorizedBy}`]);

  io.emit('tickets-update');
  io.emit('stats-update');

  return new Response(JSON.stringify({ success: true, message: `${ticketIds.length} tickets authorized` }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleDeauthorize(req: Request, io: Server) {
  const body = await req.json();
  const { ticketId, password } = body;

  if (password !== AUTH_PASSWORD) {
    return new Response(JSON.stringify({ success: false, message: 'Incorrect Authorization Password' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ticket = sqliteDb.query('SELECT * FROM tickets WHERE id = ?').get(ticketId) as any;
  if (!ticket) {
    return new Response(JSON.stringify({ success: false, message: 'Ticket not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  sqliteDb.run(
    'UPDATE tickets SET authorized = 0, authorized_by = "", authorization_time = "", updated_at = datetime("now") WHERE id = ?',
    [ticketId]
  );

  sqliteDb.run('INSERT INTO admin_logs (action, description, time) VALUES (?, ?, datetime("now"))',
    ['TICKET_DEAUTHORIZED', `Authorization removed for ticket #${ticket.ticketNumber}`]);

  io.emit('tickets-update');
  io.emit('stats-update');

  return new Response(JSON.stringify({ success: true, message: 'Authorization removed' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleVerifyPassword(req: Request) {
  const body = await req.json();
  const { password } = body;
  return new Response(JSON.stringify({ valid: password === AUTH_PASSWORD }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function getChartData() {
  const hourlyEntries = sqliteDb.query(`
    SELECT strftime('%H', time) as hour, COUNT(*) as count
    FROM scans
    WHERE result = 'SUCCESS'
    AND time >= datetime('now', '-24 hours')
    GROUP BY strftime('%H', time)
    ORDER BY hour
  `).all();

  const entriesByGate = sqliteDb.query(`
    SELECT gate, COUNT(*) as count
    FROM scans
    WHERE result = 'SUCCESS'
    GROUP BY gate
  `).all();

  const dailyActivity = sqliteDb.query(`
    SELECT date(time) as date, COUNT(*) as count
    FROM scans
    WHERE time >= datetime('now', '-7 days')
    GROUP BY date(time)
    ORDER BY date
  `).all();

  const totalEntries = (sqliteDb.query('SELECT COUNT(*) as count FROM scans WHERE result = ?').get('SUCCESS') as any).count;
  const totalRemaining = (sqliteDb.query('SELECT COALESCE(SUM(max_entries - entries_used), 0) as total FROM tickets').get() as any).total;

  return new Response(JSON.stringify({
    hourlyEntries,
    entriesByGate,
    dailyActivity,
    entriesUsed: totalEntries,
    remaining: totalRemaining,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function getStats(io: Server) {
  const totalTickets = (sqliteDb.query('SELECT COUNT(*) as count FROM tickets').get() as any).count;
  const maxEntries = (sqliteDb.query('SELECT COALESCE(SUM(max_entries), 0) as total FROM tickets').get() as any).total;
  const uniqueTicketsScanned = (sqliteDb.query('SELECT COUNT(DISTINCT ticket_id) as count FROM scans WHERE result = ?').get('SUCCESS') as any).count;
  const entriesUsed = (sqliteDb.query("SELECT COUNT(*) as count FROM scans WHERE result = 'SUCCESS'").get() as any).count;
  const remainingEntries = (sqliteDb.query("SELECT COALESCE(SUM(max_entries - entries_used), 0) as total FROM tickets").get() as any).total;
  const deniedAttempts = (sqliteDb.query("SELECT COUNT(*) as count FROM scans WHERE result = 'DENIED'").get() as any).count;
  const activeScanners = (sqliteDb.query("SELECT COUNT(*) as count FROM scanner_devices WHERE online = 1").get() as any).count;
  const peopleInside = (sqliteDb.query("SELECT COUNT(DISTINCT ticket_id) as count FROM scans WHERE result = 'SUCCESS'").get() as any).count;
  const authorizedTickets = (sqliteDb.query("SELECT COUNT(*) as count FROM tickets WHERE authorized = 1").get() as any).count;
  const unauthorizedTickets = (sqliteDb.query("SELECT COUNT(*) as count FROM tickets WHERE authorized = 0").get() as any).count;
  const deniedUnauthorized = (sqliteDb.query("SELECT COUNT(*) as count FROM scans s JOIN tickets t ON s.ticket_id = t.id WHERE s.result = 'DENIED' AND t.authorized = 0").get() as any).count;

  const recentScans = sqliteDb.query(`
    SELECT s.*, t.name as ticket_name, t.ticket_number as tkt_num
    FROM scans s
    LEFT JOIN tickets t ON s.ticket_id = t.id
    ORDER BY s.time DESC
    LIMIT 50
  `).all();

  return new Response(JSON.stringify({
    totalTickets,
    maxEntries,
    uniqueTicketsScanned,
    entriesUsed,
    remainingEntries,
    deniedAttempts,
    activeScanners,
    peopleInside,
    authorizedTickets,
    unauthorizedTickets,
    deniedUnauthorized,
    recentScans,
    currentTime: new Date().toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

console.log(`\x1b[36m╔══════════════════════════════════════════╗`);
console.log(`\x1b[36m║        Event Scan Server v1.0           ║`);
console.log(`\x1b[36m╠══════════════════════════════════════════╣`);
console.log(`\x1b[36m║                                          ║`);
console.log(`\x1b[36m║  Admin Dashboard:                        ║`);
console.log(`\x1b[36m║  http://${lanIp}:${PORT}                   ║`);
console.log(`\x1b[36m║                                          ║`);
console.log(`\x1b[36m║  Scanner Page (for phones):              ║`);
console.log(`\x1b[36m║  http://${lanIp}:${PORT}/scanner           ║`);
if (tlsConfig) {
  console.log(`\x1b[36m║  https://${lanIp}:3443/scanner (iOS)     ║`);
}
console.log(`\x1b[36m║                                          ║`);
if (tlsConfig) {
  console.log(`\x1b[36m║  iOS: Use HTTPS on port 3443 for camera ║`);
} else {
  console.log(`\x1b[36m║  Install openssl for HTTPS (iOS camera) ║`);
}
console.log(`\x1b[36m║                                          ║`);
console.log(`\x1b[36m║  Socket.IO: ws://${lanIp}:8080            ║`);
console.log(`\x1b[36m║                                          ║`);
console.log(`\x1b[36m╚══════════════════════════════════════════╝\x1b[0m`);

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});
