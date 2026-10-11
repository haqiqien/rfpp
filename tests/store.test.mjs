import test from 'node:test';
import assert from 'node:assert/strict';

const memory = new Map();
globalThis.localStorage = {
  getItem(key) { return memory.get(key) ?? null; },
  setItem(key, value) { memory.set(key, String(value)); }
};
const store = await import('../js/store.js?store-test');

test('ekspor dan impor progres schemaVersion 1', () => {
  store.updateModuleProgress('p01-contoh', { completed: true, quizBest: 0.8, quizAttempts: 2 });
  const exported = JSON.parse(store.exportProgress());
  assert.equal(exported.schemaVersion, 1);
  assert.equal(exported.modules['p01-contoh'].quizBest, 0.8);
  store.importProgress(JSON.stringify({ schemaVersion: 1, settings: { theme: 'dark', fontScale: 1 }, modules: { 'p02-contoh': { completed: false } } }));
  assert.deepEqual(store.getState().modules, { 'p02-contoh': { completed: false } });
  assert.equal(store.getState().settings.theme, 'dark');
});

test('impor progres invalid ditolak tanpa mengganti keadaan', () => {
  const before = store.exportProgress();
  assert.throws(() => store.importProgress('{'), SyntaxError);
  assert.throws(() => store.importProgress(JSON.stringify({ schemaVersion: 2, settings: {}, modules: {} })), /schemaVersion 1/);
  assert.throws(() => store.importProgress(JSON.stringify({ schemaVersion: 1, settings: { theme: 'ultraviolet' }, modules: {} })), /Tema/);
  assert.equal(store.exportProgress(), before);
});
