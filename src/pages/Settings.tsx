import { useState, useEffect, useRef } from 'react';
import {
  Save,
  RotateCcw,
  AlertTriangle,
  Upload,
  Palette,
  Moon,
  Sun,
  Type,
  Hash,
  User,
  Building2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import toast from 'react-hot-toast';
import { Layout } from '../components/layout/Layout';

export function SettingsPage() {
  return (
    <Layout>
      <SettingsContent />
    </Layout>
  );
}

function SettingsContent() {
  const [eventName, setEventName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [defaultEntries, setDefaultEntries] = useState('');
  const [applyTo, setApplyTo] = useState('new');
  const [csvText, setCsvText] = useState('');
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const settings = await api.getSettings();
        setEventName(settings.eventName || '');
        setOrganizationName(settings.organizationName || '');
        setCapacity(settings.capacity || '');
        setDefaultEntries(settings.defaultEntries || '');
        setTheme(settings.theme || 'dark');
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();
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

  const handleExportCsv = () => window.open(api.exportCsv(), '_blank');
  const handleExportHistoryCsv = () => window.open(api.exportHistoryCsv(), '_blank');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText((ev.target?.result as string) || '');
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText) {
      toast.error('Please select a CSV file first');
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

  const toggleTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    try {
      await api.updateSettings({ theme: next });
      setTheme(next);
      toast.success(`Switched to ${next} mode`);
    } catch {
      toast.error('Failed to update theme');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="h-5 w-40 rounded bg-white/10 animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
                <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Event Settings */}
      <Card className="border-0 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/60">
            <Building2 className="h-4 w-4 text-cyan-400" />
            Event Settings
          </CardTitle>
          <CardDescription>Configure your event name and organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Event Name</label>
            <div className="relative">
              <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input
                className="pl-10"
                placeholder="Enter event name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Organization Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input
                className="pl-10"
                placeholder="Enter organization name"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleSaveEventSettings} className="gap-2">
            <Save className="h-4 w-4" />
            Save Event Settings
          </Button>
        </CardContent>
      </Card>

      {/* Capacity Settings */}
      <Card className="border-0 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/60">
            <Hash className="h-4 w-4 text-cyan-400" />
            Capacity Settings
          </CardTitle>
          <CardDescription>Set event capacity and default entries per ticket</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Event Capacity</label>
            <Input
              type="number"
              placeholder="Enter total capacity"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Default Entries Per Ticket</label>
            <Input
              type="number"
              placeholder="Enter default entries"
              value={defaultEntries}
              onChange={(e) => setDefaultEntries(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveCapacity} className="gap-2">
            <Save className="h-4 w-4" />
            Save Capacity Settings
          </Button>
        </CardContent>
      </Card>

      {/* Global Entry Update */}
      <Card className="border-0 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/60">
            <ToggleLeft className="h-4 w-4 text-cyan-400" />
            Global Entry Update
          </CardTitle>
          <CardDescription>Update default entries for all tickets or only new ones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Default Entries</label>
            <Input
              type="number"
              placeholder="Number of entries"
              value={defaultEntries}
              onChange={(e) => setDefaultEntries(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Apply To</label>
            <Select value={applyTo} onValueChange={setApplyTo}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New Tickets Only</SelectItem>
                <SelectItem value="all">All Tickets</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleUpdateDefaultEntries} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Update Default Entries
          </Button>
        </CardContent>
      </Card>

      {/* Reset Options */}
      <Card className="border-0 bg-white/5 backdrop-blur-xl border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-red-400">
            <AlertTriangle className="h-4 w-4" />
            Reset Options
          </CardTitle>
          <CardDescription>Dangerous operations that cannot be undone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div>
              <p className="text-sm font-medium text-white">Reset All Tickets & Scans</p>
              <p className="text-xs text-white/50 mt-1">Completely resets all ticket data and scan history</p>
            </div>
            <Button variant="destructive" onClick={handleResetAll} className="gap-2 shrink-0">
              <RotateCcw className="h-4 w-4" />
              Reset All
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div>
              <p className="text-sm font-medium text-white">Reset Scan History Only</p>
              <p className="text-xs text-white/50 mt-1">Clears all scan records but keeps tickets intact</p>
            </div>
            <Button variant="warning" onClick={handleResetScans} className="gap-2 shrink-0">
              <RotateCcw className="h-4 w-4" />
              Clear Scans
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card className="border-0 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/60">
            <Upload className="h-4 w-4 text-cyan-400" />
            Export Data
          </CardTitle>
          <CardDescription>Download your data as CSV files</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExportCsv} className="gap-2">
            <Upload className="h-4 w-4" />
            Download Tickets CSV
          </Button>
          <Button variant="outline" onClick={handleExportHistoryCsv} className="gap-2">
            <Upload className="h-4 w-4" />
            Download Scan History CSV
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card className="border-0 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/60">
            <Upload className="h-4 w-4 text-cyan-400" />
            Import Data
          </CardTitle>
          <CardDescription>Import tickets from a CSV file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors cursor-pointer"
            />
            {csvText && <Badge variant="success">File loaded</Badge>}
          </div>
          <Button onClick={handleImport} disabled={!csvText} className="gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="border-0 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/60">
            <Palette className="h-4 w-4 text-cyan-400" />
            Theme
          </CardTitle>
          <CardDescription>Toggle between dark and light mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-blue-400" />
              ) : (
                <Sun className="h-5 w-5 text-amber-400" />
              )}
              <span className="text-sm font-medium text-white">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <Button variant="outline" onClick={toggleTheme} className="gap-2 min-w-[120px]">
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  Dark Mode
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
