import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { fetchCartStatus } from '../api/cartStatus.js';
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
  isAlertState,
} from '../utils/formatters.js';

const MonitorContext = createContext(null);

function shouldRecordAlert(stateCode, prevState) {
  if (prevState === null) {
    return isAlertState(stateCode) || stateCode === 'PANNE_CAPTEUR';
  }
  return prevState !== stateCode;
}

export function MonitorProvider({ children }) {
  const { registry, updateTrolley, addTrolley } = useTrolleyRegistry();
  const { config, updateConfig } = useAppConfig();

  const [connected, setConnected] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const [alerts, setAlerts] = useState(() => loadAlertHistory());
  const [temperatureHistory, setTemperatureHistory] = useState([]);
  const [tempHistory, setTempHistory] = useState({});
  const lastStateRef = useRef(null);

  const poll = useCallback(async () => {
    const url = config.cartStatusUrl || API_CONFIG.cartStatusUrl;
    try {
      const data = await fetchCartStatus(url);
      setConnected(true);
      setLiveData(data);

      const stateCode = getStateCode(data.state);
      const prevState = lastStateRef.current;
      const trolley = registry.find((t) => t.id === LIVE_TROLLEY_ID);

      if (trolley && shouldRecordAlert(stateCode, prevState)) {
        const alert = buildAlertFromState(trolley, stateCode, data.timestamp, {
          temperature: data.temperature,
        });
        setAlerts((prev) => {
          const next = [alert, ...prev.filter((a) => a.id !== alert.id)].slice(0, 200);
          saveAlertHistory(next);
          return next;
        });
      }

      lastStateRef.current = stateCode;

      const point = {
        time: new Date(Number(data.timestamp) * 1000).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        temperature: Number(data.temperature),
        timestamp: Number(data.timestamp),
      };

      setTemperatureHistory((prev) => [...prev, point].slice(-120));

      setTempHistory((prev) => {
        const existing = prev[LIVE_TROLLEY_ID] || [];
        return {
          ...prev,
          [LIVE_TROLLEY_ID]: [...existing, point].slice(-120),
        };
      });
    } catch {
      setConnected(false);
    }
  }, [config.cartStatusUrl, registry]);

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
      (t) => t.online && t.status !== 'NORMAL',
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
      liveData,
      trolleys,
      registry,
      updateTrolley,
      addTrolley,
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
      liveData,
      trolleys,
      registry,
      updateTrolley,
      addTrolley,
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
