/**
 * auth.js — Authentication
 * ------------------------------------------------------------------------
 * There is intentionally NO sign-up flow. Accounts live in the `users`
 * IndexedDB store and are meant to be provisioned by an admin. For now we
 * seed one demo account on first run. A future admin panel only needs to
 * call DB.put('users', {...}) / DB.remove('users', id) — this module
 * doesn't need to change.
 *
 * Session state is a lightweight flag in localStorage (fine for settings /
 * non-sensitive session data per the storage spec — real credentials never
 * touch localStorage).
 * ------------------------------------------------------------------------
 */

const SESSION_KEY = 'habitapp_session';

/** Seed a default account the first time the app runs. Replace/extend via an admin panel later. */
async function ensureSeedUser() {
  const users = await DB.getAll('users');
  if (users.length === 0) {
    await DB.put('users', {
      id: DB.makeId('user'),
      accessId: 'admin',
      password: 'admin123', // NOTE: plaintext demo auth only — replace with real hashing when a backend/admin panel exists
      name: 'Admin',
      createdAt: new Date().toISOString(),
    });
  }
}

/** Attempt login. Returns { ok, error }. */
async function login(accessId, password) {
  const users = await DB.getAll('users');
  const match = users.find(
    (u) => u.accessId.trim().toLowerCase() === accessId.trim().toLowerCase() && u.password === password
  );
  if (!match) return { ok: false, error: 'Incorrect Access ID or password.' };

  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: match.id, accessId: match.accessId, name: match.name, at: Date.now() }));
  return { ok: true, user: match };
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function isLoggedIn() {
  return !!getSession();
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
}

window.Auth = { ensureSeedUser, login, getSession, isLoggedIn, logout };
