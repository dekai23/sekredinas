/**
 * Skema validasi formulir modul konten & kepegawaian:
 * arsip digital, agenda, pengumuman, inventaris, unit kerja, kategori surat,
 * cuti, dan pengaturan sistem.
 *
 * Semua divalidasi ulang di server (server action) sebelum menyentuh basis
 * data, sehingga manipulasi formulir lewat peramban tidak berpengaruh.
 */
import { z } from "zod";

/**
 * Bentuk hasil formulir & util galat dipakai bersama modul validasi lain.
 * Diekspor ulang agar pemanggil cukup mengimpor dari satu tempat.
 */
export { galatZod, formKeObjek, type HasilForm } from "./surat";

/** Checkbox HTML mengirim "on" saat dicentang, atau tidak ada saat tidak. */
export const booleanForm = z
  .union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal(""), z.undefined()])
  .transform((nilai) => nilai === "on" || nilai === "true" || nilai === "1");

const tanggalSql = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid.")
  .refine((nilai) => !Number.isNaN(Date.parse(nilai)), "Tanggal tidak dikenal.");

const waktuLokal = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "Waktu tidak valid (gunakan tanggal & jam).")
  .refine((nilai) => !Number.isNaN(Date.parse(nilai)), "Waktu tidak dikenal.");

const teks = (maks: number) =>
  z
    .string()
    .trim()
    .transform((nilai) => nilai.replace(/\s{2,}/g, " "))
    .pipe(z.string().max(maks, `Maksimal ${maks} karakter.`));

const teksWajib = (maks: number) => teks(maks).pipe(z.string().min(1, "Wajib diisi."));

const uuidOpsional = z
  .string()
  .uuid("Pilihan tidak valid.")
  .optional()
  .or(z.literal(""));

const tahunOpsional = z
  .union([z.string().regex(/^\d{4}$/, "Tahun harus 4 angka."), z.literal("")])
  .optional()
  .transform((nilai) => (nilai ? Number(nilai) : null));

const angkaOpsional = z
  .union([z.string().regex(/^\d+$/, "Harus berupa angka."), z.literal("")])
  .optional()
  .transform((nilai) => (nilai ? Number(nilai) : null));

/* ------------------------------ ARSIP ------------------------------ */

export const skemaArsip = z.object({
  judul: teksWajib(200),
  deskripsi: teks(2000).default(""),
  kategori: teks(100).default(""),
  kodeKlasifikasi: teks(50).default(""),
  tahun: tahunOpsional,
  unitId: uuidOpsional,
  tags: teks(500).default(""),
});

export type DataArsip = z.infer<typeof skemaArsip>;

/* ------------------------------ AGENDA ----------------------------- */

export const jenisAgenda = ["rapat", "kunjungan", "pelatihan", "kegiatan", "lainnya"] as const;

export const skemaAgenda = z
  .object({
    judul: teksWajib(200),
    deskripsi: teks(2000).default(""),
    lokasi: teks(200).default(""),
    mulai: waktuLokal,
    selesai: z.union([waktuLokal, z.literal("")]).default(""),
    jenis: z.enum(jenisAgenda).default("rapat"),
    publik: booleanForm,
    penanggungJawabId: uuidOpsional,
  })
  .refine((data) => !data.selesai || Date.parse(data.selesai) > Date.parse(data.mulai), {
    message: "Waktu selesai harus setelah waktu mulai.",
    path: ["selesai"],
  });

export type DataAgenda = z.infer<typeof skemaAgenda>;

/* ---------------------------- PENGUMUMAN --------------------------- */

export const kategoriPengumuman = [
  "pengumuman",
  "kegiatan",
  "informasi",
  "layanan",
  "pencapaian",
] as const;

