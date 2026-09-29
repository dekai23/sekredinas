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

/* ------------------------------------------------------------------ */
/* Berita / artikel / kegiatan portal publik                          */
/* ------------------------------------------------------------------ */

export interface BeritaBenih {
  judul: string;
  slug: string;
  ringkasan: string;
  isi: string;
  kategori: string;
  /** Jumlah hari yang lalu sejak seed dijalankan (untuk urutan terbit). */
  hariLalu: number;
}

export const beritaBenih: BeritaBenih[] = [
  {
    judul: "Bimtek Penyusunan SKP bagi Pejabat Fungsional Lingkup Pemkab Yahukimo",
    slug: "bimtek-penyusunan-skp-pejabat-fungsional",
    ringkasan:
      "BKPSDM menggelar bimbingan teknis penyusunan Sasaran Kinerja Pegawai bagi 60 pejabat fungsional di Aula Dinas.",
    isi: "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM) Kabupaten Yahukimo menyelenggarakan bimbingan teknis (bimtek) penyusunan Sasaran Kinerja Pegawai (SKP) bagi pejabat fungsional. Kegiatan berlangsung di Aula Dinas dan diikuti sekitar 60 peserta dari berbagai perangkat daerah.\n\nKepala BKPSDM menegaskan bahwa SKP merupakan instrumen penting dalam manajemen kinerja ASN. \"SKP yang disusun dengan baik akan memudahkan penilaian kinerja dan pengembangan karier,\" ujarnya saat membuka kegiatan.\n\nMateri bimtek mencakup teknik penetapan indikator kinerja, penyelarasan dengan rencana strategis organisasi, serta pengisian SKP pada aplikasi kepegawaian. Peserta juga diberikan simulasi penyusunan SKP dan pendampingan langsung oleh fasilitator.",
    kategori: "kegiatan",
    hariLalu: 2,
  },
  {
    judul: "Rapat Koordinasi Kepegawaian Regional Papua Bahas Transformasi ASN",
    slug: "rakor-kepegawaian-regional-papua",
    ringkasan:
      "BKPSDM Yahukimo mengikuti rapat koordinasi kepegawaian regional yang membahas transformasi dan percepatan digitalisasi layanan ASN.",
    isi: "BKPSDM Kabupaten Yahukimo mengikuti Rapat Koordinasi Kepegawaian Regional Papua. Agenda utama rapat adalah percepatan transformasi ASN serta digitalisasi layanan kepegawaian di wilayah Papua.\n\nDalam forum tersebut dibahas berbagai tantangan pengelolaan kepegawaian di daerah, mulai dari pemutakhiran data mandiri, percepatan kenaikan pangkat, hingga pemanfaatan teknologi informasi untuk pelayanan yang lebih cepat dan transparan.\n\nHasil rapat akan ditindaklanjuti melalui program kerja masing-masing instansi, termasuk penguatan tata kelola data kepegawaian di BKPSDM Yahukimo.",
    kategori: "berita",
    hariLalu: 5,
  },
  {
    judul: "Memahami Kenaikan Pangkat ASN: Syarat dan Tahapan yang Wajib Dipenuhi",
    slug: "memahami-kenaikan-pangkat-asn",
    ringkasan:
      "Kenaikan pangkat adalah hak setiap ASN yang berkinerja baik. Simak syarat, dokumen, dan tahapan pengusulannya.",
    isi: "Kenaikan pangkat merupakan salah satu hak kepegawaian yang paling ditunggu ASN. Proses ini dilakukan dua kali dalam setahun, yaitu periode April dan Oktober, dengan waktu pengusulan yang telah ditetapkan.\n\nSyarat umum antara lain masa kerja golongan yang memenuhi, penilaian kinerja minimal bernilai baik, serta tidak sedang menjalani hukuman disiplin. Selain itu, ASN wajib melengkapi dokumen seperti SK pangkat terakhir, bukti pengembangan kompetensi, dan surat keputusan jabatan.\n\nTahapan pengusulan dimulai dari verifikasi berkas oleh unit kepegawaian, pemeriksaan oleh tim penilai, hingga penetapan dan penerbitan Surat Keputusan. Pastikan seluruh dokumen disiapkan lebih awal agar pengusulan tidak tertunda.",
    kategori: "artikel",
    hariLalu: 9,
  },
  {
    judul: "Pelantikan dan Pengambilan Sumpah Jabatan 45 ASN Formasi 2024",
    slug: "pelantikan-asn-formasi-2024",
    ringkasan:
      "Sebanyak 45 ASN formasi 2024 resmi dilantik dan mengucapkan sumpah janji jabatan di lingkungan Pemerintah Kabupaten Yahukimo.",
    isi: "Sebanyak 45 aparatur sipil negara (ASN) formasi tahun 2024 resmi dilantik dan mengucapkan sumpah janji jabatan. Prosesi pelantikan dipimpin langsung oleh pejabat yang berwenang dan disaksikan keluarga serta pimpinan perangkat daerah.\n\nDalam sambutannya, Kepala BKPSDM mengingatkan bahwa pengangkatan adalah awal dari pengabdian. \"Tunjukkan integritas dan pelayanan terbaik bagi masyarakat Yahukimo,\" pesannya.\n\nSetelah pelantikan, para ASN akan mengikuti orientasi untuk mengenal tugas, fungsi, dan tata kelola pemerintahan daerah sebelum ditempatkan pada unit kerja masing-masing.",
    kategori: "kegiatan",
    hariLalu: 14,
  },
  {
    judul: "Sosialisasi Aplikasi SekreDinas kepada Seluruh Perangkat Daerah",
    slug: "sosialisasi-aplikasi-sekredinas",
    ringkasan:
      "SekreDinas, sistem persuratan dan administrasi kepegawaian digital, disosialisasikan agar seluruh perangkat daerah beralih dari agenda manual.",
    isi: "BKPSDM memperkenalkan aplikasi SekreDinas, sebuah sistem terintegrasi untuk pengelolaan persuratan, disposisi, arsip digital, agenda, pengumuman, dan administrasi kepegawaian. Sosialisasi dilakukan kepada operator dari seluruh perangkat daerah.\n\nAplikasi ini diharapkan mengubah alur kerja sekretariat dari tumpukan kertas dan buku agenda manual menjadi sistem yang cepat, aman, dan tertelusuri. Registrasi surat, disposisi pimpinan, hingga pencarian arsip kini dapat dilakukan dalam satu platform.\n\nPeserta mendapatkan akun, pelatihan penggunaan, serta pendampingan teknis selama masa transisi. Dukungan berkelanjutan akan terus diberikan oleh tim pengelola aplikasi.",
    kategori: "berita",
    hariLalu: 20,
  },
  {
    judul: "Pentingnya Pemutakhiran Data Mandiri ASN Secara Berkala",
    slug: "pentingnya-pemutakhiran-data-mandiri-asn",
    ringkasan:
      "Data kepegawaian yang mutakhir mencegah penundaan kenaikan pangkat, pensiun, dan layanan kepegawaian lainnya.",
    isi: "Pemutakhiran data mandiri ASN adalah kewajiban setiap pegawai. Data yang tidak diperbarui dapat menghambat berbagai layanan, seperti kenaikan pangkat, pengurusan pensiun, hingga penerbitan kartu pegawai.\n\nBeberapa data yang perlu diperiksa secara berkala antara lain data keluarga, riwayat pendidikan, riwayat jabatan, serta data rekening dan nomor kontak. Perubahan status seperti pernikahan, kelahiran anak, atau kelulusan pendidikan wajib segera dilaporkan.\n\nBKPSDM mengimbau seluruh ASN memanfaatkan kanal resmi untuk memperbarui data masing-masing. Dengan data yang akurat, proses perencanaan kepegawaian dan pengambilan kebijakan akan lebih tepat sasaran.",
    kategori: "artikel",
    hariLalu: 27,
  },
];

