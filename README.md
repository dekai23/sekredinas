# SekreDinas — Sistem Informasi BKPSDM Kabupaten Yahukimo

Repositori kerja pembangunan **sistem aplikasi + sistem informasi kantor** Badan Kepegawaian dan
Pengembangan Sumber Daya Manusia (BKPSDM) Kabupaten Yahukimo, meliputi persuratan, disposisi,
arsip digital, kepegawaian, agenda, pengumuman, inventaris, dan halaman publik.

- **Status saat ini:** ✅ **Fase 0 — Data Master selesai** (kode aplikasi belum dimulai)
- **Acuan fitur:** `PRD.txt` (harus disesuaikan dari "Kab. Sleman" menjadi "Kab. Yahukimo")
- **Aset instansi:** logo, kop surat, struktur organisasi, dan data pegawai **sudah lengkap**

---

## 1. Isi folder

| Berkas / folder | Isi |
| :--- | :--- |
| `PRD.txt` | PRD aplikasi (593 baris): fitur, hak akses, skema DB, UI/UX, keamanan |
| `DATA PEGAWAI.xlsx` | Data 32 pegawai (No, NIP, Nama, Golongan, Jenis Jabatan, Jabatan, Eselon, Status) |
| `STRUKTUR.docx` | Susunan struktur organisasi BKPSDM |
| `kop bkd.docx` | Kop surat resmi (Pemerintah Kabupaten Yahukimo — BKPSDM) |
| `LOGO Yahukimo2.png` | Logo Kabupaten Yahukimo resolusi tinggi (1813 × 1504 px) |
| `docs/KOP-SURAT.md` | Spesifikasi teknis kop surat (hasil pembacaan `kop bkd.docx`) |
| `docs/ARSITEKTUR.md` | Pola **satu sistem dua zona**: portal publik (informasi untuk umum) + aplikasi internal, beserta aturan keamanan & privasinya |
| `seed/` | Data master hasil ekstraksi, siap dipakai sebagai seed aplikasi |
| `tools/extract-seed.ps1` | Skrip ekstraksi ulang Excel/Word → JSON |
| `.opencode/` | Tooling agen (bukan bagian aplikasi) |

## 2. Data master hasil ekstraksi (`seed/`)

| Berkas | Isi | Jumlah |
| :--- | :--- | :--- |
| `seed/pegawai.json` | Pegawai + pangkat/golongan, eselon, **unit kerja**, **peran**, **usulan role**, **usulan email** | 32 pegawai |
| `seed/struktur-organisasi.json` | Hierarki unit + kode unit + pejabat | 16 unit |
| `seed/instansi.json` | Identitas instansi (nama, alamat, email, logo, ukuran kertas F4, zona waktu, admin sistem) | 1 berkas |
| `seed/catatan-konfirmasi.json` | Hal yang perlu dipastikan ke instansi sebelum go-live | 11 catatan |

**Hierarki unit (kode dipakai untuk penomoran surat & kode bidang):**

| Kode | Unit | Induk | Pegawai |
| :--- | :--- | :--- | :--- |
| BKD | Badan Kepegawaian dan Pengembangan SDM Kab. Yahukimo | — | 0 |
| SEK | Sekretariat | BKD | 1 |
| SEK-UK | Sub Bagian Umum dan Kepegawaian | SEK | 4 |
| SEK-PK | Sub Bagian Perencanaan dan Keuangan | SEK | 4 |
| MPP | Bidang Mutasi, Promosi dan Penilaian Kinerja Aparatur | BKD | 1 |
| MPP-01 | Sub Bidang Kepangkatan | MPP | 1 |
| MPP-02 | Sub Bidang Mutasi, Pengembangan Karier dan Promosi | MPP | 2 |
| MPP-03 | Sub Bidang Penilaian Kinerja Aparatur, Disiplin dan Penghargaan | MPP | 1 |
| PPI | Bidang Pengadaan, Pemberhentian dan Informasi | BKD | 1 |
| PPI-01 | Sub Bidang Pengadaan dan Pemberhentian | PPI | 4 |
| PPI-02 | Sub Bidang Fasilitasi dan Profesi ASN | PPI | 3 |
| PPI-03 | Sub Bidang Data dan Informasi | PPI | 4 |
| PA | Bidang Pengembangan Aparatur | BKD | 0 |
| PA-01 | Sub Bidang Pengembangan Kompetensi | PA | 1 |
| PA-02 | Sub Bidang Diklat Penjenjangan, Sertifikasi dan Teknis Fungsional | PA | 3 |
| FUNGS | Kelompok Jabatan Fungsional (dibawahi langsung Kepala Badan) | BKD | 2 |

