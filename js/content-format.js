export function parseFrontMatter(source) {
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/);
  if (lines[0]?.trim() !== '---') throw new Error('Front matter harus diawali dengan --- pada baris pertama.');
  const end = lines.indexOf('---', 1);
  if (end < 0) throw new Error('Front matter tidak memiliki penutup ---.');
  const data = {}; let currentList = null;
  for (const line of lines.slice(1, end)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && currentList) { data[currentList].push(parseScalar(item[1])); continue; }
    const entry = line.match(/^([\w-]+):\s*(.*)$/);
    if (!entry) throw new Error(`Baris front matter tidak didukung: ${line}`);
    const [, key, raw] = entry; currentList = null;
    if (!raw) { data[key] = []; currentList = key; }
    else if (raw.startsWith('[') && raw.endsWith(']')) data[key] = raw.slice(1, -1).split(',').map(value => parseScalar(value.trim())).filter(value => value !== '');
    else data[key] = parseScalar(raw);
  }
  return { data, body: lines.slice(end + 1).join('\n') };
}
function parseScalar(raw) {
  const value = raw.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value.slice(1, -1);
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

export function transformDirectives(source) {
  const lines = source.split(/\r?\n/);
  const output = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim() === ':::tab') {
      const panels = []; let title = null; let content = []; let closed = false;
      for (i += 1; i < lines.length; i += 1) {
        const panel = lines[i].match(/^\s*::tab\s+(.+)$/);
        if (panel) {
          if (title) panels.push(`<details><summary>${escapeHtml(title)}</summary>${marked.parse(content.join('\n'))}</details>`);
          title = panel[1]; content = []; continue;
        }
        if (lines[i].trim() === ':::') { closed = true; break; }
        content.push(lines[i]);
      }
      if (!closed) throw new Error('Direktif :::tab tidak ditutup.');
      if (title) panels.push(`<details><summary>${escapeHtml(title)}</summary>${marked.parse(content.join('\n'))}</details>`);
      if (!panels.length) throw new Error('Direktif :::tab harus memiliki setidaknya satu panel ::tab.');
      output.push(`<div class="tab-group">${panels.join('')}</div>`);
      continue;
    }
    const directive = lines[i].match(/^\s*:::(definisi|teorema|contoh|catatan|awas|tambahan)\s*(.*)$/i);
    const demo = lines[i].match(/^\s*:::demo\s+([\w-]+)(?:\s+\{([^}]*)\})?\s*$/);
    if (directive) {
      const kind = directive[1].toLowerCase(); const title = directive[2] || kind;
      const inner = []; let closed = false;
      for (i += 1; i < lines.length; i += 1) { if (lines[i].trim() === ':::') { closed = true; break; } inner.push(lines[i]); }
      if (!closed) throw new Error(`Direktif :::${kind} tidak ditutup.`);
      const badge = kind === 'tambahan' ? '<span class="badge">Tambahan (bukan materi dosen)</span>' : '';
      output.push(`<section class="callout" data-kind="${kind}"><h3>${escapeHtml(title)} ${badge}</h3>${marked.parse(inner.join('\n'))}</section>`);
    } else if (demo) {
      const opts = escapeHtml(demo[2] || '');
      output.push(`<div class="demo-placeholder notice" data-demo="${escapeHtml(demo[1])}" data-options="${opts}" role="status" aria-live="polite">Demo “${escapeHtml(demo[1])}” belum tersedia.</div>`);
    } else if (/^\s*:::/i.test(lines[i])) throw new Error(`Direktif tidak dikenal: ${lines[i].trim()}`);
    else output.push(lines[i]);
  }
  return output.join('\n');
}
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
import { marked } from '../vendor/marked/marked.esm.js';

