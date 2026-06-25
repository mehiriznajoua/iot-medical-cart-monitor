import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import AlertFilters from '../components/alerts/AlertFilters.jsx';
import AlertList from '../components/alerts/AlertList.jsx';
import { useMonitor } from '../context/MonitorContext.jsx';
import { exportAlertsToCsv, isAlertState } from '../utils/formatters.js';

export default function AlertCenterPage() {
  const { alerts } = useMonitor();
  const [filters, setFilters] = useState({
    trolley: 'all',
    type: 'all',
    severity: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (filters.trolley !== 'all' && alert.trolleyId !== filters.trolley) {
        return false;
      }
      if (filters.type !== 'all' && alert.type !== filters.type) {
        return false;
      }
      if (filters.severity !== 'all' && alert.severity !== filters.severity) {
        return false;
      }

      const alertDate = new Date(Number(alert.timestamp) * 1000);
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        from.setHours(0, 0, 0, 0);
        if (alertDate < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (alertDate > to) return false;
      }

      return true;
    });
  }, [alerts, filters]);

  const stats = useMemo(
    () => ({
      total: alerts.length,
      active: alerts.filter((a) => isAlertState(a.type)).length,
      filtered: filteredAlerts.length,
    }),
    [alerts, filteredAlerts],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight" style={{color: '#1F4E79'}}>Alert Center</h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitor and review cold-chain alert events
          </p>
        </div>
        <button
          type="button"
          onClick={() => exportAlertsToCsv(filteredAlerts)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Events" value={stats.total} />
        <StatCard label="Active Alerts" value={stats.active} />
        <StatCard label="Filtered Results" value={stats.filtered} />
      </div>

      <AlertFilters filters={filters} onChange={setFilters} />
      <AlertList alerts={filteredAlerts} />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
