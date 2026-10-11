# AGENTS.md: Aturan Kerja untuk Agen Coding

Proyek: situs belajar statis untuk mata kuliah **Rekayasa Fitur dan Pengenalan Pola (MII226403)**,
Magister Ilmu Komputer UGM. Bahasa antarmuka dan konten: **Bahasa Indonesia** (istilah teknis
boleh tetap Inggris, mis. *feature extraction*, *PCA*, *k-NN*).

## Baca dulu
`docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/CONTENT_SCHEMA.md`, `docs/INGEST_WORKFLOW.md`,
`docs/DESIGN.md`, `docs/COURSE_CONTEXT.md`, `docs/TASKS.md`.

## Batasan teknis (wajib)
- Hanya HTML, CSS, JavaScript (ES modules, tanpa transpiler). **Tanpa npm/build step** untuk runtime situs.
- Tanpa framework (React/Vue dsb). Library pihak ketiga hanya yang di-*vendor* (disalin) ke `vendor/`
  dengan versi tercatat di `vendor/VERSIONS.md`. Dilarang memuat dari CDN saat runtime (harus bisa offline).
  Library yang diizinkan: `marked` (Markdown), `KaTeX` (rumus), `DOMPurify` (sanitasi).
- Situs harus jalan sebagai file statis (GitHub Pages / server statis apa pun) dengan **path relatif**.
- Tidak ada backend. Progres belajar disimpan di `localStorage`.
- Aksesibel (WCAG AA), responsif (mobile first), mendukung mode terang/gelap.

## Aturan konten (paling penting)
1. **Jangan mengarang materi.** Isi konten hanya dari file di `sources/` atau dari RPKPS.
   Jika perlu penjelasan tambahan, tandai dengan blok `:::note Tambahan` dan beri label jelas
   bahwa itu bukan dari materi dosen.
2. Jangan mengubah makna rumus/definisi. Jika ragu pada hasil ekstraksi (OCR, rumus), beri penanda
   `<!-- TODO: verifikasi -->` dan catat di `docs/OPEN_QUESTIONS.md`.
3. Simpan file sumber asli di `sources/` (jangan dihapus/diubah). Setiap modul mencantumkan sumbernya.
4. Penambahan materi **tidak boleh mengubah kode aplikasi**. Cukup tambah folder di `content/modules/`
   dan entri di `content/manifest.json`. Jika butuh perubahan kode, jadikan commit terpisah.
5. Hormati hak cipta: jangan menyalin utuh buku referensi. Hanya materi yang diberikan pengguna.

## Aturan kode
- Struktur dan nama file mengikuti `docs/ARCHITECTURE.md`. Jangan membuat struktur baru tanpa alasan.
- ES modules, `const`/`let`, fungsi kecil, komentar singkat berbahasa Indonesia atau Inggris (konsisten).
- Semua teks dari konten harus disanitasi (DOMPurify) sebelum dimasukkan ke DOM.
- Tidak ada `eval`, tidak ada `innerHTML` dari data yang tidak disanitasi.
- Demo interaktif ditulis sebagai modul terpisah di `js/demos/` dan didaftarkan di `js/demos/registry.js`.

## Alur kerja
- Kerjakan per milestone di `docs/TASKS.md`. Centang item yang selesai dan perbarui file itu.
- Commit kecil dengan pesan jelas (`feat:`, `content:`, `fix:`, `docs:`).
- Sebelum selesai: jalankan `node tools/validate-content.mjs` (validator konten, lihat TASKS M1)
  dan pastikan tidak ada error. Buka situs lewat server lokal dan cek halaman utama, satu modul,
  kuis, dan pencarian.
- Di akhir tiap tugas, laporkan: apa yang dibuat, apa yang di-TODO, pertanyaan terbuka.

## Yang tidak boleh dilakukan
- Menambah dependensi runtime baru tanpa persetujuan.
- Menghapus atau menulis ulang konten yang sudah ada saat menambah materi baru.
- Mengubah ID modul yang sudah dipublikasikan (ID dipakai untuk menyimpan progres).
