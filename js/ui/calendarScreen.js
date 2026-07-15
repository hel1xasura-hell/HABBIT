/**
 * calendarScreen.js — Full calendar view
 */

let _calYear = null, _calMonth = null;

async function renderCalendarScreen() {
  const habits = await Habits.listHabits();
  if (!habits.length) return `<div class="screen"><div class="empty-state"><div class="emoji">🎯</div><p>Add a habit first from the Dashboard.</p></div></div>`;
  const activeId = Habits.getSelectedHabitId() || habits[0].id;

  const now = new Date();
  if (_calYear === null) { _calYear = now.getFullYear(); _calMonth = now.getMonth(); }

  const checkins = await Habits.getCheckinsForHabit(activeId);
  const checkinsByDate = new Map(checkins.map((c) => [c.date, c.status]));
  const gridHtml = Components.renderCalendarGrid(_calYear, _calMonth, checkinsByDate);

  return `
    <div class="topbar"><div><div class="eyebrow">Track record</div><h1>Calendar</h1></div></div>
    <div class="screen">
      ${await Components.renderHabitStrip(activeId)}
      <div class="card">
        <div class="cal-nav">
          <button class="icon-btn" onclick="CalendarScreen.shiftMonth(-1)">‹</button>
          <div class="month-lbl">${Components.monthLabel(_calYear, _calMonth)}</div>
          <button class="icon-btn" onclick="CalendarScreen.shiftMonth(1)">›</button>
        </div>
        ${gridHtml}
        <div style="display:flex;gap:16px;justify-content:center;margin-top:16px;font-size:11.5px;color:var(--text-muted);">
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--sage);margin-right:5px;"></span>Success</span>
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--coral);margin-right:5px;"></span>Relapse</span>
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--surface-alt);margin-right:5px;border:1px solid var(--border);"></span>No entry</span>
        </div>
      </div>
    </div>`;
}

function shiftMonth(delta) {
  _calMonth += delta;
  if (_calMonth < 0) { _calMonth = 11; _calYear--; }
  if (_calMonth > 11) { _calMonth = 0; _calYear++; }
  Router.renderRoute();
}

window.CalendarScreen = { renderCalendarScreen, shiftMonth };
