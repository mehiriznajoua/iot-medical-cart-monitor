import { Activity, AlertTriangle, Truck, WifiOff } from 'lucide-react';

const cards = [
  { key: 'total', label: 'Total Trolleys', icon: Truck, color: 'text-slate-600 bg-slate-100' },
  { key: 'online', label: 'Online Trolleys', icon: Activity, color: 'text-emerald-600 bg-emerald-100' },
  { key: 'activeAlerts', label: 'Active Alerts', icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
  { key: 'offline', label: 'Offline Trolleys', icon: WifiOff, color: 'text-slate-500 bg-slate-100' },
];

export default function KpiCards({ stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ key, label, icon: Icon, color }) => (
        <div
          key={key}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {label}
              </p>
              <p className="mt-3 text-4xl font-bold text-slate-900">{stats[key]}</p>
            </div>
            <div className={`rounded-xl p-3 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
