import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontMatter } from '../js/content-format.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifest = JSON.parse(await readFile(resolve(root, 'content/manifest.json'), 'utf8'));
const entries = [];
for (const module of manifest.modules.filter(item => item.status === 'terbit')) {
  const source = await readFile(resolve(root, 'content', module.path, 'index.md'), 'utf8');
  const { body } = parseFrontMatter(source);
  const headings = [...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map(match => match[1].trim());
  const text = body.replace(/```[\s\S]*?```/g, ' ').replace(/\$\$?[\s\S]+?\$?\$/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/[#>*`|_[\](){},]/g, ' ').replace(/\s+/g, ' ').trim();
  entries.push({ id: module.id, title: module.title, headings, text, tags: module.tags });
}
await writeFile(resolve(root, 'content/search-index.json'), `${JSON.stringify({ schemaVersion: 1, entries }, null, 2)}\n`, 'utf8');
console.log(`Indeks pencarian dibuat: ${entries.length} modul terbit.`);
