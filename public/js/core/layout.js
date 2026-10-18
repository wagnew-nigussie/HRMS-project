import { apiFetch, clearTokens } from './api.js';

export async function initLayout() {
  // Set active link based on current URL
  const path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar nav a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  // Logout logic
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try { await apiFetch('/auth/logout', { method: 'POST', body: '{}' }); } catch {}
    clearTokens();
    window.location.href = '/pages/login.html';
  });

  // Load user info
  try {
    const me = await apiFetch('/employees/me');
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = `${me.firstName} ${me.lastName}`;
  } catch (e) { console.error('Failed to load user', e); }
}
