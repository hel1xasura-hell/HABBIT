/**
 * statsScreen.js — Statistics
 */

async function renderStats() {
  const habits = await Habits.listHabits();
  if (!habits.length) return `<div class="screen"><div class="empty-state"><div class="emoji">🎯</div><p>Add a habit first from the Dashboard.</p></div></div>`;
  const activeId = Habits.getSelectedHabitId() || habits[0].id;
  const stats = await Habits.getHabitStats(activeId);
  const monthly = monthlyReport(stats.checkins);
  const completionRate = stats.total ? Math.round((stats.successDays / stats.total) * 100) : 0;

  return `
    <div class="topbar"><div><div class="eyebrow">The full picture</div><h1>Statistics</h1></div></div>
    <div class="screen">
      ${await Components.renderHabitStrip(activeId)}

      <div class="stat-grid">
        <div class="stat-tile"><div class="val">${stats.currentStreak}</div><div class="lbl">Current streak</div></div>
        <div class="stat-tile"><div class="val">${stats.longestStreak}</div><div class="lbl">Longest streak</div></div>
        <div class="stat-tile"><div class="val">${stats.relapses}</div><div class="lbl">Relapses</div></div>
        <div class="stat-tile"><div class="val">${stats.urgesResisted}</div><div class="lbl">Urges resisted</div></div>
        <div class="stat-tile"><div class="val">${stats.avgStreak}</div><div class="lbl">Average streak</div></div>
        <div class="stat-tile"><div class="val">${completionRate}%</div><div class="lbl">Completion rate</div></div>
      </div>

      <div class="card" style="margin-top:16px;">
        <div class="card-title">Monthly report (last 6 months)</div>
        ${monthly.length ? monthly.map((m) => `
          <div class="bar-row">
            <div class="bar-lbl">${m.label}</div>
            <div class="bar-track"><div class="bar-fill" style="width:${m.pct}%"></div></div>
            <div class="bar-count">${m.pct}%</div>
          </div>`).join('') : `<div class="empty-state"><div class="emoji">📈</div><p>Log check-ins to build your monthly report.</p></div>`}
      </div>

      <div class="card">
        <div class="card-title">Totals</div>
        <div class="link-row"><span>Total days tracked</span><span>${stats.total}</span></div>
        <div class="link-row"><span>Successful days</span><span style="color:var(--sage);">${stats.successDays}</span></div>
        <div class="link-row"><span>Relapse days</span><span style="color:var(--coral);">${stats.relapses}</span></div>
      </div>

      <div class="two-col">
        <button class="btn btn-secondary" onclick="Router.navigate('achievements')">🏅 Achievements</button>
        <button class="btn btn-secondary" onclick="Router.navigate('calendar')">📅 Calendar</button>
      </div>
    </div>`;
}

function monthlyReport(checkins) {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString(undefined, { month: 'short' });
    const inMonth = checkins.filter((c) => c.date.startsWith(key));
    const success = inMonth.filter((c) => c.status === 'success').length;
    const pct = inMonth.length ? Math.round((success / inMonth.length) * 100) : 0;
    months.push({ label, pct });
  }
  return months;
}

window.StatsScreen = { renderStats };
