const API = '/api/v1';
let accessToken = sessionStorage.getItem('access') || null;
let refreshToken = sessionStorage.getItem('refresh') || null;

export function setTokens(t) {
  accessToken = t.accessToken;
  refreshToken = t.refreshToken;
  sessionStorage.setItem('access', accessToken);
  if (refreshToken) sessionStorage.setItem('refresh', refreshToken);
}

export function clearTokens() {
  accessToken = refreshToken = null;
  sessionStorage.removeItem('access');
  sessionStorage.removeItem('refresh');
}

let refreshing = null;
async function doRefresh() {
  if (!refreshToken) throw new Error('no refresh token');
  const res = await fetch(`${API}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('refresh failed');
  setTokens(await res.json());
}

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  const opts = {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  };
  if (accessToken) opts.headers.Authorization = `Bearer ${accessToken}`;

  let res = await fetch(url, opts);
  if (res.status === 401 && refreshToken) {
    refreshing = refreshing || doRefresh().finally(() => { refreshing = null; });
    try {
      await refreshing;
      opts.headers.Authorization = `Bearer ${accessToken}`;
      res = await fetch(url, opts);
    } catch { clearTokens(); throw new Error('Session expired'); }
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.message || 'Request failed'), { status: res.status, body });
  }
  return res.status === 204 ? null : res.json();
}
