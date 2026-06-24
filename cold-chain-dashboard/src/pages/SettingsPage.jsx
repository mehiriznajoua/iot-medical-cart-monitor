import ConnectionConfig from '../components/settings/ConnectionConfig.jsx';
import TrolleyRegistryTable from '../components/settings/TrolleyRegistryTable.jsx';
import { useMonitor } from '../context/MonitorContext.jsx';

export default function SettingsPage() {
  const { registry, updateTrolley, addTrolley, config, updateConfig } = useMonitor();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage trolley registry and connection endpoints
        </p>
      </div>

      <TrolleyRegistryTable
        registry={registry}
        onUpdate={updateTrolley}
        onAdd={addTrolley}
      />

      <ConnectionConfig config={config} onSave={updateConfig} />
    </div>
  );
}
