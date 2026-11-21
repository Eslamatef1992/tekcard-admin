export const API_URL = (import.meta.env.VITE_API_URL || 'https://back.teknulugycard.com').replace(/\/$/, '');

export const getToken = () => localStorage.getItem('tc_token');
export const setToken = (t) => (t ? localStorage.setItem('tc_token', t) : localStorage.removeItem('tc_token'));

export async function api(path, { method = 'GET', body, file } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (file) {
    payload = new FormData();
    payload.append('image', file);
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${API_URL}/api${path}`, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/auth/login') {
    setToken(null);
    window.location.href = '/login';
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
