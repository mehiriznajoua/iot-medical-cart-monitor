import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, FileText } from 'lucide-react';
import { useMonitor } from '../context/MonitorContext.jsx';
import { getAlertStats } from '../utils/alertHistory.js';
import {
  buildTempStats,
  exportReportCsv,
  exportReportPdf,
} from '../utils/exportReports.js';

export default function ReportsPage() {
  const { alerts, trolleys, tempHistory, temperatureHistory } = useMonitor();

  const stats = useMemo(() => getAlertStats(alerts), [alerts]);

  const chartData = useMemo(() => {
    return temperatureHistory.map((point) => ({
      time: point.time,
      temperature: point.temperature,
    }));
  }, [temperatureHistory]);

  const alertChartData = useMemo(() => stats.byType, [stats.byType]);

  const tempStats = useMemo(
    () => buildTempStats(trolleys, tempHistory),
    [trolleys, tempHistory],
  );

  const liveCount = trolleys.filter((t) => t.online).length;

  const handleExportCsv = () => exportReportCsv({ alerts, tempStats });
  const handleExportPdf = () =>
    exportReportPdf({ alerts, tempStats, stats });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight" style={{color: '#1F4E79'}}>Reports</h2>
          <p className="mt-1 text-sm text-slate-500">
            Analytics and exportable summaries from live monitoring data
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Events" value={stats.total} />
        <StatCard label="Active Alerts" value={stats.active} />
        <StatCard label="Resolved" value={stats.resolved} />
        <StatCard label="Live Trolleys" value={liveCount} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Temperature Trend (Live Trolley)" subtitle="Readings collected during this session">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} stroke="#94a3b8" unit="°C" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Waiting for live temperature data…" />
          )}
        </ChartCard>

        <ChartCard title="Alerts by Type" subtitle="Event counts from alert history">
          {alertChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={alertChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No alert events recorded yet" />
          )}
        </ChartCard>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Temperature Statistics</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="pb-3 pr-4">Trolley</th>
                <th className="pb-3 pr-4">Current</th>
                <th className="pb-3 pr-4">Min</th>
                <th className="pb-3 pr-4">Max</th>
                <th className="pb-3">Average</th>
              </tr>
            </thead>
            <tbody>
              {tempStats.length > 0 ? (
                tempStats.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50">
                    <td className="py-3 pr-4 font-semibold text-slate-900">{row.name}</td>
                    <td className="py-3 pr-4">{row.current != null ? `${row.current}°C` : '—'}</td>
                    <td className="py-3 pr-4">{row.min != null ? `${row.min}°C` : '—'}</td>
                    <td className="py-3 pr-4">{row.max != null ? `${row.max}°C` : '—'}</td>
                    <td className="py-3">{row.average != null ? `${row.average}°C` : '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No live trolley data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
      {message}
    </div>
  );
}
