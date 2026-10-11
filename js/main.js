import { loadCourse, loadManifest, loadGlossary, loadModule, loadQuiz, loadSearchIndex } from './content-loader.js';
import { startRouter } from './router.js';
import { getState, isStorageAvailable, setTheme, updateModuleProgress, exportProgress, importProgress } from './store.js';
import { renderMarkdown } from './markdown.js';
import { evaluateQuiz, formatAnswer, shuffleOptions } from './quiz.js';
import { searchIndex as searchEntries, normalizeText } from './search.js';
import { parseFrontMatter } from './content-format.js';
import { loadDemo } from './demos/registry.js';

const app = document.querySelector('#app');
let course;
let manifest;
let glossary;
let scrollHandler;
let scrollTimer;
let readerProgressFlush;
let renderVersion = 0;
let demoCleanups = [];

function clearDemos() {
  demoCleanups.forEach(cleanup => cleanup());
  demoCleanups = [];
}

function mountDemos(container) {
  for (const placeholder of container.querySelectorAll('.demo-placeholder[data-demo]')) {
    const demoId = placeholder.dataset.demo;
    let disposed = false;
    let observer;
    let mountedCleanup;
    const cleanup = () => {
      disposed = true;
      observer?.disconnect();
      mountedCleanup?.();
    };
    demoCleanups.push(cleanup);
    const mount = async () => {
      observer?.disconnect();
      if (disposed || !placeholder.isConnected) return;
      placeholder.textContent = 'Memuat demo…';
      try {
        const demo = await loadDemo(demoId);
        if (disposed || !placeholder.isConnected) return;
        const options = Object.fromEntries((placeholder.dataset.options || '').split(/\s+/).filter(Boolean).map(pair => pair.split('=')));
        placeholder.classList.add('demo-mounted');
        placeholder.removeAttribute('role');
        placeholder.removeAttribute('aria-live');
        mountedCleanup = demo.mount(placeholder, options);
      } catch {
        if (!disposed && placeholder.isConnected) {
          placeholder.textContent = `Demo ${demoId} belum dapat dimuat.`;
          placeholder.setAttribute('role', 'status');
        }
      }
    };
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) void mount();
      }, { rootMargin: '120px' });
      observer.observe(placeholder);
    } else void mount();
  }
}

const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
const makeLink = (href, text, className = '') => {
  const node = el('a', text, `button ${className}`.trim());
  node.href = href;
  return node;
};
const cpmkNumber = code => code.split('.').at(-1);
const moduleHref = id => `#/modul/${encodeURIComponent(id)}`;
const publishedModules = () => manifest.modules.filter(module => module.status === 'terbit');
const moduleSummary = module => module.summary || 'Ringkasan belum tersedia.';

function clearReaderTracking() {
  clearDemos();
  if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
  if (scrollTimer) window.clearTimeout(scrollTimer);
  if (readerProgressFlush) readerProgressFlush();
  scrollHandler = undefined;
  scrollTimer = undefined;
  readerProgressFlush = undefined;
}

function setThemeAttribute() {
  document.documentElement.dataset.theme = getState().settings.theme;
}

function showNotice(parent, text, className = 'notice') {
  const box = el('p', text, className);
  box.setAttribute('role', 'status');
  parent.append(box);
  return box;
}

function setProgressBar(container, value, label) {
  const progress = el('div', undefined, 'progress-track');
  progress.setAttribute('role', 'progressbar');
  progress.setAttribute('aria-label', label);
  progress.setAttribute('aria-valuemin', '0');
  progress.setAttribute('aria-valuemax', '100');
  progress.setAttribute('aria-valuenow', String(value));
  const fill = el('span');
  fill.style.width = `${value}%`;
  progress.append(fill);
  container.append(progress);
  return progress;
}

