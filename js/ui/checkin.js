/**
 * checkin.js — Daily check-in screen
 */

const SLIDER_ICONS = { mood: '😊', energy: '⚡', stress: '😰', urgeLevel: '🔥' };

async function renderCheckin() {
  const habits = await Habits.listHabits();
  if (!habits.length) return `<div class="screen"><div class="empty-state"><div class="emoji">🎯</div><p>Add a habit first from the Dashboard.</p></div></div>`;

  const activeId = Habits.getSelectedHabitId() || habits[0].id;
  const today = Habits.todayStr();
  const existing = await Habits.getCheckinForDate(activeId, today);

  const v = existing || { status: 'success', mood: 3, energy: 3, stress: 3, urgeLevel: 2, sleepHours: 7, notes: '' };

  return `
    <div class="topbar"><div><div class="eyebrow">${Components.formatDate(today)}</div><h1>Daily Check-In</h1></div></div>
    <div class="screen">
      ${await Components.renderHabitStrip(activeId)}

      <div class="card">
        <div class="card-title">Today's status</div>
        <div class="segmented" id="statusSeg">
          <button type="button" class="${v.status === 'success' ? 'active' : ''}" data-val="success">✅ Stayed clean</button>
          <button type="button" class="${v.status === 'relapse' ? 'active' : ''}" data-val="relapse">⚠️ Had a relapse</button>
        </div>
      </div>

      <div class="card">
        ${slider('mood', 'Mood', 1, 5, v.mood)}
        ${slider('energy', 'Energy', 1, 5, v.energy)}
        ${slider('stress', 'Stress', 1, 5, v.stress)}
        ${slider('urgeLevel', 'Urge level', 1, 5, v.urgeLevel)}
        <div class="slider-group" style="margin-bottom:0;">
          <label>😴 Sleep hours <span class="slider-val" id="sleepHoursVal">${v.sleepHours}h</span></label>
          <input type="range" id="sleepHours" min="0" max="12" step="0.5" value="${v.sleepHours}"
            oninput="document.getElementById('sleepHoursVal').textContent = this.value + 'h'">
        </div>
      </div>

      <div class="card">
        <div class="field" style="margin-bottom:0;">
          <label>Notes</label>
          <textarea id="checkinNotes" placeholder="How are you feeling today? Anything worth remembering...">${Components.escapeHtml(v.notes)}</textarea>
        </div>
      </div>

      <button class="btn btn-primary" onclick="CheckinScreen.submit('${activeId}')">Save check-in</button>
    </div>`;
}

function slider(id, label, min, max, val) {
  return `
    <div class="slider-group">
      <label>${SLIDER_ICONS[id]} ${label} <span class="slider-val" id="${id}Val">${val}/${max}</span></label>
      <input type="range" id="${id}" min="${min}" max="${max}" step="1" value="${val}"
        oninput="document.getElementById('${id}Val').textContent = this.value + '/${max}'">
    </div>`;
}

function attachCheckinListeners() {
  document.querySelectorAll('#statusSeg button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#statusSeg button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

async function submit(habitId) {
  const status = document.querySelector('#statusSeg button.active').dataset.val;
  const mood = document.getElementById('mood').value;
  const energy = document.getElementById('energy').value;
  const stress = document.getElementById('stress').value;
  const urgeLevel = document.getElementById('urgeLevel').value;
  const sleepHours = document.getElementById('sleepHours').value;
  const notes = document.getElementById('checkinNotes').value;

  await Habits.saveCheckin({ habitId, status, mood, energy, stress, urgeLevel, sleepHours, notes });
  await Habits.refreshGoalProgress(habitId);
  Components.showToast(status === 'success' ? 'Nice work — logged as a clean day 🌅' : 'Logged. Tomorrow is a new chance.');
  Router.navigate('dashboard');
}

window.CheckinScreen = { renderCheckin, attachCheckinListeners, submit };
