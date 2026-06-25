import { Database, Radio, Server } from 'lucide-react';

const services = [
  { key: 'nodeRed', label: 'Node-RED', icon: Server },
  { key: 'mqtt', label: 'MQTT Broker', icon: Radio },
  { key: 'influx', label: 'InfluxDB', icon: Database },
];

function getServiceStatus(online) {
  if (online) {
    return {
      label: 'Online',
      iconClass: 'bg-emerald-100 text-emerald-600',
      textClass: 'text-emerald-600',
    };
  }

  return {
    label: 'Offline',
    iconClass: 'bg-red-100 text-red-600',
    textClass: 'text-red-600',
  };
}

export default function SystemHealth({ health }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">System Health</h3>
      <p className="mt-1 text-sm text-slate-500">
        Node-RED and InfluxDB are checked directly; MQTT reflects live broker data flow
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {services.map((service) => {
          const { label, icon: Icon, key } = service;
          const status = getServiceStatus(health[key]);

          return (
            <div
              key={key}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className={`rounded-lg p-2 ${status.iconClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{label}</p>
                <p className={`text-xs font-semibold ${status.textClass}`}>{status.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
