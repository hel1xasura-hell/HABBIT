/**
 * journalScreen.js — Journal list + editor
 */

async function renderJournal() {
  const entries = await Journal.listJournalEntries();
  return `
    <div class="topbar"><div><div class="eyebrow">Reflect</div><h1>Journal</h1></div>
      <button class="icon-btn" onclick="JournalScreen.openEditor()">＋</button>
    </div>
    <div class="screen">
      ${entries.length ? entries.map(entryCard).join('') : `
        <div class="empty-state"><div class="emoji">📓</div><p>No entries yet. Writing a few lines a day helps you notice patterns.</p></div>`}
      <button class="btn btn-primary" onclick="JournalScreen.openEditor()">＋ New entry</button>
    </div>`;
}

function entryCard(e) {
  return `
    <div class="entry">
      <div class="entry-head">
        <div><div class="entry-title">${Components.escapeHtml(e.title)}</div><div class="entry-date">${Components.formatDate(e.date)}</div></div>
      </div>
      ${e.notes ? `<div class="entry-body">${Components.escapeHtml(e.notes)}</div>` : ''}
      <div class="entry-actions">
        <button onclick="JournalScreen.openEditor('${e.id}')">Edit</button>
        <button class="del" onclick="JournalScreen.remove('${e.id}')">Delete</button>
      </div>
    </div>`;
}

async function openEditor(id) {
  let entry = { date: Habits.todayStr(), title: '', notes: '' };
  if (id) entry = (await Journal.listJournalEntries()).find((e) => e.id === id) || entry;

  Components.openSheet(`
    <h3 style="margin-bottom:16px;">${id ? 'Edit entry' : 'New journal entry'}</h3>
    <div class="field"><label>Date</label><input type="date" id="jDate" value="${entry.date}"></div>
    <div class="field"><label>Title</label><input type="text" id="jTitle" placeholder="Give it a short title" value="${Components.escapeHtml(entry.title)}"></div>
    <div class="field"><label>Notes</label><textarea id="jNotes" placeholder="What happened today? How did you handle it?">${Components.escapeHtml(entry.notes)}</textarea></div>
    <button class="btn btn-primary" onclick="JournalScreen.save('${id || ''}')">Save entry</button>
  `);
}

async function save(id) {
  const date = document.getElementById('jDate').value || Habits.todayStr();
  const title = document.getElementById('jTitle').value;
  const notes = document.getElementById('jNotes').value;
  await Journal.saveJournalEntry({ id: id || null, date, title, notes });
  Components.closeSheet();
  Components.showToast('Journal entry saved');
  await Router.renderRoute();
}

function remove(id) {
  Components.confirmDialog('This journal entry will be permanently deleted.', async () => {
    await Journal.deleteJournalEntry(id);
    Components.showToast('Entry deleted');
    await Router.renderRoute();
  });
}

window.JournalScreen = { renderJournal, openEditor, save, remove };
