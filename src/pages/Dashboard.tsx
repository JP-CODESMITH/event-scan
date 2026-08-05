import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import StatsCards from '../components/dashboard/StatsCards';
import Charts from '../components/dashboard/Charts';
import LiveFeed from '../components/dashboard/LiveFeed';
import TicketTable from '../components/dashboard/TicketTable';
import ScannerDevices from '../components/dashboard/ScannerDevices';
import TicketModal from '../components/dashboard/TicketModal';
import { useSocketStats, useSocketTickets, useSocketScans } from '../hooks/useSocket';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { Activity, TicketCheck, Scan } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chartData, setChartData] = useState<any>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [scansLoading, setScansLoading] = useState(true);
  const [modalTicketId, setModalTicketId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { stats } = useSocketStats();
  const ticketsRefreshKey = useSocketTickets();
  const scansRefreshKey = useSocketScans();

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchChart = async () => {
      try {
        const data = await api.chartData();
        if (mounted) setChartData(data);
      } catch {
        // silently fail
      } finally {
        if (mounted) setChartLoading(false);
      }
    };

    fetchChart();
    const interval = setInterval(fetchChart, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchScans = async () => {
      setScansLoading(true);
      try {
        const data = await api.getRecentScans();
        if (mounted) setRecentScans(Array.isArray(data) ? data : data?.scans ?? []);
      } catch {
        if (mounted) setRecentScans([]);
      } finally {
        if (mounted) setScansLoading(false);
      }
    };

    fetchScans();
    return () => { mounted = false; };
  }, [scansRefreshKey]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'tickets', label: 'Tickets', icon: TicketCheck },
    { id: 'scanners', label: 'Scanners', icon: Scan },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/20 text-primary shadow-sm'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <StatsCards stats={stats} currentTime={currentTime} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Charts data={chartData} />
              </div>
              <div>
                <LiveFeed scans={recentScans} loading={scansLoading} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <TicketTable refreshKey={ticketsRefreshKey} />
        )}

        {activeTab === 'scanners' && (
          <ScannerDevices />
        )}
      </div>
    </Layout>
  );
}
