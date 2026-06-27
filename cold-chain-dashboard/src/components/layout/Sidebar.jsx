import { NavLink } from 'react-router-dom';
import { Bell, FileText, LayoutGrid, Settings } from 'lucide-react';
import coldStorageIcon from '../../assets/cold-storage.png';
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
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white border-r border-slate-200">
      {/* En-tête */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0D3B66]">
          <img src={coldStorageIcon} alt="Cold Chain" className="h-7 w-7 invert" />
        </div>
        <div>
          <p className="text-lg font-bold leading-tight text-slate-900">Cold Chain</p>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
            Hospital Monitor
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-[#0D3B66] text-white shadow-lg shadow-[#0D3B66]/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="flex-1">{label}</span>
            {label === 'Alert Center' && stats.activeAlerts > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                {stats.activeAlerts}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
