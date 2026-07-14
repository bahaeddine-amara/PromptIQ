// ═══════════════════════════════════════════════════════════════
// PromptIQ Content Script v3 — adds Optimize (requires login via
// the extension popup, since /optimize is an authenticated route)
// ═══════════════════════════════════════════════════════════════

const API_BASE = 'http://localhost:8000/api/v1';

const INPUT_SELECTORS = [
  '#prompt-textarea',
  'div[contenteditable="true"][id="prompt-textarea"]',
  'div.ProseMirror[contenteditable="true"]',
  'div[contenteditable="true"][role="textbox"]',
  'rich-textarea div[contenteditable="true"]',
  'textarea[placeholder]',
];

let lastAnalyzedText = '';   // remembered so Optimize buttons can reuse it

function findInput() {
  for (const sel of INPUT_SELECTORS) {
    const el = document.querySelector(sel);
    if (el && el.offsetParent !== null) return el;
  }
  return null;
}

function getText(el) {
  if (!el) return '';
  return (el.innerText ?? el.value ?? '').trim();
}

function injectButton() {
  const input = findInput();
  if (!input) return;
  if (input.dataset.piqDone === '1') return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'piq-trigger-btn';
  btn.textContent = '🧠 Analyze';
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const text = getText(input);
    if (!text) {
      openPanel({ error: 'Type a prompt first, then click Analyze.' });
      return;
    }
    lastAnalyzedText = text;
    analyze(text);
  });

  document.body.appendChild(btn);
  input.dataset.piqDone = '1';
}

// ─── chrome.storage helper (promise wrapper) ───────────────────
function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['piq_token'], (result) => {
      resolve(result.piq_token || null);
    });
  });
}

// ─── API calls ──────────────────────────────────────────────────
async function analyze(text) {
  openPanel({ loading: true, loadingText: 'Analyzing…' });
  try {
    const res = await fetch(`${API_BASE}/prompts/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    openPanel({ data });
  } catch (err) {
    openPanel({ error: connectionErrorMsg(err) });
  }
}

async function optimize(mode) {
  const token = await getAuthToken();
  if (!token) {
    openPanel({
      error:
        'You need to log in first.\n\n' +
        'Click the PromptIQ icon in your Chrome toolbar and log in there. ' +
        'Then come back and try Optimize again.',
    });
    return;
  }
  if (!lastAnalyzedText) return;

  openPanel({ loading: true, loadingText: mode === 'ECONOMY' ? 'Compressing…' : 'Rewriting…' });
  try {
    const res = await fetch(`${API_BASE}/prompts/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt: lastAnalyzedText, mode }),
    });
    if (res.status === 401) {
      openPanel({
        error: 'Your session expired. Open the PromptIQ popup and log in again.',
      });
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    openPanel({ optimized: data });
  } catch (err) {
    openPanel({ error: connectionErrorMsg(err) });
  }
}

function connectionErrorMsg(err) {
  return (
    'Cannot reach the PromptIQ backend.\n\n' +
    'Checklist:\n' +
    '1. Is uvicorn running? (uvicorn app.main:app --reload)\n' +
    '2. Is it on port 8000?\n' +
    '3. Open http://localhost:8000/health — does it respond?\n\n' +
    `Technical detail: ${err.message}`
  );
}

// ─── Rendering ────────────────────────────────────────────────
function gradeColor(grade) {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#3b82f6';
  if (grade.startsWith('C')) return '#eab308';
  return '#ef4444';
}

function openPanel(state) {
  document.getElementById('piq-panel')?.remove();

  const panel = document.createElement('div');
  panel.id = 'piq-panel';

  const header = `<div class="piq-panel-header"><span>🧠 PromptIQ</span><button id="piq-close">✕</button></div>`;
  let body;

  if (state.loading) {
    body = `<div class="piq-loading"><div class="piq-spinner"></div><p>${escapeHtml(state.loadingText || 'Working…')}</p></div>`;
  } else if (state.error) {
    body = `<div class="piq-error">${escapeHtml(state.error)}</div>`;
  } else if (state.optimized) {
    const o = state.optimized;
    const pct = o.savings_percent;
    const pctColor = pct > 0 ? '#a6e3a1' : '#f59e0b';
    body = `
      <div class="piq-section">
        <h4>${o.mode === 'ECONOMY' ? '💰 Economy' : '⚡ Performance'} result</h4>
        <div class="piq-stats-row">
          <div><span class="piq-stat-num">${o.tokens_before}</span><span class="piq-stat-lbl">before</span></div>
          <div><span class="piq-stat-num">${o.tokens_after}</span><span class="piq-stat-lbl">after</span></div>
          <div><span class="piq-stat-num" style="color:${pctColor}">${pct > 0 ? '-' : '+'}${Math.abs(pct)}%</span><span class="piq-stat-lbl">change</span></div>
        </div>
      </div>
      <div class="piq-optimized-box">${escapeHtml(o.optimized_prompt)}</div>
      <button class="piq-copy-btn" id="piq-copy">📋 Copy optimized prompt</button>
      <button class="piq-back-btn" id="piq-back">← Back to analysis</button>
    `;
  } else {
    const d = state.data;
    const gc = gradeColor(d.grade);
    const recs = d.recommendations.length
      ? `<ul>${d.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>`
      : `<p class="piq-good">✅ Strong prompt — no major issues found.</p>`;
    const tokens = d.token_counts
      .slice(0, 5)
      .map(
        (t) =>
          `<div class="piq-row"><span>${t.model === d.recommended_model ? '★ ' : ''}${escapeHtml(t.model)}</span><span>${t.tokens} tok</span></div>`
      )
      .join('');

    body = `
      <div class="piq-score-card">
        <div class="piq-grade" style="color:${gc}">${d.grade}</div>
        <div class="piq-score-num">${d.quality_score}<span>/100</span></div>
        <div class="piq-cat">${escapeHtml(d.category)}</div>
      </div>
      <div class="piq-section">
        <h4>Suggestions</h4>
        ${recs}
      </div>
      <div class="piq-optimize-row">
        <button class="piq-opt-btn piq-opt-perf" id="piq-opt-perf">⚡ Performance</button>
        <button class="piq-opt-btn piq-opt-econ" id="piq-opt-econ">💰 Economy</button>
      </div>
      <div class="piq-section">
        <h4>Best model · Token counts</h4>
        <div class="piq-best">${escapeHtml(d.recommended_model)}</div>
        ${tokens}
      </div>`;
  }

  panel.innerHTML = header + `<div class="piq-panel-body">${body}</div>`;
  document.body.appendChild(panel);

  document.getElementById('piq-close')?.addEventListener('click', () => panel.remove());
  document.getElementById('piq-opt-perf')?.addEventListener('click', () => optimize('PERFORMANCE'));
  document.getElementById('piq-opt-econ')?.addEventListener('click', () => optimize('ECONOMY'));
  document.getElementById('piq-back')?.addEventListener('click', () => analyze(lastAnalyzedText));
  document.getElementById('piq-copy')?.addEventListener('click', () => {
    if (state.optimized) {
      navigator.clipboard.writeText(state.optimized.optimized_prompt).catch(() => {});
      const btn = document.getElementById('piq-copy');
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.textContent = '📋 Copy optimized prompt'; }, 1500);
    }
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Bootstrapping ─────────────────────────────────────────────
injectButton();
new MutationObserver(injectButton).observe(document.body, {
  childList: true,
  subtree: true,
});
setInterval(injectButton, 2000);