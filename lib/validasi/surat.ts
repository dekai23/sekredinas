/**
 * Skema validasi formulir persuratan (divalidasi di server, bukan di peramban).
 *
 * Semua server action memanggil `skema.parse()` pada isi FormData sebelum
 * menyentuh basis data, sehingga data yang tersimpan selalu valid meskipun
 * formulir dimanipulasi lewat devtools.
 */
import { z } from "zod";

/** Sifat surat (PRD 6.B). "Rahasia" hanya terlihat Admin & Pimpinan. */
export const sifatSurat = ["biasa", "penting", "segera", "rahasia"] as const;

export const statusSuratMasuk = [
  "terkirim",
  "dibaca",
  "didisposisi",
  "selesai",
  "arsip",
] as const;

export const statusSuratKeluar = [
  "draft",
  "diajukan",
  "terkirim",
  "selesai",
  "arsip",
] as const;

/** Tanggal masuk sebagai `YYYY-MM-DD` (hasil `<input type="date">`). */
const tanggal = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid.")
  .refine((nilai) => !Number.isNaN(Date.parse(nilai)), "Tanggal tidak dikenal.");

/** Bersihkan input teks: pangkas spasi ganda dan batasi panjang. */
const teks = (maks: number) =>
  z
    .string()
    .trim()
    .transform((nilai) => nilai.replace(/\s{2,}/g, " "))
    .pipe(z.string().max(maks, `Maksimal ${maks} karakter.`));

const teksWajib = (maks: number) =>
  teks(maks).pipe(z.string().min(1, "Wajib diisi."));

/** Bentuk hasil formulir yang dipakai bersama oleh seluruh server action. */
export interface HasilForm {
  galat?: string;
  /** Galat per-field; key = nama kolom pada formulir. */
  field?: Record<string, string>;
  sukses?: string;
}

/* --------------------------- SURAT MASUK --------------------------- */

/**
 * Registrasi surat masuk (PRD 6.B). Kolom wajib: asal surat, perihal,
 * tanggal surat, tanggal terima, dan berkas scan.
 */
export const skemaSuratMasuk = z
  .object({
    asalSurat: teksWajib(200),
    nomorSurat: teks(100).default(""),
    perihal: teksWajib(2000),
    tanggalSurat: tanggal,
    tanggalTerima: tanggal,
    kategoriId: z.string().uuid("Kategori surat tidak valid.").optional().or(z.literal("")),
    sifat: z.enum(sifatSurat).default("biasa"),
    catatan: teks(1000).default(""),
  })
  .refine((data) => data.tanggalTerima >= data.tanggalSurat, {
    message: "Tanggal terima tidak boleh lebih awal dari tanggal surat.",
    path: ["tanggalTerima"],
  });

export type DataSuratMasuk = z.infer<typeof skemaSuratMasuk>;

/* --------------------------- SURAT KELUAR -------------------------- */

/**
 * Penyusun surat keluar (PRD 6.C). Penandatangan wajib dipilih dari pegawai
 * yang diberi peran pimpinan (divalidasi ulang di server action).
 */
export const skemaSuratKeluar = z.object({
  tujuan: teksWajib(200),
  perihal: teksWajib(2000),
  isiSurat: teksWajib(20000),
  tanggalSurat: tanggal,
  kategoriId: z.string().uuid("Kategori surat tidak valid."),
  unitId: z.string().uuid("Unit kerja tidak valid."),
  penandatanganId: z.string().uuid("Penandatangan wajib dipilih."),
  sifat: z.enum(sifatSurat).default("biasa"),
  parafUntuk: teks(500).default(""),
});

export type DataSuratKeluar = z.infer<typeof skemaSuratKeluar>;

/* ---------------------------- DISPOSISI ---------------------------- */

/** Penerusan disposisi berantai (PRD 6.D). */
export const skemaDisposisi = z.object({
  suratMasukId: z.string().uuid("Surat tidak valid."),
  keUserId: z.string().uuid("Penerima disposisi wajib dipilih."),
  instruksi: teksWajib(2000),
  catatan: teks(1000).default(""),
  /** Batas waktu, default 2 hari kerja setelah hari ini. */
  batasWaktu: tanggal.optional().or(z.literal("")),
  /** Disposisi lanjutan meneruskan dari disposisi yang sedang dikerjakan. */
  indukId: z.string().uuid().optional().or(z.literal("")),
});

export type DataDisposisi = z.infer<typeof skemaDisposisi>;

/** Catatan tindak lanjut saat pegawai menandai disposisi selesai. */
export const skemaTindakLanjut = z.object({
  disposisiId: z.string().uuid("Disposisi tidak valid."),
  catatan: teksWajib(2000),
});

/* ------------------------------ UTILITAS ---------------------------- */

/** Membaca field FormData menjadi objek biasa (File diabaikan). */
export function formKeObjek(data: FormData): Record<string, string> {
  const hasil: Record<string, string> = {};
  for (const [kunci, nilai] of data.entries()) {
    if (typeof nilai === "string") hasil[kunci] = nilai;
  }
  return hasil;
}

/** Mengubah galat Zod menjadi peta `{ namaField: pesan }`. */
export function galatZod(
  galat: z.ZodError,
): Record<string, string> {
  const peta: Record<string, string> = {};
  for (const isu of galat.issues) {
    const kunci = isu.path.join(".") || "_form";
    if (!peta[kunci]) peta[kunci] = isu.message;
  }
  return peta;
}
