import { Thermometer } from 'lucide-react';
import { formatTemperature, isAlertState } from '../../utils/formatters.js';

export default function AlertList({ alerts }) {
  if (!alerts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="text-slate-500">No alerts match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <article
          key={alert.id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                isAlertState(alert.type)
                  ? 'bg-red-100 text-red-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              <Thermometer className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {alert.type}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    alert.severity === 'Critical'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {alert.severity}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isAlertState(alert.type)
                      ? 'bg-red-50 text-red-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isAlertState(alert.type) ? 'Active' : 'Resolved'}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{alert.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{alert.description}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>{alert.trolleyName}</span>
                <span>{alert.location}</span>
                {alert.temperature != null && (
                  <span>{formatTemperature(alert.temperature)}</span>
                )}
                <span>{alert.timestampLabel}</span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
