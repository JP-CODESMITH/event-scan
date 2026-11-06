import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SkeletonRow } from '../ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { api } from '../../lib/api';
import { cn, formatRemaining, getEntryStatusLabel } from '../../lib/utils';
import { getSocket } from '../../lib/socket';
import toast from 'react-hot-toast';
import TicketModal from './TicketModal';

interface Ticket {
  id: number;
  ticketNumber: string;
  name: string;
  phone: string;
  email: string;
  maxEntries: number;
  entriesUsed: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  refreshKey: number;
}

const PAGE_SIZE = 15;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function statusVariant(status: string): 'success' | 'danger' | 'warning' | 'neutral' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'BLOCKED') return 'danger';
  if (status === 'FINISHED') return 'warning';
  return 'neutral';
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    if (start > 2) pages.push('ellipsis');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
  }

  const navButton =
    'flex h-9 w-9 items-center justify-center rounded-sm text-ink-secondary transition-colors hover:bg-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-30';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
        Page {page} of {totalPages}
      </p>
      <nav className="flex items-center gap-0.5" aria-label="Ticket pages">
        <button type="button" className={navButton} onClick={() => onPageChange(1)} disabled={page <= 1} aria-label="First page">
          <ChevronsLeft className="h-4 w-4" strokeWidth={1.8} />
        </button>
        <button type="button" className={navButton} onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e${i}`} className="flex h-9 w-7 items-center justify-center font-mono text-tiny text-ink-tertiary">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'flex h-9 min-w-9 items-center justify-center rounded-sm px-2 font-mono text-tiny tabular transition-colors',
                p === page ? 'bg-ink text-bg' : 'text-ink-secondary hover:bg-sunken hover:text-ink'
              )}
            >
              {p}
            </button>
          )
        )}
        <button type="button" className={navButton} onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
          <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
        </button>
        <button type="button" className={navButton} onClick={() => onPageChange(totalPages)} disabled={page >= totalPages} aria-label="Last page">
          <ChevronsRight className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </nav>
    </div>
  );
}

export default function TicketTable({ refreshKey }: Props) {
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [entryFilter, setEntryFilter] = useState('ALL');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [modalTicketId, setModalTicketId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      let data: Ticket[];
      if (debouncedSearch) {
        const res = await api.search(debouncedSearch);
        data = Array.isArray(res) ? res : res.data ?? res.tickets ?? [];
      } else {
        const res = await api.getAllTickets();
        data = Array.isArray(res) ? res : res.data ?? res.tickets ?? [];
      }

      if (statusFilter !== 'ALL') {
        data = data.filter((t) => t.status === statusFilter);
      }

      setAllTickets(data);
      setPage(1);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load tickets');
      setAllTickets([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets, refreshKey]);

  useEffect(() => {
    const socket = getSocket();
    const handler = () => fetchTickets();
    socket.on('ticket-update', handler);
    socket.on('scan', handler);
    return () => {
      socket.off('ticket-update', handler);
      socket.off('scan', handler);
    };
  }, [fetchTickets]);

  const filteredTickets = useMemo(() => {
    let data = allTickets;
    if (entryFilter !== 'ALL') {
      data = data.filter((t) => getEntryStatusLabel(t.entriesUsed, t.maxEntries) === entryFilter);
    }
    return data;
  }, [allTickets, entryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedTickets = filteredTickets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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

  const handleView = (id: number) => {
    setModalTicketId(id);
    setModalOpen(true);
  };

  const handleAction = async (action: string, id: number) => {
    try {
      let res: any;
      switch (action) {
        case 'reset':
          res = await api.resetTicket(id);
          break;
        case 'block':
          res = await api.blockTicket(id);
          break;
        case 'unblock':
          res = await api.unblockTicket(id);
          break;
        case 'delete':
          res = await api.deleteTicket(id);
          break;
      }
      toast.success(res?.message || `${action} successful`);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || `${action} failed`);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this ticket?')) {
      handleAction('delete', id);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selected.size === 0) return;
    if (['delete', 'reset'].includes(action)) {
      if (!confirm(`Are you sure you want to ${action} ${selected.size} ticket(s)?`)) return;
    }
    try {
      const res = await api.bulkAction({ action, ticketIds: Array.from(selected) });
      toast.success(res?.message || `Bulk ${action} successful`);
      setSelected(new Set());
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || `Bulk ${action} failed`);
    }
  };

  const hasFilters = statusFilter !== 'ALL' || entryFilter !== 'ALL' || !!debouncedSearch;

  return (
    <>
      <section aria-label="Tickets" className="overflow-hidden rounded-md border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Guest list</p>
              <h2 className="mt-1 text-small font-medium text-ink">
                {loading ? 'Loading tickets' : `${filteredTickets.length} ${filteredTickets.length === 1 ? 'ticket' : 'tickets'}`}
                {hasFilters && !loading && allTickets.length !== filteredTickets.length && (
                  <span className="font-normal text-ink-tertiary"> of {allTickets.length}</span>
                )}
              </h2>
            </div>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="flex h-8 items-center gap-1 rounded-sm px-2 text-tiny text-ink-secondary transition-colors hover:bg-sunken hover:text-ink"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" strokeWidth={1.7} aria-hidden="true" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search number, name, phone, email"
                aria-label="Search tickets"
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-[132px]" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={entryFilter} onValueChange={setEntryFilter}>
                <SelectTrigger className="sm:w-[148px]" aria-label="Filter by usage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All usage</SelectItem>
                  <SelectItem value="Unused">Unused</SelectItem>
                  <SelectItem value="Used Once">Used once</SelectItem>
                  <SelectItem value="Used Twice">Used twice</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-accent-soft/60 px-4 py-2.5">
            <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.08em] text-accent-strong">
              {selected.size} selected
            </span>
            <Button variant="ghost" size="sm" onClick={() => handleBulkAction('increase')}>
              <Plus className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
              Entry
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleBulkAction('decrease')}>
              <Minus className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
              Entry
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleBulkAction('block')}>
              <Lock className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
              Block
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleBulkAction('unblock')}>
              <Unlock className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
              Unblock
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleBulkAction('reset')}>
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
              Reset
            </Button>
            <Button variant="danger-quiet" size="sm" className="ml-auto" onClick={() => handleBulkAction('delete')}>
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
              Delete
            </Button>
          </div>
        )}

        <div className="scroll-thin overflow-x-auto">
          {loading ? (
            <div>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : paginatedTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-sm border border-border bg-sunken text-ink-secondary">
                <Search className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <p className="mt-4 font-display text-[1.35rem] font-medium text-ink">
                {hasFilters ? 'No tickets match' : 'No tickets yet'}
              </p>
              <p className="mt-1 max-w-[42ch] text-small text-ink-secondary">
                {hasFilters ? 'Try a different search, status or usage filter.' : 'Import a CSV or add tickets to get the door moving.'}
              </p>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('ALL');
                    setEntryFilter('ALL');
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full min-w-[760px] border-collapse">
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
                  {['Ticket', 'Guest', 'Entries', 'Remaining', 'Status', ''].map((label, i) => (
                    <th
                      key={i}
                      className={cn(
                        'px-3 py-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-ink-tertiary',
                        i === 5 ? 'text-right' : 'text-left'
                      )}
                    >
                      {label}
                      {i === 5 && <span className="sr-only">Actions</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedTickets.map((ticket) => {
                  const isSelected = selected.has(ticket.id);
                  const isBlocked = ticket.status === 'BLOCKED';
                  const remaining = formatRemaining(ticket.entriesUsed, ticket.maxEntries);
                  const usedPercent = Math.min((ticket.entriesUsed / Math.max(ticket.maxEntries, 1)) * 100, 100);

                  return (
                    <tr key={ticket.id} className={cn('row-hover', isSelected && 'bg-accent-soft/40')}>
                      <td className="w-10 px-4 py-3">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={isSelected}
                          aria-label={`Select ticket ${ticket.ticketNumber}`}
                          onClick={() => toggleSelect(ticket.id)}
                          className={cn(
                            'flex h-[18px] w-[18px] items-center justify-center rounded-sm border transition-colors',
                            isSelected ? 'border-ink bg-ink text-bg' : 'border-border-strong hover:border-ink'
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" strokeWidth={2.4} aria-hidden="true" />}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-small font-medium tabular text-ink">{ticket.ticketNumber}</span>
                      </td>
                      <td className="max-w-[240px] px-3 py-3">
                        <p className="truncate text-small text-ink">{ticket.name || '—'}</p>
                        {ticket.email && <p className="truncate text-tiny text-ink-tertiary">{ticket.email}</p>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-[4px] w-16 overflow-hidden bg-sunken" aria-hidden="true">
                            <div
                              className={cn('h-full', remaining === 0 ? 'bg-warning' : 'bg-ink')}
                              style={{ width: `${usedPercent}%` }}
                            />
                          </div>
                          <span className="whitespace-nowrap font-mono text-tiny tabular text-ink-secondary">
                            {ticket.entriesUsed}/{ticket.maxEntries}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'font-mono text-small font-medium tabular',
                            remaining === 0 ? 'text-warning' : 'text-ink'
                          )}
                        >
                          {remaining}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={statusVariant(ticket.status)} dot>
                          {ticket.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleView(ticket.id)}
                            aria-label={`View ticket ${ticket.ticketNumber}`}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleAction('reset', ticket.id)}
                            aria-label={`Reset entries for ticket ${ticket.ticketNumber}`}
                            title="Reset entries"
                          >
                            <RotateCcw className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
                          </Button>
                          {isBlocked ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleAction('unblock', ticket.id)}
                              aria-label={`Unblock ticket ${ticket.ticketNumber}`}
                              title="Unblock"
                            >
                              <Unlock className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleAction('block', ticket.id)}
                              aria-label={`Block ticket ${ticket.ticketNumber}`}
                              title="Block"
                            >
                              <Lock className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
                            </Button>
                          )}
                          <Button
                            variant="danger-quiet"
                            size="icon-sm"
                            onClick={() => handleDelete(ticket.id)}
                            aria-label={`Delete ticket ${ticket.ticketNumber}`}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && paginatedTickets.length > 0 && (
          <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        )}

        {!loading && allTickets.length > 0 && (
          <div className="border-t border-border px-4 py-2.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
              Showing {paginatedTickets.length} of {filteredTickets.length}
              {filteredTickets.length < allTickets.length && ` · filtered from ${allTickets.length}`}
            </p>
          </div>
        )}
      </section>

      <TicketModal
        ticketId={modalTicketId}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setModalTicketId(null);
        }}
      />
    </>
  );
}
