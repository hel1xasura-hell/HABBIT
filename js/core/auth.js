/**
 * auth.js — Authentication
 * ------------------------------------------------------------------------
 * There is intentionally NO sign-up flow. Accounts live in the `users`
 * IndexedDB store and are meant to be provisioned by an admin. For now we
 * seed one demo account on first run. A future admin panel only needs to
 * call DB.put('users', {...}) / DB.remove('users', id) — this module
 * doesn't need to change.
 *
 * Session state is kept in sessionStorage (cleared when the browser/app is
 * fully closed) rather than localStorage — this means the Access ID and
 * password are required every time the app is freshly opened, not just once
 * ever. Real credentials never touch either storage; only a session flag does.
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

  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId: match.id, accessId: match.accessId, name: match.name, at: Date.now() }));
  return { ok: true, user: match };
}

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function isLoggedIn() {
  return !!getSession();
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Self-service password/PIN change for the logged-in user.
 * Requires the current password to match before writing the new one.
 * Returns { ok, error }.
 */
async function changePassword(userId, currentPassword, newPassword) {
  const user = await DB.get('users', userId);
  if (!user) return { ok: false, error: 'Account not found.' };
  if (user.password !== currentPassword) return { ok: false, error: 'Current password is incorrect.' };
  if (!newPassword || newPassword.length < 4) return { ok: false, error: 'New password/PIN must be at least 4 characters.' };

  user.password = newPassword;
  await DB.put('users', user);
  return { ok: true };
}

window.Auth = { ensureSeedUser, login, getSession, isLoggedIn, logout, changePassword };

