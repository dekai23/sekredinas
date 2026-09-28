/**
 * Data benih (benih = seed) untuk tabel master dan konten awal.
 * Dipakai oleh `npm run db:seed`; aman dijalankan berulang karena skrip seed
 * memakai upsert berdasarkan kunci unik.
 *
 * CATATAN: kode kategori surat menentukan nomor surat keluar, contoh
 * KP/001/SEK-UK/I/2026. Daftar di bawah adalah usulan awal dan perlu
 * dicocokkan dengan format penomoran yang berlaku di BKPSDM
 * (lihat seed/catatan-konfirmasi.json).
 */

export interface KategoriSuratBenih {
  kode: string;
  nama: string;
  uraian: string;
}

export const kategoriSuratBenih: KategoriSuratBenih[] = [
  { kode: "KP", nama: "Kepegawaian", uraian: "Administrasi kepegawaian dan penggajian" },
  { kode: "MU", nama: "Mutasi", uraian: "Mutasi, promosi, dan penempatan ASN" },
  { kode: "PS", nama: "Pensiun", uraian: "Pensiun, eduksi, dan hak-hak pensiun" },
  { kode: "PK", nama: "Pangkat", uraian: "Kenaikan pangkat dan pengangkatan" },
  { kode: "DP", nama: "Disiplin dan Penghargaan", uraian: "Tindakan disiplin dan penghargaan" },
  { kode: "DL", nama: "Diklat", uraian: "Pelatihan dan pengembangan kompetensi" },
  { kode: "PR", nama: "Perencanaan dan Keuangan", uraian: "Rencana kerja, anggaran, dan laporan" },
  { kode: "UM", nama: "Umum", uraian: "Administrasi umum, persuratan, dan kearsipan" },
  { kode: "PH", nama: "Pengadaan", uraian: "Pengadaan barang dan jasa" },
  { kode: "IP", nama: "Informasi Publik", uraian: "Informasi, PPID, dan media" },
  { kode: "KS", nama: "Kerja Sama", uraian: "Perjanjian kerja sama" },
  { kode: "LG", nama: "Legal", uraian: "Produk hukum dan peraturan" },
];

export interface PengumumanBenih {
  judul: string;
  ringkasan: string;
  isi: string;
  kategori: string;
  internal: boolean;
  publik: boolean;
}

export const pengumumanBenih: PengumumanBenih[] = [
  {
    judul: "Selamat datang memakai aplikasi SekreDinas",
    ringkasan:
      "Aplikasi persuratan, disposisi, arsip, dan kepegawaian BKPSDM mulai digunakan.",
    isi: "Aplikasi SekreDinas digunakan untuk mengelola surat masuk dan keluar, disposisi berantai, arsip digital, agenda, pengumuman, serta pengajuan cuti. Setiap pegawai melakukan login memakai alamat email kantor, lalu mengganti sandi awal pada kunjungan pertama. Bila menemukan kendala, hubungi admin sistem.",
    kategori: "pengumuman",
    internal: true,
    publik: true,
  },
  {
    judul: "Jam layanan kantor",
    ringkasan:
      "Pelayanan kepegawaian dibuka Senin-Kamis 08.00-15.00 WIT dan Jumat 08.00-11.00 WIT.",
    isi: "Masyarakat dan pegawai dapat datang ke kantor pada hari dan jam tersebut. Untuk pertanyaan di luar jam layanan, dapat meninggalkan pesan melalui halaman kontak pada situs ini.",
    kategori: "informasi",
    internal: false,
    publik: true,
  },
];
