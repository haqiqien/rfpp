# Panduan Desain UI/UX

## 1. Arah desain
Tenang, akademis, fokus membaca. Terasa seperti buku catatan teknis yang rapi, bukan dasbor korporat.
Hindari tampilan templat generik: pilih satu identitas visual dan konsisten.
Prioritas: keterbacaan teks panjang dan rumus, lalu navigasi cepat, lalu interaksi demo.

## 2. Token desain (`css/tokens.css`)
Semua warna, spasi, dan tipografi lewat variabel CSS. Tema lewat atribut `data-theme="light|dark"` di `<html>`
(default mengikuti `prefers-color-scheme`).

| Token | Terang | Gelap |
|---|---|---|
| `--bg` | #FAF8F4 | #14161A |
| `--surface` | #FFFFFF | #1C1F25 |
| `--text` | #1E2430 | #E8E6E1 |
| `--text-muted` | #5B6475 | #9AA3B2 |
| `--accent` | #1F5F8B | #6FB1DE |
| `--accent-2` | #B4531D | #E59A63 |
| `--border` | #E3DED5 | #2C313A |
| `--ok` / `--warn` / `--err` | #2E7D4F / #A66A00 / #B3261E | #5BC285 / #E0A03A / #F2877F |

Rasio kontras teks ≥ 4,5:1 (isi) dan ≥ 3:1 (komponen UI besar). Boleh menyesuaikan nilai asal tetap lulus kontras
dan konsisten antar-tema. Warna bukan satu-satunya pembawa makna (tambahkan ikon/teks).

**Tipografi:** huruf sistem agar offline dan cepat; jika ingin font khusus, di-vendor ke `vendor/fonts/`.
- Isi: serif yang nyaman dibaca (mis. `"Iowan Old Style","Palatino Linotype",Georgia,serif`), 18px basis, line-height 1,7, lebar baca maks 70ch.
- UI/judul: sans (mis. `system-ui,-apple-system,"Segoe UI",Roboto,sans-serif`).
- Kode: `ui-monospace,"Cascadia Code",Menlo,Consolas,monospace`, 0,9em.
- Skala: 0,875 / 1 / 1,125 / 1,5 / 2 / 2,75 rem. Skala font pengguna (`fontScale`) dihormati.

**Spasi:** kelipatan 4px (`--space-1`..`--space-8`). Radius 8px kartu, 6px kontrol. Bayangan halus, tidak berlebihan.

## 3. Tata letak
- **Header** tetap: logo/judul pendek (MII226403), navigasi utama (Modul, CPMK, Glosarium, Penilaian, Progres), kotak cari, tombol tema.
- **Beranda:** hero ringkas (judul, deskripsi satu paragraf), bar progres keseluruhan, tombol "Lanjutkan: <modul terakhir>", kisi 6 kartu CPMK dengan jumlah modul/penyelesaian, daftar "Baru ditambahkan".
- **Penampil modul:** 3 kolom pada layar lebar (daftar modul kolaps / isi / daftar isi sticky), 1 kolom di ponsel dengan daftar isi sebagai panel tarik. Bilah progres baca tipis di atas. Kaki: tombol Tandai selesai, Kuis, Sebelumnya/Berikutnya.
- **Daftar modul:** kartu dengan judul, ringkasan, lencana CPMK, tag, estimasi menit, status selesai/draf, skor kuis.
- **Peta CPMK:** tabel/matriks CPMK × CPL, dan di bawahnya per CPMK daftar modul pemenuhnya. CPMK tanpa modul diberi keterangan "Belum ada materi".
- **Titik henti responsif:** 640, 960, 1280px. Mobile first.

## 4. Komponen
- **Callout** (`definisi`, `teorema`, `contoh`, `catatan`, `awas`, `tambahan`): bilah warna di sisi kiri + ikon + judul. `tambahan` memiliki lencana "Tambahan (bukan dari materi dosen)" dan latar yang jelas berbeda.
- **Rumus:** blok rumus bisa digulir horizontal pada layar kecil; fokus keyboard; tidak terpotong.
- **Tabel:** dibungkus wadah yang dapat digulir; header sticky pada tabel panjang.
- **Kode:** tombol salin, nomor baris opsional, penyorotan sintaks ringan buatan sendiri (tanpa library) atau tanpa warna.
- **Kuis:** satu soal per layar atau daftar; umpan balik langsung setelah menjawab; penjelasan terbuka; ringkasan akhir (skor, soal salah, tautan kembali ke bagian terkait); dapat diulang.
- **Demo:** kartu dengan judul, area canvas, kontrol (slider/tombol/pilihan), teks deskripsi, tombol "Reset". Tinggi tetap agar tidak melompat.
- **Lencana:** CPMK (mis. `CPMK 4`), status, tag; pil kecil.
- **Toast** untuk pemberitahuan singkat (aria-live polite).

## 5. Interaksi dan gerak
- Transisi 120 sampai 200 ms; hormati `prefers-reduced-motion` (matikan animasi non-esensial).
- Fokus terlihat jelas (outline 2px aksen). Tautan lewati-ke-konten di awal halaman.
- Simpan posisi gulir terakhir per modul dan tawarkan "Lanjutkan dari terakhir".

## 6. Aksesibilitas (WCAG 2.2 AA)
- Struktur semantik: `header`, `nav`, `main`, `article`, `aside`, urutan heading benar (satu `h1` per halaman).
- Semua kontrol dapat dioperasikan keyboard; urutan tab logis; pengelolaan fokus saat pindah rute (fokus ke `h1`, umumkan judul halaman lewat region `aria-live`).
- Gambar punya `alt`; diagram kompleks punya deskripsi panjang di teks.
- Demo: kontrol berlabel, nilai terkini dibacakan, alternatif teks hasil demo.
- Target sentuh ≥ 44px. Zoom hingga 200% tanpa kehilangan fungsi.
- Bahasa dokumen `lang="id"`; potongan Inggris diberi `lang="en"` bila panjang.

## 7. Cetak
`print.css`: sembunyikan navigasi, tampilkan isi modul satu kolom, warna aman cetak, tampilkan URL tautan eksternal,
hindari patah halaman di tengah rumus/callout/gambar.

## 8. Teks antarmuka (contoh, Bahasa Indonesia)
Modul · Peta CPMK · Glosarium · Penilaian · Progres · Cari materi… · Tandai selesai · Kerjakan kuis ·
Lanjutkan belajar · Belum ada materi · Draf · Tambahan · Ekspor progres · Impor progres · Mode gelap.
Nada: ringkas, sopan, tidak bertele-tele.
