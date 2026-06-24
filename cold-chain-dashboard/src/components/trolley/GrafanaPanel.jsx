import { ExternalLink } from 'lucide-react';

export default function GrafanaPanel({ url }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Grafana Monitoring</h3>
          <p className="mt-1 text-sm text-slate-500">
            Embedded temperature visualization from InfluxDB
          </p>
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Open in Grafana
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {url ? (
          <iframe
            title="Grafana temperature panel"
            src={url}
            className="h-80 w-full border-0"
            loading="lazy"
          />
        ) : (
          <div className="flex h-80 flex-col items-center justify-center text-slate-400">
            <p className="text-sm font-medium">No Grafana URL configured</p>
            <p className="mt-1 text-xs">Add an embed URL in Settings → Connection Configuration</p>
          </div>
        )}
      </div>
    </div>
  );
}
