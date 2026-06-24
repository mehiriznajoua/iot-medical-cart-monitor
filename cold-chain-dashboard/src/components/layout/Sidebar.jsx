import { NavLink } from 'react-router-dom';
import { Bell, FileText, LayoutGrid, Settings, Snowflake } from 'lucide-react';
import { useMonitor } from '../../context/MonitorContext.jsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/alerts', label: 'Alert Center', icon: Bell },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { stats } = useMonitor();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-slate-900 text-white">
      <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600">
          <Snowflake className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold leading-tight">Cold Chain</p>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Hospital Monitor
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="flex-1">{label}</span>
            {label === 'Alert Center' && stats.activeAlerts > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold">
                {stats.activeAlerts}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mx-4 mb-6 rounded-xl border border-slate-800 bg-slate-800/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          IoT Cold Chain
        </p>
        <p className="mt-1 text-xs text-slate-500">ESP32 · MQTT · Node-RED · InfluxDB</p>
      </div>
    </aside>
  );
}
