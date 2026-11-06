const API_BASE = '/api';
export function normalizeTicket(row: any) {
  if (!row) return row;
  return {
    ...row,
    ticketNumber: row.ticketNumber ?? row.ticket_number ?? '',
    maxEntries: Number(row.maxEntries ?? row.max_entries ?? 0),
    entriesUsed: Number(row.entriesUsed ?? row.entries_used ?? 0),
    createdAt: row.createdAt ?? row.created_at ?? '',
    updatedAt: row.updatedAt ?? row.updated_at ?? '',
    authorized: Boolean(row.authorized),
    authorizedBy: row.authorizedBy ?? row.authorized_by ?? '',
    authorizationTime: row.authorizationTime ?? row.authorization_time ?? '',
    authorizationNote: row.authorizationNote ?? row.authorization_note ?? '',
  };
}

export function normalizeScan(row: any) {
  if (!row) return row;
  return {
    ...row,
    ticketNumber: row.ticketNumber ?? row.ticket_number ?? '',
    entriesUsed: Number(row.entriesUsed ?? row.entries_used ?? 0),
    remaining: Number(row.remaining ?? 0),
    ticketName: row.ticketName ?? row.ticket_name ?? '',
    ticketId: row.ticketId ?? row.ticket_id ?? null,
  };
}

export function normalizeDevice(row: any) {
  if (!row) return row;
  return {
    ...row,
    deviceId: row.deviceId ?? row.device_id ?? '',
    lastSeen: row.lastSeen ?? row.last_seen ?? '',
    battery: Number(row.battery ?? 0),
    online: Boolean(row.online),
  };
}

function normalizeList(data: any, normalizer: (row: any) => any) {
  if (Array.isArray(data)) return data.map(normalizer);
  if (data && Array.isArray(data.items)) return { ...data, items: data.items.map(normalizer) };
  if (data && Array.isArray(data.data)) return { ...data, data: data.data.map(normalizer) };
  return data;
}


async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

export const api = {
  getStats: () => request<any>('/stats'),
  getTickets: async (params?: { status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return normalizeList(await request<any>(`/tickets?${q}`), normalizeTicket);
  },
  getAllTickets: async () => normalizeList(await request<any>('/tickets/all'), normalizeTicket),
  getTicket: async (id: number) => {
    const res = await request<any>(`/tickets/${id}`);
    const ticket = normalizeTicket(res.data ?? res);
    if (Array.isArray(ticket?.scanHistory)) {
      ticket.scanHistory = ticket.scanHistory.map(normalizeScan);
    }
    return res.data ? { ...res, data: ticket } : ticket;
  },
  updateTicket: (id: number, data: any) =>
    request<any>(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetTicket: (id: number) =>
    request<any>(`/tickets/${id}/reset`, { method: 'POST' }),
  blockTicket: (id: number) =>
    request<any>(`/tickets/${id}/block`, { method: 'POST' }),
  unblockTicket: (id: number) =>
    request<any>(`/tickets/${id}/unblock`, { method: 'POST' }),
  increaseEntries: (id: number) =>
    request<any>(`/tickets/${id}/increase`, { method: 'POST' }),
  decreaseEntries: (id: number) =>
    request<any>(`/tickets/${id}/decrease`, { method: 'POST' }),
  deleteTicket: (id: number) =>
    request<any>(`/tickets/${id}/delete`, { method: 'DELETE' }),
  getScans: async (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return normalizeList(await request<any>(`/scans?${q}`), normalizeScan);
  },
  getRecentScans: async () => normalizeList(await request<any>('/scans/recent'), normalizeScan),
  getScanHistory: async (ticketNumber: string) =>
    normalizeList(await request<any>(`/scans/history?ticketNumber=${encodeURIComponent(ticketNumber)}`), normalizeScan),
  clearScans: () => request<any>('/scans/clear', { method: 'POST' }),
  getSettings: () => request<Record<string, string>>('/settings'),
  updateSettings: (data: any) =>
    request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  updateDefaultEntries: (data: { defaultEntries: number; applyTo: string }) =>
    request<any>('/settings/default-entries', { method: 'POST', body: JSON.stringify(data) }),
  search: async (q: string) => normalizeList(await request<any>(`/search?q=${encodeURIComponent(q)}`), normalizeTicket),
  chartData: () => request<any>('/chart-data'),
  scannerDevices: async () => normalizeList(await request<any>('/scanner-devices'), normalizeDevice),
  network: () => request<{ ip: string; port: number }>('/network'),
  login: (username: string, password: string) =>
    request<any>('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  verifySession: (token: string) =>
    request<any>('/admin/verify', { method: 'POST', body: JSON.stringify({ token }) }),
  logout: (token: string) =>
    request<any>('/admin/logout', { method: 'POST', body: JSON.stringify({ token }) }),
  adminLogs: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return request<any>(`/admin/logs?${q}`);
  },
  resetAll: () => request<any>('/admin/reset-all', { method: 'POST' }),
  resetScans: () => request<any>('/admin/reset-scans', { method: 'POST' }),
  bulkAction: (data: { action: string; ticketIds: number[]; value?: any }) =>
    request<any>('/bulk', { method: 'POST', body: JSON.stringify(data) }),
  authorizeTicket: (data: { ticketId: number; password: string; authorizedBy: string; note?: string }) =>
    request<any>('/authorize', { method: 'POST', body: JSON.stringify(data) }),
  deauthorizeTicket: (data: { ticketId: number; password: string }) =>
    request<any>('/authorize/deauthorize', { method: 'POST', body: JSON.stringify(data) }),
  bulkAuthorize: (data: { ticketIds: number[]; password: string; authorizedBy: string }) =>
    request<any>('/authorize/bulk', { method: 'POST', body: JSON.stringify(data) }),
  verifyAuthPassword: (password: string) =>
    request<{ valid: boolean }>('/authorize/verify-password', { method: 'POST', body: JSON.stringify({ password }) }),
  scanTicket: (data: { ticketNumber: string; gate: string; device: string; deviceId: string }) =>
    request<any>('/scan', { method: 'POST', body: JSON.stringify(data) }),
  exportCsv: () => `${API_BASE}/export/csv`,
  exportHistoryCsv: () => `${API_BASE}/export/history-csv`,
  importCsv: (csvText: string) =>
    request<any>('/import/csv', { method: 'POST', body: csvText }),
};
