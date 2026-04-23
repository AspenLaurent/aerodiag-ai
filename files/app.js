// ── Clock ────────────────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const pad = v => String(v).padStart(2, '0');
  const el = document.getElementById('clk');
  if (el) el.textContent = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())} UTC`;
}
setInterval(updateClock, 1000);
updateClock();

// ── Timeline ─────────────────────────────────────────────────────────────────
const TIMELINE_EVENTS = [
  { color: '#ff4f4f', time: '14:32 UTC', text: 'Combustor thermal anomaly', src: 'VISION+FDR' },
  { color: '#ffb400', time: '14:28 UTC', text: 'Fuel flow +12% spike',       src: 'TELEMETRY'   },
  { color: '#ffb400', time: '14:15 UTC', text: 'Pilot: vibration at cruise',  src: 'PILOT REPORT'},
  { color: '#00c8ff', time: '09:00 UTC', text: 'Baseline established',        src: 'GROUND CHECK'},
];

function renderTimeline() {
  const container = document.getElementById('timeline');
  if (!container) return;
  container.innerHTML = TIMELINE_EVENTS.map((e, i) => `
    <div class="tl-row">
      <div class="tl-left">
        <div class="tl-dot2" style="background:${e.color}"></div>
        ${i < TIMELINE_EVENTS.length - 1 ? '<div class="tl-line"></div>' : ''}
      </div>
      <div class="tl-body">
        <div class="tl-t">${e.time}</div>
        <div class="tl-txt">${e.text}</div>
        <div class="tl-src">${e.src}</div>
      </div>
    </div>
  `).join('');
}
renderTimeline();

// ── Navigation ───────────────────────────────────────────────────────────────
const PANELS = ['dashboard', 'cv', 'fdr', 'pilot', 'report'];

function nav(id) {
  PANELS.forEach(p => {
    const el = document.getElementById(`p-${p}`);
    if (el) el.classList.remove('show');
  });
  document.querySelectorAll('.tnav').forEach(b => b.classList.remove('active'));

  const panel = document.getElementById(`p-${id}`);
  if (panel) panel.classList.add('show');

  const idx = PANELS.indexOf(id);
  const btns = document.querySelectorAll('.tnav');
  if (btns[idx]) btns[idx].classList.add('active');

  if (id === 'report') genReport();
}

// ── Engine data ───────────────────────────────────────────────────────────────
const ENGINE_DATA = [
  {
    badge: 'COMBUSTOR ANOMALY', badgeClass: 'b-er',
    egt: '847°C', egtClass: 'wn',
    n1: '98.2%', n1Class: 'ok',
    ff: '2441 kg/h', ffClass: 'er',
    op: '62 psi', opClass: 'ok',
    hot: true, wdot: true,
    fan: '18°C', comp: '312°C', comb: '1740°C', turb: '890°C', exh: '620°C',
  },
  {
    badge: 'NOMINAL', badgeClass: 'b-ok',
    egt: '791°C', egtClass: 'ok',
    n1: '97.8%', n1Class: 'ok',
    ff: '2180 kg/h', ffClass: 'ok',
    op: '64 psi', opClass: 'ok',
    hot: false, wdot: false,
    fan: '17°C', comp: '308°C', comb: '1698°C', turb: '862°C', exh: '601°C',
  },
  {
    badge: 'REVIEW REQUIRED', badgeClass: 'b-wn',
    egt: '310°C', egtClass: 'wn',
    n1: '62.1%', n1Class: 'ok',
    ff: '140 kg/h', ffClass: 'wn',
    op: '58 psi', opClass: 'ok',
    hot: false, wdot: false,
    fan: '15°C', comp: '98°C', comb: '880°C', turb: '410°C', exh: '290°C',
  },
];

function selEng(btn, idx) {
  document.querySelectorAll('.eng-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');

  const d = ENGINE_DATA[idx];
  const badge = document.getElementById('eng-badge');
  if (badge) { badge.textContent = d.badge; badge.className = `card-badge ${d.badgeClass}`; }

  const setMetric = (id, val, cls) => {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = val; el.className = `mv ${cls}`; }
  };
  setMetric('m-egt', d.egt, d.egtClass);
  setMetric('m-n1',  d.n1,  d.n1Class);
  setMetric('m-ff',  d.ff,  d.ffClass);
  setMetric('m-op',  d.op,  d.opClass);

  ['fan','comp','comb','turb','exh'].forEach(k => {
    const el = document.getElementById(`v-${k}`);
    if (el) el.textContent = d[k];
  });

  const comb = document.getElementById('ev-comb');
  if (comb) comb.classList.toggle('hot', d.hot);

  const wdot = document.getElementById('wdot');
  if (wdot) wdot.style.display = d.wdot ? 'block' : 'none';
}

// ── AI Chat ──────────────────────────────────────────────────────────────────
const AI_RESPONSES = [
  'Cross-referencing all data streams. CV findings at combustor stage 3 (87% confidence) align with FDR EGT margin erosion from 84°C to 28°C across TF-2244–2246. Multi-source confirmation complete.',
  'Pilot vibration reports from TF-2245 and TF-2246 correlate with fuel nozzle asymmetry on positions 7–9. Nozzle 8 coking is the most likely driver — recommend flow-check as part of the next borescope event.',
  'EGT margin at 28°C is approaching the 20°C operational limit. At current degradation rate, limit breach could occur within 2–3 additional cycles without intervention.',
  'Compressor section is clear — no FOD, no blade erosion. The issue is isolated to the hot section: combustor, fuel nozzles, and HPT stage 1 tip wear.',
  'Risk assessment updated. Probability of in-flight escalation within next 3 cycles: 14%. Recommend ENGINE NOT DISPATCH until borescope and nozzle check complete.',
  'Test flight baseline comparison complete. ENG-1 has deviated significantly from TF-2244 baseline over 2 sorties — progressive pattern consistent with hot section erosion.',
  'Maintenance report updated with all current data. 5 priority actions issued. Action 01 (borescope combustor stage 3) is the critical path — all others can be performed concurrently.',
];
let aiRespIdx = 0;

function addAIMsg(text, alert = false) {
  const msgs = document.getElementById('msgs');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'msg ai';
  div.innerHTML = `
    <div class="msg-who">AERODIAG AI</div>
    <div class="bubble${alert ? ' alert' : ''}">${text}</div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTypingIndicator() {
  const msgs = document.getElementById('msgs');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'msg ai';
  div.id = 'typing-indicator';
  div.innerHTML = `
    <div class="msg-who">AERODIAG AI</div>
    <div class="typing-dots"><span></span><span></span><span></span></div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function sendMsg() {
  const input = document.getElementById('ci');
  const text = input.value.trim();
  if (!text) return;

  const msgs = document.getElementById('msgs');
  const userDiv = document.createElement('div');
  userDiv.className = 'msg usr';
  userDiv.innerHTML = `
    <div class="msg-who">OPERATOR</div>
    <div class="bubble">${text}</div>
  `;
  msgs.appendChild(userDiv);
  msgs.scrollTop = msgs.scrollHeight;
  input.value = '';

  showTypingIndicator();
  setTimeout(() => {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
    const resp = AI_RESPONSES[aiRespIdx % AI_RESPONSES.length];
    aiRespIdx++;
    addAIMsg(resp, aiRespIdx % 2 === 0);
  }, 1200 + Math.random() * 700);
}

document.addEventListener('DOMContentLoaded', () => {
  const ci = document.getElementById('ci');
  if (ci) ci.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });
});

// ── CV Analysis ───────────────────────────────────────────────────────────────
function dzDrag(e) { e.preventDefault(); document.getElementById('cv-dz').classList.add('drag'); }
function dzLeave()  { document.getElementById('cv-dz').classList.remove('drag'); }
function dzDrop(e)  { e.preventDefault(); dzLeave(); startCV(); }
function dzClick()  { startCV(); }

function startCV() {
  document.getElementById('dz-default').classList.add('hidden');
  document.getElementById('dz-processing').classList.remove('hidden');
  document.getElementById('cv-results-area').classList.add('hidden');

  setTimeout(() => {
    document.getElementById('dz-processing').classList.add('hidden');
    document.getElementById('dz-done').classList.remove('hidden');
    drawCVImage();
    document.getElementById('cv-results-area').classList.remove('hidden');
    document.getElementById('cv-dz').classList.add('has-img');
  }, 2200);
}

function drawCVImage() {
  const canvas = document.getElementById('cv-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = 600; canvas.height = 140;

  ctx.fillStyle = '#0e1a2a';
  ctx.fillRect(0, 0, 600, 140);

  ctx.strokeStyle = '#1d2d42'; ctx.lineWidth = 1;
  for (let x = 0; x < 600; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 140); ctx.stroke(); }
  for (let y = 0; y < 140; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(600, y); ctx.stroke(); }

  // Combustor thermal bloom
  ctx.fillStyle = 'rgba(255,107,43,0.18)'; ctx.beginPath(); ctx.ellipse(220, 72, 80, 42, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,107,43,0.35)'; ctx.beginPath(); ctx.ellipse(220, 72, 48, 26, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,107,43,0.60)'; ctx.beginPath(); ctx.ellipse(225, 70, 22, 14, -.2, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,79,79,0.7)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
  ctx.beginPath(); ctx.ellipse(220, 72, 80, 42, 0, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);

  // HPT nozzle area
  ctx.fillStyle = 'rgba(255,180,0,0.25)'; ctx.beginPath(); ctx.ellipse(390, 68, 28, 16, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,180,0,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.ellipse(390, 68, 28, 16, 0, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);

  // Compressor blades (healthy)
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = 'rgba(0,200,255,0.25)';
    ctx.beginPath(); ctx.ellipse(80 + i * 10, 70 + Math.sin(i) * 8, 6, 28, 0, 0, Math.PI*2); ctx.fill();
  }

  // Annotation box
  ctx.strokeStyle = 'rgba(255,79,79,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([]);
  ctx.beginPath(); ctx.roundRect(150, 38, 140, 68, 4); ctx.stroke();

  // Dot annotations
  ctx.fillStyle = 'rgba(255,79,79,0.5)';  ctx.beginPath(); ctx.arc(155, 43, 4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,180,0,0.5)'; ctx.beginPath(); ctx.arc(395, 53, 4, 0, Math.PI*2); ctx.fill();
}

function rescanCV() {
  document.getElementById('dz-done').classList.add('hidden');
  document.getElementById('cv-results-area').classList.add('hidden');
  document.getElementById('dz-default').classList.remove('hidden');
  document.getElementById('cv-dz').classList.remove('has-img');
}

// ── FDR Sync ──────────────────────────────────────────────────────────────────
function doSync() {
  const btn = document.getElementById('sync-btn');
  if (!btn) return;
  btn.textContent = 'Syncing...';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Re-sync FDR Data';
    btn.disabled = false;
    addAIMsg('FDR re-sync complete. 847 parameters refreshed. No new deviations since last sync. Combustor degradation trend persists.');
  }, 2000);
}

// ── Pilot Feedback ────────────────────────────────────────────────────────────
function clearForm() {
  ['pf-pilot','pf-flight','pf-alt','pf-desc'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.querySelectorAll('.pf-checklist input[type="checkbox"]').forEach(cb => { cb.checked = false; });
}

function submitFeedback(e) {
  e.preventDefault();

  const pilot  = document.getElementById('pf-pilot').value  || 'Unknown Pilot';
  const flight = document.getElementById('pf-flight').value || 'N/A';
  const eng    = document.getElementById('pf-eng').value;
  const sev    = document.getElementById('pf-sev').value;
  const desc   = document.getElementById('pf-desc').value   || 'No description provided.';
  const checks = Array.from(document.querySelectorAll('.pf-checklist input:checked'))
                      .map(cb => cb.parentElement.textContent.trim());

  const entries = document.getElementById('pilot-entries');
  const pe = document.createElement('div');
  const isCrit = sev.includes('Critical') || sev.includes('High');
  const isOk   = sev.includes('Low');
  const sevShort = sev.split('—')[0].trim();
  const sevClass = isCrit ? 'crit-pe' : isOk ? 'ok-pe' : '';
  const sevBadge = isCrit ? 'b-er' : isOk ? 'b-ok' : 'b-wn';

  const now = new Date();
  const pad = v => String(v).padStart(2, '0');
  const timeStr = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())} UTC`;

  pe.className = `pe ${sevClass}`;
  pe.innerHTML = `
    <div class="pe-head">
      <span class="pe-pilot">${pilot}</span>
      <span class="pe-time">${flight} · ${timeStr}</span>
    </div>
    <div class="pe-text">${desc}</div>
    <div class="pe-tags">
      <span class="pe-tag">${eng}</span>
      ${checks.map(c => `<span class="pe-tag">${c.toUpperCase()}</span>`).join('')}
      <span class="badge ${sevBadge}">${sevShort.toUpperCase()}</span>
    </div>
  `;

  entries.insertBefore(pe, entries.firstChild);
  clearForm();

  addAIMsg(
    `New pilot report logged from ${pilot} (${flight}). Severity: ${sevShort}. Engine: ${eng}. ` +
    (checks.length ? `Symptoms: ${checks.join(', ')}.` : '') +
    ` Report integrated into diagnostic model.`
  );
  nav('dashboard');
}

// ── MX Report ─────────────────────────────────────────────────────────────────
function genReport() {
  const el = document.getElementById('rep-time');
  if (!el) return;
  const now = new Date();
  const pad = v => String(v).padStart(2, '0');
  el.textContent = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())} UTC`;
}

function exportReport() {
  const date = new Date().toISOString().slice(0, 10);
  addAIMsg(`MX Report export initiated. PDF generated with all CV findings, FDR deviations, pilot reports, and priority action items. File: AERODIAG_N7742_ENG1_${date}.pdf`);
}
