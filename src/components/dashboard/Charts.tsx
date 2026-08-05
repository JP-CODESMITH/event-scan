import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ChartData {
  hourlyEntries: Array<{ hour: string; count: number }>;
  entriesByGate: Array<{ gate: string; count: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
  entriesUsed: number;
  remaining: number;
}

interface Props {
  data: ChartData | null;
}

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

function ChartSkeleton() {
  return (
    <Card className="border-0 bg-white/5 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <div className="h-4 w-32 rounded bg-white/10 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] rounded-lg bg-white/5 animate-pulse" />
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[rgba(15,15,35,0.9)] px-4 py-3 shadow-xl backdrop-blur-2xl">
      <p className="text-xs text-white/50 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold text-white" style={{ color: entry.color }}>
          {entry.name || entry.dataKey}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function HourlyEntriesChart({ data }: { data: ChartData['hourlyEntries'] }) {
  return (
    <Card className="group relative border-0 overflow-hidden bg-white/5 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-2xl hover:shadow-black/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/60">
          <Activity className="h-4 w-4 text-blue-400" />
          Hourly Entries
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <defs>
              <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="hour" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
            <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 3 }}
              activeDot={{ r: 5, fill: '#3b82f6' }}
              fill="url(#lineGlow)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function EntriesByGateChart({ data }: { data: ChartData['entriesByGate'] }) {
  return (
    <Card className="group relative border-0 overflow-hidden bg-white/5 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-2xl hover:shadow-black/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/60">
          <PieIcon className="h-4 w-4 text-purple-400" />
          Entries Per Gate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="gate"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={50}
              paddingAngle={3}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-white/70">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function UsageChart({ used, remaining }: { used: number; remaining: number }) {
  const data = [
    { name: 'Used', value: used },
    { name: 'Remaining', value: remaining },
  ];

  return (
    <Card className="group relative border-0 overflow-hidden bg-white/5 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-2xl hover:shadow-black/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/60">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          Entries Used vs Remaining
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={60}
              startAngle={90}
              endAngle={-270}
            >
              <Cell fill="#10b981" />
              <Cell fill="rgba(255,255,255,0.1)" />
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-white/70">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function DailyActivityChart({ data }: { data: ChartData['dailyActivity'] }) {
  return (
    <Card className="group relative border-0 overflow-hidden bg-white/5 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:shadow-2xl hover:shadow-black/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/60">
          <BarChart3 className="h-4 w-4 text-amber-400" />
          Daily Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
            <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default function Charts({ data }: Props) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <HourlyEntriesChart data={data.hourlyEntries} />
      <EntriesByGateChart data={data.entriesByGate} />
      <UsageChart used={data.entriesUsed} remaining={data.remaining} />
      <DailyActivityChart data={data.dailyActivity} />
    </div>
  );
}
