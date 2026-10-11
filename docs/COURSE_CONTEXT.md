# Konteks Mata Kuliah (ringkasan RPKPS)

Sumber lengkap: `docs/RPKPS.md`. File ini ringkasan yang dipakai sebagai data awal
(`content/course.json`).

- **Mata kuliah:** Rekayasa Fitur dan Pengenalan Pola, kode **MII226403**, 3 sks (T: 3, P: 0), status MKK
- **Program:** Magister Ilmu Komputer, FMIPA, Universitas Gadjah Mada
- **Semester:** Gasal 2026/2027
- **Pengampu:** Dr. Dyah Aruming Tyas, S.Si.
- **LMS:** simaster.ugm.ac.id (luring 100%, daring maksimal 40%)
- **Metode:** tatap muka *student centered learning*, penugasan berbasis kasus dan proyek, belajar mandiri via LMS

## Deskripsi singkat
Pengenalan pola dibutuhkan pada Era Industri 4.0 dan Masyarakat 5.0. Rekayasa fitur adalah topik penting
dalam pengenalan pola, dengan aplikasi di bidang medis, industri (inspeksi, kendali mutu), biometrika,
*multimedia information retrieval*, serta monitoring dan kendali, dengan data berupa citra, sinyal 1D,
audio, atau video. Tujuan: mahasiswa menguasai konsep dan teknik rekayasa fitur dan mampu
mengadaptasikannya pada situasi yang dihadapi.

## CPMK (Capaian Pembelajaran Mata Kuliah)
| Kode | Ringkasan | Data | Alokasi waktu* |
|---|---|---|:---:|
| MII226403.1 | Menganalisis dan mengembangkan konsep rekayasa fitur dan pengenalan pola; relevansi untuk masalah komputasi kompleks lewat pendekatan riset | Konsep | 2 |
| MII226403.2 | Merancang, mengembangkan, mengevaluasi akuisisi, prapemrosesan, ekstraksi fitur, dan model inferensi; analisis kritis metode mutakhir | Umum | 4 |
| MII226403.3 | Sama seperti di atas untuk **sinyal 1D termasuk audio**; integrasi pendekatan inter/multidisipliner | Sinyal 1D / audio | 1 |
| MII226403.4 | Sama untuk **citra**; mengkaji efektivitas pendekatan berbasis riset | Citra | 3 |
| MII226403.5 | Sama untuk **video**; integrasi teknik komputasi lanjutan | Video | 1 |
| MII226403.6 | Studi kasus: solusi pengenalan pola di berbagai domain aplikasi; pemecahan masalah kompleks sistematis | Studi kasus | 3 |

*Satuan "alokasi waktu" pada RPKPS tidak disebutkan (kemungkinan jumlah pertemuan). Jangan menafsirkan lebih jauh
tanpa konfirmasi pemilik.

Teks lengkap tiap CPMK ada di `docs/RPKPS.md`; gunakan teks itu apa adanya di `content/course.json`.

## CPL yang dibebankan
- **CPL 2.2** (PLO2, Pengetahuan Dasar dan Teoritis)
- **CPL 2.3** (PLO3, Pengetahuan Terapan)
- **CPL 3.4** (PLO4, Keterampilan Penyelesaian Masalah)

Pemetaan CPL ke CPMK:
| CPMK | CPL 2.2 | CPL 2.3 | CPL 3.4 |
|---|:---:|:---:|:---:|
| .1 | ✓ | ✓ | |
| .2 | | ✓ | ✓ |
| .3 | | ✓ | ✓ |
| .4 | | ✓ | ✓ |
| .5 | | ✓ | ✓ |
| .6 | | | ✓ |

Catatan: teks CPL 3.4 pada RPKPS sumber terpotong ("...atau intr", "...approach to pr"). Biarkan apa adanya dan
catat di `OPEN_QUESTIONS.md`.

## Penilaian
| Basis | Komponen | Bobot |
|---|---|:---:|
| Hasil Proyek (30%) | Proyek/Studi Kasus/Hasil PBL | 30% |
| Kognitif (70%) | Tugas terstruktur | 30% |
| Kognitif (70%) | UTS | 20% |
| Kognitif (70%) | UAS | 20% |

Keselarasan komponen dengan CPMK pada RPKPS sumber: ekstraksi teks PDF tidak menyimpan posisi kolom tanda centang
dengan pasti. Gunakan data pemetaan penilaian-CPMK hanya setelah diverifikasi pemilik (isi sebagai `null` dulu).

## Referensi
1. Theodoridis, S. and Koutroumbas, K., *Pattern Recognition*, 4th Ed., Academic Press, 2008.
2. Duda, R. O., Hart, P. E., Stork, D. G., *Pattern Classification*, Wiley, 2000.
3. Bishop, C. M., *Pattern Recognition and Machine Learning*, Springer, 2007.
4. Homenda, W., Pedrycz, W., *Pattern Recognition: A Quality of Data Perspective*, Wiley, 2018.

## Kerangka topik (dari materi pembelajaran RPKPS)
1. Konsep rekayasa fitur dan pengenalan pola (CPMK 1)
2. Akuisisi, prapemrosesan, ekstraksi fitur (dan rekayasa fitur), model inferensi (CPMK 2)
3. Pipeline pada sinyal 1D / audio (CPMK 3)
4. Pipeline pada citra (CPMK 4)
5. Pipeline pada video (CPMK 5)
6. Studi kasus rekayasa fitur dan pengenalan pola (CPMK 6)

Kerangka ini hanya "rak kosong". Isi modul diambil dari materi yang diberikan pengguna, bukan dari
pengetahuan umum agen.
