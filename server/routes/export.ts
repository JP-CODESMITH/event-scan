import { sqliteDb } from '../db/index';

export async function handleExport(req: Request, subpath: string) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (subpath === '/csv') {
    const tickets = sqliteDb.query('SELECT * FROM tickets ORDER BY ticket_number ASC').all() as any[];
    let csv = 'Ticket Number,Name,Phone,Email,Max Entries,Entries Used,Remaining,Status,Authorized,Authorized By,Authorization Time,Created At\n';
    for (const t of tickets) {
      const remaining = t.max_entries - t.entries_used;
      const auth = t.authorized ? 'Yes' : 'No';
      csv += `${t.ticket_number},"${t.name || ''}","${t.phone || ''}","${t.email || ''}",${t.max_entries},${t.entries_used},${remaining},${t.status},${auth},"${t.authorized_by || ''}","${t.authorization_time || ''}",${t.created_at}\n`;
    }
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="tickets.csv"',
        ...corsHeaders,
      },
    });
  }

  if (subpath === '/history-csv') {
    const scans = sqliteDb.query(`
      SELECT s.*, t.name as ticket_name
      FROM scans s
      LEFT JOIN tickets t ON s.ticket_id = t.id
      ORDER BY s.time DESC
    `).all() as any[];
    let csv = 'Ticket Number,Attendee Name,Gate,Device,Result,Entries Used,Remaining,Time\n';
    for (const s of scans) {
      csv += `${s.ticket_number},"${s.ticket_name || ''}","${s.gate || ''}","${s.device || ''}",${s.result},${s.entries_used || 0},${s.remaining || 0},${s.time}\n`;
    }
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="scan-history.csv"',
        ...corsHeaders,
      },
    });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