export const skemaPengumuman = z
  .object({
    judul: teksWajib(200),
    ringkasan: teks(500).default(""),
    isi: teksWajib(20000),
    prioritas: z.enum(["biasa", "penting", "segera", "rahasia"]).default("biasa"),
    kategori: z.enum(kategoriPengumuman).default("pengumuman"),
    internal: booleanForm,
    publik: booleanForm,
    tanggalMulai: tanggalSql.optional().or(z.literal("")),
    tanggalBerakhir: z.union([tanggalSql, z.literal("")]).default(""),
  })
  .refine(
    (data) =>
      !data.tanggalBerakhir ||
      !data.tanggalMulai ||
      data.tanggalBerakhir >= data.tanggalMulai,
    { message: "Tanggal berakhir tidak boleh lebih awal.", path: ["tanggalBerakhir"] },
  );

export type DataPengumuman = z.infer<typeof skemaPengumuman>;

/* ---------------------------- INVENTARIS --------------------------- */

export const kondisiAset = ["baik", "rusak_ringan", "rusak_berat"] as const;

export const skemaInventaris = z.object({
  namaAset: teksWajib(200),
  kategori: teksWajib(100),
  merek: teks(100).default(""),
  tahunPerolehan: tahunOpsional,
  jumlah: z
    .union([z.string().regex(/^\d+$/, "Harus berupa angka."), z.literal("")])
    .optional()
    .transform((nilai) => (nilai ? Math.max(1, Number(nilai)) : 1)),
  satuan: teks(20).default("unit"),
  kondisi: z.enum(kondisiAset).default("baik"),
  lokasi: teks(200).default(""),
  nilaiPerolehan: angkaOpsional,
  nomorPolisi: teks(30).default(""),
  nomorBmn: teks(30).default(""),
  sumberDana: teks(100).default(""),
  penanggungJawabId: uuidOpsional,
});

export type DataInventaris = z.infer<typeof skemaInventaris>;

/* ----------------------------- UNIT KERJA -------------------------- */

export const jenisUnit = [
  "badan",
  "sekretariat",
  "sub_bagian",
  "bidang",
  "sub_bidang",
  "kelompok_jabatan_fungsional",
] as const;

export const skemaUnitKerja = z.object({
  nama: teksWajib(200),
  kode: teksWajib(20),
  jenis: z.enum(jenisUnit).default("sub_bidang"),
  indukId: uuidOpsional,
  /** "on" bila unit berada langsung di bawah Pemerintah Kabupaten Yahukimo. */
  indukPemkab: booleanForm,
  urutan: angkaOpsional,
  pejabatEselon: teks(10).default(""),
  publik: booleanForm,
});

export type DataUnitKerja = z.infer<typeof skemaUnitKerja>;

/* --------------------------- KATEGORI SURAT ------------------------- */

export const skemaKategori = z.object({
  nama: teksWajib(120),
  kode: teksWajib(10),
  uraian: teks(500).default(""),
  aktif: booleanForm,
});

export type DataKategori = z.infer<typeof skemaKategori>;

/* -------------------------------- CUTI ------------------------------ */

export const jenisCuti = [
  "cuti_annual",
  "cuti_besar",
  "cuti_sakit",
  "cuti_melahirkan",
  "cuti_khusus",
] as const;

export const skemaCuti = z
  .object({
    jenisCuti: z.enum(jenisCuti),
    tanggalMulai: tanggalSql,
    tanggalSelesai: tanggalSql,
    alasan: teksWajib(2000),
    alamatTujuan: teks(200).default(""),
    kontak: teks(50).default(""),
  })
  .refine((data) => data.tanggalSelesai >= data.tanggalMulai, {
    message: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.",
    path: ["tanggalSelesai"],
  });

export type DataCuti = z.infer<typeof skemaCuti>;

/* ------------------------------ LAYANAN ----------------------------- */

/**
 * Layanan kepegawaian publik. `syarat` dan `alur` dikirim sebagai teks
 * multi-baris (satu baris = satu butir) lalu disimpan sebagai JSON array oleh
 * lapisan operasi.
 */
