import axios from 'axios';

export async function fetchCartStatus(url) {
  const response = await axios.get(url, {
    timeout: 4000,
  });
  return response.data;
}
