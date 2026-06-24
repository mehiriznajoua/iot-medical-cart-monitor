import { useMonitor } from '../context/MonitorContext.jsx';
import KpiCards from '../components/dashboard/KpiCards.jsx';
import SystemHealth from '../components/dashboard/SystemHealth.jsx';
import TrolleyGrid from '../components/dashboard/TrolleyGrid.jsx';

export default function DashboardPage() {
  const { stats, trolleys, connected } = useMonitor();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">
          Overview of hospital cold-chain trolley status
        </p>
      </div>

      <KpiCards stats={stats} />
      <SystemHealth connected={connected} />
      <TrolleyGrid trolleys={trolleys} />
    </div>
  );
}
