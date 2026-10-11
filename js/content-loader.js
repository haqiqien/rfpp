const cache = new Map();
const base = new URL('../content/', import.meta.url);

async function loadJson(path) {
  const url = new URL(path, base).href;
  if (!cache.has(url)) cache.set(url, fetch(url).then(async response => {
    if (!response.ok) throw new Error(`Gagal memuat ${path} (${response.status}).`);
    return response.json();
  }).catch(error => { cache.delete(url); throw error; }));
  return cache.get(url);
}
export function loadCourse() { return loadJson('course.json'); }
export function loadManifest() { return loadJson('manifest.json'); }
export function loadGlossary() { return loadJson('glossary.json'); }
export function loadSearchIndex() { return loadJson('search-index.json'); }
export function loadQuiz(module) { return loadJson(`${module.path}/quiz.json`); }
export async function loadModule(module) {
  const url = new URL(`${module.path}/index.md`, base).href;
  if (!cache.has(url)) cache.set(url, fetch(url).then(async response => {
    if (!response.ok) throw new Error(`Materi “${module.title}” belum dapat dimuat.`);
    return response.text();
  }).catch(error => { cache.delete(url); throw error; }));
  return cache.get(url);
}
