# Arsitektur

## 1. Prinsip
- Statis penuh: HTML, CSS, JS (ES modules). Tidak ada build step untuk situs.
- **Konten terpisah dari kode.** Konten di `content/`, kode di `js/`, `css/`.
- **Data-driven:** semua daftar (modul, CPMK, glosarium) dibaca dari JSON/Markdown saat runtime.
- Routing sisi klien berbasis hash (`#/…`) agar jalan di hosting statis mana pun tanpa konfigurasi server.
- Path selalu relatif (mis. `./content/...`), agar bisa di-host di sub-path (GitHub Pages).

## 2. Struktur folder
```
/
├─ index.html                 # shell aplikasi (satu-satunya halaman HTML)
├─ AGENTS.md
├─ docs/                      # dokumen spesifikasi ini + RPKPS.md + OPEN_QUESTIONS.md
├─ css/
│  ├─ tokens.css              # variabel desain (warna, spasi, tipografi, tema)
│  ├─ base.css                # reset, tipografi dasar, layout
│  ├─ components.css          # kartu, tombol, callout, kuis, tabel, dll.
│  └─ print.css
├─ js/
│  ├─ main.js                 # titik masuk: init, router, tema
│  ├─ router.js               # hash router
│  ├─ store.js                # akses localStorage (progres, catatan, pengaturan), berversi
│  ├─ content-loader.js       # fetch + cache manifest, modul, kuis, glosarium
│  ├─ markdown.js             # pipeline Markdown → HTML (marked + direktif + KaTeX + DOMPurify)
│  ├─ search.js               # indeks dan pencarian
│  ├─ quiz.js                 # mesin kuis
│  ├─ views/
│  │  ├─ home.js
│  │  ├─ modules.js           # daftar modul + filter
│  │  ├─ module.js            # penampil modul
│  │  ├─ cpmk.js
│  │  ├─ glossary.js
│  │  ├─ assessment.js
│  │  ├─ search.js
│  │  └─ progress.js
│  ├─ components/             # elemen UI kecil (function yang mengembalikan DOM)
│  └─ demos/
│     ├─ registry.js          # peta id → modul demo (dimuat malas dengan import())
│     └─ <nama-demo>.js
├─ vendor/                    # marked, katex (+fonts), dompurify; VERSIONS.md
├─ content/
│  ├─ manifest.json           # daftar modul terurut (SATU-SATUNYA file indeks)
│  ├─ course.json             # metadata mata kuliah, CPMK, CPL, penilaian, referensi
│  ├─ glossary.json
│  ├─ search-index.json       # dihasilkan oleh tools/build-index.mjs
│  └─ modules/
│     └─ <id-modul>/
│        ├─ index.md          # materi (front matter + isi)
│        ├─ quiz.json         # opsional
│        └─ assets/           # gambar, data demo
├─ sources/                   # file asli dari dosen (PDF/PPTX/ipynb), tidak disajikan ke pengguna akhir
├─ tools/
│  ├─ validate-content.mjs    # validasi manifest, front matter, kuis, tautan, ID unik
│  ├─ build-index.mjs         # bangun search-index.json
│  └─ new-module.mjs          # perancah modul baru (folder + front matter + entri manifest)
└─ tests/                     # uji ringan (opsional): parser front matter, mesin kuis
```
Alat di `tools/` adalah skrip Node **hanya untuk pengembangan** (tidak dimuat di browser).
Tanpa dependensi npm; gunakan modul bawaan Node.

## 3. Alur data
1. `main.js` memuat `course.json` dan `manifest.json` (di-cache di memori).
2. Router memetakan `#/modul/<id>` → `views/module.js`.
3. `content-loader` mengambil `content/modules/<id>/index.md` dan `quiz.json`, lalu cache.
4. `markdown.js` mengurai front matter, memproses direktif, merender Markdown, KaTeX, sanitasi.
5. Direktif `:::demo <id>` menghasilkan placeholder; `demos/registry.js` memuat demo dengan `import()` saat terlihat.
6. `store.js` menyimpan progres per ID modul.

