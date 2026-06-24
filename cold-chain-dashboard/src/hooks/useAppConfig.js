import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_APP_CONFIG, STORAGE_KEYS } from '../config/config.js';

export function useAppConfig() {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.config);
      return saved ? { ...DEFAULT_APP_CONFIG, ...JSON.parse(saved) } : DEFAULT_APP_CONFIG;
    } catch {
      return DEFAULT_APP_CONFIG;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config));
  }, [config]);

  const updateConfig = useCallback((updates) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  return { config, updateConfig };
}
