import { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Download,
  Moon,
  RotateCcw,
  Save,
  Sun,
  Upload,
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { api } from '../lib/api';
import { useTheme, type Theme } from '../lib/theme';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

export function SettingsPage() {
  return (
    <Layout>
      <SettingsContent />
    </Layout>
  );
}

function Section({
  title,
  description,
  children,
  tone = 'default',
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  tone?: 'default' | 'danger';
}) {
  return (
    <section className={cn('grid gap-6 border-t border-border pt-8 lg:grid-cols-[220px_minmax(0,1fr)]')}>
      <div>
        <h2 className={cn('font-display text-[1.3rem] font-medium leading-tight tracking-[-0.02em]', tone === 'danger' ? 'text-danger' : 'text-ink')}>
          {title}
        </h2>
        <p className="mt-1.5 text-tiny leading-relaxed text-ink-secondary">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-tiny font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-tertiary">{hint}</span>}
    </label>
  );
}

function ThemeChoice({ value, current, onSelect }: { value: Theme; current: Theme; onSelect: (t: Theme) => void }) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={active}
      className={cn(
        'flex min-h-[76px] flex-1 items-center gap-3 rounded-sm border px-4 text-left transition-colors focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        active ? 'border-ink bg-sunken' : 'border-border hover:border-border-strong'
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-sm border',
          value === 'light' ? 'border-border bg-[#f4f0e6] text-[#12110e]' : 'border-border bg-[#12110e] text-[#f4f0e6]'
        )}
      >
        {value === 'light' ? (
          <Sun className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
        ) : (
          <Moon className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
        )}
      </span>
      <span>
        <span className="block text-small font-medium text-ink">{value === 'light' ? 'Paper' : 'Ink'}</span>
        <span className="block text-[11px] text-ink-tertiary">{value === 'light' ? 'Warm daylight desk' : 'Low-light control room'}</span>
      </span>
    </button>
  );
}

