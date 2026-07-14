const API_BASE = 'http://localhost:8000/api/v1';

// ─── Backend health check ──────────────────────────────────────
fetch('http://localhost:8000/health')
  .then((r) => {
    if (!r.ok) throw new Error('bad status');
    return r.json();
  })
  .then(() => {
    document.getElementById('dot').classList.remove('off');
    document.getElementById('status-text').textContent = 'Backend connected';
  })
  .catch(() => {
    document.getElementById('dot').classList.add('off');
    document.getElementById('status-text').textContent = 'Backend offline';
  });

// ─── Auth UI ────────────────────────────────────────────────────
const authBox = document.getElementById('auth-box');

function renderLoginForm(errorMsg) {
  authBox.innerHTML = `
    <h4>Login to unlock Optimize</h4>
    ${errorMsg ? `<div class="auth-error">${errorMsg}</div>` : ''}
    <input type="email" id="email" placeholder="Email" />
    <input type="password" id="password" placeholder="Password" />
    <button class="auth-btn" id="login-btn">Log in</button>
  `;
  document.getElementById('login-btn').addEventListener('click', doLogin);
}

function renderLoggedIn(email) {
  authBox.innerHTML = `
    <div class="logged-in-as">✓ Logged in as ${email}</div>
    <button class="logout-btn" id="logout-btn">Log out</button>
  `;
  document.getElementById('logout-btn').addEventListener('click', doLogout);
}

async function doLogin() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!email || !password) return;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      renderLoginForm('Invalid email or password.');
      return;
    }
    const data = await res.json();
    chrome.storage.local.set(
      { piq_token: data.access_token, piq_email: email },
      () => renderLoggedIn(email)
    );
  } catch (err) {
    renderLoginForm('Cannot reach backend. Is uvicorn running?');
  }
}

function doLogout() {
  chrome.storage.local.remove(['piq_token', 'piq_email'], () => {
    renderLoginForm();
  });
}

// On popup open, check if we already have a saved token
chrome.storage.local.get(['piq_token', 'piq_email'], (result) => {
  if (result.piq_token && result.piq_email) {
    renderLoggedIn(result.piq_email);
  } else {
    renderLoginForm();
  }
});