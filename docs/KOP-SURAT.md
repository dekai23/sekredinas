# Spesifikasi Kop Surat — BKPSDM Kabupaten Yahukimo

Dokumen ini adalah hasil pembacaan teknis berkas **`kop bkd.docx`** (sumber: Bapak/Ibu) supaya
kop surat dapat direplikasi **identik** saat dicetak langsung dari aplikasi (surat keluar, laporan, PDF).

---

## 1. Ukuran kertas & margin

| Properti | Nilai terukur (twips) | Konversi |
| :--- | :--- | :--- |
| Lebar kertas | `12242` | 21,6 cm (**F4/Folio**) |
| Tinggi kertas | `18722` | 33,0 cm |
| Margin atas | `709` | 1,25 cm |
| Margin kanan | `1043` | 1,84 cm |
| Margin bawah | `10` | 0,02 cm |
| Margin kiri | `1440` | 2,54 cm |
| Header / Footer | `720` | 1,27 cm |
| Jarak baris baris-1 | `line = 240 (auto)` | spasi tunggal |

> **Wajib di CSS cetak:** `@page { size: 216mm 330mm; margin: 0; }` agar tidak terpotong ke A4.

## 2. Susunan baris kop (semua rata tengah / `center`)

| Baris | Teks | Font | Ukuran |
| :--- | :--- | :--- | :--- |
| 1 | PEMERINTAH KABUPATEN YAHUKIMO | Palatino Linotype, **Bold** | 18 pt (`w:sz 36`) |
| 2 | BADAN KEPEGAWAIAN DAN PENGEMBANGAN | Berlin Sans FB | 18 pt (`w:sz 36`) |
| 3 | SUMBER DAYA MANUSIA | Berlin Sans FB | 18 pt (`w:sz 36`) |
| 4 | Komp. Gedung Serba Guna Jl. Kurima - Dekai | LiSu, **Bold** | 10 pt (`w:sz 20`) |

Catatan gaya asli:
- Baris 2 dan 3 sebenarnya **satu paragraf** "BADAN KEPEGAWAIAN DAN PENGEMBANGAN SUMBER DAYA MANUSIA"
  yang dibiarkan membungkus menjadi dua baris (word wrap), bukan dua baris terpisah.
- Jarak setelah baris 3: `w:after = 240`; sebelum baris 3: `w:before = 120`.
- Ada jarak antar-karakter kecil pada baris 1 (`w:spacing 3`, `-3`, `-2`) — sifatnya kosmetik.

## 3. Garis kop

- Jenis: garis **ganda (thin-thick)** dengan `strokeweight = 1.5pt`, `linestyle = thinThick`.
- Diposisikan tepat di bawah baris alamat (baris 4), selebar area teks.
- Pada implementasi web diwakili `border-bottom: 3px double #111` (atau SVG saat ekspor PDF).

## 4. Logo

| Properti | Nilai |
| :--- | :--- |
| Posisi di dokumen | melayang (anchored), di sisi kiri kop |
| Ukuran di dokumen | `920522 × 873457` EMU = **2,56 × 2,43 cm** |
| Offset dari kertas | kiri 746455 EMU ≈ **2,07 cm**; atas 347980 EMU ≈ 0,97 cm |
| Perilaku | di belakang teks (`behindDoc=1`), tanpa pembungkusan teks (`wrapNone`) |
| Gambar dalam dokumen | `word/media/image1.jpeg` (277 × 263 px) |
| Gambar resolusi tinggi tersedia | **`LOGO Yahukimo2.png`** (1813 × 1504 px) → dipakai untuk aplikasi |

## 5. Rencana penerapan di aplikasi

1. Buat komponen global `<KopSurat />` (identitas instansi diambil dari tabel pengaturan, bukan hard-code).
2. Nilai awal tabel pengaturan (menu `/admin/pengaturan`):

   | Kunci | Nilai |
   | :--- | :--- |
   | `namaInstansi` | Badan Kepegawaian dan Pengembangan Sumber Daya Manusia |
   | `namaPemerintah` | Pemerintah Kabupaten Yahukimo |
   | `alamat` | Komp. Gedung Serba Guna Jl. Kurima - Dekai |
   | `logoPath` | `public/logo-yahukimo.png` |
   | `ukuranKertas` | F4 (21,6 × 33 cm) |
   | `garisKop` | ganda 1,5 pt |

3. Halaman cetak surat memakai kelas `print:block` + `@page` F4 dan menyembunyikan menu/sidebar.
4. Preview PDF di server dibuat dari HTML yang sama agar hasil cetak = hasil preview.

## 6. Yang belum tersedia pada kop (mohon konfirmasi)

- Nomor telepon kantor, alamat email resmi, dan alamat website — kop saat ini hanya memuat alamat fisik.
- Format penomoran surat dinas yang berlaku dan daftar kategori surat + kodenya.
- Daftar pejabat penandatangan (Kepala Badan/Sekretaris) beserta jabatan lengkap untuk blok tanda tangan.