function renderModuleCard(module, { compact = false } = {}) {
  const card = el('article', undefined, `card${compact ? ' compact-card' : ''}`);
  card.append(el('span', module.status === 'draf' ? 'Draf' : `CPMK ${module.cpmk.map(cpmkNumber).join(', ')}`, 'badge'));
  card.append(el(compact ? 'h3' : 'h2', module.title));
  if (!compact) card.append(el('p', moduleSummary(module)));
  const meta = el('p', `${module.estimatedMinutes} menit · ${module.tags.map(tag => `#${tag}`).join(' ')}`, 'card-meta');
  card.append(meta);
  card.append(makeLink(moduleHref(module.id), compact ? 'Buka' : 'Baca modul', 'secondary'));
  return card;
}

function renderHome() {
  const state = getState();
  const activeModules = publishedModules();
  const completedCount = activeModules.filter(module => state.modules[module.id]?.completed).length;
  const completion = activeModules.length ? Math.round((completedCount / activeModules.length) * 100) : 0;
  const latestVisited = manifest.modules
    .filter(module => state.modules[module.id]?.lastVisited)
    .sort((a, b) => state.modules[b.id].lastVisited.localeCompare(state.modules[a.id].lastVisited))[0];

  const hero = el('section', undefined, 'hero');
  hero.append(el('p', 'MII226403 · Magister Ilmu Komputer UGM', 'eyebrow'));
  hero.append(el('h1', course.title));
  hero.append(el('p', course.description, 'lead'));
  hero.append(el('p', `${course.credits.theory} SKS · ${course.semester} · ${course.program}`, 'lead'));
  const actions = el('div', undefined, 'button-row');
  actions.append(makeLink(latestVisited ? moduleHref(latestVisited.id) : '#/modul', latestVisited ? `Lanjutkan: ${latestVisited.title}` : 'Mulai belajar'));
  actions.append(makeLink('#/modul', 'Jelajahi modul', 'secondary'));
  hero.append(actions);
  app.append(hero);

  const progressSection = el('section', undefined, 'home-progress');
  progressSection.append(el('h2', 'Progres belajar'));
  progressSection.append(el('p', activeModules.length ? `${completedCount} dari ${activeModules.length} modul terbit selesai (${completion}%).` : 'Materi pertama akan segera hadir. Progres akan dihitung setelah modul kuliah diterbitkan.'));
  setProgressBar(progressSection, completion, 'Progres modul terbit');
  app.append(progressSection);

  const outcomes = el('section');
  outcomes.append(el('h2', 'Capaian pembelajaran'));
  const outcomeGrid = el('div', undefined, 'card-grid outcome-grid');
  for (const outcome of course.cpmk) {
    const related = activeModules.filter(module => module.cpmk.includes(outcome.code));
    const completed = related.filter(module => state.modules[module.id]?.completed).length;
    const card = el('article', undefined, 'card outcome-card');
    card.append(el('span', `CPMK ${cpmkNumber(outcome.code)}`, 'badge'));
    card.append(el('h3', outcome.code));
    card.append(el('p', outcome.text));
    card.append(el('p', `${related.length} modul terbit · ${completed} selesai`, 'card-meta'));
    outcomeGrid.append(card);
  }
  outcomes.append(outcomeGrid);
  app.append(outcomes);

  const latestSection = el('section');
  latestSection.append(el('h2', 'Baru ditambahkan'));
  const latest = [...manifest.modules].sort((a, b) => b.added.localeCompare(a.added) || a.order - b.order).slice(0, 3);
  if (!latest.length || !activeModules.length) showNotice(latestSection, 'Materi pertama akan segera hadir. Contoh format draf disediakan untuk pemilik situs.');
  if (latest.length) {
    const cards = el('div', undefined, 'card-grid');
    for (const module of latest) cards.append(renderModuleCard(module));
    latestSection.append(cards);
  }
  app.append(latestSection);
}

function renderModules(route) {
  const heading = el('h1', 'Daftar modul');
  app.append(heading);
  app.append(el('p', 'Saring materi menurut CPMK, status, atau tag.', 'lead'));

  const filters = el('form', undefined, 'inline-form filter-form');
  const cpmkLabel = el('label', 'CPMK');
  const cpmk = el('select');
  cpmk.name = 'cpmk';
  cpmk.append(new Option('Semua CPMK', ''));
  for (const item of course.cpmk) cpmk.append(new Option(item.code, item.code));
  cpmk.value = route.query.get('cpmk') || '';
  cpmkLabel.append(cpmk);

  const statusLabel = el('label', 'Status');
  const status = el('select');
  status.name = 'status';
  for (const [label, value] of [['Semua status', ''], ['Terbit', 'terbit'], ['Draf', 'draf']]) status.append(new Option(label, value));
  status.value = route.query.get('status') || '';
  statusLabel.append(status);

  const tagLabel = el('label', 'Tag');
  const tag = el('input');
  tag.name = 'tag';
  tag.placeholder = 'mis. audio';
  tag.value = route.query.get('tag') || '';
  tagLabel.append(tag);
  const submit = el('button', 'Terapkan filter', 'button');
  filters.append(cpmkLabel, statusLabel, tagLabel, submit);
  filters.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(filters);
    const query = new URLSearchParams([...formData].filter(([, value]) => String(value).trim()));
    location.hash = `#/modul${query.size ? `?${query}` : ''}`;
  });
  app.append(filters);

  const selected = manifest.modules.filter(module =>
    (!cpmk.value || module.cpmk.includes(cpmk.value)) &&
    (!status.value || module.status === status.value) &&
    (!tag.value.trim() || module.tags.includes(tag.value.trim().toLowerCase()))
  );
  if (!selected.length) {
    showNotice(app, 'Belum ada modul yang cocok dengan filter ini.');
    return;
  }
  const cards = el('div', undefined, 'card-grid module-card-grid');
  for (const module of selected) cards.append(renderModuleCard(module));
  app.append(cards);
}

