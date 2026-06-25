export const NODE_RED_API_URL = 'http://localhost:1880/api/cart-status';

export const GRAFANA_URL = 'http://localhost:3000/d-solo/cold-chain/temperature?orgId=1&refresh=5s&panelId=1';

export const REFRESH_INTERVAL = 5000;

export const DEFAULT_TROLLEY_IDS = [
  'trolley01',
  'trolley02',
  'trolley03',
  'trolley04',
  'trolley05',
  'trolley06',
];

export const DEFAULT_TROLLEY_REGISTRY = DEFAULT_TROLLEY_IDS.map((id, index) => ({
  id,
  name: `Trolley ${String(index + 1).padStart(2, '0')}`,
  location: index === 0 ? 'Operating Room A' : 'Not assigned',
  notes: '',
  enabled: true,
}));

export const STORAGE_KEYS = {
  registry: 'cold_chain_trolley_registry',
  alerts: 'cold_chain_alert_history',
  settings: 'cold_chain_settings_overrides',
  tempHistory: 'cold_chain_temp_history',
};