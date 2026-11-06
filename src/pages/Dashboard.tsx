import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/button';
import { SegmentedControl } from '../components/ui/segmented-control';
import StatsCards from '../components/dashboard/StatsCards';
import Charts from '../components/dashboard/Charts';
import LiveFeed from '../components/dashboard/LiveFeed';
import TicketTable from '../components/dashboard/TicketTable';
import ScannerDevices from '../components/dashboard/ScannerDevices';
import { useSocketStats, useSocketTickets, useSocketScans } from '../hooks/useSocket';
import { api } from '../lib/api';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chartData, setChartData] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [scansLoading, setScansLoading] = useState(true);

  const { stats } = useSocketStats();
  const ticketsRefreshKey = useSocketTickets();
  const scansRefreshKey = useSocketScans();

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchChart = async () => {
      try {
        const data = await api.chartData();
        if (mounted) setChartData(data);
      } catch {
        // keep the previous chart on a transient failure
      }
    };
    fetchChart();
    const interval = window.setInterval(fetchChart, 10000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setScansLoading(true);
    api
      .getRecentScans()
      .then((data) => {
        if (mounted) setRecentScans(Array.isArray(data) ? data : data?.scans ?? []);
      })
      .catch(() => {
        if (mounted) setRecentScans([]);
      })
      .finally(() => {
        if (mounted) setScansLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [scansRefreshKey]);

  const dateLabel = currentTime.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <Layout>
      <PageHeader
        eyebrow={`Live desk · ${dateLabel}`}
        title="The door, at a glance."
        description="Entries, capacity and every scan as it happens. The numbers refresh over the local network, without a reload."
        actions={
          <Button asChild>
            <Link to="/scanner">
              Open scanner
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <div className="mb-5">
        <SegmentedControl
          label="Desk view"
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'guests', label: 'Guest list', count: stats?.totalTickets },
            { value: 'gates', label: 'Gates', count: stats?.activeScanners },
          ]}
        />
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <StatsCards stats={stats} currentTime={currentTime} />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <Charts data={chartData} />
            <LiveFeed scans={recentScans} loading={scansLoading} />
          </div>
        </div>
      )}

      {activeTab === 'guests' && <TicketTable refreshKey={ticketsRefreshKey} />}
      {activeTab === 'gates' && <ScannerDevices />}
    </Layout>
  );
}
