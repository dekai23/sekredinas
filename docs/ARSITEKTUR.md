# Arsitektur: Satu Sistem, Dua Zona (Portal Publik + Aplikasi Internal)

Dokumen ini menetapkan pola arsitektur SekreDinas BKPSDM Kabupaten Yahukimo:
**satu basis kode/aplikasi** yang melayani **dua audiens berbeda** dengan batas keamanan yang tegas.

---

## 1. Alasan pola ini dipakai

1. **BKPSDM adalah badan publik** → wajib menyediakan dan mengumumkan informasi publik
   (UU 14/2008 tentang Keterbukaan Informasi Publik; praktik bakunya melalui kanal **PPID** dan
   **Daftar Informasi Publik/DIP**). Website resmi menjadi kanal utama pemenuhan kewajiban itu.
2. **Satu sumber data**: berita, agenda, dan pengumuman publik diinput sekali dari aplikasi internal,
   langsung tayang di portal publik (tidak ada pekerjaan ganda).
3. Hemat biaya & SDM dibanding memelihara dua sistem terpisah.
4. Transparansi, kredibilitas instansi, dan kemudahan masyarakat mengakses layanan kepegawaian.
5. PRD awal (`PRD.txt`) memang sudah mencakup halaman publik (Bab 3.A), jadi tidak ada perubahan arah.

## 2. Dua zona yang wajib dipisah tegas

| Aspek | Zona Publik | Zona Internal |
| :--- | :--- | :--- |
| Contoh rute | `/`, `/profil`, `/layanan`, `/berita`, `/pengumuman`, `/agenda`, `/ppid`, `/statistik`, `/kontak` | `/masuk`, `/dashboard/*`, `/admin/*` |
| Login | Tidak perlu | Wajib (admin/pimpinan/pegawai) |
| Layout | Header publik + footer instansi | Sidebar 260px + header internal |
| Sumber data | Hanya tabel/kolom yang memang publik | Seluruh data dinas |
| Cache | Agresif (statis/ISR + `revalidateTag`) | Selalu dinamis, per-permintaan |
| Mesin pencari | Terindeks + `sitemap.xml` | `noindex, nofollow` |
| Cookie sesi | Tidak ada | httpOnly, secure, sameSite=lax |

**Aturan pemisahan teknis:** gunakan dua *route group* terpisah (`app/(publik)` dan `app/(internal)`),
dua layout berbeda, dan `middleware` yang hanya menjaga rute internal. Halaman publik **tidak boleh**
mengimpor komponen/modul yang membaca data internal.

## 3. Yang boleh dan TIDAK boleh tampil di area publik

**Boleh:**
- Profil instansi: sejarah, visi-misi, tugas & fungsi, struktur organisasi (dari `STRUKTUR.docx`),
  alamat/telepon/email kantor, jam layanan, peta lokasi.
- Layanan kepegawaian: daftar layanan (kenaikan pangkat, pensiun, cuti besar, diklat, karpeg, dll),
  syarat, alur, dan waktu penyelesaian — sifatnya informasi, belum pengajuan online.
- Berita/kegiatan, agenda publik, pengumuman publik, galeri foto kegiatan.
- PPID: Daftar Informasi Publik (DIP), prosedur permohonan informasi, kontak PPID.
- Statistik **agregat** ASN (mis. jumlah ASN per golongan/jenis kelamin/pendidikan) — hanya angka rekap.

**Tidak boleh (wajib dijaga):**
- Data pribadi pegawai: NIP, NIK, tanggal lahir, alamat, nomor telepon pribadi, foto KTP/berkas ASN.
- Surat masuk/keluar, disposisi, catatan disposisi, dan seluruh dokumen persuratan internal.
- Arsip internal, inventaris aset beserta penanggung jawab, pengajuan cuti & hasil persetujuannya.
- Data yang bersifat rahasia/terbatas sesuai klasifikasi informasi (sifat surat "Rahasia").
- Statistik yang bisa mengidentifikasi individu (mis. unit kerja dengan hanya 1 pegawai + jabatannya).

> Prinsip: **server component publik hanya mengambil kolom yang memang publik**. Jangan pernah
> mengirim seluruh objek pegawai ke halaman publik lalu menyembunyikannya di sisi tampilan.

## 4. Modul publik yang disarankan (tambahan dari PRD)

| Modul | Manfaat |
| :--- | :--- |
| Profil & struktur organisasi | Menjawab kebutuhan informasi dasar masyarakat |
| Layanan kepegawaian (informasi syarat & alur) | Mengurangi pertanyaan berulang ke kantor |
| Berita & kegiatan | Citra instansi + bahan laporan |
| Pengumuman publik | Sarana pengumuman resmi (bukan lagi grup WhatsApp) |
| Agenda publik | Jadwal kegiatan yang terbuka untuk umum |
| PPID / DIP | Pemenuhan kewajiban keterbukaan informasi |
| Statistik ASN (agregat) | Transparansi kepegawaian |
| Kontak, peta & FAQ | Kanal layanan dasar |

## 5. Pertimbangan hosting, domain, dan regulasi

1. **Domain resmi instansi:** penggunaan nama domain instansi pemerintah diatur oleh Kementerian
   Komunikasi dan Digital (PM Komdigi No. 5 Tahun 2025) dan dikelola melalui kanal resmi
   `domain.go.id`. Aplikasi sebaiknya memakai subdomain resmi, mis. `bkpsdm.yahukimokab.go.id`.
   Pengajuan/pengelolaan domain umumnya dikoordinasikan lewat Diskominfo daerah.
2. **Pusat data:** Perpres 95/2018 Pasal 30 mewajibkan instansi pusat dan **pemerintah daerah
   menggunakan Pusat Data nasional**; instansi yang sudah memiliki pusat data sendiri harus memenuhi
   standar (SNI pusat data) dan membuat keterhubungan. Karena itu lokasi hosting sebaiknya
   dikoordinasikan dengan Diskominfo/pengelola data center daerah.
3. **Konsekuensi bagi portal publik:** halaman publik harus cepat diakses dari luar daerah
   (Yahukimo/Papua dengan kualitas internet terbatas) → wajib caching agresif, gambar terkompresi,
   halaman ringan; bila server kantor, sebaiknya dilapisi CDN/proxy untuk konten publik.
4. **Keamanan:** zona internal tidak pernah dibuka langsung ke internet tanpa proteksi (rate limiting,
   WAF, pembaruan rutin), dan akun admin wajib password kuat + aktivasi penuh audit log.

## 6. Dampak pada rencana fase

| Fase | Penyesuaian |
| :--- | :--- |
| 1 | Ditambah: dua route group + middleware zona, tabel konten publik (`berita`, `pengumuman`, `layanan`, `agenda` dengan flag publik), tabel pengaturan identitas instansi |
| 2–5 | Tidak berubah (sesuai PRD), tetapi setiap modul langsung menyertakan opsi "publikasikan" |
| 6 | Diperluas: seluruh halaman publik, PPID/DIP, statistik agregat, SEO, aksesibilitas, pengujian pemisahan zona |
| 7 | Ditambah: penetapan penanggung jawab konten (editor PPID), pelatihan unggah berita/pengumuman |

**Kebutuhan non-teknis yang perlu disiapkan instansi:** penanggung jawab konten publik, teks layanan &
syarat, foto kegiatan, DIP, dan koordinasi domain/hosting dengan Diskominfo.
