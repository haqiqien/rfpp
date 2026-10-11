# Alur Memasukkan Materi Baru (Ingest Workflow)

Dipakai setiap kali pemilik memberi file materi baru. Tujuan: konversi **setia** ke modul,
tanpa menyentuh kode aplikasi.

## Masukan
Folder `sources/<nama>/` berisi satu atau lebih: PDF, PPTX, DOCX, notebook `.ipynb`, gambar, dataset kecil.
Pemilik biasanya menyebut: nomor pertemuan/topik, CPMK terkait (bila tahu).

## Langkah

### 1. Inventarisasi
- Daftar semua file, jenis, jumlah halaman/slide.
- Tentukan CPMK terkait dari isi (lihat `COURSE_CONTEXT.md`). Jika ambigu, pilih yang paling mungkin dan
  catat asumsi di `docs/OPEN_QUESTIONS.md`.
- Tentukan apakah materi menjadi **satu modul** atau **beberapa modul** (aturan: satu modul ≈ 15 sampai 40 menit baca;
  pecah bila lebih dari itu atau bila ada topik jelas berbeda).

### 2. Ekstraksi
- Ekstrak teks dan gambar per halaman/slide. Simpan gambar penting ke `content/modules/<id>/assets/`.
- Rumus: tulis ulang ke LaTeX. Bandingkan dengan gambar halaman aslinya. Jika ragu, beri `<!-- TODO: verifikasi -->`.
- Tabel: ubah ke tabel Markdown; bila terlalu kompleks, simpan sebagai gambar dengan `alt` deskriptif plus ringkasan teks.
- Kode/notebook: pindahkan ke blok kode berlabel bahasa; sertakan keluaran penting (teks/gambar) sebagai cuplikan.
- Bahasa: pertahankan bahasa asli materi. Jangan menerjemahkan istilah teknis.

### 3. Penyusunan modul
- Buat folder lewat `node tools/new-module.mjs <id> "<judul>" --cpmk MII226403.4` (atau manual sesuai `CONTENT_SCHEMA.md`).
- Susun `index.md` mengikuti struktur bagian yang disarankan. Urutan dan kedalaman mengikuti materi dosen.
- Ringkas **hanya** dari materi. Rangkuman dan Tujuan Belajar disusun dari isi materi; jika tujuan belajar tidak
  eksplisit, turunkan dari judul bagian dan beri tanda `origin: agen` di `objectives` komentar.
- Penjelasan di luar materi → blok `:::tambahan`, singkat dan berlabel. Jangan menambah klaim teknis baru di luar blok itu.
- Istilah penting → tambah/ perbarui `glossary.json` dan tautkan `[[...]]` pada kemunculan pertama.
- Cantumkan `sources` (path file asli) di front matter, dan sumber hlm/slide di keterangan gambar.

### 4. Kuis
- Buat 5 sampai 10 soal dari isi materi (campur tipe), dengan penjelasan dan `source`.
- Sebarkan tingkat kesulitan 1 sampai 3. Minimal separuh soal menguji pemahaman, bukan hafalan istilah.
- Beri `"origin": "agen"` pada soal buatan agen.
- Bila materi memuat soal latihan dosen, masukkan sebagai bagian `## Latihan` (bukan kuis otomatis) lengkap dengan
  kunci jawaban hanya bila dosen menyediakannya.

### 5. Demo interaktif (opsional, bila materi menuntut)
- Cek `PRD.md` §7. Bangun demo hanya bila topik modul ini cocok dan belum ada demonya.
- Ikuti kontrak demo di `ARCHITECTURE.md` §8. Daftarkan di `js/demos/registry.js`.
- Ini perubahan kode: lakukan di commit terpisah dengan pesan `feat(demo): ...`.

### 6. Registrasi
- Tambahkan entri di `content/manifest.json` (status awal `draf` bila masih ada TODO verifikasi, selain itu `terbit`).
- Jalankan: `node tools/validate-content.mjs` dan `node tools/build-index.mjs`. Perbaiki semua error.

### 7. Verifikasi manual
- Jalankan `python -m http.server 8000`, buka modul baru: cek rumus, gambar, daftar isi, kuis, pencarian, navigasi.
- Bandingkan visual dengan slide asli pada 3 halaman acak.

### 8. Laporan (wajib)
Tulis ringkasan dalam balasan:
- Modul yang dibuat (ID, judul, CPMK).
- Jumlah TODO verifikasi dan lokasinya.
- Asumsi dan pertanyaan terbuka.
- Soal kuis yang dibuat agen (jumlah).
- Perubahan kode (bila ada).

## Prinsip penting
- **Setia pada sumber.** Jangan memperbaiki "kesalahan" dosen secara diam-diam. Tandai di `OPEN_QUESTIONS.md`.
- **Tambahan bukan pengganti.** Penjelasan agen tidak boleh menggantikan isi materi.
- **Inkremental.** Jangan menyusun ulang modul lama. Jika materi baru memperluas modul lama, buat modul baru dan
  tautkan, atau minta persetujuan pemilik sebelum mengubah modul terbit.
- **Rapi.** Satu permintaan ingest = satu commit `content: tambah <id>`.

## Templat `docs/OPEN_QUESTIONS.md`
```markdown
# Pertanyaan Terbuka
| Tanggal | Modul | Pertanyaan/asumsi | Status |
|---|---|---|---|
```