function renderCpmk() {
  app.append(el('h1', 'Peta CPMK'));
  app.append(el('p', 'Pemetaan capaian pembelajaran mata kuliah terhadap CPL dan materi yang tersedia.', 'lead'));
  const tableWrap = el('div', undefined, 'table-scroll');
  const table = el('table', undefined, 'mapping-table');
  const head = el('thead');
  const headerRow = el('tr');
  const cpmkHeader = el('th', 'CPMK');
  cpmkHeader.scope = 'col';
  headerRow.append(cpmkHeader);
  for (const outcome of course.cpl) {
    const th = el('th', outcome.code);
    th.scope = 'col';
    headerRow.append(th);
  }
  head.append(headerRow);
  const body = el('tbody');
  for (const outcome of course.cpmk) {
    const row = el('tr');
    const title = el('th', outcome.code);
    title.scope = 'row';
    row.append(title);
    for (const cpl of course.cpl) {
      const cell = el('td', outcome.cpl.includes(cpl.code) ? '✓' : '—');
      if (outcome.cpl.includes(cpl.code)) cell.setAttribute('aria-label', `Terkait ${cpl.code}`);
      else cell.setAttribute('aria-label', `Tidak dipetakan ke ${cpl.code}`);
      row.append(cell);
    }
    body.append(row);
  }
  table.append(head, body);
  tableWrap.append(table);
  app.append(tableWrap);

  app.append(el('h2', 'CPL yang dibebankan'));
  const cplCards = el('div', undefined, 'card-grid cpl-grid');
  for (const cpl of course.cpl) {
    const card = el('article', undefined, 'card');
    card.append(el('h3', cpl.code));
    card.append(el('p', cpl.text));
    if (cpl.code === 'CPL 3.4') showNotice(card, 'Teks CPL 3.4 pada salinan RPKPS terpotong; bagian akhirnya menunggu verifikasi sumber asli.', 'notice compact-notice');
    cplCards.append(card);
  }
  app.append(cplCards);

  app.append(el('h2', 'Materi per capaian'));
  const active = publishedModules();
  for (const outcome of course.cpmk) {
    const section = el('section', undefined, 'card cpmk-detail');
    section.append(el('h3', `${outcome.code} · CPMK ${cpmkNumber(outcome.code)}`));
    section.append(el('p', outcome.text));
    section.append(el('p', `Alokasi waktu pada RPKPS: ${outcome.timeAllocation} (satuan belum disebutkan).`, 'card-meta'));
    const modules = active.filter(module => module.cpmk.includes(outcome.code));
    if (!modules.length) showNotice(section, 'Belum ada materi terbit untuk CPMK ini.');
    else {
      const list = el('ul');
      for (const module of modules) {
        const item = el('li');
        item.append(makeLink(moduleHref(module.id), module.title, 'text-link'));
        list.append(item);
      }
      section.append(list);
    }
    app.append(section);
  }
}

function renderAssessment(route) {
  app.append(el('h1', 'Penilaian dan referensi'));
  app.append(el('p', 'Komponen penilaian dan daftar referensi yang tercantum dalam RPKPS.', 'lead'));
  app.append(el('h2', 'Blueprint penilaian'));
  const tableWrap = el('div', undefined, 'table-scroll');
  const table = el('table');
  const head = el('thead');
  const header = el('tr');
  for (const label of ['Basis', 'Komponen', 'Bobot', 'Pemetaan CPMK']) header.append(el('th', label));
  head.append(header);
  const body = el('tbody');
  for (const item of course.assessment) {
    const row = el('tr');
    row.append(el('td', item.basis));
    row.append(el('td', item.component));
    row.append(el('td', `${item.weight}%`));
    row.append(el('td', Array.isArray(item.cpmk) ? item.cpmk.join(', ') : 'Belum diverifikasi'));
    body.append(row);
  }
  table.append(head, body);
  tableWrap.append(table);
  app.append(tableWrap);
  showNotice(app, 'Pemetaan komponen penilaian terhadap CPMK belum diverifikasi dari dokumen sumber.');

  app.append(el('h2', 'Referensi'));
  const list = el('ol', undefined, 'reference-list');
  for (const reference of course.references) {
    const item = el('li', undefined, 'reference-item');
    item.id = `ref-${reference.id}`;
    item.append(el('span', reference.citation));
    list.append(item);
  }
  app.append(list);
  const selectedReference = route.query.get('ref');
  if (selectedReference) window.requestAnimationFrame(() => document.getElementById(`ref-${selectedReference}`)?.scrollIntoView());
}

