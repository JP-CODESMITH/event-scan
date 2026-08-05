import React, { useState, useEffect } from 'react';
import {
  User, Phone, Mail, Ticket, Hash, Activity, Clock, X, Edit3, ShieldCheck, ShieldX
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { api } from '../../lib/api';
import { cn, getStatusColor, formatDateTime } from '../../lib/utils';
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
}

interface Props {
  ticketId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/50">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-white/40">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-medium text-white truncate">
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

function ScanItem({ scan }: { scan: ScanRecord }) {
  const isSuccess = scan.result === 'SUCCESS';
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border-l-4 transition-colors',
        isSuccess
          ? 'border-l-emerald-500 bg-emerald-500/5'
          : 'border-l-red-500 bg-red-500/5'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white/70">
            {formatDateTime(scan.time)}
          </span>
          <Badge
            variant={isSuccess ? 'success' : 'destructive'}
            className="text-[10px] px-1.5 py-0"
          >
            {scan.result}
          </Badge>
        </div>
        <div className="mt-1 text-xs text-white/40">
          {scan.gate} &middot; {scan.device}
        </div>
      </div>
    </div>
  );
}

function ScanSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg">
      <div className="flex-1 space-y-2">
        <div className="h-3 w-40 rounded bg-white/10 animate-pulse" />
        <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
      </div>
    </div>
  );
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

    async function load() {
      setLoading(true);
      setScansLoading(true);
      try {
        const res = await api.getTicket(ticketId);
        const data: TicketDetail = res.data ?? res;
        setTicket(data);
        setEditName(data.name);
        setEditPhone(data.phone);
        setEditEmail(data.email);

        try {
          const scanRes = await api.getScanHistory(data.ticketNumber);
          const scanData = Array.isArray(scanRes)
            ? scanRes
            : scanRes.data ?? scanRes.scans ?? [];
          setScans(scanData);
        } catch {
          setScans([]);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load ticket');
      } finally {
        setLoading(false);
        setScansLoading(false);
      }
    }

    load();
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
      setTicket((prev) =>
        prev
          ? { ...prev, name: editName, phone: editPhone, email: editEmail }
          : prev
      );
      toast.success(res?.message || 'Ticket updated');
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  const remaining = ticket
    ? Math.max(ticket.maxEntries - ticket.entriesUsed, 0)
    : 0;
  const ticketAuth = ticket && 'authorized' in ticket ? ticket as any : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Ticket className="h-5 w-5 text-primary" />
            {loading ? 'Loading...' : ticket?.ticketNumber || 'Ticket Details'}
          </DialogTitle>
          <DialogDescription>
            {ticket && (
              <Badge className={cn('border text-xs font-medium mt-1', getStatusColor(ticket.status))}>
                {ticket.status}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03]">
                  <div className="h-8 w-8 rounded-lg bg-white/10 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
                    <div className="h-4 w-28 rounded bg-white/10 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : ticket ? (
          <div className="space-y-6 py-4">
            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                {editing ? (
                  <div className="space-y-3 p-3 rounded-lg bg-white/[0.03]">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40 mb-2">
                      <Edit3 className="h-3.5 w-3.5" />
                      Editing
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Name</label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Phone</label>
                        <Input
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Email</label>
                        <Input
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setEditing(false);
                          setEditName(ticket.name);
                          setEditPhone(ticket.phone);
                          setEditEmail(ticket.email);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="xs"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit details
                  </button>
                )}
              </div>

              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="Name"
                value={ticket.name}
              />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={ticket.phone}
              />
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={ticket.email}
              />
              <InfoRow
                icon={<Hash className="h-4 w-4" />}
                label="Ticket Number"
                value={ticket.ticketNumber}
              />
              <InfoRow
                icon={<Activity className="h-4 w-4" />}
                label="Entries"
                value={`${ticket.entriesUsed} / ${ticket.maxEntries}`}
              />
              <InfoRow
                icon={<Activity className="h-4 w-4" />}
                label="Remaining"
                value={remaining}
              />
              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label="Created"
                value={formatDateTime(ticket.createdAt)}
              />
              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label="Updated"
                value={formatDateTime(ticket.updatedAt)}
              />
              {ticketAuth && (
                <>
                  <InfoRow
                    icon={ticket.authorized ? <ShieldCheck className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
                    label="Authorization Status"
                    value={ticket.authorized ? 'Authorized' : 'Not Authorized'}
                  />
                  {ticket.authorized && (
                    <>
                      <InfoRow
                        icon={<User className="h-4 w-4" />}
                        label="Authorized By"
                        value={ticket.authorizedBy || '—'}
                      />
                      <InfoRow
                        icon={<Clock className="h-4 w-4" />}
                        label="Authorization Time"
                        value={ticket.authorizationTime ? formatDateTime(ticket.authorizationTime) : '—'}
                      />
                    </>
                  )}
                </>
              )}
            </div>

            {/* Scan history */}
            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium text-white/60 mb-3">
                <Activity className="h-4 w-4 text-cyan-400" />
                Scan History
                {scans.length > 0 && (
                  <span className="text-xs text-white/30 ml-auto">
                    {scans.length} scan{scans.length !== 1 ? 's' : ''}
                  </span>
                )}
              </h4>
              {scansLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ScanSkeleton key={i} />
                  ))}
                </div>
              ) : scans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-white/30">
                  <Clock className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs">No scans recorded</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto scrollbar-thin pr-1">
                  {scans.map((scan) => (
                    <ScanItem key={scan.id} scan={scan} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-white/30">
            <X className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">Could not load ticket</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="glass" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
