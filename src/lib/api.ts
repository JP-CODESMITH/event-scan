const API_BASE = '/api';

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
  getTickets: (params?: { status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return request<any>(`/tickets?${q}`);
  },
  getAllTickets: () => request<any>('/tickets/all'),
  getTicket: (id: number) => request<any>(`/tickets/${id}`),
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
  getScans: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return request<any>(`/scans?${q}`);
  },
  getRecentScans: () => request<any>('/scans/recent'),
  getScanHistory: (ticketNumber: string) =>
    request<any>(`/scans/history?ticketNumber=${ticketNumber}`),
  clearScans: () => request<any>('/scans/clear', { method: 'POST' }),
  getSettings: () => request<Record<string, string>>('/settings'),
  updateSettings: (data: any) =>
    request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  updateDefaultEntries: (data: { defaultEntries: number; applyTo: string }) =>
    request<any>('/settings/default-entries', { method: 'POST', body: JSON.stringify(data) }),
  search: (q: string) => request<any>(`/search?q=${encodeURIComponent(q)}`),
  chartData: () => request<any>('/chart-data'),
  scannerDevices: () => request<any>('/scanner-devices'),
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
