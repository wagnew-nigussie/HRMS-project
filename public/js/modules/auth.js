import { setTokens } from '../core/api.js';

const form = document.getElementById('login-form');
const errEl = document.getElementById('error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.hidden = true;

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Login failed');
    }
    const tokens = await res.json();
    setTokens(tokens);
    window.location.href = '/pages/dashboard.html';
  } catch (err) {
    errEl.textContent = err.message;
    errEl.hidden = false;
  }
});
