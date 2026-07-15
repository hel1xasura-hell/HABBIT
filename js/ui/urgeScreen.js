/**
 * urgeScreen.js — "I Have an Urge" emergency support screen
 */

let _breatheInterval = null;
let _meditateInterval = null;
let _breatheSeconds = 300; // 5 minutes
let _meditateSeconds = 120; // 2 minutes
let _urgeStartedAt = null;

function fmtTime(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

async function renderUrge() {
  const habits = await Habits.listHabits();
  const activeId = Habits.getSelectedHabitId() || habits[0]?.id;
  _breatheSeconds = 300;
  _meditateSeconds = 120;
  _urgeStartedAt = Date.now();
  const distractions = Urge.randomDistractions(4);

  return `
    <div class="topbar">
      <div><div class="eyebrow">You've got this</div><h1>Ride the Urge Out</h1></div>
      <button class="icon-btn" onclick="Router.navigate('dashboard')">✕</button>
    </div>
    <div class="screen">
      <div class="motivation-banner" id="urgeMessage"><span style="font-size:20px;">💬</span><span>${Urge.randomMessage()}</span></div>

      <div class="card" style="text-align:center;">
        <div class="card-title">5-minute breathing timer</div>
        <div class="breathe-wrap">
          <div class="breathe-circle" id="breatheCircle">Breathe</div>
          <div class="breathe-timer" id="breatheTimer">${fmtTime(_breatheSeconds)}</div>
        </div>
        <div class="two-col">
          <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="UrgeScreen.toggleBreathe()" id="breatheBtn">Start</button>
          <button class="btn btn-ghost btn-sm" style="width:100%;" onclick="UrgeScreen.resetBreathe()">Reset</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Meditation timer</div>
        <div class="card-row">
          <div>
            <div class="ring-number" style="font-size:28px;" id="meditateTimer">${fmtTime(_meditateSeconds)}</div>
            <div style="font-size:12px;color:var(--text-muted);">Sit quietly. Focus on your breath.</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="UrgeScreen.toggleMeditate()" id="meditateBtn">Start</button>
        </div>
      </div>

      <div class="section-title">Try one of these right now</div>
      <div class="urge-tools">
        <div class="tool-item"><span class="t-icon">💧</span><span class="t-text">Drink a full glass of water, slowly</span></div>
        <div class="tool-item"><span class="t-icon">🚶</span><span class="t-text">Go for a brisk walk — even just around the block</span></div>
        <div class="tool-item"><span class="t-icon">🤸</span><span class="t-text">Do a quick burst of exercise: jumping jacks, stretching, push-ups</span></div>
        ${distractions.map((d) => `<div class="tool-item"><span class="t-icon">${d.icon}</span><span class="t-text">${d.text}</span></div>`).join('')}
      </div>

      <div class="card" style="margin-top:20px;text-align:center;">
        <div class="card-title">When you're ready</div>
        <p style="font-size:14px;font-weight:600;margin-bottom:14px;">Did the urge pass?</p>
        <div class="two-col">
          <button class="btn btn-primary" onclick="UrgeScreen.resolve('${activeId}', 'yes')">✅ Yes, it passed</button>
          <button class="btn btn-danger" onclick="UrgeScreen.resolve('${activeId}', 'no')">Not yet / I slipped</button>
        </div>
      </div>
    </div>`;
}

function enterUrge() {
  clearAllTimers();
}

function clearAllTimers() {
  clearInterval(_breatheInterval); _breatheInterval = null;
  clearInterval(_meditateInterval); _meditateInterval = null;
}

function toggleBreathe() {
  const btn = document.getElementById('breatheBtn');
  const circle = document.getElementById('breatheCircle');
  if (_breatheInterval) {
    clearInterval(_breatheInterval); _breatheInterval = null;
    btn.textContent = 'Resume';
    circle.style.animationPlayState = 'paused';
    return;
  }
  btn.textContent = 'Pause';
  circle.style.animationPlayState = 'running';
  _breatheInterval = setInterval(() => {
    _breatheSeconds--;
    const timerEl = document.getElementById('breatheTimer');
    if (timerEl) timerEl.textContent = fmtTime(Math.max(0, _breatheSeconds));
    if (_breatheSeconds <= 0) {
      clearInterval(_breatheInterval); _breatheInterval = null;
      btn.textContent = 'Start';
      Components.showToast('Breathing session complete 🌬️');
      _breatheSeconds = 300;
    }
  }, 1000);
}

function resetBreathe() {
  clearInterval(_breatheInterval); _breatheInterval = null;
  _breatheSeconds = 300;
  document.getElementById('breatheTimer').textContent = fmtTime(_breatheSeconds);
  document.getElementById('breatheBtn').textContent = 'Start';
}

function toggleMeditate() {
  const btn = document.getElementById('meditateBtn');
  if (_meditateInterval) {
    clearInterval(_meditateInterval); _meditateInterval = null;
    btn.textContent = 'Resume';
    return;
  }
  btn.textContent = 'Pause';
  _meditateInterval = setInterval(() => {
    _meditateSeconds--;
    const timerEl = document.getElementById('meditateTimer');
    if (timerEl) timerEl.textContent = fmtTime(Math.max(0, _meditateSeconds));
    if (_meditateSeconds <= 0) {
      clearInterval(_meditateInterval); _meditateInterval = null;
      btn.textContent = 'Start';
      Components.showToast('Meditation complete 🧘');
      _meditateSeconds = 120;
    }
  }, 1000);
}

async function resolve(habitId, resolved) {
  clearAllTimers();
  const durationSeconds = Math.round((Date.now() - _urgeStartedAt) / 1000);
  await Urge.logUrge({ habitId, resolved, durationSeconds });

  if (resolved === 'yes') {
    Components.showToast('That took real strength. Logged 💪');
    Router.navigate('dashboard');
  } else {
    Components.showToast('Thank you for being honest. Let\'s log today\'s check-in.');
    Router.navigate('checkin');
  }
}

window.UrgeScreen = { renderUrge, enterUrge, toggleBreathe, resetBreathe, toggleMeditate, resolve };