**Rekap peran pegawai:** 1 Sekretaris, 2 Kepala Bidang, 7 Kepala Sub Bidang, 2 Kepala Sub Bagian,
2 Pl./Plt. Kepala Sub Bidang, 16 Pelaksana, 2 Fungsional.
**Role aplikasi hasil pemetaan:** **11 pimpinan**, **1 admin** (Theodorus Valentinus, S.Kom. —
Admin Sistem), **20 pegawai**.

**Aturan penempatan yang divalidasi otomatis oleh skrip:**
1. Pelaksana hanya boleh berada pada jabatan eselon terendah (Sub Bidang/Sub Bagian) — tidak boleh
   langsung di bawah Bidang/Sekretariat. (Data saat ini: ✅ patuh.)
2. Jabatan fungsional berada pada "Kelompok Jabatan Fungsional" yang dibawahi langsung Kepala Badan.
3. Unit yang hanya dijabat Pl./Plt. ditandai sebagai *tanpa pejabat definitif*.

## 3. Menjalankan ulang ekstraksi

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\extract-seed.ps1
```

Skrip membaca `.xlsx`/`.docx` sebagai arsip OOXML (tidak butuh Microsoft Office), menyalin berkas
ke TEMP lebih dulu sehingga tetap berjalan walau berkas sedang dibuka di Word/Excel.

## 4. Catatan penting

1. **Kepala Badan belum ada pada daftar pegawai** — perlu ditambahkan agar akun pimpinan tertinggi tersedia.
2. **Penulisan resmi nama unit masih ada variasi antar dokumen:** `Fasilitasi dan Profesi ASN` (STRUKTUR.docx)
   vs `Fasilitasi Profesi ASN` (DATA PEGAWAI.xlsx); `Penilaian Kinerja Aparatur` (STRUKTUR.docx) vs
   `Penilaian Kinerja Aparatur, Disiplin dan Penghargaan` (DATA PEGAWAI.xlsx).
3. **Domain email instansi:** `yahukimokab.go.id` (email kantor `bkpsdm@yahukimokab.go.id`). Usulan email
   pegawai pola `nama.tanpa.gelar@yahukimokab.go.id` sudah dibuat pada `seed/pegawai.json` (kolom
   `usulanEmail`) — perlu dipastikan apakah login memakai email tersebut atau memakai NIP.
4. **Kewenangan Pl./Plt.** (PENIUS SIEP, S.E. dan TINUS BAHABOL, S.Pd. — NON ESELON) — perlu diputuskan
   apakah diberi role `pimpinan` atau tetap `pegawai`.
5. **Excel `DATA PEGAWAI.xlsx` masih menautkan 4 workbook luar** (`AGAMA`, `DATA PNS per 30 Agustus 2026`,
   `Jabatan`, `PANGKAT`). Jika data tersebut diperlukan, mohon berkas aslinya disertakan.
6. **Belum ada repositori Git.** Sebaiknya dijalankan `git init` pada Fase 1 agar perubahan terlacak.
7. `STRUKTUR.docx` dan `kop bkd.docx` sempat terbuka di Word (file lock) — tutup Word sebelum mengganti berkas.

## 5. Rencana fase berikutnya

| Fase | Lingkup |
| :--- | :--- |
| 1 | Kerangka aplikasi, autentikasi multi-role, RBAC, layout, skema DB |
| 2 | Surat masuk, surat keluar (auto-nomor + kop surat), disposisi |
| 3 | Arsip digital, agenda, pengumuman |
| 4 | Kepegawaian & cuti, inventaris aset |
| 5 | Dashboard, laporan PDF/Excel, notifikasi |
| 6 | Halaman publik, SEO, penguatan keamanan |
| 7 | Deploy, backup, pelatihan staf |
