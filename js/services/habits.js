/**
 * habits.js — Habit / check-in / streak / goal / achievement logic
 * ------------------------------------------------------------------------
 * Pure business logic — no DOM access here. UI modules call these
 * functions and render whatever they return. Keeping logic separate
 * from rendering is what makes this portable to React Native / Flutter
 * later: this whole file can move as-is, only the UI layer changes.
 * ------------------------------------------------------------------------
 */

const MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365];
const MILESTONE_LABELS = { 1: '1 Day', 3: '3 Days', 7: '7 Days', 14: '14 Days', 30: '30 Days', 60: '60 Days', 90: '90 Days', 180: '180 Days', 365: '365 Days' };
const MILESTONE_ICONS = { 1: '🌱', 3: '🔆', 7: '☀️', 14: '🌤️', 30: '🌅', 60: '🌈', 90: '⭐', 180: '🏆', 365: '👑' };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

/* ------------------------------ Habits ------------------------------ */

async function listHabits({ activeOnly = true } = {}) {
  const all = await DB.getAll('habits');
  const filtered = activeOnly ? all.filter((h) => h.active !== false) : all;
  return filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

async function createHabit({ name, icon = '🎯', category = 'Other' }) {
  const habit = {
    id: DB.makeId('habit'),
    name: name.trim(),
    icon,
    category,
    active: true,
    createdAt: new Date().toISOString(),
  };
  await DB.put('habits', habit);
  return habit;
}

async function updateHabit(habit) {
  return DB.put('habits', habit);
}

async function archiveHabit(habitId) {
  const habit = await DB.get('habits', habitId);
  if (!habit) return;
  habit.active = false;
  await DB.put('habits', habit);
}

/** Returns the current "selected habit" id, persisted in localStorage. */
function getSelectedHabitId() {
  return localStorage.getItem('habitapp_selected_habit');
}
function setSelectedHabitId(id) {
  localStorage.setItem('habitapp_selected_habit', id);
}

/* ----------------------------- Check-ins ----------------------------- */

async function getCheckinsForHabit(habitId) {
  const rows = await DB.query('checkins', 'habitId', habitId);
  return rows.sort((a, b) => (a.date < b.date ? -1 : 1));
}

async function getCheckinForDate(habitId, date) {
  const rows = await getCheckinsForHabit(habitId);
  return rows.find((r) => r.date === date) || null;
}

/**
 * Save (create or overwrite) today's — or any date's — check-in.
 * status: 'success' | 'relapse'
 */
async function saveCheckin({ habitId, date = todayStr(), status, mood, energy, stress, urgeLevel, sleepHours, notes }) {
  const existing = await getCheckinForDate(habitId, date);
  const record = {
    id: existing ? existing.id : DB.makeId('checkin'),
    habitId,
    date,
    status,
    mood: Number(mood),
    energy: Number(energy),
    stress: Number(stress),
    urgeLevel: Number(urgeLevel),
    sleepHours: Number(sleepHours),
    notes: notes || '',
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
  };
  await DB.put('checkins', record);
  await checkAndUnlockAchievements(habitId);
  return record;
}

/* ------------------------------ Streaks ------------------------------ */

/** Current streak = consecutive 'success' days ending today (or yesterday if today isn't logged yet). */
function currentStreakFromCheckins(checkins) {
  const map = new Map(checkins.map((c) => [c.date, c.status]));
  let streak = 0;
  let cursor = new Date();
  // If today has no entry yet, start counting from yesterday so the streak isn't falsely broken mid-day.
  if (!map.has(todayStr())) cursor.setDate(cursor.getDate() - 1);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    const status = map.get(key);
    if (status === 'success') {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/** Longest streak ever achieved, scanning full check-in history. */
function longestStreakFromCheckins(checkins) {
  const sorted = [...checkins].sort((a, b) => (a.date < b.date ? -1 : 1));
  let longest = 0, run = 0, prevDate = null;
  for (const c of sorted) {
    if (c.status === 'success') {
      if (prevDate && daysBetween(prevDate, c.date) === 1) run++;
      else run = 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
    prevDate = c.date;
  }
  return longest;
}

async function getHabitStats(habitId) {
  const checkins = await getCheckinsForHabit(habitId);
  const successDays = checkins.filter((c) => c.status === 'success').length;
  const relapses = checkins.filter((c) => c.status === 'relapse').length;
  const total = checkins.length;
  const urges = await DB.query('urges', 'habitId', habitId);
  const urgesResisted = urges.filter((u) => u.resolved === 'yes').length;

  const currentStreak = currentStreakFromCheckins(checkins);
  const longestStreak = Math.max(longestStreakFromCheckins(checkins), currentStreak);
  const successPct = total > 0 ? Math.round((successDays / total) * 100) : 0;

  // average streak length across all completed streak runs (segments between relapses)
  const sorted = [...checkins].sort((a, b) => (a.date < b.date ? -1 : 1));
  const runs = [];
  let run = 0, prevDate = null;
  for (const c of sorted) {
    if (c.status === 'success') {
      if (prevDate && daysBetween(prevDate, c.date) === 1) run++;
      else run = 1;
    } else {
      if (run > 0) runs.push(run);
      run = 0;
    }
    prevDate = c.date;
  }
  if (run > 0) runs.push(run);
  const avgStreak = runs.length ? Math.round((runs.reduce((a, b) => a + b, 0) / runs.length) * 10) / 10 : 0;

  return { currentStreak, longestStreak, successDays, relapses, total, successPct, urgesResisted, avgStreak, checkins };
}

/* ------------------------------- Goals ------------------------------- */

async function getGoalsForHabit(habitId) {
  const rows = await DB.query('goals', 'habitId', habitId);
  return rows.sort((a, b) => a.targetDays - b.targetDays);
}

async function createGoal(habitId, targetDays) {
  const goal = { id: DB.makeId('goal'), habitId, targetDays: Number(targetDays), createdAt: new Date().toISOString(), achieved: false };
  await DB.put('goals', goal);
  return goal;
}

async function deleteGoal(goalId) {
  return DB.remove('goals', goalId);
}

async function refreshGoalProgress(habitId) {
  const { currentStreak } = await getHabitStats(habitId);
  const goals = await getGoalsForHabit(habitId);
  for (const g of goals) {
    const achieved = currentStreak >= g.targetDays;
    if (achieved !== g.achieved) {
      g.achieved = achieved;
      await DB.put('goals', g);
    }
  }
  return { goals, currentStreak };
}

/* --------------------------- Achievements ---------------------------- */

async function getAchievementsForHabit(habitId) {
  return DB.query('achievements', 'habitId', habitId);
}

/** Checks the habit's longest streak against milestone thresholds and persists any newly-unlocked badges. */
async function checkAndUnlockAchievements(habitId) {
  const { longestStreak } = await getHabitStats(habitId);
  const unlocked = await getAchievementsForHabit(habitId);
  const unlockedSet = new Set(unlocked.map((a) => a.milestone));
  const newlyUnlocked = [];

  for (const m of MILESTONES) {
    if (longestStreak >= m && !unlockedSet.has(m)) {
      const record = { id: DB.makeId('ach'), habitId, milestone: m, unlockedAt: new Date().toISOString() };
      await DB.put('achievements', record);
      newlyUnlocked.push(record);
    }
  }
  return newlyUnlocked;
}

window.Habits = {
  MILESTONES, MILESTONE_LABELS, MILESTONE_ICONS,
  todayStr, daysBetween,
  listHabits, createHabit, updateHabit, archiveHabit, getSelectedHabitId, setSelectedHabitId,
  getCheckinsForHabit, getCheckinForDate, saveCheckin,
  currentStreakFromCheckins, longestStreakFromCheckins, getHabitStats,
  getGoalsForHabit, createGoal, deleteGoal, refreshGoalProgress,
  getAchievementsForHabit, checkAndUnlockAchievements,
};
