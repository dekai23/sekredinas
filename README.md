# SekreDinas — Sistem Informasi BKPSDM Kabupaten Yahukimo

Repositori kerja pembangunan **sistem aplikasi + sistem informasi kantor** Badan Kepegawaian dan
Pengembangan Sumber Daya Manusia (BKPSDM) Kabupaten Yahukimo, meliputi persuratan, disposisi,
arsip digital, kepegawaian, agenda, pengumuman, inventaris, dan halaman publik.

- **Status saat ini:** 🟡 **Fase 1 — Kerangka aplikasi berjalan** (login, RBAC, portal publik,
  dashboard, admin pengguna, skema basis data terisi data master)
- **Acuan fitur:** `PRD.txt` (sudah disesuaikan dari "Kab. Sleman" menjadi "Kab. Yahukimo")
- **Aset instansi:** logo, kop surat, struktur organisasi, dan data pegawai **sudah lengkap**
- **Basis data:** PGlite (PostgreSQL tertanam) untuk pengembangan; cukup diisi `DATABASE_URL`
  bila memakai PostgreSQL server

---

## 0. Menjalankan aplikasi

```bash
npm install                 # pasang dependensi
copy .env.example .env.local  # Windows; Linux: cp .env.example .env.local
npm run db:setup            # buat skema + isi data master (32 pegawai, 16 unit)
npm run dev                 # buka http://localhost:3000
```

**Akun awal admin sistem**

| Email | Sandi awal |
| :--- | :--- |
| `theodorus.valentinus@yahukimokab.go.id` | `Bkpsdm-Yahukimo2026` |

> Ganti `AUTH_SECRET` di `.env.local` (minimal 32 karakter) sebelum dipakai di jaringan.
> Sandi awal wajib diganti setiap pengguna pada login pertama.

**Perintah lain**

| Perintah | Kegunaan |
| :--- | :--- |
| `npm run dev` | Server pengembangan (port 3000) |
| `npm run build` / `npm run start` | Build & jalankan versi produksi |
| `npm run typecheck` / `npm run lint` | Cek tipe & gaya kode |
| `npm run db:generate` | Buat migrasi SQL setelah mengubah `lib/db/schema-*.ts` |
| `npm run db:migrate` | Terapkan migrasi (`-- --reset` untuk membangun ulang) |
| `npm run db:seed` | Isi ulang data master (`-- --hapus-pegawai` untuk mulai bersih) |

---

## 0.1. Struktur folder

| Folder / berkas | Isi |
| :--- | :--- |
| `app/(publik)/` | Portal publik: beranda, profil, layanan, pengumuman, kontak |
| `app/(auth)/` | Autentikasi: halaman masuk & server action keluar |
| `app/(internal)/` | Area internal: dashboard, sidebar, daftar pengguna |
| `components/kop/` | `<KopSurat />` replikasi kop resmi F4 |
| `components/ui/` | Komponen dasar: tombol, formulir, kartu, lencana, tabel |
| `components/internal/` | Sidebar, topbar, dan peta menu sesuai hak akses |
| `lib/db/schema-*.ts` | Skema basis data (17 tabel) |
| `lib/auth/` | Sandi (bcrypt), sesi (JWT cookie), hak akses (RBAC) |
| `lib/data/` | Data benih & pembacaan pengaturan instansi |
| `proxy.ts` | Penjaga zona internal (menggantikan middleware.ts di Next 16) |

---

## 1. Isi folder

| Berkas / folder | Isi |
| :--- | :--- |
| `PRD.txt` | PRD aplikasi (593 baris): fitur, hak akses, skema DB, UI/UX, keamanan |
| `app/`, `components/`, `lib/` | Kode aplikasi (lihat struktur folder di atas) |
| `drizzle/` | Berkas migrasi SQL hasil `drizzle-kit generate` |
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
6. **Repositori Git sudah aktif** (branch `master`). Perubahan dikomit per fase.
7. `STRUKTUR.docx` dan `kop bkd.docx` sempat terbuka di Word (file lock) — tutup Word sebelum mengganti berkas.
8. **Kategori surat masih usulan** — kode `KP`, `MU`, `PS`, dst. menentukan nomor surat
   keluar dan perlu disesuaikan dengan format penomoran yang berlaku.

## 5. Rencana fase berikutnya

| Fase | Status | Lingkup |
| :--- | :--- | :--- |
| 0 | ✅ selesai | Data master: seed pegawai/unit/instansi, dokumen kop & arsitektur |
| 1 | ✅ selesai | Kerangka aplikasi, autentikasi multi-role, RBAC, layout, skema DB, portal publik dasar |
| 2 | ⏳ berikutnya | Surat masuk, surat keluar (auto-nomor + kop surat), disposisi berantai |
| 3 | | Arsip digital, agenda, pengumuman |
| 4 | | Kepegawaian & cuti, inventaris aset |
| 5 | | Dashboard lanjutan, laporan PDF/Excel, notifikasi |
| 6 | | Penyempurnaan halaman publik, PPID, SEO, penguatan keamanan |
| 7 | | Deploy, backup, pelatihan staf |
