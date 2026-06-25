import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, DoorOpen, Thermometer, TriangleAlert } from 'lucide-react';
import DeviceInfo from '../components/trolley/DeviceInfo.jsx';
import RecentAlerts from '../components/trolley/RecentAlerts.jsx';
import TemperatureChart from '../components/trolley/TemperatureChart.jsx';
import { useMonitor } from '../context/MonitorContext.jsx';
import {
  formatTemperature,
  formatTimestamp,
  getDoorLabel,
  getStateLabel,
  getStatusStyles,
} from '../utils/formatters.js';

export default function TrolleyDetailsPage() {
  const { id } = useParams();
  const { trolleys, liveData, connected, alerts, temperatureHistory } = useMonitor();
  const trolley = trolleys.find((item) => item.id === id);

  const chartData = useMemo(() => {
    if (!trolley?.online) return [];
    return temperatureHistory;
  }, [trolley, temperatureHistory]);

  if (!trolley) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600">Trolley not found.</p>
        <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const styles = getStatusStyles(trolley.status);
  const statusLabel = trolley.online ? getStateLabel(trolley.status) : 'OFFLINE';

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">{trolley.name}</h2>
          <p className="text-sm text-slate-500">{trolley.location}</p>
        </div>
        {trolley.online && (
          <span className="rounded-full bg-brand-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
            Live
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Status"
          value={
            <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${styles.badge}`}>
              {statusLabel}
            </span>
          }
        />
        <MetricCard
          label="Temperature"
          icon={Thermometer}
          value={trolley.online ? formatTemperature(liveData?.temperature) : '—'}
        />
        <MetricCard
          label="Door"
          icon={DoorOpen}
          value={trolley.online ? getDoorLabel(liveData?.door) : '—'}
        />
        <MetricCard
          label="Last Update"
          icon={Clock}
          value={
            trolley.online ? formatTimestamp(liveData?.timestamp) : 'Future deployment'
          }
        />
        <MetricCard
          label="Alerts"
          icon={TriangleAlert}
          value={alerts.filter((a) => a.trolleyId === trolley.id).length}
        />
      </div>

      {trolley.online && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Temperature History</h3>
          <p className="mt-1 text-sm text-slate-500">
            Live readings stored in memory while the dashboard is running
          </p>
          <div className="mt-6">
            <TemperatureChart data={chartData} />
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <RecentAlerts alerts={alerts} trolleyId={trolley.id} />
        <DeviceInfo trolley={trolley} liveData={liveData} connected={connected} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </div>
      <div className="mt-3 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
