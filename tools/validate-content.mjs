import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontMatter, transformDirectives } from '../js/content-format.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
let errors = 0; let warnings = 0;
const error = (where, message) => { errors += 1; console.error(`ERROR ${where}: ${message}`); };
const warn = (where, message) => { warnings += 1; console.warn(`WARN  ${where}: ${message}`); };
const ok = async path => { try { await access(path, constants.F_OK); return true; } catch { return false; } };
async function json(path) { try { return JSON.parse(await readFile(resolve(root, path), 'utf8')); } catch (cause) { error(path, `JSON tidak dapat dibaca: ${cause.message}`); return null; } }
function validDate(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)); }
function withinRoot(path) { const absolute = resolve(root, path); return absolute === root || absolute.startsWith(root + sep); }

const manifest = await json('content/manifest.json');
const course = await json('content/course.json');
const glossary = await json('content/glossary.json');
if (manifest) {
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.modules)) error('content/manifest.json', 'schemaVersion harus 1 dan modules harus berupa array.');
}
if (course) {
  if (course.schemaVersion !== 1 || !Array.isArray(course.cpmk) || !Array.isArray(course.cpl)) error('content/course.json', 'Metadata kursus tidak sesuai schemaVersion 1.');
}
if (glossary && (glossary.schemaVersion !== 1 || !Array.isArray(glossary.terms))) error('content/glossary.json', 'schemaVersion harus 1 dan terms harus berupa array.');

