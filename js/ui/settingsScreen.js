/**
 * settingsScreen.js — Settings
 */

async function renderSettings() {
  const theme = localStorage.getItem('habitapp_theme') || 'light';
  const habits = await Habits.listHabits();
  const session = Auth.getSession();

  return `
    <div class="topbar"><div><div class="eyebrow">Personalize</div><h1>Settings</h1></div></div>
    <div class="screen">
      <div class="card">
        <div class="card-row">
          <div>
            <div style="font-weight:700;">${Components.escapeHtml(session?.name || 'Account')}</div>
            <div style="font-size:12px;color:var(--text-muted);">Access ID: ${Components.escapeHtml(session?.accessId || '—')}</div>
          </div>
          <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(150deg,var(--horizon),var(--dawn));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">${(session?.name || '?')[0]}</div>
        </div>
      </div>

      <div class="section-title">Appearance</div>
      <div class="card">
        <div class="settings-row">
          <div><div class="s-label">Dark mode</div><div class="s-desc">Easier on the eyes at night</div></div>
          <button class="switch ${theme === 'dark' ? 'on' : ''}" id="themeSwitch" onclick="SettingsScreen.toggleTheme()"><div class="knob"></div></button>
        </div>
      </div>

      <div class="section-title">Habits</div>
      <div class="card">
        ${habits.map((h) => `
          <div class="habit-manage-row">
            <div class="h-icon">${h.icon}</div>
            <div style="flex:1;"><div class="h-name">${Components.escapeHtml(h.name)}</div><div class="h-meta">Tracking since ${Components.formatDate(h.createdAt.slice(0, 10))}</div></div>
            <button class="icon-btn" onclick="SettingsScreen.archiveHabit('${h.id}')">🗑️</button>
          </div>`).join('') || `<p style="font-size:13px;color:var(--text-muted);">No habits yet.</p>`}
        <button class="btn btn-secondary" style="margin-top:6px;" onclick="Components.openAddHabitSheet()">＋ Add habit</button>
      </div>

      <div class="section-title">Data</div>
      <div class="card">
        <div class="link-row" onclick="SettingsScreen.exportData()" role="button">Export data <span class="chev">↓</span></div>
        <div class="link-row" onclick="SettingsScreen.triggerImport()" role="button">Import data <span class="chev">↑</span></div>
        <div class="link-row" onclick="SettingsScreen.resetData()" role="button" style="color:var(--coral);">Reset all data <span class="chev">⚠️</span></div>
      </div>
      <input type="file" id="importFileInput" accept="application/json" class="hidden" onchange="SettingsScreen.handleImportFile(event)">

      <div class="section-title">Account</div>
      <div class="card">
        <div class="link-row" onclick="SettingsScreen.changePin()" role="button">Change Access ID / PIN <span class="chev">›</span></div>
        <div class="link-row" onclick="SettingsScreen.aboutModal()" role="button">About <span class="chev">›</span></div>
        <div class="link-row" onclick="SettingsScreen.privacyModal()" role="button">Privacy <span class="chev">›</span></div>
      </div>

      <button class="btn btn-secondary" style="margin-top:6px;" onclick="SettingsScreen.logout()">Log out</button>
    </div>`;
}

function toggleTheme() {
  const current = localStorage.getItem('habitapp_theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  document.getElementById('themeSwitch').classList.toggle('on', next === 'dark');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('habitapp_theme', theme);
}

function archiveHabit(id) {
  Components.confirmDialog('This habit will be archived and hidden from tracking. Its history is kept.', async () => {
    await Habits.archiveHabit(id);
    Components.showToast('Habit archived');
    await Router.renderRoute();
  });
}

async function exportData() {
  const data = await DB.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habit-recovery-export-${Habits.todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  Components.showToast('Data exported');
}

function triggerImport() {
  document.getElementById('importFileInput').click();
}

async function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    Components.confirmDialog('Importing will replace your current data with the contents of this file.', async () => {
      await DB.importAll(data);
      Components.showToast('Data imported');
      await Router.renderRoute();
    }, { danger: false });
  } catch (err) {
    Components.showToast('That file could not be read as a valid export');
  }
  event.target.value = '';
}

function resetData() {
  Components.confirmDialog('This permanently deletes all habits, check-ins, journal entries, triggers, goals, and achievements from this device. This cannot be undone.', async () => {
    await DB.resetAllData();
    Components.showToast('All data has been reset');
    Router.navigate('dashboard');
    await Router.renderRoute();
  });
}

function changePin() {
  const session = Auth.getSession();
  Components.openSheet(`
    <h3 style="margin-bottom:6px;">Access ID &amp; Password</h3>
    <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:16px;">Set your own login instead of the default admin account. Your current password is always required to confirm changes.</p>
    <div id="pinError" class="login-error hidden"></div>
    <div class="field"><label>New Access ID</label><input type="text" id="pinAccessId" placeholder="Choose your own Access ID" value="${Components.escapeHtml(session?.accessId || '')}"></div>
    <div class="field"><label>Current password</label><input type="password" id="pinCurrent" placeholder="Enter current password"></div>
    <div class="field"><label>New password <span style="font-weight:400;color:var(--text-muted);">(leave blank to keep it)</span></label><input type="password" id="pinNew" placeholder="At least 4 characters"></div>
    <div class="field"><label>Confirm new password</label><input type="password" id="pinConfirm" placeholder="Re-enter new password"></div>
    <button class="btn btn-primary" onclick="SettingsScreen.submitPinChange()">Save changes</button>
  `);
}

async function submitPinChange() {
  const newAccessId = document.getElementById('pinAccessId').value;
  const current = document.getElementById('pinCurrent').value;
  const next = document.getElementById('pinNew').value;
  const confirm = document.getElementById('pinConfirm').value;
  const errorEl = document.getElementById('pinError');
  errorEl.classList.add('hidden');

  if (next && next !== confirm) {
    errorEl.textContent = 'New password and confirmation do not match.';
    errorEl.classList.remove('hidden');
    return;
  }

  const session = Auth.getSession();
  const result = await Auth.updateAccount(session.userId, { currentPassword: current, newAccessId, newPassword: next });
  if (!result.ok) {
    errorEl.textContent = result.error;
    errorEl.classList.remove('hidden');
    return;
  }

  Components.closeSheet();
  Components.showToast('Account updated');
  await Router.renderRoute();
}

function aboutModal() {
  Components.openSheet(`
    <h3 style="margin-bottom:10px;">About</h3>
    <p style="font-size:13.5px;color:var(--text-muted);line-height:1.6;">Habit Recovery is a private, offline-first companion for quitting unwanted habits — track streaks, understand your triggers, and get support in the moment an urge hits. All your data stays on this device.</p>
  `, { center: true });
}

function privacyModal() {
  Components.openSheet(`
    <h3 style="margin-bottom:10px;">Privacy</h3>
    <p style="font-size:13.5px;color:var(--text-muted);line-height:1.6;">Nothing you enter ever leaves this device. There are no servers, analytics, or accounts in the cloud — everything is stored locally in your browser's IndexedDB. Use Export in Settings to back up your data yourself.</p>
  `, { center: true });
}

function logout() {
  Components.confirmDialog('You will need your Access ID and password to log back in.', () => {
    Auth.logout();
    location.hash = '';
    location.reload();
  }, { danger: false });
}

window.SettingsScreen = { renderSettings, toggleTheme, applyTheme, archiveHabit, exportData, triggerImport, handleImportFile, resetData, changePin, submitPinChange, aboutModal, privacyModal, logout };
                                                                                                                                                                        
