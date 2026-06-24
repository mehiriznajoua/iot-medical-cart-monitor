import { Link } from 'react-router-dom';
import { ChevronRight, DoorOpen, MapPin, Thermometer } from 'lucide-react';
import {
  formatTemperature,
  formatTimestamp,
  getDoorLabel,
  getStateLabel,
  getStatusStyles,
} from '../../utils/formatters.js';

export default function TrolleyCard({ trolley }) {
  const styles = getStatusStyles(trolley.status);
  const statusLabel = trolley.online ? getStateLabel(trolley.status) : 'OFFLINE';

  return (
    <Link
      to={`/trolley/${trolley.id}`}
      className={`group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ring-1 ${styles.ring}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-slate-900">{trolley.name}</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="h-4 w-4" />
            {trolley.location}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles.badge}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="flex items-center gap-1 text-xs font-medium uppercase text-slate-400">
            <Thermometer className="h-3.5 w-3.5" />
            Temperature
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {trolley.online ? formatTemperature(trolley.temperature) : '—'}
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-xs font-medium uppercase text-slate-400">
            <DoorOpen className="h-3.5 w-3.5" />
            Door
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {trolley.online ? getDoorLabel(trolley.door) : '—'}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Last seen:{' '}
          {trolley.online
            ? formatTimestamp(trolley.timestamp)
            : 'Future deployment'}
        </p>
        <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:text-brand-600" />
      </div>
    </Link>
  );
}