export const skemaLayanan = z.object({
  judul: teksWajib(200),
  slug: teks(220).default(""),
  ringkasan: teks(500).default(""),
  deskripsi: teksWajib(20000),
  syarat: teks(8000).default(""),
  alur: teks(8000).default(""),
  waktuPenyelesaian: teks(60).default(""),
  dasarHukum: teks(300).default(""),
  unitId: uuidOpsional,
  urutan: angkaOpsional,
  publik: booleanForm,
});

export type DataLayanan = z.infer<typeof skemaLayanan>;

/* ------------------------------- BERITA ----------------------------- */
export const kategoriBerita = [
  "berita",
  "kegiatan",
  "artikel",
  "diklat",
  "prestasi",
] as const;

export const skemaBerita = z.object({
  judul: teksWajib(200),
  slug: teks(220).default(""),
  ringkasan: teks(500).default(""),
  isi: teksWajib(40000),
  kategori: z.enum(kategoriBerita).default("kegiatan"),
  /** URL gambar utama; kosong = pakai sampul abstrak bawaan. */
  gambarUrl: teks(500).default(""),
  publik: booleanForm,
  noindex: booleanForm,
  tanggalTerbit: tanggalSql.optional().or(z.literal("")),
});

export type DataBerita = z.infer<typeof skemaBerita>;

/* ------------------------------ ABSENSI ----------------------------- */
export const statusAbsensi = [
  "hadir",
  "izin",
  "sakit",
  "cuti",
  "dinas_luar",
  "alpa",
] as const;

const jam = z.union([
  z.string().regex(/^\d{2}:\d{2}$/, "Format jam tidak valid."),
  z.literal(""),
]);

export const skemaAbsensi = z.object({
  pegawaiId: z.string().uuid("Pegawai tidak valid."),
  tanggal: tanggalSql,
  status: z.enum(statusAbsensi).default("hadir"),
  /** Jam dalam format `HH:mm` WIT; kosong = tidak dicatat. */
  jamMasuk: jam.optional().transform((v) => v ?? ""),
  jamPulang: jam.optional().transform((v) => v ?? ""),
  keterangan: teks(500).default(""),
});

export type DataAbsensi = z.infer<typeof skemaAbsensi>;

/* --------------------------- PENGATURAN ----------------------------- */

/** Seluruh nilai pengaturan diterima sebagai string (key-value). */
export const KUNCI_PENGATURAN = [
  "namaBadan",
  "namaSingkat",
  "pemerintah",
  "alamat",
  "emailKantor",
  "telepon",
  "ukuranKertas",
  "zonaWaktu",
  "namaAplikasi",
  "sosmedWhatsapp",
  "sosmedFacebook",
  "sosmedInstagram",
  "sosmedX",
  "sosmedYoutube",
  "berandaJudul",
  "berandaSubjudul",
  "berandaSambutanJudul",
  "berandaSambutanIsi",
  "berandaSambutanNama",
  "berandaSambutanJabatan",
  "berandaSambutanFoto",
] as const;

export const skemaPengaturan = z.object({
  namaBadan: teksWajib(200),
  namaSingkat: teksWajib(150),
  pemerintah: teksWajib(150),
  alamat: teksWajib(200),
  emailKantor: teksWajib(150),
  telepon: teks(30).default(""),
  ukuranKertas: teks(50).default("F4 (21,6 x 33 cm)"),
  zonaWaktu: teks(50).default("Asia/Jayapura"),
  namaAplikasi: teks(80).default("BKPSDM Yahukimo"),
  sosmedWhatsapp: teks(300).default(""),
  sosmedFacebook: teks(300).default(""),
  sosmedInstagram: teks(300).default(""),
  sosmedX: teks(300).default(""),
  sosmedYoutube: teks(300).default(""),
  berandaJudul: teks(200).default(""),
  berandaSubjudul: teks(600).default(""),
  berandaSambutanJudul: teks(200).default(""),
  berandaSambutanIsi: teks(6000).default(""),
  berandaSambutanNama: teks(150).default(""),
  berandaSambutanJabatan: teks(200).default(""),
  berandaSambutanFoto: teks(500).default(""),
});

export type DataPengaturan = z.infer<typeof skemaPengaturan>;
