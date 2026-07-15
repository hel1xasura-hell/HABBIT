/**
 * components.js — Reusable render helpers shared across screens.
 * Every function here either returns an HTML string or manipulates a
 * small, self-contained piece of the DOM (toast/sheet). No routing or
 * business logic lives here.
 */

/* ------------------------------- Toast -------------------------------- */
function showToast(message, duration = 2200) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

/* --------------------------- Bottom sheet ------------------------------ */
function openSheet(innerHtml, { center = false } = {}) {
  closeSheet();
  const overlay = document.createElement('div');
  overlay.className = 'overlay' + (center ? ' center' : '');
  overlay.id = 'activeOverlay';
  overlay.innerHTML = `
    <div class="sheet">
      ${center ? '' : '<div class="sheet-handle"></div>'}
      <button class="icon-btn sheet-close" aria-label="Close" onclick="Components.closeSheet()">✕</button>
      ${innerHtml}
    </div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSheet(); });
  document.body.appendChild(overlay);
}
function closeSheet() {
  document.getElementById('activeOverlay')?.remove();
}

/* ---------------------------- Confirm dialog ---------------------------- */
function confirmDialog(message, onConfirm, { danger = true } = {}) {
  openSheet(`
    <h3 style="margin-bottom:10px;">Are you sure?</h3>
    <p style="color:var(--text-muted);font-size:13.5px;margin-bottom:20px;">${message}</p>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-secondary" onclick="Components.closeSheet()">Cancel</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirmBtn">Confirm</button>
    </div>
  `, { center: true });
  document.getElementById('confirmBtn').onclick = () => { closeSheet(); onConfirm(); };
}

/* --------------------------- Sunrise Ring -------------------------------
 * Signature visual: an SVG ring whose fill sweeps from horizon-teal to
 * dawn-gold, proportional to progress toward the next milestone.
 * ------------------------------------------------------------------- */
function sunriseRing({ value, label, progressPct }) {
  const r = 74, c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, progressPct)) / 100) * c;
  return `
    <div class="ring-wrap">
      <svg viewBox="0 0 168 168">
        <defs>
          <linearGradient id="sunriseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="var(--horizon)"/>
            <stop offset="100%" stop-color="var(--dawn)"/>
          </linearGradient>
        </defs>
        <circle class="ring-track" cx="84" cy="84" r="${r}"/>
        <circle class="ring-progress" cx="84" cy="84" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>
      </svg>
      <div class="ring-center">
        <div class="ring-number">${value}</div>
        <div class="ring-label">${label}</div>
      </div>
    </div>`;
}

/* ------------------------------ Calendar -------------------------------- */
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function renderCalendarGrid(year, month, checkinsByDate) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = Habits.todayStr();

  let cells = '';
  for (let i = 0; i < startPad; i++) cells += `<div class="cal-day empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const status = checkinsByDate.get(key);
    const cls = status === 'success' ? 'success' : status === 'relapse' ? 'relapse' : '';
    const todayCls = key === todayKey ? 'today' : '';
    cells += `<div class="cal-day ${cls} ${todayCls}">${d}</div>`;
  }

  return `
    <div class="cal-grid" style="margin-bottom:2px;">
      ${DOW.map((d) => `<div class="cal-dow">${d}</div>`).join('')}
    </div>
    <div class="cal-grid">${cells}</div>`;
}

function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/* ----------------------------- Bar chart --------------------------------- */
function renderBarChart(data) {
  if (!data.length) return `<div class="empty-state"><div class="emoji">📊</div><p>No data yet — log a few trigger entries to see patterns here.</p></div>`;
  const max = Math.max(...data.map((d) => d.count), 1);
  return data.map((d) => `
    <div class="bar-row">
      <div class="bar-lbl">${d.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(d.count / max) * 100}%"></div></div>
      <div class="bar-count">${d.count}</div>
    </div>`).join('');
}

/* --------------------------- Habit selector strip ------------------------- */
async function renderHabitStrip(activeHabitId, onSelectRouteName) {
  const habits = await Habits.listHabits();
  if (!habits.length) return '';
  return `<div class="habit-strip">
    ${habits.map((h) => `
      <button class="habit-chip ${h.id === activeHabitId ? 'active' : ''}" data-habit-id="${h.id}" onclick="Components.selectHabitAndRerender('${h.id}')">
        <span>${h.icon}</span><span>${escapeHtml(h.name)}</span>
      </button>`).join('')}
    <button class="habit-chip" onclick="Components.openAddHabitSheet()">+ Add</button>
  </div>`;
}

async function selectHabitAndRerender(habitId) {
  Habits.setSelectedHabitId(habitId);
  await Router.renderRoute();
}

function openAddHabitSheet() {
  openSheet(`
    <h3 style="margin-bottom:16px;">New habit</h3>
    <div class="field">
      <label>What are you quitting or building?</label>
      <input id="newHabitName" type="text" placeholder="e.g. Smoking, Nail biting, Junk food" maxlength="40" />
    </div>
    <div class="field">
      <label>Icon</label>
      <div class="chip-row" id="iconPicker">
        ${['🎯','🚭','🍺','📱','🍔','🎲','💊','🛌','🧠','✂️','🧃','🕹️'].map((i, idx) => `<button type="button" class="chip ${idx === 0 ? 'active' : ''}" data-icon="${i}" onclick="Components.pickIcon(this)">${i}</button>`).join('')}
      </div>
    </div>
    <button class="btn btn-primary" style="margin-top:8px;" onclick="Components.submitNewHabit()">Create habit</button>
  `);
  setTimeout(() => document.getElementById('newHabitName')?.focus(), 100);
}

function pickIcon(el) {
  el.parentElement.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
  el.classList.add('active');
}

async function submitNewHabit() {
  const name = document.getElementById('newHabitName').value.trim();
  if (!name) { showToast('Give your habit a name first'); return; }
  const icon = document.getElementById('iconPicker').querySelector('.chip.active')?.dataset.icon || '🎯';
  const habit = await Habits.createHabit({ name, icon });
  Habits.setSelectedHabitId(habit.id);
  closeSheet();
  showToast(`"${habit.name}" added`);
  await Router.renderRoute();
}

/* -------------------------------- Utils ---------------------------------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

window.Components = {
  showToast, openSheet, closeSheet, confirmDialog,
  sunriseRing, renderCalendarGrid, monthLabel, renderBarChart,
  renderHabitStrip, selectHabitAndRerender, openAddHabitSheet, pickIcon, submitNewHabit,
  escapeHtml, formatDate, timeAgo,
};
