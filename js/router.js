const ROUTES = [
  { pattern: /^\/$/, name: 'home' },
  { pattern: /^\/modul$/, name: 'modules' },
  { pattern: /^\/modul\/([^/]+)$/, name: 'module' },
  { pattern: /^\/modul\/([^/]+)\/kuis$/, name: 'quiz' },
  { pattern: /^\/cpmk$/, name: 'cpmk' },
  { pattern: /^\/glosarium$/, name: 'glossary' },
  { pattern: /^\/kartu$/, name: 'flashcards' },
  { pattern: /^\/penilaian$/, name: 'assessment' },
  { pattern: /^\/cari$/, name: 'search' },
  { pattern: /^\/progres$/, name: 'progress' }
];

export function resolveRoute(hash = location.hash) {
  const raw = (hash.startsWith('#') ? hash.slice(1) : hash) || '/';
  const [pathname, query = ''] = raw.split('?');
  for (const route of ROUTES) {
    const match = pathname.match(route.pattern);
    if (match) return { name: route.name, params: match.slice(1), query: new URLSearchParams(query) };
  }
  return { name: 'not-found', params: [], query: new URLSearchParams(query) };
}

export function startRouter(render) {
  let firstRender = true;
  const navigate = () => {
    const route = resolveRoute();
    const afterRender = () => {
      if (firstRender) { firstRender = false; return; }
      const heading = document.querySelector('#app h1');
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      const announcer = document.querySelector('#announcer');
      if (announcer) announcer.textContent = heading?.textContent || 'Halaman berubah';
      window.scrollTo(0, 0);
    };
    const result = render(route);
    if (result && typeof result.then === 'function') result.finally(afterRender);
    else afterRender();
  };
  window.addEventListener('hashchange', navigate);
  navigate();
  return () => window.removeEventListener('hashchange', navigate);
}
