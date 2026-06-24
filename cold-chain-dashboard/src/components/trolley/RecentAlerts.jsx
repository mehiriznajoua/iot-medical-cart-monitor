import { Thermometer } from 'lucide-react';
import { isAlertState } from '../../utils/formatters.js';

export default function RecentAlerts({ alerts, trolleyId }) {
  const filtered = alerts
    .filter((alert) => alert.trolleyId === trolleyId)
    .slice(0, 8);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Recent Alerts</h3>
      <p className="mt-1 text-sm text-slate-500">
        Generated automatically on temperature and door alert events
      </p>

      <div className="mt-5 space-y-3">
        {filtered.length === 0 && (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No alerts recorded for this trolley yet.
          </p>
        )}
        {filtered.map((alert) => (
          <div
            key={alert.id}
            className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                isAlertState(alert.type) ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              <Thermometer className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {alert.type}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    alert.severity === 'Critical'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {alert.severity}
                </span>
              </div>
              <p className="mt-1 font-medium text-slate-900">{alert.title}</p>
              <p className="text-sm text-slate-500">{alert.timestampLabel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