function renderGlossary(route) {
  app.append(el('h1', 'Glosarium'));
  app.append(el('p', 'Istilah yang digunakan dalam materi kuliah beserta definisi dan tautan terkait.', 'lead'));
  if (!glossary.terms.length) {
    showNotice(app, 'Glosarium belum memiliki istilah. Istilah akan ditambahkan bersama materi kuliah.');
    return;
  }
  const form = el('form', undefined, 'inline-form glossary-search');
  form.setAttribute('role', 'search');
  const label = el('label', 'Cari istilah');
  const input = el('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = 'Ketik istilah';
  input.autocomplete = 'off';
  label.append(input);
  form.append(label);
  app.append(form);

  const terms = [...glossary.terms].sort((a, b) => a.term.localeCompare(b.term, 'id'));
  const list = el('div', undefined, 'glossary-list');
  for (const term of terms) {
    const card = el('article', undefined, 'card glossary-term');
    card.id = `term-${term.id}`;
    card.dataset.search = normalizeText(`${term.term} ${term.en || ''} ${term.definition}`);
    const title = el('h2', term.term);
    title.id = `${card.id}-title`;
    card.setAttribute('aria-labelledby', title.id);
    card.append(title);
    if (term.en) card.append(el('p', term.en, 'term-translation'));
    card.append(el('p', term.definition));
    if (term.related?.length) {
      const related = el('p');
      related.append(document.createTextNode('Istilah terkait: '));
      term.related.forEach((id, index) => {
        if (index) related.append(document.createTextNode(', '));
        const other = glossary.terms.find(candidate => candidate.id === id);
        const anchor = el('a', other?.term || id);
        anchor.href = `#/glosarium?istilah=${encodeURIComponent(id)}`;
        related.append(anchor);
      });
      card.append(related);
    }
    if (term.modules?.length) {
      const modules = el('ul', undefined, 'term-modules');
      for (const id of term.modules) {
        const module = manifest.modules.find(candidate => candidate.id === id);
        if (!module) continue;
        const item = el('li');
        item.append(makeLink(moduleHref(id), module.title, 'text-link'));
        modules.append(item);
      }
      if (modules.childElementCount) card.append(modules);
    }
    list.append(card);
  }
  app.append(list);
  input.addEventListener('input', () => {
    const query = normalizeText(input.value);
    let visible = 0;
    for (const card of list.children) {
      const match = !query || card.dataset.search.includes(query);
      card.hidden = !match;
      if (match) visible += 1;
    }
    empty.hidden = visible > 0;
  });
  const empty = showNotice(app, 'Tidak ada istilah yang cocok.', 'notice glossary-empty');
  empty.hidden = true;
  const selectedId = route.query.get('istilah');
  if (selectedId) window.requestAnimationFrame(() => document.getElementById(`term-${selectedId}`)?.scrollIntoView());
}

function renderFlashcards() {
  app.append(el('h1', 'Kartu hafalan'));
  app.append(el('p', 'Latih istilah dari glosarium. Coba ingat definisinya sebelum menampilkan jawaban.', 'lead'));
  const cards = [...glossary.terms].sort((a, b) => a.term.localeCompare(b.term, 'id'));
  if (!cards.length) {
    showNotice(app, 'Kartu belum tersedia karena glosarium masih kosong.');
    app.append(makeLink('#/glosarium', 'Buka glosarium', 'secondary'));
    return;
  }

  let current = 0;
  let revealed = false;
  const card = el('article', undefined, 'card flashcard');
  const counter = el('p', undefined, 'card-meta');
  counter.setAttribute('role', 'status');
  counter.setAttribute('aria-live', 'polite');
  const term = el('h2');
  const translation = el('p', undefined, 'term-translation');
  const definition = el('p');
  const flip = el('button', 'Tampilkan jawaban', 'button');
  flip.type = 'button';
  const previous = el('button', 'Sebelumnya', 'button secondary');
  previous.type = 'button';
  const next = el('button', 'Berikutnya', 'button secondary');
  next.type = 'button';

  function update() {
    const item = cards[current];
    term.textContent = item.term;
    translation.textContent = revealed && item.en ? item.en : '';
    definition.textContent = revealed ? item.definition : '';
    definition.hidden = !revealed;
    translation.hidden = !revealed || !item.en;
    flip.textContent = revealed ? 'Sembunyikan jawaban' : 'Tampilkan jawaban';
    counter.textContent = `Kartu ${current + 1} dari ${cards.length}`;
    previous.disabled = current === 0;
    next.disabled = current === cards.length - 1;
  }
  flip.addEventListener('click', () => { revealed = !revealed; update(); });
  previous.addEventListener('click', () => { current -= 1; revealed = false; update(); });
  next.addEventListener('click', () => { current += 1; revealed = false; update(); });
  card.append(counter, term, translation, definition, flip);
  const navigation = el('div', undefined, 'button-row');
  navigation.append(previous, next);
  app.append(card, navigation);
  update();
}

async function getSearchEntries() {
  try {
    const index = await loadSearchIndex();
    if (Array.isArray(index.entries)) return index.entries;
  } catch { /* Indeks tidak tersedia: susun indeks di klien dari materi terbit. */ }
  const entries = [];
  for (const module of publishedModules()) {
    const source = await loadModule(module);
    const { body } = parseFrontMatter(source);
    const headings = [...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map(match => match[1].trim());
    const text = body.replace(/<!--([\s\S]*?)-->/g, ' ')
      .replace(/\$\$?[\s\S]+?\$?\$/g, ' ')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^\s*:::[^\n]*$|^\s*:::[\s]*$/gm, ' ')
      .replace(/[`*_~>|#]/g, ' ').replace(/\s+/g, ' ').trim();
    entries.push({ id: module.id, title: module.title, headings, text, tags: module.tags });
  }
  return entries;
}

async function renderSearch(route, version) {
  app.append(el('h1', 'Cari materi'));
  app.append(el('p', 'Cari istilah, bagian, atau isi modul yang sudah diterbitkan.', 'lead'));
  const form = el('form', undefined, 'inline-form search-form');
  form.setAttribute('role', 'search');
  const label = el('label', 'Kata kunci');
  const input = el('input');
  input.type = 'search';
  input.name = 'q';
  input.autocomplete = 'off';
  input.placeholder = 'mis. fitur';
  input.value = route.query.get('q') || '';
  label.append(input);
  const submit = el('button', 'Cari', 'button');
  form.append(label, submit);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const query = input.value.trim();
    location.hash = `#/cari${query ? `?q=${encodeURIComponent(query)}` : ''}`;
  });
  app.append(form);
  const results = el('section', undefined, 'search-results');
  results.setAttribute('aria-live', 'polite');
  app.append(results);
  if (!input.value.trim()) {
    showNotice(results, 'Masukkan kata kunci untuk mencari.');
    return;
  }
  showNotice(results, 'Mencari…');
  const entries = await getSearchEntries();
  if (version !== renderVersion) return;
  results.replaceChildren();
  const matches = searchEntries(entries, input.value);
  if (!matches.length) {
    showNotice(results, 'Tidak ada hasil yang cocok.');
    return;
  }
  results.append(el('h2', `${matches.length} hasil`));
  const cards = el('div', undefined, 'card-grid search-card-grid');
  for (const result of matches) {
    const card = el('article', undefined, 'card search-result');
    card.append(el('h3', result.title));
    const matchingHeading = (result.headings || []).find(heading => normalizeText(heading).includes(normalizeText(input.value).split(/\s+/)[0]));
    if (matchingHeading) card.append(el('p', `Bagian: ${matchingHeading}`));
    const excerpt = result.text?.slice(0, 220);
    if (excerpt) card.append(el('p', `${excerpt}${result.text.length > 220 ? '…' : ''}`));
    const tagLine = result.tags?.length ? `Tag: ${result.tags.join(', ')}` : '';
    if (tagLine) card.append(el('p', tagLine, 'card-meta'));
    card.append(makeLink(moduleHref(result.id), 'Buka modul', 'secondary'));
    cards.append(card);
  }
  results.append(cards);
}

function renderQuizResults(module, quiz, evaluation, attempts) {
  const section = el('section', undefined, 'quiz-results');
  section.tabIndex = -1;
  const percent = Math.round(evaluation.score * 100);
  const passed = evaluation.score >= (quiz.passScore ?? 0.7);
  section.append(el('h2', 'Hasil kuis'));
  section.append(el('p', `Skor ${percent}% · ${evaluation.correct} dari ${evaluation.total} jawaban benar · percobaan ke-${attempts}.`, 'lead'));
  showNotice(section, passed ? 'Batas kelulusan tercapai.' : 'Batas kelulusan belum tercapai. Anda dapat mencoba lagi.', passed ? 'notice quiz-pass' : 'notice quiz-retry');
  for (const result of evaluation.results) {
    const card = el('article', undefined, `card answer-review ${result.correct ? 'answer-correct' : 'answer-incorrect'}`);
    card.append(el('h3', result.question.prompt));
    card.append(el('p', `Jawaban Anda: ${formatAnswer(result.question, result.response)}`));
    if (!result.correct) card.append(el('p', `Jawaban benar: ${formatAnswer(result.question, result.question.answer)}`));
    card.append(el('p', result.question.explanation));
    card.append(el('p', `Sumber: ${result.question.source}`, 'card-meta'));
    section.append(card);
  }
  const actions = el('div', undefined, 'button-row');
  const retry = el('button', 'Ulangi kuis', 'button secondary');
  retry.type = 'button';
  retry.addEventListener('click', () => { void render({ name: 'quiz', params: [module.id], query: new URLSearchParams() }); });
  actions.append(retry, makeLink(moduleHref(module.id), 'Kembali ke modul'));
  section.append(actions);
  app.append(section);
  section.focus();
}

async function renderQuiz(route, version) {
  const module = manifest.modules.find(item => item.id === route.params[0]);
  if (!module) {
    app.append(el('h1', 'Modul tidak ditemukan'));
    showNotice(app, 'Modul kuis yang diminta tidak ada di manifest.');
    return;
  }
  app.append(el('h1', `Kuis: ${module.title}`));
  if (!module.hasQuiz) {
    showNotice(app, 'Modul ini belum memiliki kuis.');
    app.append(makeLink(moduleHref(module.id), 'Kembali ke modul', 'secondary'));
    return;
  }
  app.append(el('p', 'Pilih atau tulis jawaban untuk setiap soal, lalu kirim untuk melihat umpan balik.', 'lead'));
  if (module.status === 'draf') showNotice(app, 'Kuis ini bagian dari modul draf dan hanya digunakan untuk contoh format.');
  let quiz;
  try { quiz = await loadQuiz(module); }
  catch (error) { if (version === renderVersion) showNotice(app, error.message || 'Berkas kuis tidak dapat dimuat.'); return; }
  if (version !== renderVersion) return;
  if (!quiz.questions?.length) {
    showNotice(app, 'Kuis ini belum memiliki soal.');
    return;
  }
  const form = el('form', undefined, 'quiz-form');
  quiz.questions.forEach((question, questionIndex) => {
    const fieldset = el('fieldset', undefined, 'quiz-question card');
    const legend = el('legend', `${questionIndex + 1}. ${question.prompt}`);
    fieldset.append(legend);
    if (question.type === 'pilihan-ganda' || question.type === 'pilihan-ganda-banyak') {
      const options = shuffleOptions(question);
      options.forEach(option => {
        const label = el('label', undefined, 'quiz-option');
        const input = el('input');
        input.type = question.type === 'pilihan-ganda' ? 'radio' : 'checkbox';
        input.name = `question-${questionIndex}`;
        input.value = String(option.index);
        if (question.type === 'pilihan-ganda') input.required = true;
        input.dataset.questionIndex = String(questionIndex);
        label.append(input, document.createTextNode(` ${option.label}`));
        fieldset.append(label);
      });
    } else if (question.type === 'benar-salah') {
      for (const [labelText, value] of [['Benar', 'true'], ['Salah', 'false']]) {
        const label = el('label', undefined, 'quiz-option');
        const input = el('input');
        input.type = 'radio';
        input.name = `question-${questionIndex}`;
        input.value = value;
        input.required = true;
        label.append(input, document.createTextNode(` ${labelText}`));
        fieldset.append(label);
      }
    } else {
      const label = el('label', 'Jawaban singkat', 'quiz-short-answer');
      const input = el('input');
      input.type = 'text';
      input.name = `question-${questionIndex}`;
      input.required = true;
      input.autocomplete = 'off';
      label.append(input);
      fieldset.append(label);
    }
    form.append(fieldset);
  });
  const submit = el('button', 'Kirim jawaban', 'button');
  submit.type = 'submit';
  form.append(submit);
  const feedback = el('div', undefined, 'quiz-feedback');
  feedback.setAttribute('aria-live', 'polite');
  form.append(feedback);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const responses = {};
    let missingIndex = -1;
    quiz.questions.forEach((question, index) => {
      const name = `question-${index}`;
      if (question.type === 'pilihan-ganda-banyak') {
        const checked = [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(input => Number(input.value));
        if (!checked.length && missingIndex < 0) missingIndex = index;
        responses[question.id] = checked;
      } else if (question.type === 'isian') {
        const value = new FormData(form).get(name)?.trim() || '';
        if (!value && missingIndex < 0) missingIndex = index;
        responses[question.id] = value;
      } else {
        const value = new FormData(form).get(name);
        if (value === null && missingIndex < 0) missingIndex = index;
        responses[question.id] = question.type === 'pilihan-ganda' ? Number(value) : value;
      }
    });
    feedback.replaceChildren();
    if (missingIndex >= 0) {
      showNotice(feedback, 'Lengkapi jawaban untuk semua soal sebelum mengirim.');
      form.querySelectorAll('.quiz-question')[missingIndex]?.querySelector('input')?.focus();
      return;
    }
    const evaluation = evaluateQuiz(quiz.questions, responses);
    const progress = getState().modules[module.id] || {};
    const attempts = (progress.quizAttempts || 0) + 1;
    updateModuleProgress(module.id, {
      quizBest: Math.max(progress.quizBest || 0, evaluation.score),
      quizAttempts: attempts,
      lastVisited: new Date().toISOString()
    });
    form.replaceChildren();
    form.append(feedback);
    renderQuizResults(module, quiz, evaluation, attempts);
    form.remove();
  });
  app.append(form);
}

function renderProgress(route) {
  const state = getState();
  const active = publishedModules();
  const completed = active.filter(module => state.modules[module.id]?.completed).length;
  const percent = active.length ? Math.round((completed / active.length) * 100) : 0;
  app.append(el('h1', 'Progres belajar'));
  app.append(el('p', 'Progres disimpan di perangkat ini. Ekspor berkas JSON untuk membuat cadangan atau memindahkannya ke perangkat lain.', 'lead'));
  const summary = el('section', undefined, 'card progress-summary');
  summary.append(el('h2', 'Penyelesaian modul'));
  summary.append(el('p', active.length ? `${completed} dari ${active.length} modul terbit selesai (${percent}%).` : 'Belum ada modul kuliah terbit; modul draf tidak dihitung dalam progres keseluruhan.'));
  setProgressBar(summary, percent, 'Penyelesaian modul terbit');
  app.append(summary);

  app.append(el('h2', 'Rincian modul'));
  if (!manifest.modules.length) showNotice(app, 'Belum ada modul.');
  else {
    const tableWrap = el('div', undefined, 'table-scroll');
    const table = el('table');
    const thead = el('thead');
    const row = el('tr');
    for (const title of ['Modul', 'Status', 'Penyelesaian', 'Skor kuis terbaik', 'Percobaan']) row.append(el('th', title));
    thead.append(row);
    const tbody = el('tbody');
    for (const module of [...manifest.modules].sort((a, b) => a.order - b.order)) {
      const progress = state.modules[module.id] || {};
      const tr = el('tr');
      const title = el('td');
      title.append(makeLink(moduleHref(module.id), module.title, 'text-link'));
      tr.append(title, el('td', module.status === 'draf' ? 'Draf' : 'Terbit'));
      tr.append(el('td', module.status === 'draf' ? 'Tidak dihitung' : (progress.completed ? 'Selesai' : 'Belum selesai')));
      tr.append(el('td', progress.quizBest === undefined ? '—' : `${Math.round(progress.quizBest * 100)}%`));
      tr.append(el('td', String(progress.quizAttempts || 0)));
      tbody.append(tr);
    }
    table.append(thead, tbody);
    tableWrap.append(table);
    app.append(tableWrap);
  }

  app.append(el('h2', 'Cadangan progres'));
  const actions = el('div', undefined, 'progress-transfer');
  const exportButton = el('button', 'Ekspor progres JSON', 'button');
  exportButton.type = 'button';
  const feedback = el('p', undefined, 'notice transfer-feedback');
  feedback.setAttribute('aria-live', 'polite');
  exportButton.addEventListener('click', () => {
    try {
      const blob = new Blob([exportProgress()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const download = el('a');
      download.href = url;
      download.download = 'rfpp-progres.json';
      document.body.append(download);
      download.click();
      download.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      feedback.textContent = 'Berkas progres siap diunduh.';
    } catch { feedback.textContent = 'Progres tidak dapat diekspor di browser ini.'; }
  });
  const importLabel = el('label', 'Impor berkas progres JSON');
  importLabel.className = 'button secondary file-button';
  const file = el('input');
  file.type = 'file';
  file.accept = 'application/json,.json';
  file.addEventListener('change', async () => {
    const selected = file.files?.[0];
    if (!selected) return;
    try {
      importProgress(await selected.text());
      setThemeAttribute();
      await render(route);
      showNotice(app, isStorageAvailable() ? 'Progres berhasil diimpor.' : 'Progres dimuat untuk sesi ini, tetapi penyimpanan perangkat tidak tersedia.');
    } catch (error) {
      feedback.textContent = `Impor gagal: ${error.message}`;
      file.value = '';
    }
  });
  importLabel.append(file);
  actions.append(exportButton, importLabel);
  app.append(actions, feedback);
}

function renderCodeControls(body) {
  for (const pre of body.querySelectorAll('pre')) {
    const code = pre.querySelector('code');
    if (!code) continue;
    pre.classList.add('code-block');
    const copy = el('button', 'Salin kode', 'copy-button');
    copy.type = 'button';
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        copy.textContent = 'Tersalin';
      } catch {
        copy.textContent = 'Tidak dapat menyalin';
      }
      window.setTimeout(() => { copy.textContent = 'Salin kode'; }, 1800);
    });
    pre.append(copy);
  }
}

