import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, ShieldCheck, ShieldX, Check, X, Lock, User, Clock, Hash,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { getSocket } from '../lib/socket';

interface AuthTicket {
  id: number;
  ticketNumber: string;
  name: string;
  phone: string;
  email: string;
  maxEntries: number;
  entriesUsed: number;
  status: string;
  authorized: boolean;
  authorizedBy: string;
  authorizationTime: string;
  createdAt: string;
}

export function AuthorizedTicketsPage() {
  const [tickets, setTickets] = useState<AuthTicket[]>([]);
  const [search, setSearch] = useState('');
  const [authFilter, setAuthFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [deauthModalOpen, setDeauthModalOpen] = useState(false);
  const [currentTicketId, setCurrentTicketId] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authNote, setAuthNote] = useState('');
  const dialogOpenRef = useRef(false);
  const PAGE_SIZE = 20;

  const fetchTickets = async () => {
    try {
      const res = await api.getAllTickets();
      const data = Array.isArray(res) ? res : res.data ?? res.tickets ?? [];
      setTickets(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load tickets');
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const guarded = () => { if (!dialogOpenRef.current) fetchTickets(); };
    socket.on('tickets-update', guarded);
    socket.on('stats-update', guarded);
    return () => {
      socket.off('tickets-update', guarded);
      socket.off('stats-update', guarded);
    };
  }, []);

  const filteredTickets = useMemo(() => {
    let data = tickets;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(t =>
        t.ticketNumber.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.phone.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q)
      );
    }
    if (authFilter !== 'ALL') {
      if (authFilter === 'AUTHORIZED') data = data.filter(t => t.authorized);
      else if (authFilter === 'UNAUTHORIZED') data = data.filter(t => !t.authorized);
    }
    return data;
  }, [tickets, search, authFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedTickets = filteredTickets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalAuthorized = tickets.filter(t => t.authorized).length;
  const totalUnauthorized = tickets.filter(t => !t.authorized).length;

  const allSelected = paginatedTickets.length > 0 && selected.size === paginatedTickets.length;

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(paginatedTickets.map(t => t.id)));
  };

  const handleAuthorize = async () => {
    if (currentTicketId === null || !password) return;
    setAuthLoading(true);
    try {
      const res = await api.authorizeTicket({
        ticketId: currentTicketId,
        password,
        authorizedBy: localStorage.getItem('username') || 'Admin',
        note: authNote,
      });
      toast.success(res.message || 'Ticket authorized');
      setAuthModalOpen(false);
      setPassword('');
      setAuthNote('');
      setCurrentTicketId(null);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Authorization failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDeauthorize = async () => {
    if (currentTicketId === null || !password) return;
    setAuthLoading(true);
    try {
      const res = await api.deauthorizeTicket({
        ticketId: currentTicketId,
        password,
      });
      toast.success(res.message || 'Authorization removed');
      setDeauthModalOpen(false);
      setPassword('');
      setCurrentTicketId(null);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove authorization');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleBulkAuthorize = async () => {
    if (selected.size === 0) return;
    setPassword('');
    setAuthModalOpen(true);
  };

  const confirmBulkAuthorize = async () => {
    if (selected.size === 0 || !password) return;
    setAuthLoading(true);
    try {
      const res = await api.bulkAuthorize({
        ticketIds: Array.from(selected),
        password,
        authorizedBy: localStorage.getItem('username') || 'Admin',
      });
      toast.success(res.message || 'Tickets authorized');
      setAuthModalOpen(false);
      setPassword('');
      setSelected(new Set());
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Bulk authorization failed');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Authorized Tickets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage ticket authorization — only authorized tickets can be scanned for entry
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/60">Authorized</p>
                <p className="text-2xl font-bold text-white tabular-nums">{totalAuthorized}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
                <ShieldX className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/60">Unauthorized</p>
                <p className="text-2xl font-bold text-white tabular-nums">{totalUnauthorized}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Hash className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/60">Total Tickets</p>
                <p className="text-2xl font-bold text-white tabular-nums">{tickets.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-white/5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by ticket number, name, phone, or email..."
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Select value={authFilter} onValueChange={v => { setAuthFilter(v); setPage(1); }}>
                <SelectTrigger className="h-9 w-[160px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Tickets</SelectItem>
                  <SelectItem value="AUTHORIZED">Authorized</SelectItem>
                  <SelectItem value="UNAUTHORIZED">Unauthorized</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selected.size > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border-b border-primary/20">
                <span className="text-xs font-medium text-primary mr-2">{selected.size} selected</span>
                <Button variant="ghost" size="xs" onClick={handleBulkAuthorize} className="text-white/70 hover:text-white">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  Authorize Selected
                </Button>
              </div>
            )}

            {paginatedTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/40">
                <ShieldCheck className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">
                  {search || authFilter !== 'ALL' ? 'No tickets match your filters' : 'No tickets found'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="p-3 text-left">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="rounded border-white/20 bg-white/5"
                        />
                      </th>
                      <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Ticket</th>
                      <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Name</th>
                      <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Authorized</th>
                      <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Authorized By</th>
                      <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Auth Time</th>
                      <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Entries</th>
                      <th className="p-3 text-right text-xs font-medium uppercase tracking-wider text-white/40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTickets.map(ticket => {
                      const remaining = Math.max(ticket.maxEntries - ticket.entriesUsed, 0);
                      return (
                        <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selected.has(ticket.id)}
                              onChange={() => toggleSelect(ticket.id)}
                              className="rounded border-white/20 bg-white/5"
                            />
                          </td>
                          <td className="p-3">
                            <span className="text-sm font-mono text-white/80">{ticket.ticketNumber}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-white/70">{ticket.name || '—'}</span>
                          </td>
                          <td className="p-3">
                            {ticket.authorized ? (
                              <Badge variant="success" className="text-[10px]">
                                <Check className="h-3 w-3 mr-1" />
                                Authorized
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="text-[10px]">
                                <X className="h-3 w-3 mr-1" />
                                Unauthorized
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-sm text-white/50">
                            {ticket.authorizedBy || '—'}
                          </td>
                          <td className="p-3 text-sm text-white/50">
                            {ticket.authorizationTime ? new Date(ticket.authorizationTime).toLocaleString() : '—'}
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-white/70">
                              {ticket.entriesUsed}/{ticket.maxEntries}
                              <span className="text-white/30 ml-1">({remaining} left)</span>
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {ticket.authorized ? (
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => { dialogOpenRef.current = true; setCurrentTicketId(ticket.id); setPassword(''); setDeauthModalOpen(true); }}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <ShieldX className="h-3.5 w-3.5 mr-1" />
                                  Remove
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => { dialogOpenRef.current = true; setCurrentTicketId(ticket.id); setPassword(''); setAuthNote(''); setAuthModalOpen(true); }}
                                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                  Authorize
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-white/40">
                Showing {paginatedTickets.length} of {filteredTickets.length} tickets
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(1)} disabled={page <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-white/40 px-2">Page {safePage} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPage(totalPages)} disabled={page >= totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={authModalOpen} onOpenChange={v => { dialogOpenRef.current = v; setAuthModalOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              {selected.size > 1 ? `Authorize ${selected.size} Tickets` : 'Authorize Ticket'}
            </DialogTitle>
            <DialogDescription>
              {selected.size > 1
                ? `You are about to authorize ${selected.size} tickets.`
                : `Ticket #${tickets.find(t => t.id === currentTicketId)?.ticketNumber || ''}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selected.size <= 1 && (
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Note (optional)</label>
                <Input
                  value={authNote}
                  onChange={e => setAuthNote(e.target.value)}
                  placeholder="Reason for authorizing..."
                  className="h-9 text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">
                <Lock className="h-3 w-3 inline mr-1" />
                Authorization Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter authorization password..."
                className="h-9 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setAuthModalOpen(false); setPassword(''); setAuthNote(''); }}>
              Cancel
            </Button>
            <Button
              onClick={selected.size > 1 ? confirmBulkAuthorize : handleAuthorize}
              disabled={!password || authLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {authLoading ? 'Authorizing...' : 'Authorize'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deauthModalOpen} onOpenChange={v => { dialogOpenRef.current = v; setDeauthModalOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldX className="h-5 w-5 text-red-400" />
              Remove Authorization
            </DialogTitle>
            <DialogDescription>
              Ticket #{tickets.find(t => t.id === currentTicketId)?.ticketNumber || ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-white/60">
              This will prevent this ticket from being scanned for entry.
            </p>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">
                <Lock className="h-3 w-3 inline mr-1" />
                Authorization Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter authorization password..."
                className="h-9 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setDeauthModalOpen(false); setPassword(''); }}>
              Cancel
            </Button>
            <Button
              onClick={handleDeauthorize}
              disabled={!password || authLoading}
              variant="destructive"
            >
              {authLoading ? 'Removing...' : 'Remove Authorization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
