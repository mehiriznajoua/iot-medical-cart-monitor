import { useState } from 'react';
import { Save } from 'lucide-react';

export default function ConnectionConfig({ config, onSave }) {
  const [form, setForm] = useState({
    cartStatusUrl: config.cartStatusUrl || '',
    grafanaEmbedUrl: config.grafanaEmbedUrl || '',
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Connection Configuration</h3>
      <p className="mt-1 text-sm text-slate-500">
        Configure API endpoints. Changes apply on the next poll cycle.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Node-RED API URL
          </label>
          <input
            type="text"
            value={form.cartStatusUrl}
            onChange={(e) => setForm({ ...form, cartStatusUrl: e.target.value })}
            placeholder="http://localhost:1880/api/cart-status"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Grafana Embed URL
          </label>
          <input
            type="text"
            value={form.grafanaEmbedUrl}
            onChange={(e) => setForm({ ...form, grafanaEmbedUrl: e.target.value })}
            placeholder="https://your-grafana/d/.../panel/..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Save className="h-4 w-4" />
          {saved ? 'Saved!' : 'Save Configuration'}
        </button>
      </form>
    </div>
  );
}