function renderTables(body) {
  for (const table of body.querySelectorAll('table')) {
    if (table.parentElement?.classList.contains('table-scroll')) continue;
    const wrapper = el('div', undefined, 'table-scroll');
    table.before(wrapper);
    wrapper.append(table);
  }
}

function renderModuleNavigation(module, layout) {
  const ordered = [...manifest.modules].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex(item => item.id === module.id);
  const previous = ordered[index - 1];
  const next = ordered[index + 1];
  const nav = el('nav', undefined, 'module-pagination');
  nav.setAttribute('aria-label', 'Navigasi modul');
  if (previous) nav.append(makeLink(moduleHref(previous.id), `← Sebelumnya: ${previous.title}`, 'secondary'));
  else nav.append(el('span', 'Ini modul pertama', 'card-meta'));
  if (next) nav.append(makeLink(moduleHref(next.id), `Berikutnya: ${next.title} →`, 'secondary'));
  layout.append(nav);
}

function renderSidebars(module, layout, headingItems) {
  const side = el('aside', undefined, 'module-list-aside');
  const listDetails = el('details', undefined, 'reader-disclosure');
  listDetails.open = matchMedia('(min-width: 701px)').matches;
  const summary = el('summary', 'Daftar modul');
  listDetails.append(summary);
  const list = el('ul', undefined, 'reader-module-list');
  for (const item of [...manifest.modules].sort((a, b) => a.order - b.order)) {
    const entry = el('li');
    const anchor = el('a', item.title, 'text-link');
    anchor.href = moduleHref(item.id);
    if (item.id === module.id) anchor.setAttribute('aria-current', 'page');
    entry.append(anchor);
    if (item.status === 'draf') entry.append(el('span', 'Draf', 'badge'));
    list.append(entry);
  }
  listDetails.append(list);
  side.append(listDetails);

  const tocAside = el('aside', undefined, 'toc-aside');
  const tocDetails = el('details', undefined, 'reader-disclosure');
  tocDetails.open = true;
  tocDetails.append(el('summary', 'Daftar isi'));
  const toc = el('ol', undefined, 'toc-list');
  for (const heading of headingItems) {
    const entry = el('li');
    if (heading.tagName === 'H3') entry.className = 'toc-subitem';
    const anchor = el('a', heading.textContent, 'text-link');
    anchor.href = `${moduleHref(module.id)}?bagian=${encodeURIComponent(heading.id)}`;
    entry.append(anchor);
    toc.append(entry);
  }
  if (!headingItems.length) toc.append(el('li', 'Tidak ada bagian.'));
  tocDetails.append(toc);
  tocAside.append(tocDetails);
  layout.append(side, tocAside);
}

