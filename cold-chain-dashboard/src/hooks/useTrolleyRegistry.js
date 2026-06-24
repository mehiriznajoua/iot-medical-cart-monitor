import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_TROLLEY_REGISTRY, STORAGE_KEYS } from '../config/config.js';

export function useTrolleyRegistry() {
  const [registry, setRegistry] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.registry);
      return saved ? JSON.parse(saved) : DEFAULT_TROLLEY_REGISTRY;
    } catch {
      return DEFAULT_TROLLEY_REGISTRY;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.registry, JSON.stringify(registry));
  }, [registry]);

  const updateTrolley = useCallback((id, updates) => {
    setRegistry((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  }, []);

  const addTrolley = useCallback((entry) => {
    setRegistry((prev) => {
      if (prev.some((t) => t.id === entry.id)) return prev;
      return [...prev, { live: false, ...entry }];
    });
  }, []);

  return { registry, setRegistry, updateTrolley, addTrolley };
}
