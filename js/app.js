/**
 * app.js — Bootstraps the application shell (index.html only).
 * Responsibilities: guard the route behind login, restore theme,
 * register every screen with the router, wire the bottom nav + FAB.
 */

const NAV_ITEMS = [
  { name: 'dashboard', icon: '🏠', label: 'Home' },
  { name: 'journal', icon: '📓', label: 'Journal' },
  { name: 'triggers', icon: '🧭', label: 'Triggers' },
  { name: 'stats', icon: '📊', label: 'Stats' },
  { name: 'settings', icon: '⚙️', label: 'Settings' },
];

async function boot() {
  // ---- Auth guard ----
  await DB.openDB();
  await Auth.ensureSeedUser();
  if (!Auth.isLoggedIn()) {
    location.href = 'login.html';
    return;
  }

  // ---- Theme ----
  const theme = localStorage.getItem('habitapp_theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);

  // ---- Shell ----
  document.getElementById('app').innerHTML = `
    <div id="screen-mount"></div>
    <button class="fab-urge" id="urgeFab" onclick="Router.navigate('urge')">🆘 I Have an Urge</button>
    <nav class="bottom-nav">
      ${NAV_ITEMS.map((n) => `
        <button class="nav-item" data-route="${n.name}" onclick="Router.navigate('${n.name}')">
          <span class="nav-icon">${n.icon}</span><span>${n.label}</span>
        </button>`).join('')}
    </nav>
  `;

  // ---- Routes ----
  Router.registerRoute('dashboard', DashboardScreen.renderDashboard);
  Router.registerRoute('checkin', CheckinScreen.renderCheckin, CheckinScreen.attachCheckinListeners);
  Router.registerRoute('urge', UrgeScreen.renderUrge, UrgeScreen.enterUrge);
  Router.registerRoute('journal', JournalScreen.renderJournal);
  Router.registerRoute('triggers', TriggerScreen.renderTriggers);
  Router.registerRoute('goals', GoalsScreen.renderGoals);
  Router.registerRoute('achievements', AchievementsScreen.renderAchievements);
  Router.registerRoute('stats', StatsScreen.renderStats);
  Router.registerRoute('calendar', CalendarScreen.renderCalendarScreen);
  Router.registerRoute('settings', SettingsScreen.renderSettings);

  await Router.renderRoute();

  // Register service worker for offline support / installability.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', boot);
