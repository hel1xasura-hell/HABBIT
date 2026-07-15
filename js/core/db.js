/**
 * db.js — Storage module
 * ------------------------------------------------------------------------
 * This is the ONLY file in the app allowed to talk to IndexedDB directly.
 * Every other module reads/writes data through the async API exported here
 * (get, getAll, put, remove, query, clearStore, exportAll, importAll).
 *
 * WHY: when this project is later wrapped with Capacitor/Cordova or ported
 * to React Native / Flutter, IndexedDB can be swapped for SQLite (or any
 * other engine) by rewriting ONLY this file. No other module needs to
 * change, because they never import `indexedDB` themselves.
 * ------------------------------------------------------------------------
 */

const DB_NAME = 'habitRecoveryDB';
const DB_VERSION = 1;

/** Object store definitions: name + keyPath + indexes. */
const STORES = {
  users:        { keyPath: 'id' },
  habits:       { keyPath: 'id', indexes: ['active'] },
  checkins:     { keyPath: 'id', indexes: ['habitId', 'date'] },
  urges:        { keyPath: 'id', indexes: ['habitId', 'timestamp'] },
  journal:      { keyPath: 'id', indexes: ['date'] },
  triggers:     { keyPath: 'id', indexes: ['habitId', 'timestamp'] },
  goals:        { keyPath: 'id', indexes: ['habitId'] },
  achievements: { keyPath: 'id', indexes: ['habitId'] },
};

let _dbPromise = null;

/** Open (or create/upgrade) the database. Cached as a singleton promise. */
function openDB() {
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      Object.entries(STORES).forEach(([name, def]) => {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: def.keyPath });
          (def.indexes || []).forEach((idx) => store.createIndex(idx, idx, { unique: false }));
        }
      });
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });

  return _dbPromise;
}

function tx(storeName, mode = 'readonly') {
  return openDB().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

/** Get a single record by id. */
async function get(storeName, id) {
  const store = await tx(storeName);
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/** Get every record in a store. */
async function getAll(storeName) {
  const store = await tx(storeName);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/** Get all records where `field` === `value` (uses an index if available). */
async function query(storeName, field, value) {
  const all = await getAll(storeName);
  return all.filter((row) => row[field] === value);
}

/** Insert or update a record. Record must include its keyPath field (id). */
async function put(storeName, record) {
  const store = await tx(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

/** Bulk insert/update. */
async function putMany(storeName, records) {
  const store = await tx(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    records.forEach((r) => store.put(r));
    store.transaction.oncomplete = () => resolve(records);
    store.transaction.onerror = () => reject(store.transaction.error);
  });
}

/** Delete a record by id. */
async function remove(storeName, id) {
  const store = await tx(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/** Wipe every record from a store. */
async function clearStore(storeName) {
  const store = await tx(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/** Export every store's contents as one JSON-serializable object (for Settings > Export Data). */
async function exportAll() {
  const out = { _meta: { app: 'habit-recovery', exportedAt: new Date().toISOString(), version: DB_VERSION } };
  for (const name of Object.keys(STORES)) {
    if (name === 'users') continue; // never export credentials
    out[name] = await getAll(name);
  }
  return out;
}

/** Import a previously-exported object, replacing existing data store-by-store. */
async function importAll(data) {
  for (const name of Object.keys(STORES)) {
    if (name === 'users') continue;
    if (Array.isArray(data[name])) {
      await clearStore(name);
      if (data[name].length) await putMany(name, data[name]);
    }
  }
  return true;
}

/** Wipe all app data (used by Settings > Reset Data). Keeps user accounts. */
async function resetAllData() {
  for (const name of Object.keys(STORES)) {
    if (name === 'users') continue;
    await clearStore(name);
  }
  return true;
}

/** Simple id generator (timestamp + random) — good enough for a local-only device store. */
function makeId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

window.DB = { openDB, get, getAll, query, put, putMany, remove, clearStore, exportAll, importAll, resetAllData, makeId, STORES };