/* ------------------------------------------------------------------ */
/* Agenda kegiatan awal                                               */
/* ------------------------------------------------------------------ */

export interface AgendaBenih {
  judul: string;
  deskripsi: string;
  lokasi: string;
  jenis: string;
  /** Selisih hari dari hari ini (positif = mendatang). */
  hari: number;
  jamMulai: number;
  jamSelesai: number;
  publik: boolean;
}

export const agendaBenih: AgendaBenih[] = [
  {
    judul: "Apel Pagi dan Pemeriksaan Kehadiran ASN",
    deskripsi: "Apel rutin seluruh pegawai dilanjutkan pemeriksaan kehadiran dan disiplin.",
    lokasi: "Halaman Kantor BKPSDM",
    jenis: "kegiatan",
    hari: 1,
    jamMulai: 7,
    jamSelesai: 8,
    publik: false,
  },
  {
    judul: "Rapat Koordinasi Bulanan Pimpinan",
    deskripsi: "Evaluasi capaian kinerja bulanan dan rencana kerja pekan berikutnya.",
    lokasi: "Ruang Rapat Utama",
    jenis: "rapat",
    hari: 3,
    jamMulai: 9,
    jamSelesai: 12,
    publik: true,
  },
  {
    judul: "Bimbingan Teknis Pengelolaan Arsip Digital",
    deskripsi: "Pelatihan penggunaan aplikasi arsip digital bagi operator perangkat daerah.",
    lokasi: "Aula Dinas",
    jenis: "pelatihan",
    hari: 7,
    jamMulai: 8,
    jamSelesai: 15,
    publik: true,
  },
  {
    judul: "Pelayanan Terpadu Kenaikan Pangkat Periode Oktober",
    deskripsi: "Layanan penerimaan berkas kenaikan pangkat ASN periode Oktober.",
    lokasi: "Loket Pelayanan Kepegawaian",
    jenis: "kegiatan",
    hari: 12,
    jamMulai: 8,
    jamSelesai: 14,
    publik: true,
  },
];

