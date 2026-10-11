# Skema Konten (schemaVersion 1)

Semua konten berupa teks. Validator `tools/validate-content.mjs` memeriksa semuanya.

## 1. `content/manifest.json`
Satu-satunya indeks modul. **Urutan array = urutan tampil.**
```json
{
  "schemaVersion": 1,
  "modules": [
    {
      "id": "p01-konsep-rekayasa-fitur",
      "title": "Konsep Rekayasa Fitur dan Pengenalan Pola",
      "path": "modules/p01-konsep-rekayasa-fitur",
      "cpmk": ["MII226403.1"],
      "order": 1,
      "status": "terbit",
      "tags": ["konsep", "pipeline"],
      "estimatedMinutes": 25,
      "hasQuiz": true,
      "added": "2026-08-24"
    }
  ]
}
```
| Field | Tipe | Aturan |
|---|---|---|
| `id` | string | Unik, huruf kecil, angka, tanda hubung; diawali `pNN-` atau `s-` (suplemen). **Tidak boleh diubah** setelah `terbit`. |
| `title` | string | Judul tampil. |
| `summary` | string | Ringkasan singkat untuk kartu modul (disarankan, maksimal 200 karakter). |
| `path` | string | Relatif terhadap `content/`; folder harus berisi `index.md`. |
| `cpmk` | string[] | Minimal 1; nilai harus ada di `course.json`. |
| `order` | number | Urutan tampil, unik. |
| `status` | `draf` \| `terbit` | `draf` tidak muncul di pencarian dan diberi lencana "Draf". |
| `tags` | string[] | Huruf kecil, tanpa spasi (pakai `-`). |
| `estimatedMinutes` | number | Perkiraan waktu baca. |
| `hasQuiz` | boolean | Harus cocok dengan keberadaan `quiz.json`. |
| `added` | date `YYYY-MM-DD` | Tanggal materi masuk. |

## 2. `content/course.json`
```json
{
  "schemaVersion": 1,
  "code": "MII226403",
  "title": "Rekayasa Fitur dan Pengenalan Pola",
  "credits": { "theory": 3, "practice": 0 },
  "semester": "Gasal 2026/2027",
  "program": "Magister Ilmu Komputer, FMIPA UGM",
  "lecturers": ["Dr. Dyah Aruming Tyas, S.Si."],
  "description": "...",
  "cpl": [ { "code": "CPL 2.2", "text": "..." } ],
  "cpmk": [
    { "code": "MII226403.1", "text": "...", "cpl": ["CPL 2.2", "CPL 2.3"], "timeAllocation": 2 }
  ],
  "assessment": [
    { "basis": "Hasil Proyek", "component": "Proyek/Studi Kasus/Hasil PBL", "weight": 30, "cpmk": null }
  ],
  "references": [ { "id": "ref1", "citation": "..." } ]
}
```
Isi dari `docs/COURSE_CONTEXT.md` dan `docs/RPKPS.md`. `cpmk: null` pada penilaian = belum diverifikasi.

## 3. Modul: `content/modules/<id>/index.md`

### Front matter
Blok di awal file dibatasi `---`. Subset YAML yang didukung parser sederhana (jangan pakai fitur lain):
`kunci: nilai` (string, angka, boolean), daftar inline `[a, b]`, dan daftar blok `- item`.
Tanpa objek bersarang.
```markdown
---
id: p01-konsep-rekayasa-fitur
title: Konsep Rekayasa Fitur dan Pengenalan Pola
cpmk: [MII226403.1]
summary: Gambaran pipeline pengenalan pola dan peran rekayasa fitur.
objectives:
  - Menjelaskan tahapan pipeline pengenalan pola
  - Membedakan ekstraksi fitur dan seleksi fitur
prerequisites: []
sources:
  - sources/pertemuan-01/slide-01.pdf
authors: Dr. Dyah Aruming Tyas, S.Si.
updated: 2026-08-24
---
```
Wajib: `id`, `title`, `cpmk`, `summary`, `objectives`, `sources`, `updated`.
`id` harus sama dengan nama folder dan entri manifest.

### Isi
Markdown GFM (tabel, daftar tugas, kode berpagar) plus ekstensi di bawah.

**Struktur bagian yang disarankan** (gunakan yang relevan):
1. `## Tujuan Belajar`: dihasilkan otomatis dari `objectives` bila tidak ditulis.
2. `## Ringkasan Konsep`
3. `## Uraian` (beberapa `###`)
4. `## Contoh dan Studi Kasus`
5. `## Rangkuman`: 5 sampai 8 poin
6. `## Bacaan Lanjutan`: merujuk ke referensi di `course.json` (`[ref:ref3]`)

**Rumus:** inline `$x_i$`, blok `$$\hat{y}=\arg\max_k p(C_k\mid x)$$`. Pakai sintaks KaTeX standar.
Jangan menaruh rumus sebagai gambar kecuali tidak dapat diekspresikan; sertakan `alt` bermakna.

