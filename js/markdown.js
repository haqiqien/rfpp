import { marked } from '../vendor/marked/marked.esm.js';
import katex from '../vendor/katex/katex.mjs';
import DOMPurify from '../vendor/dompurify/purify.es.mjs';
import { parseFrontMatter, transformDirectives } from './content-format.js';

marked.setOptions({ gfm: true, breaks: false });
export { parseFrontMatter, transformDirectives } from './content-format.js';

function protectMath(source) {
  const expressions = [];
  const protectedText = source.replace(/\$\$([\s\S]+?)\$\$|\$([^\n$]+?)\$/g, (_match, display, inline) => {
    const index = expressions.push({ value: display || inline, display: Boolean(display) }) - 1;
    return ` RFPPMATH${index}TOKEN `;
  });
  return { protectedText, expressions };
}
function replaceGlossary(source, glossary = []) {
  const ids = new Set(glossary.map(term => term.id));
  return source.replace(/\[\[([\w-]+)(?:\|([^\]]+))?\]\]/g, (_m, id, label) => ids.has(id) ? `[${label || glossary.find(term => term.id === id)?.term || id}](#/glosarium?istilah=${encodeURIComponent(id)})` : `[[${id}]]`)
    .replace(/\[ref:([\w-]+)\]/g, (_m, id) => `[Referensi ${id}](#/penilaian?ref=${encodeURIComponent(id)})`);
}

export function renderMarkdown(source, { glossary = [] } = {}) {
  const { data, body } = parseFrontMatter(source);
  const linked = replaceGlossary(body, glossary);
  const { protectedText, expressions } = protectMath(linked);
  const directed = transformDirectives(protectedText);
  const dirty = marked.parse(directed);
  const clean = DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true, svg: true, mathMl: true }, ADD_ATTR: ['data-kind', 'data-demo', 'data-options', 'loading'] });
  const template = document.createElement('template'); template.innerHTML = clean;
  const headingIds = new Map();
  for (const heading of template.content.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    const base = heading.textContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'bagian';
    const count = headingIds.get(base) || 0; headingIds.set(base, count + 1);
    heading.id = count ? `${base}-${count + 1}` : base;
  }
  const glossaryById = new Map(glossary.map(term => [term.id, term]));
  let tooltipIndex = 0;
  for (const link of template.content.querySelectorAll('a[href^="#/glosarium?istilah="]')) {
    const termId = new URL(link.getAttribute('href'), location.href).searchParams.get('istilah');
    const term = glossaryById.get(termId);
    if (!term?.definition) continue;
    const wrapper = document.createElement('span');
    wrapper.className = 'glossary-tooltip';
    const tooltip = document.createElement('span');
    tooltip.className = 'glossary-tooltip-content';
    tooltip.id = `glossary-tip-${term.id}-${++tooltipIndex}`;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.textContent = term.definition;
    link.setAttribute('aria-describedby', tooltip.id);
    wrapper.append(link, tooltip);
    link.replaceWith(wrapper);
  }
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  const textNodes = []; while (walker.nextNode()) textNodes.push(walker.currentNode);
  for (const node of textNodes) {
    if (!/RFPPMATH\d+TOKEN/.test(node.nodeValue)) continue;
    const fragment = document.createDocumentFragment();
    const parts = node.nodeValue.split(/(RFPPMATH\d+TOKEN)/g);
    for (const part of parts) {
      const match = part.match(/^RFPPMATH(\d+)TOKEN$/);
      if (!match) { fragment.append(document.createTextNode(part)); continue; }
      const expression = expressions[Number(match[1])]; const span = document.createElement('span');
      try { span.innerHTML = DOMPurify.sanitize(katex.renderToString(expression.value, { displayMode: expression.display, throwOnError: false, output: 'htmlAndMathml' }), { USE_PROFILES: { html: true, svg: true, mathMl: true } }); }
      catch { span.textContent = expression.value; }
      fragment.append(span);
    }
    node.replaceWith(fragment);
  }
  for (const image of template.content.querySelectorAll('img')) image.loading = 'lazy';
  for (const link of template.content.querySelectorAll('a[href^="http"]')) { link.rel = 'noopener noreferrer'; link.target = '_blank'; }
  return { meta: data, html: template.innerHTML };
}
