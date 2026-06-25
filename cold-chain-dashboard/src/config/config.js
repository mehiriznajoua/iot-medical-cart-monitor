export const API_CONFIG = {
  cartStatusUrl: import.meta.env.VITE_CART_STATUS_URL || '/api/cart-status',
  mqttHealthUrl: import.meta.env.VITE_MQTT_HEALTH_URL || '/api/mqtt-health',
  influxHealthUrl: import.meta.env.VITE_INFLUX_HEALTH_URL || '/influx/health',
  pollIntervalMs: 5000,
  staleDataThresholdSec: 30,
};

export const LIVE_TROLLEY_ID = 'trolley01';

export const STORAGE_KEYS = {
  registry: 'coldchain_trolley_registry',
  alerts: 'coldchain_alert_history',
  config: 'coldchain_app_config',
};

export const DEFAULT_APP_CONFIG = {
  cartStatusUrl: '/api/cart-status',
  mqttHealthUrl: '/api/mqtt-health',
  influxHealthUrl: '/influx/health',
};

export const DEFAULT_TROLLEY_REGISTRY = [
  { id: 'trolley01', name: 'Trolley 01', location: 'Operating Room A', live: true },
  { id: 'trolley02', name: 'Trolley 02', location: 'Not assigned', live: false },
  { id: 'trolley03', name: 'Trolley 03', location: 'Not assigned', live: false },
  { id: 'trolley04', name: 'Trolley 04', location: 'Not assigned', live: false },
  { id: 'trolley05', name: 'Trolley 05', location: 'Not assigned', live: false },
  { id: 'trolley06', name: 'Trolley 06', location: 'Not assigned', live: false },
];

/** @deprecated use DEFAULT_TROLLEY_REGISTRY */
export const DEFAULT_TROLLEYS = DEFAULT_TROLLEY_REGISTRY;

export const STATE_CODES = {
  0: 'NORMAL',
  1: 'ALERTE_TEMP',
  2: 'ALERTE_PORTE',
  3: 'PANNE_CAPTEUR',
};

export const ALERT_TYPES = ['ALERTE_TEMP', 'ALERTE_PORTE', 'PANNE_CAPTEUR', 'NORMAL'];
