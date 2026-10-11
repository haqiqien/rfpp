import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, searchIndex } from '../js/search.js';

test('menormalkan huruf dan diakritik', () => {
  assert.equal(normalizeText('Ekstraksi Fitur'), 'ekstraksi fitur');
  assert.equal(normalizeText('café'), 'cafe');
});

test('memberi bobot lebih tinggi pada judul daripada isi', () => {
  const entries = [
    { id: 'body', title: 'Modul umum', headings: [], text: 'PCA dibahas pada bagian ini.' },
    { id: 'title', title: 'PCA dan reduksi dimensi', headings: [], text: '' }
  ];
  const results = searchIndex(entries, 'pca');
  assert.deepEqual(results.map(result => result.id), ['title', 'body']);
});

test('mengembalikan tanpa hasil untuk query kosong', () => {
  assert.deepEqual(searchIndex([{ title: 'PCA' }], '  '), []);
});
