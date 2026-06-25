import axios from 'axios';

export async function fetchHealthCheck(url) {
  const response = await axios.get(url, {
    timeout: 4000,
    validateStatus: (status) => status >= 200 && status < 300,
  });
  return response.data;
}

export function isLiveDataFresh(timestamp, thresholdSec) {
  const ts = Number(timestamp);
  if (!timestamp || Number.isNaN(ts)) return false;

  const normalizedTs = ts > 1e12 ? Math.floor(ts / 1000) : ts;
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec - normalizedTs <= thresholdSec;
}