**Gambar:** `![alt bermakna](assets/nama.png "keterangan opsional")` (path relatif terhadap folder modul).
Beri keterangan sumber bila dari slide (`Sumber: slide pertemuan 2, hlm. 7`).

**Direktif blok** (`:::jenis judul` ... `:::`):
| Direktif | Fungsi |
|---|---|
| `:::definisi Judul` | Kotak definisi |
| `:::teorema Judul` | Teorema/sifat penting |
| `:::contoh Judul` | Contoh terselesaikan |
| `:::catatan Judul` | Catatan/tips |
| `:::awas Judul` | Kesalahan umum/peringatan |
| `:::tambahan Judul` | Penjelasan tambahan yang **bukan** dari materi dosen (wajib berlabel otomatis "Tambahan") |
| `:::demo id-demo` | Menyisipkan demo interaktif (lihat `ARCHITECTURE.md` §8). Opsi: `{seed=7 height=420}` pada baris yang sama |
| `:::tab` / `::tab Judul` | Kelompok tab (opsional) |

**Tautan glosarium:** `[[feature-extraction]]` atau `[[feature-extraction|ekstraksi fitur]]`.
ID harus ada di `glossary.json` (validator memeriksa).

**Tautan antar-modul:** `[teks](#/modul/p02-akuisisi-prapemrosesan)`.

**Penanda verifikasi:** `<!-- TODO: verifikasi rumus dari slide hlm. 12 -->`. Validator melaporkan jumlah TODO per modul.

## 4. Kuis: `content/modules/<id>/quiz.json`
```json
{
  "schemaVersion": 1,
  "moduleId": "p01-konsep-rekayasa-fitur",
  "passScore": 0.7,
  "questions": [
    {
      "id": "q1",
      "type": "pilihan-ganda",
      "prompt": "Manakah yang termasuk tahap ekstraksi fitur?",
      "options": ["Normalisasi", "Menghitung histogram gradien", "Pembagian data latih/uji", "Penentuan ambang"],
      "answer": 1,
      "explanation": "Histogram gradien menghasilkan vektor fitur dari citra.",
      "cpmk": "MII226403.4",
      "difficulty": 2,
      "source": "slide 3, hlm. 14"
    },
    { "id": "q2", "type": "benar-salah", "prompt": "...", "answer": true, "explanation": "..." },
    { "id": "q3", "type": "isian", "prompt": "Nama operasi ... adalah ...", "answer": ["konvolusi", "convolution"], "explanation": "..." },
    { "id": "q4", "type": "pilihan-ganda-banyak", "prompt": "...", "options": ["a","b","c"], "answer": [0,2], "explanation": "..." }
  ]
}
```
Aturan: `id` unik dalam berkas; `answer` sesuai tipe; `explanation` wajib; isian dicocokkan tanpa
membedakan huruf besar/kecil dan spasi tepi; pilihan diacak saat tampil (kecuali `"shuffle": false`).
Soal hanya boleh bersumber dari materi dosen; isi `source`. Soal buatan agen diberi `"origin": "agen"` agar
pemilik dapat meninjau.

## 5. `content/glossary.json`
```json
{
  "schemaVersion": 1,
  "terms": [
    {
      "id": "feature-extraction",
      "term": "Ekstraksi fitur",
      "en": "Feature extraction",
      "definition": "...",
      "related": ["feature-selection"],
      "modules": ["p01-konsep-rekayasa-fitur"]
    }
  ]
}
```
`id` unik; `related` dan `modules` harus merujuk ke ID yang ada.

## 6. Aturan penamaan
- Folder modul dan ID: `pNN-slug-singkat` (NN dua digit; urutan kronologis materi masuk, bukan jaminan urutan belajar,
  yang ditentukan `order`). Suplemen: `s-slug`.
- Aset: huruf kecil, tanda hubung, tanpa spasi. Format gambar: `.png`, `.jpg`, `.webp`, `.svg`.
- Gambar > 400 KB sebaiknya dikompres; target total aset per modul < 3 MB.

## 7. Aturan validator (`tools/validate-content.mjs`)
Error (gagal) bila: JSON tidak valid; ID ganda; folder/`index.md` hilang; `id` front matter ≠ manifest ≠ folder;
CPMK tidak dikenal; field wajib hilang; `hasQuiz` tidak cocok; `[[istilah]]` tidak ada di glosarium;
gambar/aset rujukan tidak ada; jawaban kuis di luar rentang; `:::` tidak tertutup.
Peringatan: jumlah TODO verifikasi; modul `draf`; modul tanpa kuis; ringkasan > 200 karakter; tidak ada `alt` pada gambar.
Keluaran: ringkasan berwarna, kode keluar ≠ 0 bila ada error.
