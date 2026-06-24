import { useState } from 'react';
import { Check, Pencil, Plus, X } from 'lucide-react';
import { LIVE_TROLLEY_ID } from '../../config/config.js';

export default function TrolleyRegistryTable({ registry, onUpdate, onAdd }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', location: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ id: '', name: '', location: '' });

  const startEdit = (trolley) => {
    setEditingId(trolley.id);
    setEditForm({ name: trolley.name, location: trolley.location });
  };

  const saveEdit = (id) => {
    onUpdate(id, editForm);
    setEditingId(null);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!addForm.id.trim() || !addForm.name.trim()) return;
    onAdd({
      id: addForm.id.trim().toLowerCase().replace(/\s+/g, ''),
      name: addForm.name.trim(),
      location: addForm.location.trim() || 'Not assigned',
      live: false,
    });
    setAddForm({ id: '', name: '', location: '' });
    setShowAdd(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Trolley Registry</h3>
          <p className="mt-1 text-sm text-slate-500">
            Manage display names and locations. Live data comes from Node-RED.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add Trolley
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4"
        >
          <input
            placeholder="ID (e.g. trolley07)"
            value={addForm.id}
            onChange={(e) => setAddForm({ ...addForm, id: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            placeholder="Name"
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            placeholder="Location"
            value={addForm.location}
            onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="pb-3 pr-4">ID</th>
              <th className="pb-3 pr-4">Name</th>
              <th className="pb-3 pr-4">Location</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {registry.map((trolley) => (
              <tr key={trolley.id} className="border-b border-slate-50">
                <td className="py-4 pr-4 font-mono text-xs text-slate-500">{trolley.id}</td>
                <td className="py-4 pr-4">
                  {editingId === trolley.id ? (
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1"
                    />
                  ) : (
                    <span className="font-semibold text-slate-900">{trolley.name}</span>
                  )}
                </td>
                <td className="py-4 pr-4">
                  {editingId === trolley.id ? (
                    <input
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1"
                    />
                  ) : (
                    <span className="text-slate-600">{trolley.location}</span>
                  )}
                </td>
                <td className="py-4 pr-4">
                  {trolley.id === LIVE_TROLLEY_ID ? (
                    <span className="font-semibold text-emerald-600">Live</span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      Not Deployed
                    </span>
                  )}
                </td>
                <td className="py-4">
                  {editingId === trolley.id ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(trolley.id)}
                        className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(trolley)}
                      className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
