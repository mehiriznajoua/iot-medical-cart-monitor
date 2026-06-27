// src/pages/Settings.jsx

import ConnectionConfig from '../components/settings/ConnectionConfig.jsx';
import TrolleyRegistryTable from '../components/settings/TrolleyRegistryTable.jsx';
import { useMonitor } from '../context/MonitorContext.jsx';

export default function SettingsPage() {
  // Ajouter deleteTrolley
  const { registry, updateTrolley, addTrolley, deleteTrolley, config, updateConfig } = useMonitor();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-normal tracking-tight" style={{color: '#152b5a', fontWeight: 550,}}>Settings</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage trolley registry and connection endpoints
        </p>
      </div>

      <TrolleyRegistryTable
        registry={registry}
        onUpdate={updateTrolley}
        onAdd={addTrolley}
        onDelete={deleteTrolley}  // AJOUTER
      />

      <ConnectionConfig config={config} onSave={updateConfig} />
    </div>
  );
}
