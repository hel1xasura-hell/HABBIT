/**
 * dashboard.js — Home screen
 */

function nextMilestone(streak) {
  return Habits.MILESTONES.find((m) => m > streak) || Habits.MILESTONES[Habits.MILESTONES.length - 1];
}

async function renderDashboard() {
  const habits = await Habits.listHabits();
  if (!habits.length) {
    return `
      <div class="topbar"><div><div class="eyebrow">Welcome</div><h1>Let's begin</h1></div></div>
      <div class="screen">
        <div class="card empty-state">
          <div class="emoji">🌅</div>
          <h3 style="margin-bottom:8px;">Start your recovery journey</h3>
          <p style="margin-bottom:18px;">Add the habit you're working on to unlock streak tracking, check-ins, and support tools.</p>
          <button class="btn btn-primary" onclick="Components.openAddHabitSheet()">+ Add a habit</button>
        </div>
      </div>`;
  }

  let activeId = Habits.getSelectedHabitId();
  if (!activeId || !habits.find((h) => h.id === activeId)) {
    activeId = habits[0].id;
    Habits.setSelectedHabitId(activeId);
  }
  const habit = habits.find((h) => h.id === activeId);
  const stats = await Habits.getHabitStats(activeId);
  const next = nextMilestone(stats.currentStreak);
  const progressPct = Math.min(100, (stats.currentStreak / next) * 100);

  const now = new Date();
  const checkins = stats.checkins;
  const checkinsByDate = new Map(checkins.map((c) => [c.date, c.status]));

  // weekly progress: last 7 days
  let weekSuccess = 0, weekLogged = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (checkinsByDate.has(key)) { weekLogged++; if (checkinsByDate.get(key) === 'success') weekSuccess++; }
  }
  const weekPct = weekLogged ? Math.round((weekSuccess / weekLogged) * 100) : 0;

  // monthly progress: current calendar month
  const monthChecks = checkins.filter((c) => c.date.startsWith(now.toISOString().slice(0, 7)));
  const monthSuccess = monthChecks.filter((c) => c.status === 'success').length;
  const monthPct = monthChecks.length ? Math.round((monthSuccess / monthChecks.length) * 100) : 0;

  const calHtml = Components.renderCalendarGrid(now.getFullYear(), now.getMonth(), checkinsByDate);
  const message = dashboardMessage(stats.currentStreak);

  return `
    <div class="topbar">
      <div><div class="eyebrow">${Components.formatDate(Habits.todayStr())}</div><h1>Dashboard</h1></div>
      <button class="icon-btn" onclick="Router.navigate('settings')">⚙️</button>
    </div>
    <div class="screen">
      ${await Components.renderHabitStrip(activeId)}

      <div class="card grad-card" style="text-align:center;">
        <div style="font-weight:700;font-size:14px;opacity:.9;margin-bottom:4px;">${habit.icon} ${Components.escapeHtml(habit.name)}</div>
        ${Components.sunriseRing({ value: stats.currentStreak, label: stats.currentStreak === 1 ? 'day streak' : 'days streak', progressPct })}
        <div style="font-size:12px;opacity:.9;">${stats.currentStreak >= next ? 'Milestone reached!' : `${next - stats.currentStreak} days to ${Habits.MILESTONE_LABELS[next]}`}</div>
      </div>

      <div class="motivation-banner"><span style="font-size:20px;">💬</span><span>${message}</span></div>

      <div class="stat-grid" style="margin-bottom:16px;">
        <div class="stat-tile"><div class="val">${stats.longestStreak}</div><div class="lbl">Longest streak</div></div>
        <div class="stat-tile"><div class="val">${stats.successDays}</div><div class="lbl">Successful days</div></div>
        <div class="stat-tile"><div class="val">${stats.successPct}%</div><div class="lbl">Success rate</div></div>
        <div class="stat-tile"><div class="val">${stats.urgesResisted}</div><div class="lbl">Urges resisted</div></div>
      </div>

      <div class="card">
        <div class="card-title">This week</div>
        <div class="pbar"><div style="width:${weekPct}%"></div></div>
        <div class="card-row" style="margin-top:8px;"><span style="font-size:12px;color:var(--text-muted);">${weekSuccess}/${weekLogged || 0} logged days on track</span><span style="font-size:12px;font-weight:700;">${weekPct}%</span></div>
      </div>

      <div class="card">
        <div class="card-title">This month</div>
        <div class="pbar"><div style="width:${monthPct}%"></div></div>
        <div class="card-row" style="margin-top:8px;"><span style="font-size:12px;color:var(--text-muted);">${monthSuccess}/${monthChecks.length || 0} logged days on track</span><span style="font-size:12px;font-weight:700;">${monthPct}%</span></div>
      </div>

      <div class="card">
        <div class="card-row" style="margin-bottom:12px;">
          <div class="card-title" style="margin-bottom:0;">${Components.monthLabel(now.getFullYear(), now.getMonth())}</div>
          <button class="btn-ghost" style="font-size:12px;font-weight:700;color:var(--accent);" onclick="Router.navigate('calendar')">Full view →</button>
        </div>
        ${calHtml}
      </div>

      <div class="two-col">
        <button class="btn btn-secondary" onclick="Router.navigate('checkin')">📝 Check in</button>
        <button class="btn btn-secondary" onclick="Router.navigate('goals')">🎯 Goals</button>
      </div>
    </div>`;
}

function dashboardMessage(streak) {
  if (streak === 0) return 'Today is a fresh start. One clean day builds the next.';
  if (streak < 3) return 'The first days are the hardest — you\'re already past the beginning.';
  if (streak < 7) return 'Momentum is building. Your body and mind are adjusting.';
  if (streak < 30) return 'A full week+ clean. This is becoming who you are.';
  if (streak < 90) return 'This is real, lasting change. Keep showing up for yourself.';
  return 'You have built something remarkable. Stay proud, stay steady.';
}

window.DashboardScreen = { renderDashboard };
