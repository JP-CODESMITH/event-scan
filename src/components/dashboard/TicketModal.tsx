import { useEffect, useState } from 'react';
import { Check, Edit3, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { api } from '../../lib/api';
import { cn, formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';

interface ScanRecord {
  id: number;
  time: string;
  gate: string;
  device: string;
  result: string;
  ticketNumber?: string;
}

interface TicketDetail {
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
  authorized?: boolean;
  authorizedBy?: string;
  authorizationTime?: string;
}

interface Props {
  ticketId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Info({ label, value, wide = false }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn('bg-surface px-3.5 py-3', wide && 'col-span-2')}>
      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-tertiary">{label}</p>
      <p className="mt-1 truncate text-small font-medium text-ink">{value || '—'}</p>
    </div>
  );
}

function statusVariant(status: string): 'success' | 'danger' | 'warning' | 'neutral' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'BLOCKED') return 'danger';
  if (status === 'FINISHED') return 'warning';
  return 'neutral';
}

export default function TicketModal({ ticketId, open, onOpenChange }: Props) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [scansLoading, setScansLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || ticketId === null) {
      setTicket(null);
      setScans([]);
      setEditing(false);
      return;
    }

    let mounted = true;

    async function load() {
      setLoading(true);
      setScansLoading(true);
      try {
        const res = await api.getTicket(ticketId as number);
        const data: TicketDetail = res.data ?? res;
        if (!mounted) return;
        setTicket(data);
        setEditName(data.name);
        setEditPhone(data.phone);
        setEditEmail(data.email);

        try {
          const scanRes = await api.getScanHistory(data.ticketNumber);
          const scanData = Array.isArray(scanRes) ? scanRes : scanRes.data ?? scanRes.scans ?? [];
          if (mounted) setScans(scanData);
        } catch {
          if (mounted) setScans([]);
        }
      } catch (err: any) {
        if (mounted) toast.error(err.message || 'Failed to load ticket');
      } finally {
        if (mounted) {
          setLoading(false);
          setScansLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [open, ticketId]);

  const handleSave = async () => {
    if (!ticket) return;
    setSaving(true);
    try {
      const res = await api.updateTicket(ticket.id, {
        name: editName,
        phone: editPhone,
        email: editEmail,
      });
      setTicket((prev) => (prev ? { ...prev, name: editName, phone: editPhone, email: editEmail } : prev));
      toast.success(res?.message || 'Ticket updated');
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  const remaining = ticket ? Math.max(ticket.maxEntries - ticket.entriesUsed, 0) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="scroll-thin max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
        <div className="border-b border-border px-5 pb-4 pt-5">
          <DialogHeader className="pr-10">
            <p className="eyebrow">Ticket record</p>
            <DialogTitle className="mt-1 font-mono text-[1.6rem] tracking-[-0.01em]">
              {loading ? 'Loading…' : ticket?.ticketNumber || 'Ticket'}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              {ticket ? (
                <>
                  <span>{ticket.name || 'Unnamed guest'}</span>
                  <Badge variant={statusVariant(ticket.status)} dot>
                    {ticket.status}
                  </Badge>
                </>
              ) : (
                'Loading the ticket record'
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-px bg-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface p-3.5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="mt-2 h-4 w-28" />
              </div>
            ))}
          </div>
        ) : ticket ? (
          <div className="space-y-5 px-5 py-5">
            {editing ? (
              <div className="rounded-sm border border-border bg-sunken/40 p-4">
                <p className="eyebrow">Edit guest details</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="edit-name" className="mb-1 block text-tiny text-ink-secondary">Name</label>
                    <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="edit-phone" className="mb-1 block text-tiny text-ink-secondary">Phone</label>
                    <Input id="edit-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="edit-email" className="mb-1 block text-tiny text-ink-secondary">Email</label>
                    <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(false);
                      setEditName(ticket.name);
                      setEditPhone(ticket.phone);
                      setEditEmail(ticket.email);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} loading={saving}>
                    Save changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit3 className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                  Edit guest
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border">
              <Info label="Guest" value={ticket.name} wide />
              <Info label="Phone" value={ticket.phone} />
              <Info label="Email" value={ticket.email} />
              <Info label="Ticket number" value={<span className="font-mono">{ticket.ticketNumber}</span>} />
              <Info label="Entries" value={<span className="font-mono tabular">{ticket.entriesUsed} / {ticket.maxEntries}</span>} />
              <Info
                label="Remaining"
                value={<span className={cn('font-mono tabular', remaining === 0 && 'text-warning')}>{remaining}</span>}
              />
              <Info label="Created" value={formatDateTime(ticket.createdAt)} />
              <Info label="Updated" value={formatDateTime(ticket.updatedAt)} />
              <Info label="Authorisation" value={ticket.authorized ? 'Authorised' : 'Not authorised'} />
              {ticket.authorized && (
                <>
                  <Info label="Authorised by" value={ticket.authorizedBy || '—'} />
                  <Info
                    label="Authorised at"
                    value={ticket.authorizationTime ? formatDateTime(ticket.authorizationTime) : '—'}
                  />
                </>
              )}
            </div>

            <div>
              <div className="flex items-end justify-between gap-3 border-b border-border pb-2">
                <div>
                  <p className="eyebrow">Scan history</p>
                  <h4 className="mt-1 text-small font-medium text-ink">Every attempt on this ticket</h4>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                  {scans.length} {scans.length === 1 ? 'scan' : 'scans'}
                </span>
              </div>

              {scansLoading ? (
                <div className="space-y-2 pt-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : scans.length === 0 ? (
                <p className="py-8 text-center text-small text-ink-tertiary">No scans recorded for this ticket.</p>
              ) : (
                <ul className="scroll-thin max-h-[220px] divide-y divide-border overflow-y-auto">
                  {scans.map((scan) => {
                    const success = scan.result === 'SUCCESS';
                    return (
                      <li key={scan.id} className="flex items-center gap-3 py-2.5">
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border',
                            success
                              ? 'border-success/25 bg-success-soft text-success'
                              : 'border-danger/25 bg-danger-soft text-danger'
                          )}
                        >
                          {success ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                          ) : (
                            <X className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-tiny text-ink">{formatDateTime(scan.time)}</p>
                          <p className="truncate font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary">
                            {scan.gate} · {scan.device}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'font-mono text-[9px] uppercase tracking-[0.1em]',
                            success ? 'text-success' : 'text-danger'
                          )}
                        >
                          {success ? 'Admitted' : scan.result}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <X className="h-8 w-8 text-ink-tertiary" strokeWidth={1.6} aria-hidden="true" />
            <p className="mt-3 font-display text-[1.25rem] font-medium text-ink">Ticket not available</p>
            <p className="mt-1 text-small text-ink-secondary">Close this panel and try again.</p>
          </div>
        )}

        <DialogFooter className="border-t border-border px-5 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