async function renderModule(module, route, version) {
  app.append(el('p', 'Memuat modul…', 'loading-message'));
  const source = await loadModule(module);
  if (version !== renderVersion) return;
  const rendered = renderMarkdown(source, { glossary: glossary.terms });
  const article = el('article', undefined, 'module-article');
  const heading = el('h1', rendered.meta.title || module.title);
  article.append(heading);
  article.append(el('p', `${module.cpmk.join(', ')} · ${module.status === 'draf' ? 'Draf' : 'Terbit'} · ${module.estimatedMinutes} menit`, 'eyebrow'));
  article.append(el('p', rendered.meta.summary || moduleSummary(module), 'lead'));

  const scrollPct = Math.max(0, Math.min(1, Number(getState().modules[module.id]?.scrollPct) || 0));
  const resume = el('button', 'Lanjutkan dari posisi terakhir', 'button secondary resume-reading');
  resume.hidden = scrollPct < 0.03;
  article.append(resume);
  const body = el('div', undefined, 'module-body');
  body.innerHTML = rendered.html;
  for (const image of body.querySelectorAll('img[src]')) {
    image.src = new URL(image.getAttribute('src'), new URL(`../content/${module.path}/`, import.meta.url)).href;
  }
  renderCodeControls(body);
  renderTables(body);
  article.append(body);

  const noteSection = el('section', undefined, 'module-note');
  noteSection.append(el('h2', 'Catatan pribadi'));
  noteSection.append(el('p', 'Catatan ini tersimpan di penyimpanan lokal perangkat dan tidak dikirim ke server.'));
  const noteLabel = el('label', 'Catatan untuk modul ini');
  noteLabel.htmlFor = `module-note-${module.id}`;
  const noteInput = el('textarea');
  noteInput.id = noteLabel.htmlFor;
  noteInput.rows = 5;
  noteInput.value = getState().modules[module.id]?.note || '';
  noteLabel.append(noteInput);
  const saveNote = el('button', 'Simpan catatan', 'button secondary');
  saveNote.type = 'button';
  const noteStatus = el('p', undefined, 'note-status');
  noteStatus.setAttribute('role', 'status');
  noteStatus.setAttribute('aria-live', 'polite');
  saveNote.addEventListener('click', () => {
    const saved = updateModuleProgress(module.id, { note: noteInput.value });
    noteStatus.textContent = saved ? 'Catatan tersimpan di perangkat ini.' : 'Catatan belum tersimpan. Penyimpanan lokal tidak tersedia.';
  });
  noteSection.append(noteLabel, saveNote, noteStatus);
  article.append(noteSection);

  const headings = [...body.querySelectorAll('h2, h3')];
  const layout = el('div', undefined, 'module-reader-grid');
  layout.append(article);
  renderSidebars(module, layout, headings);
  renderModuleNavigation(module, layout);
  app.replaceChildren();
  const readingProgress = el('div', undefined, 'reading-progress');
  const readingFill = el('span');
  readingProgress.append(readingFill);
  readingProgress.setAttribute('role', 'progressbar');
  readingProgress.setAttribute('aria-label', 'Progres membaca');
  readingProgress.setAttribute('aria-valuemin', '0');
  readingProgress.setAttribute('aria-valuemax', '100');
  app.append(readingProgress, layout);
  mountDemos(body);

  const moduleControls = el('div', undefined, 'button-row module-controls');
  const completed = el('button', getState().modules[module.id]?.completed ? 'Tandai belum selesai' : 'Tandai selesai', 'button');
  completed.type = 'button';
  completed.addEventListener('click', () => {
    const nextValue = !getState().modules[module.id]?.completed;
    updateModuleProgress(module.id, { completed: nextValue, lastVisited: new Date().toISOString() });
    completed.textContent = nextValue ? 'Tandai belum selesai' : 'Tandai selesai';
  });
  moduleControls.append(completed);
  if (module.hasQuiz) moduleControls.append(makeLink(`#/modul/${module.id}/kuis`, 'Kerjakan kuis', 'secondary'));
  article.append(moduleControls);

  const updateReadingProgress = () => {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const value = Math.round((window.scrollY / maxScroll) * 100);
    readingFill.style.width = `${value}%`;
    readingProgress.setAttribute('aria-valuenow', String(value));
    if (scrollTimer) window.clearTimeout(scrollTimer);
    readerProgressFlush = () => updateModuleProgress(module.id, { lastVisited: new Date().toISOString(), scrollPct: value / 100 });
    scrollTimer = window.setTimeout(() => {
      if (readerProgressFlush) readerProgressFlush();
      readerProgressFlush = undefined;
      scrollTimer = undefined;
    }, 350);
  };
  scrollHandler = updateReadingProgress;
  window.addEventListener('scroll', scrollHandler, { passive: true });
  updateReadingProgress();
  updateModuleProgress(module.id, { lastVisited: new Date().toISOString() });

  resume.addEventListener('click', () => {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    window.scrollTo({ top: maxScroll * scrollPct, behavior });
  });
  const sectionId = route.query.get('bagian');
  if (sectionId) window.requestAnimationFrame(() => document.getElementById(sectionId)?.scrollIntoView());
}

