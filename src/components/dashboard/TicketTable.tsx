import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Check, X, Plus, Minus, RotateCcw, Eye, Trash2, Lock, Unlock
} from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { api } from '../../lib/api';
import { cn, getStatusColor, getEntryStatusLabel, formatTime, formatRemaining } from '../../lib/utils';
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

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-white/[0.03]">
          <div className="h-4 w-4 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-32 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-20 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-16 rounded bg-white/10 animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-white/10 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-8 w-8 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-8 w-8 rounded-lg bg-white/10 animate-pulse" />
            <div className="h-8 w-8 rounded-lg bg-white/10 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-white/40">
      <Search className="h-12 w-12 mb-3 opacity-50" />
      <p className="text-sm font-medium">
        {hasFilters ? 'No tickets match your filters' : 'No tickets yet'}
      </p>
      <p className="text-xs mt-1">
        {hasFilters
          ? 'Try adjusting your search or filter criteria'
          : 'Import tickets to get started'}
      </p>
    </div>
  );
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
  const maxVisible = 5;

  if (totalPages <= maxVisible + 2) {
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

  return (
    <div className="flex items-center justify-between pt-4 px-4">
      <span className="text-xs text-white/40">
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e${i}`} className="flex h-8 w-8 items-center justify-center text-xs text-white/30">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all',
                p === page
                  ? 'bg-primary/20 text-primary'
                  : 'text-white/40 hover:text-white hover:bg-white/10'
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
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
      data = data.filter(
        (t) => getEntryStatusLabel(t.entriesUsed, t.maxEntries) === entryFilter
      );
    }
    return data;
  }, [allTickets, entryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedTickets = filteredTickets.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const allSelected = paginatedTickets.length > 0 && selected.size === paginatedTickets.length;

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedTickets.map((t) => t.id)));
    }
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

  return (
    <>
      <Card className="border-0 bg-white/5 backdrop-blur-xl">
        <CardContent className="p-0">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-white/5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ticket number, name, phone, or email..."
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={entryFilter} onValueChange={setEntryFilter}>
                <SelectTrigger className="h-9 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Usage</SelectItem>
                  <SelectItem value="Unused">Unused</SelectItem>
                  <SelectItem value="Used Once">Used Once</SelectItem>
                  <SelectItem value="Used Twice">Used Twice</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border-b border-primary/20">
              <span className="text-xs font-medium text-primary mr-2">
                {selected.size} selected
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleBulkAction('increase')}
                className="text-white/70 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Entry
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleBulkAction('decrease')}
                className="text-white/70 hover:text-white"
              >
                <Minus className="h-3.5 w-3.5 mr-1" />
                Remove Entry
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleBulkAction('block')}
                className="text-white/70 hover:text-white"
              >
                <Lock className="h-3.5 w-3.5 mr-1" />
                Block
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleBulkAction('unblock')}
                className="text-white/70 hover:text-white"
              >
                <Unlock className="h-3.5 w-3.5 mr-1" />
                Unblock
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleBulkAction('reset')}
                className="text-white/70 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleBulkAction('delete')}
                className="text-red-400 hover:text-red-300 ml-auto"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setSelected(new Set())}
                className="text-white/40 hover:text-white"
                title="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-4">
                <TableSkeleton />
              </div>
            ) : paginatedTickets.length === 0 ? (
              <EmptyState
                hasFilters={statusFilter !== 'ALL' || entryFilter !== 'ALL' || !!debouncedSearch}
              />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="w-10 px-4 py-3 text-left">
                      <button
                        onClick={toggleSelectAll}
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border transition-all',
                          allSelected
                            ? 'bg-primary border-primary text-white'
                            : 'border-white/20 hover:border-white/40'
                        )}
                      >
                        {allSelected && <Check className="h-3 w-3" />}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">
                      Ticket #
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">
                      Name
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">
                      Entries
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">
                      Remaining
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">
                      Status
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/40">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {paginatedTickets.map((ticket) => {
                    const isSelected = selected.has(ticket.id);
                    const isBlocked = ticket.status === 'BLOCKED';
                    const remaining = formatRemaining(ticket.entriesUsed, ticket.maxEntries);

                    return (
                      <tr
                        key={ticket.id}
                        className={cn(
                          'transition-colors',
                          isSelected ? 'bg-primary/[0.04]' : 'hover:bg-white/[0.03]'
                        )}
                      >
                        <td className="w-10 px-4 py-3">
                          <button
                            onClick={() => toggleSelect(ticket.id)}
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded border transition-all',
                              isSelected
                                ? 'bg-primary border-primary text-white'
                                : 'border-white/20 hover:border-white/40'
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm font-mono font-medium text-white">
                            {ticket.ticketNumber}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm text-white/80">{ticket.name}</div>
                          {ticket.email && (
                            <div className="text-xs text-white/40 truncate max-w-[180px]">
                              {ticket.email}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[80px]">
                              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all duration-500',
                                    remaining === 0
                                      ? 'bg-amber-500'
                                      : ticket.entriesUsed === 0
                                        ? 'bg-white/20'
                                        : 'bg-emerald-500'
                                  )}
                                  style={{
                                    width: `${Math.min(
                                      (ticket.entriesUsed / Math.max(ticket.maxEntries, 1)) * 100,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-xs font-medium text-white/60 tabular-nums whitespace-nowrap">
                              {ticket.entriesUsed}/{ticket.maxEntries}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              'text-sm font-medium tabular-nums',
                              remaining === 0
                                ? 'text-amber-400'
                                : remaining <= 1
                                  ? 'text-orange-400'
                                  : 'text-emerald-400'
                            )}
                          >
                            {remaining}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <Badge
                            className={cn(
                              'border text-xs font-medium',
                              getStatusColor(ticket.status)
                            )}
                          >
                            {ticket.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleView(ticket.id)}
                              className="h-7 w-7 p-0 text-white/40 hover:text-white"
                              title="View details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleAction('reset', ticket.id)}
                              className="h-7 w-7 p-0 text-white/40 hover:text-amber-400"
                              title="Reset entries"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                            {isBlocked ? (
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handleAction('unblock', ticket.id)}
                                className="h-7 w-7 p-0 text-white/40 hover:text-emerald-400"
                                title="Unblock"
                              >
                                <Unlock className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handleAction('block', ticket.id)}
                                className="h-7 w-7 p-0 text-white/40 hover:text-red-400"
                                title="Block"
                              >
                                <Lock className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleDelete(ticket.id)}
                              className="h-7 w-7 p-0 text-white/40 hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

          {/* Pagination */}
          {!loading && paginatedTickets.length > 0 && (
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}

          {/* Footer count */}
          {!loading && allTickets.length > 0 && (
            <div className="px-4 pb-4">
              <p className="text-xs text-white/30">
                Showing {paginatedTickets.length} of {filteredTickets.length} ticket
                {filteredTickets.length !== 1 ? 's' : ''}
                {filteredTickets.length < allTickets.length &&
                  ` (filtered from ${allTickets.length})`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
