import { ALERT_TYPES } from '../../config/config.js';
import { useMonitor } from '../../context/MonitorContext.jsx';

export default function AlertFilters({ filters, onChange }) {
  const { registry } = useMonitor();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
        Filters
      </h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FilterField label="Severity">
          <select
            value={filters.severity}
            onChange={(e) => onChange({ ...filters, severity: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600"
          >
            <option value="all">All</option>
            <option value="Critical">Critical</option>
            <option value="Info">Info</option>
          </select>
        </FilterField>

        <FilterField label="Alert Type">
          <select
            value={filters.type}
            onChange={(e) => onChange({ ...filters, type: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600"
          >
            <option value="all">All</option>
            {ALERT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Trolley">
          <select
            value={filters.trolley}
            onChange={(e) => onChange({ ...filters, trolley: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600"
          >
            <option value="all">All</option>
            {registry.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Date From">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600"
          />
        </FilterField>

        <FilterField label="Date To">
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600"
          />
        </FilterField>
      </div>
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
