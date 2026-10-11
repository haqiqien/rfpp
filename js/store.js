const STORAGE_KEY = 'rfpp:v1';
const EMPTY_STATE = Object.freeze({ schemaVersion: 1, settings: { theme: 'auto', fontScale: 1 }, modules: {} });
let storageAvailable = true;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function normalizeState(value) {
  if (!value || typeof value !== 'object' || value.schemaVersion !== 1) return clone(EMPTY_STATE);
  return {
    schemaVersion: 1,
    settings: { theme: ['auto', 'light', 'dark'].includes(value.settings?.theme) ? value.settings.theme : 'auto', fontScale: Number(value.settings?.fontScale) || 1 },
    modules: value.modules && typeof value.modules === 'object' ? value.modules : {}
  };
}
function readState() {
  try { return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')); }
  catch { storageAvailable = false; return clone(EMPTY_STATE); }
}
let state = readState();
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; }
  return storageAvailable;
}

export function getState() { return clone(state); }
export function isStorageAvailable() { return storageAvailable; }
export function getModuleProgress(id) { return { ...(state.modules[id] || {}) }; }
export function setTheme(theme) {
  if (!['auto', 'light', 'dark'].includes(theme)) return false;
  state.settings.theme = theme;
  return persist();
}
export function updateModuleProgress(id, patch) {
  if (!id || !patch || typeof patch !== 'object') return false;
  state.modules[id] = { ...(state.modules[id] || {}), ...patch };
  return persist();
}
export function exportProgress() { return JSON.stringify(state, null, 2); }
export function importProgress(json) {
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== 'object' || parsed.schemaVersion !== 1 || !parsed.settings || !parsed.modules || typeof parsed.modules !== 'object' || Array.isArray(parsed.modules)) {
    throw new Error('Format progres tidak sesuai schemaVersion 1.');
  }
  if (!['auto', 'light', 'dark'].includes(parsed.settings.theme)) throw new Error('Tema pada berkas progres tidak dikenal.');
  if (parsed.settings.fontScale !== undefined && (!Number.isFinite(parsed.settings.fontScale) || parsed.settings.fontScale < 0.75 || parsed.settings.fontScale > 2)) throw new Error('Skala huruf pada berkas progres tidak valid.');
  for (const [id, progress] of Object.entries(parsed.modules)) {
    if (!id || !progress || typeof progress !== 'object' || Array.isArray(progress)) throw new Error('Data progres modul tidak valid.');
    if (progress.completed !== undefined && typeof progress.completed !== 'boolean') throw new Error(`Status selesai modul ${id} tidak valid.`);
    if (progress.quizBest !== undefined && (!Number.isFinite(progress.quizBest) || progress.quizBest < 0 || progress.quizBest > 1)) throw new Error(`Skor kuis modul ${id} harus antara 0 dan 1.`);
    if (progress.quizAttempts !== undefined && (!Number.isInteger(progress.quizAttempts) || progress.quizAttempts < 0)) throw new Error(`Jumlah percobaan modul ${id} tidak valid.`);
    if (progress.scrollPct !== undefined && (!Number.isFinite(progress.scrollPct) || progress.scrollPct < 0 || progress.scrollPct > 1)) throw new Error(`Posisi baca modul ${id} harus antara 0 dan 1.`);
    if (progress.note !== undefined && typeof progress.note !== 'string') throw new Error(`Catatan modul ${id} tidak valid.`);
    if (progress.lastVisited !== undefined && (typeof progress.lastVisited !== 'string' || Number.isNaN(Date.parse(progress.lastVisited)))) throw new Error(`Waktu kunjungan modul ${id} tidak valid.`);
  }
  state = normalizeState(parsed);
  return persist();
}
