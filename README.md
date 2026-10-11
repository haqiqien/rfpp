# Situs Belajar MII226403

Situs statis untuk mata kuliah **Rekayasa Fitur dan Pengenalan Pola**. Runtime menggunakan HTML, CSS, JavaScript ES modules, dan library lokal di `vendor/`; tidak ada framework, backend, atau build step.

Beranda, daftar modul, pembaca modul, peta CPMK, penilaian/referensi, kuis, pencarian, glosarium, kartu hafalan, catatan pribadi, dan progres tersedia.

## Menjalankan lokal

Gunakan server statis dari root proyek (jangan membuka `index.html` langsung karena situs mengambil konten dengan `fetch`):

```powershell
python -m http.server 8000
```

Buka <http://localhost:8000>.

## Menambah materi

1. Simpan berkas asli dosen di `sources/<nama-batch>/` tanpa mengubahnya.
2. Ikuti [`docs/INGEST_WORKFLOW.md`](docs/INGEST_WORKFLOW.md), lalu tambahkan modul dan entri manifest.
3. Jalankan `node tools/validate-content.mjs` serta `node tools/build-index.mjs`.

Untuk membuat kerangka modul draf, jalankan:

```powershell
node tools/new-module.mjs p01-topik-singkat "Judul Modul" --cpmk MII226403.1
```

Modul `p01-pengantar-pattern-recognition` berasal dari HTML materi yang disediakan pemilik. Modul contoh teknis awal telah dihapus setelah materi kuliah pertama diterbitkan.

## Struktur penting

- `content/`: metadata, manifest, glosarium, indeks, dan modul Markdown.
- `js/`, `css/`: aplikasi statis dan antarmuka.
- `vendor/`: salinan library lokal beserta versi dan lisensi.
- `sources/`: materi asli yang disediakan pemilik.
- `docs/`: spesifikasi dan alur kerja proyek.

## Progres belajar

Progres dan catatan pribadi per modul tersimpan di browser pada `localStorage` dengan kunci `rfpp:v1`. Halaman Progres menyediakan ekspor dan impor berkas JSON versi 1. Kuis mendukung pilihan tunggal, pilihan jamak, benar/salah, dan isian pendek. Kartu hafalan memakai istilah dan definisi dari glosarium.

## Pencarian dan glosarium

Indeks pencarian dibuat dengan `node tools/build-index.mjs`. Jika indeks belum tersedia, situs menyusun fallback di browser dari modul terbit. Glosarium dimuat dari `content/glossary.json`.
