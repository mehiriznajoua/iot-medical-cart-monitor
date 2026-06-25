import { useMonitor } from '../context/MonitorContext.jsx';
import KpiCards from '../components/dashboard/KpiCards.jsx';
import SystemHealth from '../components/dashboard/SystemHealth.jsx';
import TrolleyGrid from '../components/dashboard/TrolleyGrid.jsx';

export default function DashboardPage() {
  const { stats, trolleys, systemHealth } = useMonitor();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl tracking-tight" style={{color: '#152b5a', fontWeight: 550,}}>Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">
          Overview of hospital cold-chain trolley status
        </p>
      </div>

      <KpiCards stats={stats} />
      <SystemHealth health={systemHealth} />
      <TrolleyGrid trolleys={trolleys} />
    </div>
  );
}
