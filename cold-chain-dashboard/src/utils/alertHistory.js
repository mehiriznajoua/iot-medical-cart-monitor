export function getAlertStats(alerts) {
  const byType = {};
  let active = 0;
  let resolved = 0;

  alerts.forEach((alert) => {
    byType[alert.type] = (byType[alert.type] || 0) + 1;
    if (alert.type === 'NORMAL') {
      resolved += 1;
    } else {
      active += 1;
    }
  });

  return {
    total: alerts.length,
    active,
    resolved,
    byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
  };
}

export function loadAlertHistory() {
  try {
    const saved = localStorage.getItem('coldchain_alert_history');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveAlertHistory(alerts) {
  localStorage.setItem('coldchain_alert_history', JSON.stringify(alerts));
}
