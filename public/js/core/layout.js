import { apiFetch, clearTokens } from './api.js';

export async function initLayout() {
  const path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar nav a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try { await apiFetch('/auth/logout', { method: 'POST', body: '{}' }); } catch {}
    clearTokens();
    window.location.href = '/pages/login.html';
  });

  try {
    const token = sessionStorage.getItem('access');
    if (token) {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const role = payload.role;

      if (role !== 'ADMIN' && role !== 'HR_MANAGER') {
        document.querySelectorAll('a[href="analytics.html"], a[href="attendance.html"], a[href="employees.html"]').forEach(el => {
          el.style.display = 'none';
        });
      }
    }
  } catch (e) { console.error('Auth check failed', e); }

  try {
    const me = await apiFetch('/employees/me');
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = `${me.firstName} ${me.lastName}`;
  } catch (e) { console.error('Failed to load user', e); }
}

// 🔔 Socket.io Real-time Notification Listener
if (typeof io !== 'undefined') {
  const socket = io();
  socket.on("leave:new", (data) => {
    alert("🔔 REAL-TIME ALERT: " + data.name + " just requested leave!");
  });
}
