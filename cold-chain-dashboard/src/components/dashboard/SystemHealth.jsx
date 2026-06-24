import { Activity, Database, Radio, Server } from 'lucide-react';

const services = [
  { key: 'nodeRed', label: 'Node-RED', icon: Server },
  { key: 'mqtt', label: 'MQTT Broker', icon: Radio },
  { key: 'influx', label: 'InfluxDB', icon: Database },
  { key: 'grafana', label: 'Grafana', icon: Activity },
];

export default function SystemHealth({ connected }) {
  const status = {
    nodeRed: connected,
    mqtt: true,
    influx: true,
    grafana: true,
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">System Health</h3>
      <p className="mt-1 text-sm text-slate-500">
        IoT pipeline status — Node-RED reflects live API connectivity
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {services.map(({ key, label, icon: Icon }) => {
          const online = status[key];
          return (
            <div
              key={key}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div
                className={`rounded-lg p-2 ${
                  online ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{label}</p>
                <p
                  className={`text-xs font-semibold ${
                    online ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {online ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
