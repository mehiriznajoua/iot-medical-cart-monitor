import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { fetchCartStatus } from '../api/cartStatus.js';
import { fetchHealthCheck, isLiveDataFresh } from '../api/healthCheck.js';
import {
  API_CONFIG,
  LIVE_TROLLEY_ID,
  STORAGE_KEYS,
} from '../config/config.js';
import { useAppConfig } from '../hooks/useAppConfig.js';
import { usePolling } from '../hooks/usePolling.js';
import { useTrolleyRegistry } from '../hooks/useTrolleyRegistry.js';
import { loadAlertHistory, saveAlertHistory } from '../utils/alertHistory.js';
import {
  buildAlertFromState,
  getStateCode,
  isActiveAlertState,
  isAlertState,
} from '../utils/formatters.js';

const MonitorContext = createContext(null);

const DEFAULT_SYSTEM_HEALTH = {
  nodeRed: false,
  mqtt: false,
  influx: false,
};

async function checkMqttHealth(mqttHealthUrl, cartData, thresholdSec) {
  if (mqttHealthUrl) {
    try {
      await fetchHealthCheck(mqttHealthUrl);
      return true;
    } catch (error) {
      const status = error.response?.status;
      if (status && status !== 404) {
        return false;
      }
    }
  }

  return isLiveDataFresh(cartData?.timestamp, thresholdSec);
}

function shouldRecordAlert(stateCode, prevState) {
  if (prevState === null) {
    return isAlertState(stateCode) || stateCode === 'PANNE_CAPTEUR';
  }
  return prevState !== stateCode;
}

export function MonitorProvider({ children }) {
  const { registry, updateTrolley, addTrolley, deleteTrolley } = useTrolleyRegistry();  // AJOUTER deleteTrolley

  const { config, updateConfig } = useAppConfig();

  const [connected, setConnected] = useState(false);
  const [systemHealth, setSystemHealth] = useState(DEFAULT_SYSTEM_HEALTH);
  const [liveData, setLiveData] = useState(null);
  const [alerts, setAlerts] = useState(() => loadAlertHistory());
  const [temperatureHistory, setTemperatureHistory] = useState([]);
  const [tempHistory, setTempHistory] = useState({});
  const lastStateRef = useRef(null);

  const poll = useCallback(async () => {
    const cartUrl = config.cartStatusUrl || API_CONFIG.cartStatusUrl;
    const mqttHealthUrl = config.mqttHealthUrl || API_CONFIG.mqttHealthUrl;
    const influxHealthUrl = config.influxHealthUrl || API_CONFIG.influxHealthUrl;
    const thresholdSec = API_CONFIG.staleDataThresholdSec;

    let cartData = null;
    let nodeRedOnline = false;

    try {
      cartData = await fetchCartStatus(cartUrl);
      if (Array.isArray(cartData)) cartData = cartData[0];
      nodeRedOnline = true;
      setConnected(true);
      setLiveData(cartData);

      const stateCode = getStateCode(cartData.state);
      const prevState = lastStateRef.current;
      const trolley = registry.find((t) => t.id === LIVE_TROLLEY_ID);

      if (trolley && shouldRecordAlert(stateCode, prevState)) {
        const alert = buildAlertFromState(trolley, stateCode, cartData.timestamp, {
          temperature: cartData.temperature,
        });
        setAlerts((prev) => {
          const next = [alert, ...prev.filter((a) => a.id !== alert.id)].slice(0, 200);
          saveAlertHistory(next);
          return next;
        });
      }

      lastStateRef.current = stateCode;

      const parsedTime = new Date(cartData.timestamp.replace(' ', 'T'));
      const point = {
        time: parsedTime.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        temperature: Number(cartData.temperature),
        timestamp: parsedTime.getTime(),
      };

      setTemperatureHistory((prev) => [...prev, point].slice(-43200));

      setTempHistory((prev) => {
        const existing = prev[LIVE_TROLLEY_ID] || [];
        return {
          ...prev,
          [LIVE_TROLLEY_ID]: [...existing, point].slice(-120),
        };
      });
    } catch {
      nodeRedOnline = false;
      setConnected(false);
    }

    const [mqttOnline, influxOnline] = await Promise.all([
      nodeRedOnline
        ? checkMqttHealth(mqttHealthUrl, cartData, thresholdSec)
        : Promise.resolve(false),
      fetchHealthCheck(influxHealthUrl)
        .then(() => true)
        .catch(() => false),
    ]);

    setSystemHealth({
      nodeRed: nodeRedOnline,
      mqtt: mqttOnline,
      influx: influxOnline,
    });
  }, [
    config.cartStatusUrl,
    config.mqttHealthUrl,
    config.influxHealthUrl,
    registry,
  ]);

  usePolling(poll, API_CONFIG.pollIntervalMs);

  const trolleys = useMemo(() => {
    return registry.map((trolley) => {
      if (!trolley.live) {
        return {
          ...trolley,
          status: 'OFFLINE',
          temperature: null,
          door: null,
          timestamp: null,
          online: false,
        };
      }

      if (!liveData || !connected) {
        return {
          ...trolley,
          status: 'OFFLINE',
          temperature: liveData?.temperature ?? null,
          door: liveData?.door ?? null,
          timestamp: liveData?.timestamp ?? null,
          online: false,
        };
      }

      return {
        ...trolley,
        status: getStateCode(liveData.state),
        temperature: liveData.temperature,
        door: liveData.door,
        timestamp: liveData.timestamp,
        online: true,
      };
    });
  }, [connected, liveData, registry]);

  const stats = useMemo(() => {
    const online = trolleys.filter((t) => t.online).length;
    const offline = trolleys.length - online;
    const activeAlerts = trolleys.filter(
      (t) => t.online && isActiveAlertState(t.status),
    ).length;

    return {
      total: trolleys.length,
      online,
      offline,
      activeAlerts,
    };
  }, [trolleys]);

  const value = useMemo(
    () => ({
      connected,
      systemHealth,
      liveData,
      trolleys,
      registry,
      updateTrolley,
      addTrolley,
      deleteTrolley,  // AJOUTER
      config,
      updateConfig,
      stats,
      alerts,
      temperatureHistory,
      tempHistory,
      pollIntervalMs: API_CONFIG.pollIntervalMs,
    }),
    [
      connected,
      systemHealth,
      liveData,
      trolleys,
      registry,
      updateTrolley,
      addTrolley,
      deleteTrolley,  // AJOUTER
      config,
      updateConfig,
      stats,
      alerts,
      temperatureHistory,
      tempHistory,
    ],
  );

  return (
    <MonitorContext.Provider value={value}>{children}</MonitorContext.Provider>
  );
}

export function useMonitor() {
  const context = useContext(MonitorContext);
  if (!context) {
    throw new Error('useMonitor must be used within MonitorProvider');
  }
  return context;
}