const moduleIds = new Set(); const orders = new Set(); const cpmkIds = new Set(course?.cpmk?.map(item => item.code) || []);
const termIds = new Set(glossary?.terms?.map(item => item.id) || []);
const referenceIds = new Set(course?.references?.map(item => item.id) || []);
const knownModules = new Set(manifest?.modules?.map(item => item.id) || []);
for (const module of manifest?.modules || []) {
  const where = `modul ${module.id || '(tanpa id)'}`;
  if (!module.id || !/^(p\d{2}-[a-z0-9-]+|s-[a-z0-9-]+)$/.test(module.id)) error(where, 'ID harus memakai format pNN- atau s-.');
  if (moduleIds.has(module.id)) error(where, 'ID modul duplikat.'); moduleIds.add(module.id);
  if (!module.title || typeof module.title !== 'string') error(where, 'title wajib berupa teks.');
  if (module.summary !== undefined && (typeof module.summary !== 'string' || module.summary.length > 200)) error(where, 'summary manifest harus teks maksimal 200 karakter.');
  if (!module.path || !withinRoot(resolve(root, 'content', module.path))) error(where, 'path tidak valid.');
  if (orders.has(module.order)) error(where, `order ${module.order} duplikat.`); orders.add(module.order);
  if (!Array.isArray(module.cpmk) || !module.cpmk.length || module.cpmk.some(id => !cpmkIds.has(id))) error(where, 'cpmk harus memuat kode CPMK yang dikenal.');
  if (!['draf', 'terbit'].includes(module.status)) error(where, 'status harus draf atau terbit.');
  if (!Array.isArray(module.tags) || module.tags.some(tag => !/^[a-z0-9-]+$/.test(tag))) error(where, 'tags harus huruf kecil tanpa spasi.');
  if (!Number.isFinite(module.estimatedMinutes) || module.estimatedMinutes < 0) error(where, 'estimatedMinutes harus angka non-negatif.');
  if (typeof module.hasQuiz !== 'boolean' || !validDate(module.added)) error(where, 'hasQuiz harus boolean dan added harus tanggal YYYY-MM-DD.');
  const moduleDir = resolve(root, 'content', module.path || ''); const mdPath = resolve(moduleDir, 'index.md'); const quizPath = resolve(moduleDir, 'quiz.json');
  if (!withinRoot(moduleDir) || !await ok(mdPath)) { error(where, `Berkas ${module.path}/index.md tidak ada.`); continue; }
  const raw = await readFile(mdPath, 'utf8');
  let parsed;
  try { parsed = parseFrontMatter(raw); } catch (cause) { error(where, cause.message); continue; }
  const meta = parsed.data;
  if (meta.id !== module.id || resolve(root, 'content', module.path).split(sep).at(-1) !== module.id) error(where, 'ID front matter, manifest, dan nama folder harus sama.');
  for (const field of ['id', 'title', 'cpmk', 'summary', 'objectives', 'sources', 'updated']) if (meta[field] === undefined) error(where, `Field front matter “${field}” wajib ada.`);
  if (typeof meta.summary === 'string' && meta.summary.length > 200) warn(where, 'Ringkasan lebih dari 200 karakter.');
  if (typeof meta.summary !== 'string') error(where, 'summary harus berupa teks.');
  if (!Array.isArray(meta.cpmk) || meta.cpmk.some(id => !cpmkIds.has(id))) error(where, 'cpmk front matter berisi kode tidak dikenal.');
  if (Array.isArray(meta.cpmk) && JSON.stringify(meta.cpmk) !== JSON.stringify(module.cpmk)) error(where, 'cpmk front matter harus sama dengan cpmk manifest.');
  if (!Array.isArray(meta.objectives) || !Array.isArray(meta.sources)) error(where, 'objectives dan sources harus berupa daftar.');
  for (const sourcePath of meta.sources || []) {
    if (typeof sourcePath !== 'string' || !withinRoot(resolve(root, sourcePath)) || !await ok(resolve(root, sourcePath))) error(where, `Sumber ${sourcePath} tidak ditemukan di dalam proyek.`);
  }
  if (!validDate(meta.updated)) error(where, 'updated harus berformat YYYY-MM-DD.');
  if (module.hasQuiz !== await ok(quizPath)) error(where, 'hasQuiz tidak cocok dengan keberadaan quiz.json.');
  const todoCount = (raw.match(/TODO:\s*verifikasi/gi) || []).length;
  if (todoCount) warn(where, `${todoCount} penanda TODO verifikasi.`);
  try { transformDirectives(parsed.body); } catch (cause) { error(where, cause.message); }
  for (const match of parsed.body.matchAll(/\[\[([\w-]+)(?:\|[^\]]+)?\]\]/g)) if (!termIds.has(match[1])) error(where, `Istilah glosarium “${match[1]}” tidak ditemukan.`);
  for (const match of parsed.body.matchAll(/\[ref:([\w-]+)\]/g)) if (!referenceIds.has(match[1])) error(where, `Referensi “${match[1]}” tidak ditemukan di course.json.`);
  for (const match of parsed.body.matchAll(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const asset = resolve(moduleDir, match[2]);
    if (!match[1].trim()) warn(where, `Gambar ${match[2]} tidak memiliki alt.`);
    if (!withinRoot(asset) || !await ok(asset)) error(where, `Aset gambar ${match[2]} tidak ditemukan.`);
  }
  if (module.status === 'draf') warn(where, 'Modul berstatus draf.');
  if (!module.hasQuiz) warn(where, 'Modul belum memiliki kuis.');
  if (module.hasQuiz && await ok(quizPath)) {
    let quiz;
    try { quiz = JSON.parse(await readFile(quizPath, 'utf8')); } catch (cause) { error(where, `Kuis JSON tidak valid: ${cause.message}`); continue; }
    if (quiz.schemaVersion !== 1 || quiz.moduleId !== module.id || !Array.isArray(quiz.questions)) error(where, 'Struktur kuis tidak valid atau moduleId tidak cocok.');
    const questionIds = new Set();
    for (const question of quiz.questions || []) {
      if (!question.id || questionIds.has(question.id)) error(where, `ID soal kosong atau duplikat: ${question.id || '(kosong)'}.`); questionIds.add(question.id);
      if (!['pilihan-ganda', 'pilihan-ganda-banyak', 'benar-salah', 'isian'].includes(question.type)) error(where, `Tipe soal ${question.type} tidak dikenal.`);
      if (!question.explanation || !question.source) error(where, `Soal ${question.id} harus memiliki explanation dan source.`);
      if (question.type === 'pilihan-ganda' && (!Array.isArray(question.options) || !Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.length)) error(where, `Jawaban soal ${question.id} di luar rentang.`);
      if (question.type === 'pilihan-ganda-banyak' && (!Array.isArray(question.options) || !Array.isArray(question.answer) || question.answer.some(index => !Number.isInteger(index) || index < 0 || index >= question.options.length))) error(where, `Jawaban soal ${question.id} di luar rentang.`);
      if (question.type === 'benar-salah' && typeof question.answer !== 'boolean') error(where, `Jawaban soal ${question.id} harus boolean.`);
      if (question.type === 'isian' && !(typeof question.answer === 'string' || Array.isArray(question.answer))) error(where, `Jawaban soal ${question.id} harus string atau daftar.`);
    }
  }
}
for (const term of glossary?.terms || []) {
  if (!term.id || !term.term || !term.definition) error('content/glossary.json', 'Setiap istilah memerlukan id, term, dan definition.');
  for (const id of term.modules || []) if (!knownModules.has(id)) error('content/glossary.json', `Modul ${id} pada istilah ${term.id} tidak terdaftar.`);
  for (const id of term.related || []) if (!termIds.has(id)) error('content/glossary.json', `Istilah terkait ${id} pada ${term.id} tidak ditemukan.`);
}
console.log(`\nValidasi selesai: ${errors} error, ${warnings} peringatan.`);
if (errors) process.exitCode = 1;