function SettingsContent() {
  const { theme, setTheme } = useTheme();
  const [eventName, setEventName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [defaultEntries, setDefaultEntries] = useState('');
  const [applyTo, setApplyTo] = useState('new');
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    api
      .getSettings()
      .then((settings) => {
        if (!mounted) return;
        setEventName(settings.eventName || '');
        setOrganizationName(settings.organizationName || '');
        setCapacity(settings.capacity || '');
        setDefaultEntries(settings.defaultEntries || '');
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveEventSettings = async () => {
    try {
      await api.updateSettings({ eventName, organizationName });
      toast.success('Event settings saved');
    } catch {
      toast.error('Failed to save event settings');
    }
  };

  const handleSaveCapacity = async () => {
    try {
      await api.updateSettings({ capacity, defaultEntries });
      toast.success('Capacity settings saved');
    } catch {
      toast.error('Failed to save capacity settings');
    }
  };

  const handleUpdateDefaultEntries = async () => {
    try {
      await api.updateDefaultEntries({
        defaultEntries: Number(defaultEntries),
        applyTo: applyTo === 'all' ? 'All Tickets' : 'New Tickets Only',
      });
      toast.success('Default entries updated');
    } catch {
      toast.error('Failed to update default entries');
    }
  };

  const handleResetAll = async () => {
    if (!confirm('This will reset ALL tickets and scan history. Are you sure?')) return;
    if (!confirm('This action cannot be undone. Proceed?')) return;
    try {
      await api.resetAll();
      toast.success('All tickets and scans have been reset');
    } catch {
      toast.error('Failed to reset');
    }
  };

  const handleResetScans = async () => {
    if (!confirm('This will clear scan history but keep tickets. Are you sure?')) return;
    try {
      await api.resetScans();
      toast.success('Scan history cleared');
    } catch {
      toast.error('Failed to reset scan history');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText((ev.target?.result as string) || '');
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText) {
      toast.error('Choose a CSV file first');
      return;
    }
    try {
      await api.importCsv(csvText);
      toast.success('CSV imported successfully');
      setCsvText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      toast.error('Failed to import CSV');
    }
  };

  const handleTheme = (next: Theme) => {
    setTheme(next);
    toast.success(next === 'dark' ? 'Ink theme on' : 'Paper theme on');
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-3 h-4 w-80" />
        <div className="mt-10 space-y-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid gap-6 border-t border-border pt-8 lg:grid-cols-[220px_1fr]">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-3">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Event setup"
        title="Settings"
        description="The event identity, capacity rules and data tools. Door policy lives under Authorisation."
      />

      <div className="space-y-8">
        <Section title="Event" description="The name shown on the desk and the scanner, plus who runs the event.">
          <div className="space-y-4">
            <Field label="Event name">
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="St Mary's Christmas Concert"
              />
            </Field>
            <Field label="Organisation">
              <Input
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="St Mary's Parish"
              />
            </Field>
            <Button onClick={handleSaveEventSettings}>
              <Save className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              Save event settings
            </Button>
          </div>
        </Section>

        <Section title="Capacity" description="How many entries the venue allows, and the default each new ticket receives.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Event capacity" hint="Total entries across the night.">
              <Input type="number" min={0} inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="400" />
            </Field>
            <Field label="Default entries per ticket" hint="Applied when a ticket has no explicit value.">
              <Input type="number" min={1} inputMode="numeric" value={defaultEntries} onChange={(e) => setDefaultEntries(e.target.value)} placeholder="2" />
            </Field>
          </div>
          <Button variant="outline" className="mt-4" onClick={handleSaveCapacity}>
            <Save className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            Save capacity
          </Button>
        </Section>

        <Section title="Entry rules" description="Change the default entry allowance without editing tickets one by one.">
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
            <Field label="Default entries">
              <Input type="number" min={1} inputMode="numeric" value={defaultEntries} onChange={(e) => setDefaultEntries(e.target.value)} />
            </Field>
            <Field label="Apply to">
              <Select value={applyTo} onValueChange={setApplyTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New tickets only</SelectItem>
                  <SelectItem value="all">All tickets</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Button variant="outline" className="mt-4" onClick={handleUpdateDefaultEntries}>
            <RotateCcw className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            Update default entries
          </Button>
        </Section>

        <Section title="Appearance" description="The desk follows your choice; the scanner always uses the dark gate theme.">
          <div className="flex flex-col gap-2 sm:flex-row">
            <ThemeChoice value="light" current={theme} onSelect={handleTheme} />
            <ThemeChoice value="dark" current={theme} onSelect={handleTheme} />
          </div>
        </Section>

        <Section title="Data" description="Export a copy for reconciliation, or bring in a new guest list from CSV.">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a href={api.exportCsv()}>
                <Download className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                Tickets CSV
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={api.exportHistoryCsv()}>
                <Download className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                Scan history CSV
              </a>
            </Button>
          </div>

          <div className="mt-5 rounded-sm border border-dashed border-border-strong bg-sunken/30 p-4">
            <label htmlFor="csv-file" className="mb-2 flex items-center gap-2 text-tiny font-medium text-ink">
              <Upload className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              Import guest list
            </label>
            <input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="block w-full cursor-pointer text-tiny text-ink-secondary file:mr-3 file:cursor-pointer file:rounded-sm file:border file:border-border file:bg-surface file:px-3 file:py-2 file:text-tiny file:font-medium file:text-ink hover:file:border-border-strong"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {csvText && <Badge variant="success">File ready</Badge>}
              <Button size="sm" onClick={handleImport} disabled={!csvText}>
                <Upload className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                Import CSV
              </Button>
            </div>
          </div>
        </Section>

        <Section
          title="Reset"
          description="Irreversible operations. Both ask for confirmation before anything is deleted."
          tone="danger"
        >
          <div className="space-y-3">
            <div className="flex flex-col gap-3 rounded-sm border border-danger/25 bg-danger-soft/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-small font-medium text-ink">Reset all tickets and scans</p>
                <p className="mt-0.5 text-tiny text-ink-secondary">Clears the guest list and every scan record.</p>
              </div>
              <Button variant="danger" size="sm" onClick={handleResetAll} className="shrink-0">
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                Reset everything
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-sm border border-warning/25 bg-warning-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-small font-medium text-ink">Clear scan history only</p>
                <p className="mt-0.5 text-tiny text-ink-secondary">Keeps tickets and their entry counts.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleResetScans} className="shrink-0">
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                Clear scans
              </Button>
            </div>
          </div>
        </Section>

        <div className="flex items-center gap-2 border-t border-border pt-6 text-tiny text-ink-tertiary">
          <Building2 className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
          Local event data. Export a CSV before resetting.
        </div>
      </div>
    </div>
  );
}
