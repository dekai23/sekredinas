/**
 * Informasi layanan kepegawaian untuk portal publik (docs/ARSITEKTUR.md).
 * Bersifat informasi syarat dan alur - belum formulir pengajuan online;
 * modul pengajuan cuti dibangun pada Fase 4.
 *
 * `kodeUnit` menunjuk unit pengelola pada seed/struktur-organisasi.json.
 */

export interface LayananBenih {
  judul: string;
  slug: string;
  ringkasan: string;
  deskripsi: string;
  syarat: string[];
  alur: string[];
  waktuPenyelesaian: string;
  dasarHukum: string;
  kodeUnit?: string;
}

export const layananBenih: LayananBenih[] = [
  {
    judul: "Pengajuan Kenaikan Pangkat",
    slug: "kenaikan-pangkat",
    ringkasan: "Syarat dan alur kenaikan pangkat serta pengangkatan ASN.",
    deskripsi:
      "Berkas diajukan paling lambat tiga bulan sebelum periode kenaikan pangkat. Verifikasi berkas dilakukan Sub Bidang Kepangkatan, disahkan Kepala Bidang, lalu disahkan Kepala Badan.",
    syarat: [
      "Fotokopi SK terakhir dan SK pengangkatan",
      "Fotokopi KP4 (kartu pengalaman kerja)",
      "Daftar riwayat pekerjaan yang pernah dilalui",
      "Salinan sertifikat kompetensi atau sertifikat diklat",
    ],
    alur: [
      "Mengisi formulir pada unit kerja masing-masing",
      "Verifikasi berkas oleh Sub Bidang Kepangkatan",
      "Pengesahan oleh Kepala Bidang",
      "Pengesahan oleh Kepala Badan",
    ],
    waktuPenyelesaian: "14 hari kerja",
    dasarHukum: "PP 11/2017 jo. PP 17/2020 tentang Manajemen PNS",
    kodeUnit: "MPP-01",
  },
  {
    judul: "Pengajuan Pensiun",
    slug: "pensiun",
    ringkasan: "Syarat dan alur pengajuan pensiun dan surat rekomendasi pensionis.",
    deskripsi:
      "Pengajuan diajukan paling lambat enam bulan sebelum usia pensiun. Verifikasi berkas dilakukan Sub Bidang Mutasi, Pengembangan Karier dan Promosi.",
    syarat: [
      "Surat permohonan yang ditandatangani pegawai",
      "Fotokopi SK pengangkatan dan SK terakhir",
      "Kartu Tanda Pensiun dan fotokopi KTP",
      "Data riwayat jabatan dan masa kerja",
    ],
    alur: [
      "Pengajuan ke unit kerja masing-masing",
      "Verifikasi berkas dan pemeriksaan masa kerja",
      "Pengesahan Kepala Bidang dan Kepala Badan",
      "Penerbitan surat rekomendasi pensiun",
    ],
    waktuPenyelesaian: "21 hari kerja",
    dasarHukum: "PP 45/1990 jo. PP 60/2014 tentang Pensiun",
    kodeUnit: "MPP-02",
  },
];
