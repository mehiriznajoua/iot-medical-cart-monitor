import { useEffect } from 'react';
import { API_CONFIG } from '../config/config.js';

export function usePolling(callback, intervalMs = API_CONFIG.pollIntervalMs) {
  useEffect(() => {
    callback();
    const timer = setInterval(callback, intervalMs);
    return () => clearInterval(timer);
  }, [callback, intervalMs]);
}
