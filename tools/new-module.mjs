import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [id, title, ...args] = process.argv.slice(2);
const cpmkIndex = args.indexOf('--cpmk'); const cpmk = cpmkIndex >= 0 ? args[cpmkIndex + 1] : null;
if (!id || !title || !cpmk || !/^(p\d{2}-[a-z0-9-]+|s-[a-z0-9-]+)$/.test(id)) {
  console.error('Pakai: node tools/new-module.mjs <id> "<judul>" --cpmk MII226403.1'); process.exit(1);
}
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifestPath = resolve(root, 'content/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.modules.some(module => module.id === id)) { console.error(`ID ${id} sudah ada.`); process.exit(1); }
const course = JSON.parse(await readFile(resolve(root, 'content/course.json'), 'utf8'));
if (!course.cpmk.some(item => item.code === cpmk)) { console.error(`CPMK ${cpmk} tidak ditemukan di course.json.`); process.exit(1); }
const modulePath = resolve(root, 'content/modules', id);
await mkdir(modulePath, { recursive: false });
const date = new Date().toISOString().slice(0, 10);
const safeTitle = title.replace(/[\r\n]/g, ' ').replace(/"/g, '\\"');
await writeFile(resolve(modulePath, 'index.md'), `---\nid: ${id}\ntitle: "${safeTitle}"\ncpmk: [${cpmk}]\nsummary: Ringkasan modul ini belum ditulis.\nobjectives: []\nprerequisites: []\nsources: []\nauthors: Pemilik situs\nupdated: ${date}\n---\n\n## Ringkasan Konsep\n\nTulis materi berdasarkan sumber dosen atau RPKPS.\n`, 'utf8');
manifest.modules.push({ id, title, summary: 'Ringkasan modul ini belum ditulis.', path: `modules/${id}`, cpmk: [cpmk], order: Math.max(0, ...manifest.modules.map(item => item.order)) + 1, status: 'draf', tags: ['draf'], estimatedMinutes: 15, hasQuiz: false, added: date });
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Modul draf dibuat: ${id}. Tambahkan sumber dan isi sebelum diterbitkan.`);
