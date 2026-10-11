import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontMatter, transformDirectives } from '../js/content-format.js';
import { resolveRoute } from '../js/router.js';

test('membaca front matter scalar dan daftar', () => {
  const parsed = parseFrontMatter('---\nid: p01-contoh\nflag: true\nitems: [satu, dua]\nobjectives:\n  - Tujuan satu\n---\nIsi');
  assert.equal(parsed.data.id, 'p01-contoh');
  assert.equal(parsed.data.flag, true);
  assert.deepEqual(parsed.data.items, ['satu', 'dua']);
  assert.deepEqual(parsed.data.objectives, ['Tujuan satu']);
  assert.equal(parsed.body, 'Isi');
});

test('mengubah direktif menjadi callout dan demo', () => {
  const result = transformDirectives(':::tambahan Catatan\nTeks contoh.\n:::\n\n:::demo demo-coba {seed=7}\n');
  assert.match(result, /data-kind="tambahan"/);
  assert.match(result, /bukan materi dosen/);
  assert.match(result, /data-demo="demo-coba"/);
});

test('melaporkan direktif yang belum ditutup', () => {
  assert.throws(() => transformDirectives(':::catatan Tanpa akhir\nIsi'), /tidak ditutup/);
});

test('mengubah tab menjadi panel disclosure yang dapat diakses', () => {
  const result = transformDirectives(':::tab\n::tab Panel satu\nIsi pertama\n:::');
  assert.match(result, /<details><summary>Panel satu<\/summary>/);
});

test('rute kosong dan hash home menuju beranda', () => {
  assert.equal(resolveRoute('').name, 'home');
  assert.equal(resolveRoute('#/').name, 'home');
  assert.equal(resolveRoute('#/jalur-asing').name, 'not-found');
});
