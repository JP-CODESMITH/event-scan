import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Hash,
  Lock,
  Search,
  ShieldCheck,
  ShieldX,
  X,
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { PageHeader } from '../components/layout/PageHeader';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { api } from '../lib/api';
import { cn, formatDateTime } from '../lib/utils';
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

const PAGE_SIZE = 20;

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
    const guarded = () => {
      if (!dialogOpenRef.current) fetchTickets();
    };
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
      data = data.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.phone.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q)
      );
    }
    if (authFilter === 'AUTHORIZED') data = data.filter((t) => t.authorized);
    else if (authFilter === 'UNAUTHORIZED') data = data.filter((t) => !t.authorized);
    return data;
  }, [tickets, search, authFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedTickets = filteredTickets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalAuthorized = tickets.filter((t) => t.authorized).length;
  const totalUnauthorized = tickets.filter((t) => !t.authorized).length;
  const allSelected = paginatedTickets.length > 0 && paginatedTickets.every((t) => selected.has(t.id));

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(paginatedTickets.map((t) => t.id)));
  };

  const closeAuthModal = (open: boolean) => {
    dialogOpenRef.current = open;
    setAuthModalOpen(open);
    if (!open) {
      setPassword('');
      setAuthNote('');
    }
  };

  const closeDeauthModal = (open: boolean) => {
    dialogOpenRef.current = open;
    setDeauthModalOpen(open);
    if (!open) setPassword('');
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
      toast.success(res.message || 'Ticket authorised');
      closeAuthModal(false);
      setCurrentTicketId(null);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Authorisation failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDeauthorize = async () => {
    if (currentTicketId === null || !password) return;
    setAuthLoading(true);
    try {
      const res = await api.deauthorizeTicket({ ticketId: currentTicketId, password });
      toast.success(res.message || 'Authorisation removed');
      closeDeauthModal(false);
      setCurrentTicketId(null);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove authorisation');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleBulkAuthorize = () => {
    if (selected.size === 0) return;
    setPassword('');
    dialogOpenRef.current = true;
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
      toast.success(res.message || 'Tickets authorised');
      closeAuthModal(false);
      setSelected(new Set());
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Bulk authorisation failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const isBulk = selected.size > 1;
  const modalTicket = tickets.find((t) => t.id === currentTicketId);
  const navButton =
    'flex h-9 w-9 items-center justify-center rounded-sm text-ink-secondary transition-colors hover:bg-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-30';

  return (
    <Layout>
      <PageHeader
        eyebrow="Door policy"
        title="Authorisation"
        description="Only authorised tickets pass the gate. Authorise a whole list at once, or remove one guest with the secondary password."
        actions={
          <Button variant="outline" asChild>
            <Link to="/tickets">
              <Hash className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              All tickets
            </Link>
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
        <div className="bg-surface p-5">
          <p className="eyebrow">Authorised</p>
          <p className="mt-2 font-mono text-[2rem] font-medium leading-none tabular text-success">{totalAuthorized}</p>
          <p className="mt-2 text-tiny text-ink-tertiary">cleared for entry</p>
        </div>
        <div className="bg-surface p-5">
          <p className="eyebrow">Not authorised</p>
          <p className="mt-2 font-mono text-[2rem] font-medium leading-none tabular text-warning">{totalUnauthorized}</p>
          <p className="mt-2 text-tiny text-ink-tertiary">will be refused at the gate</p>
        </div>
        <div className="bg-surface p-5">
          <p className="eyebrow">Total tickets</p>
          <p className="mt-2 font-mono text-[2rem] font-medium leading-none tabular text-ink">{tickets.length}</p>
          <p className="mt-2 text-tiny text-ink-tertiary">on the guest list</p>
        </div>
      </div>

      <section aria-label="Ticket authorisations" className="overflow-hidden rounded-md border border-border bg-surface">
        <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" strokeWidth={1.7} aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search number, name, phone, email"
              aria-label="Search tickets"
              className="pl-9"
            />
          </div>
          <Select
            value={authFilter}
            onValueChange={(v) => {
              setAuthFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-[168px]" aria-label="Filter by authorisation">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All tickets</SelectItem>
              <SelectItem value="AUTHORIZED">Authorised</SelectItem>
              <SelectItem value="UNAUTHORIZED">Not authorised</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-accent-soft/60 px-4 py-2.5">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent-strong">
              {selected.size} selected
            </span>
            <Button size="sm" onClick={handleBulkAuthorize}>
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
              Authorise selected
            </Button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-auto flex h-8 items-center gap-1 rounded-sm px-2 text-tiny text-ink-secondary transition-colors hover:bg-surface hover:text-ink"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
              Clear
            </button>
          </div>
        )}

        {paginatedTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-sm border border-border bg-sunken text-ink-secondary">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
            </span>
            <p className="mt-4 font-display text-[1.35rem] font-medium text-ink">
              {search || authFilter !== 'ALL' ? 'No tickets match' : 'No tickets yet'}
            </p>
            <p className="mt-1 text-small text-ink-secondary">
              {search || authFilter !== 'ALL'
                ? 'Adjust the search or filter to see more guests.'
                : 'Import the guest list from Tickets to start authorising.'}
            </p>
          </div>
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="border-b border-border bg-sunken/40">
                  <th className="w-10 px-4 py-2.5 text-left">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={allSelected}
                      aria-label="Select all tickets on this page"
                      onClick={toggleSelectAll}
                      className={cn(
                        'flex h-[18px] w-[18px] items-center justify-center rounded-sm border transition-colors',
                        allSelected ? 'border-ink bg-ink text-bg' : 'border-border-strong hover:border-ink'
                      )}
                    >
                      {allSelected && <Check className="h-3 w-3" strokeWidth={2.4} aria-hidden="true" />}
                    </button>
                  </th>
                  {['Ticket', 'Guest', 'Authorisation', 'Authorised by', 'Time', 'Entries', ''].map((label, i) => (
                    <th
                      key={i}
                      className={cn(
                        'px-3 py-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-ink-tertiary',
                        i === 6 ? 'text-right' : 'text-left'
                      )}
                    >
                      {label}
                      {i === 6 && <span className="sr-only">Actions</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedTickets.map((ticket) => {
                  const remaining = Math.max(ticket.maxEntries - ticket.entriesUsed, 0);
                  return (
                    <tr key={ticket.id} className="row-hover">
                      <td className="w-10 px-4 py-3">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={selected.has(ticket.id)}
                          aria-label={`Select ticket ${ticket.ticketNumber}`}
                          onClick={() => toggleSelect(ticket.id)}
                          className={cn(
                            'flex h-[18px] w-[18px] items-center justify-center rounded-sm border transition-colors',
                            selected.has(ticket.id)
                              ? 'border-ink bg-ink text-bg'
                              : 'border-border-strong hover:border-ink'
                          )}
                        >
                          {selected.has(ticket.id) && <Check className="h-3 w-3" strokeWidth={2.4} aria-hidden="true" />}
                        </button>
                      </td>
                      <td className="px-3 py-3 font-mono text-small font-medium tabular text-ink">{ticket.ticketNumber}</td>
                      <td className="max-w-[220px] px-3 py-3">
                        <p className="truncate text-small text-ink">{ticket.name || '—'}</p>
                        {ticket.phone && <p className="truncate font-mono text-[10px] text-ink-tertiary">{ticket.phone}</p>}
                      </td>
                      <td className="px-3 py-3">
                        {ticket.authorized ? (
                          <Badge variant="success" dot>Authorised</Badge>
                        ) : (
                          <Badge variant="warning" dot>Not authorised</Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 text-tiny text-ink-secondary">{ticket.authorizedBy || '—'}</td>
                      <td className="px-3 py-3 text-tiny tabular text-ink-secondary">
                        {ticket.authorizationTime ? formatDateTime(ticket.authorizationTime) : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-tiny tabular text-ink-secondary">
                          {ticket.entriesUsed}/{ticket.maxEntries}
                          <span className="ml-1 text-ink-tertiary">· {remaining} left</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        {ticket.authorized ? (
                          <Button
                            variant="danger-quiet"
                            size="sm"
                            onClick={() => {
                              dialogOpenRef.current = true;
                              setCurrentTicketId(ticket.id);
                              setPassword('');
                              setDeauthModalOpen(true);
                            }}
                          >
                            <ShieldX className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                            Remove
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              dialogOpenRef.current = true;
                              setCurrentTicketId(ticket.id);
                              setPassword('');
                              setAuthNote('');
                              setAuthModalOpen(true);
                            }}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                            Authorise
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
            Showing {paginatedTickets.length} of {filteredTickets.length}
          </p>
          {totalPages > 1 && (
            <nav className="flex items-center gap-0.5" aria-label="Authorisation pages">
              <button type="button" className={navButton} onClick={() => setPage(1)} disabled={page <= 1} aria-label="First page">
                <ChevronsLeft className="h-4 w-4" strokeWidth={1.8} />
              </button>
              <button
                type="button"
                className={navButton}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
              </button>
              <span className="px-2 font-mono text-tiny tabular text-ink-secondary">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                className={navButton}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
              </button>
              <button
                type="button"
                className={navButton}
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </nav>
          )}
        </div>
      </section>

      <Dialog open={authModalOpen} onOpenChange={closeAuthModal}>
        <DialogContent>
          <DialogHeader>
            <p className="eyebrow">{isBulk ? 'Bulk authorisation' : 'Single authorisation'}</p>
            <DialogTitle>{isBulk ? `Authorise ${selected.size} tickets` : 'Authorise this ticket'}</DialogTitle>
            <DialogDescription>
              {isBulk
                ? `These ${selected.size} tickets will be cleared for entry.`
                : `Ticket ${modalTicket?.ticketNumber || ''}${modalTicket?.name ? ` · ${modalTicket.name}` : ''}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {!isBulk && (
              <div>
                <label htmlFor="auth-note" className="mb-1.5 block text-tiny font-medium text-ink">
                  Note <span className="font-normal text-ink-tertiary">(optional)</span>
                </label>
                <Input
                  id="auth-note"
                  value={authNote}
                  onChange={(e) => setAuthNote(e.target.value)}
                  placeholder="Reason for authorising"
                />
              </div>
            )}
            <div>
              <label htmlFor="auth-password" className="mb-1.5 flex items-center gap-1.5 text-tiny font-medium text-ink">
                <Lock className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
                Authorisation password
              </label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the secondary password"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => closeAuthModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={isBulk ? confirmBulkAuthorize : handleAuthorize}
              disabled={!password}
              loading={authLoading}
            >
              {isBulk ? `Authorise ${selected.size}` : 'Authorise'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deauthModalOpen} onOpenChange={closeDeauthModal}>
        <DialogContent>
          <DialogHeader>
            <p className="eyebrow">Remove clearance</p>
            <DialogTitle>Remove authorisation</DialogTitle>
            <DialogDescription>
              Ticket {modalTicket?.ticketNumber || ''} will be refused at the gate until it is authorised again.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label htmlFor="deauth-password" className="mb-1.5 flex items-center gap-1.5 text-tiny font-medium text-ink">
              <Lock className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
              Authorisation password
            </label>
            <Input
              id="deauth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter the secondary password"
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => closeDeauthModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeauthorize} disabled={!password} loading={authLoading}>
              Remove authorisation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
