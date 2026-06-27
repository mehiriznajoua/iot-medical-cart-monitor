import { Link } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { useLiveClock } from '../../hooks/useLiveClock.js';
import { useMonitor } from '../../context/MonitorContext.jsx';

export default function TopNavbar() {
  const now = useLiveClock();
  const { connected, stats } = useMonitor();

  const dateLabel = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const timeLabel = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4 px-8 py-5">
        <div>
          <h1 className="text-5xl tracking-tight" style={{color: '#152b5a', fontWeight: 600,}}>Cold Chain Monitor</h1>
          <p className="text-sm text-slate-500">
            Real-time hospital refrigeration monitoring
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${
              connected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                connected ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
            {connected ? 'Node-RED Connected' : 'Node-RED Disconnected'}
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-700">{dateLabel}</p>
            <p className="font-mono text-sm text-slate-500">{timeLabel}</p>
          </div>

          <Link to="/alerts" className="relative">
            <Bell className="h-5 w-5 text-slate-500 hover:text-brand-600" />
            {stats.activeAlerts > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {stats.activeAlerts}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white">
              <User className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
