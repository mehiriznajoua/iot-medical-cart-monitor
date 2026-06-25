import { STATE_CODES } from '../config/config.js';

export const DOOR_LABELS = {
  0: 'CLOSED',
  1: 'OPEN',
};

export const STATE_LABELS = {
  0: 'NORMAL',
  1: 'ALERTE TEMP',
  2: 'ALERTE PORTE',
  3: 'PANNE CAPTEUR',
};

export const STATE_DESCRIPTIONS = {
  NORMAL: 'All parameters within acceptable range',
  ALERTE_TEMP: 'Temperature exceeded threshold',
  ALERTE_PORTE: 'Door remained open beyond limit',
  PANNE_CAPTEUR: 'Sensor failure detected',
  OFFLINE: 'Future deployment',
};

export function getDoorLabel(door) {
  if (door === 'OPEN' || door === 1 || door === '1') return 'OPEN';
  if (door === 'CLOSED' || door === 0 || door === '0') return 'CLOSED';
  return 'UNKNOWN';
}

export function getStateCode(state) {
  const numeric = Number(state);
  if (!Number.isNaN(numeric) && STATE_CODES[numeric]) {
    return STATE_CODES[numeric];
  }
  if (typeof state === 'string') return state.toUpperCase();
  return 'OFFLINE';
}

export function getStateLabel(state) {
  const code = getStateCode(state);
  if (code === 'OFFLINE') return 'OFFLINE';
  const numeric = Number(state);
  return STATE_LABELS[numeric] || code.replace('_', ' ');
}

export function getSeverity(stateCode) {
  if (stateCode === 'NORMAL') return 'Info';
  if (['ALERTE_TEMP', 'ALERTE_PORTE', 'PANNE_CAPTEUR'].includes(stateCode)) {
    return 'Critical';
  }
  return 'Info';
}

export function isAlertState(stateCode) {
  return stateCode === 'ALERTE_TEMP' || stateCode === 'ALERTE_PORTE';
}

export function isActiveAlertState(stateCode) {
  return (
    stateCode === 'ALERTE_TEMP' ||
    stateCode === 'ALERTE_PORTE' ||
    stateCode === 'PANNE_CAPTEUR'
  );
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return '—';
  const date = typeof timestamp === 'string' 
    ? new Date(timestamp.replace(' ', 'T'))
    : new Date(Number(timestamp) * 1000);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function formatTemperature(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(1)}°C`;
}

export function getStatusStyles(stateCode) {
  switch (stateCode) {
    case 'NORMAL':
      return {
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        ring: 'ring-emerald-200',
      };
    case 'ALERTE_TEMP':
      return {
        badge: 'bg-red-100 text-red-700 border-red-200',
        dot: 'bg-red-500',
        ring: 'ring-red-200',
      };
    case 'ALERTE_PORTE':
      return {
        badge: 'bg-orange-100 text-orange-700 border-orange-200',
        dot: 'bg-orange-500',
        ring: 'ring-orange-200',
      };
    case 'PANNE_CAPTEUR':
      return {
        badge: 'bg-red-100 text-red-700 border-red-200',
        dot: 'bg-red-500',
        ring: 'ring-red-200',
      };
    default:
      return {
        badge: 'bg-slate-100 text-slate-500 border-slate-200',
        dot: 'bg-slate-400',
        ring: 'ring-slate-200',
      };
  }
}

export function exportAlertsToCsv(alerts) {
  const headers = ['Timestamp', 'Trolley', 'Type', 'Severity', 'Title', 'Description'];
  const rows = alerts.map((alert) => [
    alert.timestampLabel,
    alert.trolleyName,
    alert.type,
    alert.severity,
    alert.title,
    alert.description,
  ]);

  const escape = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cold-chain-alerts-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function buildAlertFromState(trolley, stateCode, timestamp, extras = {}) {
  const titles = {
    ALERTE_TEMP: 'Temperature exceeded threshold',
    ALERTE_PORTE: 'Door remained open beyond limit',
    PANNE_CAPTEUR: 'Sensor failure detected',
    NORMAL: 'Returned to normal operation',
  };

  return {
    id: `${trolley.id}-${stateCode}-${timestamp}`,
    trolleyId: trolley.id,
    trolleyName: trolley.name,
    location: trolley.location,
    type: stateCode,
    severity: getSeverity(stateCode),
    title: titles[stateCode] || stateCode,
    description: STATE_DESCRIPTIONS[stateCode] || '',
    temperature: extras.temperature ?? null,
    timestamp,
    timestampLabel: formatTimestamp(timestamp),
  };
}
