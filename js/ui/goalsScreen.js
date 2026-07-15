/**
 * goalsScreen.js — Custom goals
 */

const PRESET_GOALS = [7, 30, 90, 180, 365];

async function renderGoals() {
  const habits = await Habits.listHabits();
  if (!habits.length) return `<div class="screen"><div class="empty-state"><div class="emoji">🎯</div><p>Add a habit first from the Dashboard.</p></div></div>`;
  const activeId = Habits.getSelectedHabitId() || habits[0].id;
  const { goals, currentStreak } = await Habits.refreshGoalProgress(activeId);

  return `
    <div class="topbar"><div><div class="eyebrow">Aim for it</div><h1>Goals</h1></div>
      <button class="icon-btn" onclick="GoalsScreen.openEditor('${activeId}')">＋</button>
    </div>
    <div class="screen">
      ${await Components.renderHabitStrip(activeId)}

      <div class="card" style="text-align:center;">
        <div class="card-title">Current streak</div>
        <div class="ring-number" style="font-size:36px;">${currentStreak}</div>
        <div style="font-size:12px;color:var(--text-muted);">days and counting</div>
      </div>

      <div class="section-title">Your goals</div>
      ${goals.length ? goals.map((g) => goalCard(g, currentStreak)).join('') : `
        <div class="empty-state"><div class="emoji">🏁</div><p>Set a target — 7, 30, 90, 180 or 365 days — to stay focused.</p></div>`}
      <button class="btn btn-primary" onclick="GoalsScreen.openEditor('${activeId}')">＋ Add a goal</button>
    </div>`;
}

function goalCard(g, currentStreak) {
  const pct = Math.min(100, Math.round((currentStreak / g.targetDays) * 100));
  return `
    <div class="card goal-card">
      <div class="g-info">
        <div class="g-days">${g.targetDays} Days</div>
        <div class="g-status">${g.achieved ? '🏆 Achieved!' : `${Math.max(0, g.targetDays - currentStreak)} days to go`}</div>
        <div class="pbar" style="margin-top:10px;width:180px;"><div style="width:${pct}%"></div></div>
      </div>
      <button class="icon-btn" onclick="GoalsScreen.remove('${g.id}')">🗑️</button>
    </div>`;
}

function openEditor(habitId) {
  Components.openSheet(`
    <h3 style="margin-bottom:16px;">New goal</h3>
    <div class="field">
      <label>Choose a target</label>
      <div class="chip-row" id="goalPreset">
        ${PRESET_GOALS.map((d, i) => `<button type="button" class="chip ${i === 0 ? 'active' : ''}" data-days="${d}" onclick="GoalsScreen.pickPreset(this)">${d} Days</button>`).join('')}
      </div>
    </div>
    <div class="field"><label>Or enter a custom number of days</label><input type="number" id="goalCustom" min="1" placeholder="e.g. 45"></div>
    <button class="btn btn-primary" onclick="GoalsScreen.save('${habitId}')">Create goal</button>
  `);
}

function pickPreset(el) {
  el.parentElement.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('goalCustom').value = '';
}

async function save(habitId) {
  const custom = document.getElementById('goalCustom').value;
  const preset = document.getElementById('goalPreset').querySelector('.chip.active')?.dataset.days;
  const targetDays = custom ? Number(custom) : Number(preset);
  if (!targetDays || targetDays < 1) { Components.showToast('Enter a valid number of days'); return; }

  await Habits.createGoal(habitId, targetDays);
  Components.closeSheet();
  Components.showToast('Goal created');
  await Router.renderRoute();
}

function remove(id) {
  Components.confirmDialog('This goal will be removed.', async () => {
    await Habits.deleteGoal(id);
    Components.showToast('Goal removed');
    await Router.renderRoute();
  });
}

window.GoalsScreen = { renderGoals, openEditor, pickPreset, save, remove };
