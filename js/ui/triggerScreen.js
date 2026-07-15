/**
 * triggerScreen.js — Trigger tracker
 */

const MOOD_OPTIONS = ['😊 Calm', '😐 Neutral', '😟 Anxious', '😡 Angry', '😢 Sad', '🥱 Bored', '😴 Tired'];

async function renderTriggers() {
  const habits = await Habits.listHabits();
  if (!habits.length) return `<div class="screen"><div class="empty-state"><div class="emoji">🎯</div><p>Add a habit first from the Dashboard.</p></div></div>`;
  const activeId = Habits.getSelectedHabitId() || habits[0].id;
  const entries = await Journal.listTriggersForHabit(activeId);
  const freq = await Journal.triggerFrequency(activeId);

  return `
    <div class="topbar"><div><div class="eyebrow">Understand yourself</div><h1>Trigger Tracker</h1></div>
      <button class="icon-btn" onclick="TriggerScreen.openEditor('${activeId}')">＋</button>
    </div>
    <div class="screen">
      ${await Components.renderHabitStrip(activeId)}

      <div class="card">
        <div class="card-title">Most common triggers</div>
        ${Components.renderBarChart(freq)}
      </div>

      <div class="section-title">Log</div>
      ${entries.length ? entries.map(triggerCard).join('') : `<div class="empty-state"><div class="emoji">🧭</div><p>No triggers logged yet.</p></div>`}
      <button class="btn btn-primary" onclick="TriggerScreen.openEditor('${activeId}')">＋ Log a trigger</button>
    </div>`;
}

function triggerCard(t) {
  const d = new Date(t.timestamp);
  return `
    <div class="entry">
      <div class="entry-head">
        <div>
          <div class="entry-title">${Components.escapeHtml(t.trigger || 'Unspecified trigger')}</div>
          <div class="entry-date">${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} ${t.mood ? '· ' + t.mood : ''}${t.location ? ' · ' + Components.escapeHtml(t.location) : ''}</div>
        </div>
      </div>
      ${t.notes ? `<div class="entry-body">${Components.escapeHtml(t.notes)}</div>` : ''}
      <div class="entry-actions"><button class="del" onclick="TriggerScreen.remove('${t.id}')">Delete</button></div>
    </div>`;
}

function openEditor(habitId) {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  Components.openSheet(`
    <h3 style="margin-bottom:16px;">Log a trigger</h3>
    <div class="field"><label>Time</label><input type="datetime-local" id="tTime" value="${localTime}"></div>
    <div class="field">
      <label>Mood</label>
      <div class="chip-row" id="tMoodPicker">
        ${MOOD_OPTIONS.map((m, i) => `<button type="button" class="chip ${i === 1 ? 'active' : ''}" onclick="TriggerScreen.pickMood(this)">${m}</button>`).join('')}
      </div>
    </div>
    <div class="field"><label>Trigger</label><input type="text" id="tTrigger" placeholder="e.g. Stress at work, Boredom, Social event"></div>
    <div class="field"><label>Location (optional)</label><input type="text" id="tLocation" placeholder="e.g. Home, Office, Car"></div>
    <div class="field"><label>Notes</label><textarea id="tNotes" placeholder="What led up to this?"></textarea></div>
    <button class="btn btn-primary" onclick="TriggerScreen.save('${habitId}')">Save trigger</button>
  `);
}

function pickMood(el) {
  el.parentElement.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
  el.classList.add('active');
}

async function save(habitId) {
  const timeVal = document.getElementById('tTime').value;
  const timestamp = timeVal ? new Date(timeVal).toISOString() : new Date().toISOString();
  const mood = document.getElementById('tMoodPicker').querySelector('.chip.active')?.textContent || '';
  const trigger = document.getElementById('tTrigger').value;
  const location = document.getElementById('tLocation').value;
  const notes = document.getElementById('tNotes').value;

  if (!trigger.trim()) { Components.showToast('Add a short trigger description'); return; }

  await Journal.saveTrigger({ habitId, timestamp, mood, trigger, location, notes });
  Components.closeSheet();
  Components.showToast('Trigger logged');
  await Router.renderRoute();
}

function remove(id) {
  Components.confirmDialog('This trigger entry will be permanently deleted.', async () => {
    await Journal.deleteTrigger(id);
    Components.showToast('Trigger deleted');
    await Router.renderRoute();
  });
}

window.TriggerScreen = { renderTriggers, openEditor, pickMood, save, remove };