function renderPlaceholder(route) {
  const labels = { quiz: 'Kuis', glossary: 'Glosarium', search: 'Pencarian', progress: 'Progres' };
  app.append(el('h1', labels[route.name] || 'Halaman tidak ditemukan'));
  app.append(el('p', 'Bagian ini akan tersedia pada milestone berikutnya. Anda dapat membuka daftar modul atau kembali ke beranda.', 'lead'));
  const row = el('div', undefined, 'button-row');
  row.append(makeLink('#/modul', 'Daftar modul'));
  row.append(makeLink('#/', 'Beranda', 'secondary'));
  app.append(row);
}

async function render(route) {
  const version = ++renderVersion;
  clearReaderTracking();
  app.replaceChildren();
  try {
    if (route.name === 'home') renderHome();
    else if (route.name === 'modules') renderModules(route);
    else if (route.name === 'quiz') await renderQuiz(route, version);
    else if (route.name === 'module') {
      const module = manifest.modules.find(item => item.id === route.params[0]);
      if (module) await renderModule(module, route, version);
      else renderPlaceholder({ name: 'not-found' });
    } else if (route.name === 'cpmk') renderCpmk();
    else if (route.name === 'assessment') renderAssessment(route);
    else if (route.name === 'glossary') renderGlossary(route);
    else if (route.name === 'flashcards') renderFlashcards();
    else if (route.name === 'search') await renderSearch(route, version);
    else if (route.name === 'progress') renderProgress(route);
    else renderPlaceholder(route);
  } catch (error) {
    if (version !== renderVersion) return;
    app.replaceChildren(
      el('h1', 'Konten belum dapat dimuat'),
      el('p', error.message || 'Terjadi kesalahan saat memuat konten.', 'notice'),
      makeLink('#/', 'Kembali ke beranda')
    );
  }
}

async function init() {
  setThemeAttribute();
  document.querySelector('#theme-toggle').addEventListener('click', () => {
    const themes = ['auto', 'light', 'dark'];
    const current = getState().settings.theme;
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    setTheme(next);
    setThemeAttribute();
    document.querySelector('#theme-toggle').setAttribute('aria-label', `Tema: ${next}. Ganti tema`);
  });
  const quickSearch = document.querySelector('#quick-search');
  quickSearch?.addEventListener('submit', event => {
    event.preventDefault();
    const query = new FormData(quickSearch).get('q')?.toString().trim() || '';
    location.hash = `#/cari${query ? `?q=${encodeURIComponent(query)}` : ''}`;
  });
  try {
    [course, manifest, glossary] = await Promise.all([loadCourse(), loadManifest(), loadGlossary()]);
  } catch (error) {
    app.replaceChildren(el('h1', 'Situs belum dapat dimuat'), el('p', `Jalankan situs melalui server lokal. ${error.message}`, 'notice'));
    return;
  }
  startRouter(route => render(route));
  if (!isStorageAvailable()) showNotice(app, 'Penyimpanan lokal tidak tersedia. Progres tidak akan tersimpan di sesi ini.');
}

void init();
