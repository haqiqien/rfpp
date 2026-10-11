# PRD: Situs Belajar Rekayasa Fitur dan Pengenalan Pola

## 1. Latar belakang
Mata kuliah MII226403 (3 sks, S2 Ilmu Komputer UGM) mencakup konsep rekayasa fitur dan pengenalan pola
pada data sinyal 1D/audio, citra, dan video. Materi dosen berupa file terpisah yang datang bertahap
sepanjang semester. Dibutuhkan satu situs belajar terpusat, terstruktur menurut CPMK, dengan
demo interaktif dan latihan, yang bisa tumbuh tanpa perlu menulis ulang aplikasi.

## 2. Tujuan
- G1: Menyajikan materi kuliah secara terstruktur, mudah dicari, dan terhubung ke CPMK.
- G2: Membantu pemahaman lewat visualisasi/demo interaktif (mis. PCA, k-NN, filter, FFT).
- G3: Membantu latihan mandiri lewat kuis dan lembar rangkuman.
- G4: Memungkinkan penambahan materi baru secara inkremental dengan usaha minimal.
- G5: Berjalan sepenuhnya statis dan bisa dipakai offline.

Bukan tujuan (non-goals): sistem login, forum, penilaian resmi, penyimpanan data di server,
mengganti SIMASTER/LMS resmi.

## 3. Pengguna
- **Mahasiswa (utama):** membaca materi, berlatih, memantau progres belajar pribadi.
- **Pemilik situs (pengguna/mahasiswa yang mengelola):** menambah materi bertahap lewat Codex.

## 4. Persona dan skenario
- Sebelum UTS, mahasiswa membuka halaman CPMK 2 dan 3, membaca rangkuman, mengerjakan kuis,
  lalu melihat topik yang belum selesai.
- Saat membaca bab PCA, mahasiswa memutar demo 2D untuk melihat arah komponen utama berubah
  ketika data digeser.
- Pemilik menerima slide baru dari dosen, menaruhnya di `sources/`, dan meminta Codex
  mengubahnya menjadi modul baru. Situs langsung menampilkannya.

## 5. Fitur

### 5.1 Wajib (MVP)
| ID | Fitur | Deskripsi |
|---|---|---|
| F1 | Beranda | Ringkasan mata kuliah, progres keseluruhan, tombol "lanjutkan belajar", daftar modul terbaru. |
| F2 | Daftar modul | Urut sesuai manifest, dapat difilter per CPMK, status (draf/terbit), dan tag. |
| F3 | Penampil modul | Render Markdown dengan rumus (KaTeX), kode, tabel, gambar, callout, daftar isi samping, navigasi sebelumnya/berikutnya. |
| F4 | Peta CPMK | Halaman yang menampilkan 6 CPMK, CPL terkait, dan modul yang memenuhinya. |
| F5 | Kuis per modul | Pilihan ganda, benar/salah, isian singkat; umpan balik + penjelasan; skor tersimpan. |
| F6 | Progres | Penanda modul selesai, skor kuis terbaik, disimpan di `localStorage`; ekspor/impor progres sebagai JSON. |
| F7 | Pencarian | Pencarian teks penuh di sisi klien (indeks dibuat oleh `tools/build-index.mjs` atau saat load). |
| F8 | Glosarium | Daftar istilah dengan tautan dari teks modul (tooltip atau halaman). |
| F9 | Mode terang/gelap | Mengikuti preferensi sistem, dapat diubah manual. |
| F10 | Halaman Penilaian | Menampilkan blueprint penilaian (bobot tugas, UTS, UAS, proyek) dan referensi. |

### 5.2 Penting (setelah MVP)
| ID | Fitur | Deskripsi |
|---|---|---|
| F11 | Demo interaktif | Komponen canvas/SVG yang dapat disisipkan di modul. Daftar demo awal di bagian 7. |
| F12 | Kartu hafalan (flashcard) | Diturunkan dari glosarium dan kuis. |
| F13 | Catatan pribadi | Catatan per modul di `localStorage`. |
| F14 | Cetak/PDF | Gaya cetak rapi untuk tiap modul. |
| F15 | PWA offline | Service worker dan manifest agar bisa dipasang dan dipakai offline. |

### 5.3 Opsional
Penyorotan teks, penanda bacaan, sandbox kode Python via Pyodide (di-vendor, hanya bila disetujui).

## 6. Persyaratan non-fungsional
- **Performa:** halaman pertama < 1,5 dtk di jaringan 4G biasa; modul dimuat malas (lazy) per halaman.
- **Aksesibilitas:** navigasi keyboard penuh, kontras AA, `alt` untuk gambar, rumus punya teks alternatif
  (KaTeX menyediakan MathML).
- **Kompatibilitas:** browser modern 2 versi terakhir (Chrome, Edge, Firefox, Safari).
- **Keamanan:** semua HTML hasil render disanitasi; tanpa skrip pihak ketiga saat runtime.
- **Skalabilitas konten:** minimal 40 modul tanpa penurunan kinerja berarti.
- **Pemeliharaan:** semua konten berupa teks (Markdown/JSON) agar mudah di-diff dan di-review.

## 7. Demo interaktif yang direncanakan
Dikerjakan bertahap, mengikuti materi yang tersedia (jangan dibangun sebelum materinya ada):
1. Pra-pemrosesan: normalisasi min-max vs z-score pada sebaran 2D.
2. Reduksi dimensi: PCA 2D (arah komponen, proyeksi, varians terjelaskan).
3. Klasifikasi dasar: k-NN dan batas keputusan 2D.
4. Sinyal 1D: sinyal sintetis, jendela, dan spektrum (FFT); fitur domain waktu dan frekuensi.
5. Citra: konvolusi dengan kernel (blur, Sobel), histogram, fitur tepi.
6. Video: selisih antar-frame dan optical flow sederhana (bila materi mencakupnya).
7. Evaluasi: matriks konfusi, presisi/recall/F1, kurva ROC dari ambang yang digeser.

## 8. Metrik keberhasilan
- Materi baru dapat ditambahkan dalam < 10 menit kerja manual (di luar waktu agen) tanpa menyentuh kode inti.
- Validator konten lulus tanpa error pada setiap penambahan.
- Setiap CPMK memiliki minimal satu modul dan satu kuis pada akhir semester.
- Skor Lighthouse: Accessibility ≥ 95, Best Practices ≥ 95, Performance ≥ 90.

## 9. Risiko dan mitigasi
| Risiko | Mitigasi |
|---|---|
| Hasil konversi PDF/PPTX salah (rumus rusak) | Wajib tanda TODO verifikasi, daftar `OPEN_QUESTIONS.md`, simpan sumber asli. |
| Agen mengarang materi | Aturan konten di `AGENTS.md`; blok "Tambahan" berlabel. |
| Format konten berubah dan merusak modul lama | Skema berversi (`schemaVersion`) dan validator. |
| ID berubah dan progres hilang | ID modul tidak boleh diubah setelah terbit. |
| Hak cipta materi | Hanya materi yang diberikan pengguna; jangan menyalin buku referensi. |

## 10. Pertanyaan terbuka
- Apakah situs akan dipublikasikan publik (GitHub Pages) atau hanya pribadi/lokal? Jika publik, cek izin dosen atas materinya.
- Perlu sandbox kode Python di browser atau cukup tautan ke notebook?
- Jadwal pertemuan dan nomor pertemuan resmi per topik (RPKPS hanya memberi alokasi waktu per CPMK).
