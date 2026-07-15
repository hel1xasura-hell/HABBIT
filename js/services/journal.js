/**
 * journal.js — Journal + Trigger tracker logic (pure data layer)
 */

/* -------------------------------- Journal -------------------------------- */

async function listJournalEntries() {
  const rows = await DB.getAll('journal');
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function saveJournalEntry({ id, date, title, notes }) {
  const record = {
    id: id || DB.makeId('journal'),
    date: date || Habits.todayStr(),
    title: (title || '').trim() || 'Untitled entry',
    notes: notes || '',
    createdAt: id ? undefined : new Date().toISOString(),
  };
  if (id) {
    const existing = await DB.get('journal', id);
    record.createdAt = existing ? existing.createdAt : new Date().toISOString();
  }
  await DB.put('journal', record);
  return record;
}

async function deleteJournalEntry(id) {
  return DB.remove('journal', id);
}

/* -------------------------------- Triggers -------------------------------- */

async function listTriggersForHabit(habitId) {
  const rows = await DB.query('triggers', 'habitId', habitId);
  return rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

async function saveTrigger({ habitId, timestamp, mood, trigger, location, notes }) {
  const record = {
    id: DB.makeId('trigger'),
    habitId,
    timestamp: timestamp || new Date().toISOString(),
    mood,
    trigger: (trigger || '').trim(),
    location: (location || '').trim(),
    notes: notes || '',
  };
  await DB.put('triggers', record);
  return record;
}

async function deleteTrigger(id) {
  return DB.remove('triggers', id);
}

/** Aggregate trigger frequency for a simple bar chart: [{label, count}] sorted desc. */
async function triggerFrequency(habitId) {
  const rows = await listTriggersForHabit(habitId);
  const counts = {};
  rows.forEach((r) => {
    const key = r.trigger || 'Unspecified';
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

window.Journal = { listJournalEntries, saveJournalEntry, deleteJournalEntry, listTriggersForHabit, saveTrigger, deleteTrigger, triggerFrequency };
    