## 4. Rute
| Hash | Tampilan |
|---|---|
| `#/` | Beranda |
| `#/modul` | Daftar modul (query: `?cpmk=3&tag=audio&status=terbit`) |
| `#/modul/<id>` | Penampil modul (`?bagian=<anchor>`) |
| `#/modul/<id>/kuis` | Kuis modul |
| `#/cpmk` | Peta CPMK |
| `#/glosarium` | Glosarium (`?istilah=<id>`) |
| `#/kartu` | Kartu hafalan dari istilah glosarium |
| `#/penilaian` | Blueprint penilaian dan referensi |
| `#/cari?q=...` | Hasil pencarian |
| `#/progres` | Ringkasan progres, ekspor/impor |

Rute tidak dikenal menampilkan halaman 404 yang ramah dengan tautan ke beranda.

## 5. Penyimpanan lokal (`store.js`)
Kunci tunggal `rfpp:v1` berisi JSON:
```json
{
  "schemaVersion": 1,
  "settings": { "theme": "auto", "fontScale": 1 },
  "modules": {
    "<id-modul>": { "completed": false, "lastVisited": "ISO-8601", "scrollPct": 0.4,
                     "quizBest": 0.8, "quizAttempts": 2, "note": "" }
  }
}
```
- Migrasi berdasarkan `schemaVersion`.
- Bungkus akses `localStorage` dalam try/catch (mode privat dapat menolak). Jika gagal, jalan tanpa penyimpanan dan tampilkan pemberitahuan kecil.
- Ekspor/impor: unduh/unggah JSON yang sama.

## 6. Pencarian
- `tools/build-index.mjs` membaca semua modul terbit dan menulis `content/search-index.json`
  (id, judul, bagian/heading, potongan teks bersih tanpa rumus, tag).
- Klien memakai pencarian sederhana: tokenisasi, normalisasi huruf kecil dan diakritik, skor dengan bobot (judul > heading > isi). Tanpa library eksternal.
- Jika `search-index.json` tidak ada, fallback: bangun indeks saat load dari modul (lebih lambat). Dokumentasikan di README repo.

## 7. Pipeline Markdown (`markdown.js`)
Urutan:
1. Pisahkan front matter (parser YAML-sederhana, lihat `CONTENT_SCHEMA.md`).
2. Pra-proses direktif `:::` (callout, demo, definisi, contoh, rumus penting, tab).
3. Lindungi rumus (`$…$`, `$$…$$`) dari Markdown, lalu render dengan KaTeX (`throwOnError:false`).
4. Render dengan `marked`; beri `id` pada heading (slug) untuk daftar isi.
5. Sanitasi dengan DOMPurify (izinkan MathML/SVG KaTeX, blokir skrip dan handler `on*`).
6. Pasca-proses: tautan glosarium (`[[istilah]]`), gambar `loading="lazy"`, tautan eksternal `rel="noopener"`.

## 8. Demo interaktif
Kontrak tiap demo di `js/demos/<id>.js`:
```js
export const meta = { id: 'pca-2d', title: 'PCA 2D', description: '...' };
export function mount(container, options = {}) { /* bangun UI, kembalikan fungsi cleanup */ return () => {}; }
```
- Gunakan Canvas 2D atau SVG; tanpa library grafik eksternal.
- Harus responsif, bisa dioperasikan keyboard (slider/tombol), dan memiliki deskripsi teks (`aria-describedby`).
- Data acak harus punya *seed* yang dapat diatur agar hasil dapat direproduksi.
- Bersihkan listener/animasi di fungsi cleanup.

## 9. Deployment
- Target utama: GitHub Pages (branch `main`, root). Alternatif: Netlify atau server statis apa pun.
- Tidak butuh konfigurasi tambahan karena routing berbasis hash dan path relatif.
- (Opsional F15) `sw.js` dan `site.webmanifest`; strategi *stale-while-revalidate* untuk `content/`, *cache-first* untuk `vendor/` dan `css/`. Naikkan `CACHE_VERSION` saat konten berubah.

## 10. Keputusan dan alasan
| Keputusan | Alasan |
|---|---|
| Hash routing | Tidak perlu aturan rewrite server; aman di sub-path. |
| Markdown + front matter per modul | Mudah diedit, di-diff, dan dihasilkan agen dari materi mentah. |
| Satu manifest | Menambah materi = satu entri; urutan eksplisit. |
| Library di-vendor | Offline, versi terkunci, tanpa risiko CDN. |
| Tanpa framework | Sederhana, tahan lama, mudah dipahami agen dan manusia. |
