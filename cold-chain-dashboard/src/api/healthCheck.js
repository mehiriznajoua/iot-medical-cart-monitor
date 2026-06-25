import axios from 'axios';

export async function fetchHealthCheck(url) {
  const response = await axios.get(url, {
    timeout: 4000,
    validateStatus: (status) => status >= 200 && status < 300,
  });
  return response.data;
}

export function isLiveDataFresh(timestamp, thresholdSec) {
  if (!timestamp) return false;
  
  let date;
  if (typeof timestamp === 'string') {
    date = new Date(timestamp.replace(' ', 'T'));
  } else {
    const ts = Number(timestamp);
    date = ts > 1e12 ? new Date(ts) : new Date(ts * 1000);
  }
  
  if (isNaN(date.getTime())) return false;
  return (Date.now() - date.getTime()) / 1000 <= thresholdSec;
}
