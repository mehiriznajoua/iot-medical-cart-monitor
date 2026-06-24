import { AlertTriangle, Clock, Cpu, Wifi } from 'lucide-react';
import {
  formatTimestamp,
  getDoorLabel,
  getStateLabel,
  getStatusStyles,
} from '../../utils/formatters.js';

export default function DeviceInfo({ trolley, liveData, connected }) {
  const status = trolley.online ? trolley.status : 'OFFLINE';
  const styles = getStatusStyles(status);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Device Information</h3>
      <div className="mt-5 space-y-4">
        <InfoRow icon={Cpu} label="ID" value={trolley.id} />
        <InfoRow
          icon={Wifi}
          label="Connection Status"
          value={trolley.online && connected ? 'Live' : 'Offline'}
          valueClass={trolley.online && connected ? 'text-emerald-600' : 'text-slate-500'}
        />
        <InfoRow
          icon={Clock}
          label="Last Seen"
          value={
            trolley.online
              ? formatTimestamp(liveData?.timestamp)
              : 'Future deployment'
          }
        />
        <InfoRow
          icon={AlertTriangle}
          label="Current State"
          value={
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles.badge}`}>
              {trolley.online ? getStateLabel(liveData?.state) : 'OFFLINE'}
            </span>
          }
        />
        {trolley.online && liveData && (
          <InfoRow icon={AlertTriangle} label="Door" value={getDoorLabel(liveData.door)} />
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, valueClass = 'text-slate-900' }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className={`text-sm font-medium ${valueClass}`}>{value}</div>
    </div>
  );
}
