# Roadmap dan Checklist

Centang `[x]` saat selesai. Kerjakan berurutan; berhenti dan lapor di akhir tiap milestone.
Jangan membangun fitur yang bergantung pada materi yang belum ada (terutama demo F11).

## M0: Fondasi proyek
- [x] Inisialisasi struktur folder sesuai `ARCHITECTURE.md` §2 (folder kosong diberi `.gitkeep`)
- [x] `index.html` shell: `lang="id"`, meta viewport, tautan lewati-ke-konten, header, `<main id="app">`, footer
- [x] `css/tokens.css`, `base.css`, `components.css`, `print.css` sesuai `DESIGN.md`
- [x] Vendor library: `marked`, `katex` (+ CSS + fonts), `dompurify` ke `vendor/` dan catat versi di `vendor/VERSIONS.md`
      (jika tidak ada akses jaringan, tulis instruksi unduh manual dan stub, lalu lapor)
- [x] `js/main.js`, `router.js` (hash router, 404, fokus ke h1 saat pindah rute), `store.js` (versi 1, try/catch)
- [x] Pengalih tema terang/gelap/otomatis tersimpan di store
- [x] `docs/RPKPS.md` dan `docs/OPEN_QUESTIONS.md` ada
- [x] `.gitignore`, `README.md` repo (cara jalankan lokal, cara tambah materi → rujuk `INGEST_WORKFLOW.md`)

**Selesai bila:** situs terbuka lewat server lokal, tema berfungsi, rute dasar tampil tanpa error konsol.

## M1: Mesin konten
- [x] `content/course.json` dari `COURSE_CONTEXT.md` dan `RPKPS.md` (teks CPMK/CPL persis seperti sumber)
- [x] `content/manifest.json` (satu modul contoh berstatus draf), `content/glossary.json` (`terms: []`)
- [x] `js/content-loader.js` (fetch, cache, penanganan galat jaringan dengan pesan ramah)
- [x] `js/markdown.js`: front matter, direktif `:::`, KaTeX, `marked`, DOMPurify, slug heading, `[[glosarium]]`, `[ref:id]`
- [x] `tools/validate-content.mjs` sesuai `CONTENT_SCHEMA.md` §7
- [x] `tools/new-module.mjs` (perancah modul + entri manifest `draf`)
- [x] `tools/build-index.mjs` (tulis `content/search-index.json`)
- [x] **Modul contoh `s-contoh-format`** (status `draf`): memperagakan semua fitur format (rumus, tabel, gambar, semua direktif, kuis). Berisi teks netral tentang cara memakai situs, **bukan** materi kuliah.
- [x] Uji ringan parser front matter dan direktif (`tests/`, dijalankan `node --test`)

**Selesai bila:** `validate-content` lulus, modul contoh tampil sempurna termasuk rumus dan callout.

## M2: Tampilan inti (MVP bagian 1)
- [x] Beranda (F1) dengan progres, lanjutkan belajar, CPMK, modul terbaru, dan keadaan kosong ramah
- [x] Daftar modul + filter CPMK/tag/status (F2)
- [x] Penampil modul + daftar isi + navigasi sebelumnya/berikutnya + posisi gulir (F3)
- [x] Peta CPMK (F4) dengan matriks CPMK × CPL dan keadaan "Belum ada materi"
- [x] Halaman Penilaian dan Referensi (F10)
- [x] Komponen gaya: callout, kode dengan tombol salin, tabel bergulir

## M3: Belajar aktif (MVP bagian 2)
- [x] Mesin kuis semua tipe + halaman hasil (F5) + uji ringan penilaian
- [x] Progres, tandai selesai, ekspor/impor JSON (F6)
- [x] Glosarium + tooltip/tautan (F8; tooltip tampil jika definisi istilah tersedia)
- [x] Pencarian (F7) dengan indeks dan fallback

**Selesai bila:** semua F1 sampai F10 berfungsi dengan modul contoh; audit manual aksesibilitas (keyboard, kontras, pembaca layar dasar) lulus. Audit manual masih menunggu browser.

## M4: Materi pertama (ritme inkremental dimulai)
- [x] Terima berkas `materi/1.belajar-pattern-recognition.html`; salin utuh ke `sources/`, susun, validasi, dan terbitkan modul pertama sesuai `INGEST_WORKFLOW.md`.
- [x] Setelah modul nyata pertama terbit, hapus `s-contoh-format` sesuai keputusan pemilik.

## M5: Demo interaktif (dikerjakan seiring materi tersedia)
Bangun hanya bila materi terkait sudah ada. Daftar di `PRD.md` §7.
- [x] Kerangka `js/demos/registry.js` + pemuatan malas direktif `:::demo`
- [x] Demo dari materi p01: pencocokan grid template dan kurva peluang diameter ilustratif
- [ ] Demo 1: normalisasi
- [ ] Demo 2: PCA 2D
- [ ] Demo 3: k-NN
- [ ] Demo 4: sinyal 1D dan FFT
- [ ] Demo 5: konvolusi citra
- [ ] Demo 6: selisih frame / optical flow sederhana
- [ ] Demo 7: evaluasi (konfusi, ROC)

## M6: Penyempurnaan
- [x] Kartu hafalan (F12), dibuat dari istilah glosarium
- [x] Catatan pribadi per modul (F13), tersimpan di `localStorage` serta masuk ekspor/impor progres
- [ ] Gaya cetak (F14) diuji
- [ ] PWA offline (F15)
- [ ] Audit Lighthouse (target di `PRD.md` §8) dan perbaikan
- [ ] Dokumentasi akhir: `README.md` diperbarui, panduan singkat untuk pemilik

## Definisi selesai (berlaku untuk semua tugas)
- Tidak ada galat di konsol pada rute yang disentuh.
- `node tools/validate-content.mjs` lulus.
- Teks UI Bahasa Indonesia, konsisten dengan `DESIGN.md` §8.
- Dokumen ini dan `OPEN_QUESTIONS.md` diperbarui.
- Laporan akhir berisi: yang dibuat, yang ditunda, pertanyaan terbuka.
