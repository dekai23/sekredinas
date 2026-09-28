/**
 * Penyimpanan berkas unggahan (scan surat, lampiran, arsip).
 *
 * Berkas TIDAK diletakkan di `public/` karena berkas persuratan bersifat
 * terbatas. Semua akses lewat route handler `/berkas/...` yang memeriksa sesi
 * terlebih dahulu (lihat app/berkas/[...nama]/route.ts).
 *
 * developing  : folder lokal `UPLOAD_DIR` (default `.uploads`)
 * produksi    : isi `UPLOAD_DIR` dengan folder bersama (SMB/NAS) atau
 *               ganti implementasi ini ke Supabase Storage / S3.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

import { namaBerkasAman } from "@/lib/utils";

export interface HasilUnggah {
  /** Path relatif yang disimpan di basis data, mis. `surat-masuk/2026/9/xxx.pdf`. */
  path: string;
  namaAsli: string;
  ukuran: number;
  tipe: string;
}

export interface AturanUnggah {
  /** MIME yang diizinkan. */
  tipe: string[];
  /** Batas ukuran dalam megabyte. */
  maksMb: number;
  /** Ekstensi yang diizinkan, huruf kecil dengan titik, mis. `.pdf`. */
  ekstensi: string[];
}

export const ATURAN_SURAT_MASUK: AturanUnggah = {
  tipe: ["application/pdf"],
  maksMb: 10,
  ekstensi: [".pdf"],
};

export const ATURAN_SURAT_KELUAR: AturanUnggah = {
  tipe: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  maksMb: 10,
  ekstensi: [".pdf", ".doc", ".docx"],
};

export const ATURAN_ARSIP: AturanUnggah = {
  tipe: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
  ],
  maksMb: 25,
  ekstensi: [".pdf", ".docx", ".xlsx", ".jpg", ".jpeg", ".png"],
};

export class GalatUnggah extends Error {}

function folderUnggah(): string {
  const dir = process.env.UPLOAD_DIR?.trim() || ".uploads";
  return resolve(process.cwd(), dir);
}

/** Path absolut berkas dari path relatif tersimpan. */
export function pathAbsolut(pathRelatif: string): string {
  return join(folderUnggah(), pathRelatif);
}

/**
 * Menyimpan berkas hasil unggahan.
 *
 * Pengamanan berlapis:
 *  1. Validasi ukuran (sebelum seluruh berkas dibaca ke memori).
 *  2. Validasi MIME *dari isi berkas* (magic bytes) - bukan sekadar header
 *     yang bisa dipalsukan peramban.
 *  3. Validasi ekstensi.
 *  4. Nama berkas dibersihkan dan diberi hash acak, sehingga nama asli dari
 *     pengguna tidak pernah dipakai langsung sebagai path.
 */
export async function simpanBerkas(
  berkas: File,
  aturan: AturanUnggah,
  /** Folder tujuan, mis. `surat-masuk` atau `arsip`. */
  kategori: string,
): Promise<HasilUnggah> {
  if (berkas.size === 0) {
    throw new GalatUnggah("Berkas kosong. Pilih berkas yang akan diunggah.");
  }

  const maksBytes = aturan.maksMb * 1024 * 1024;
  if (berkas.size > maksBytes) {
    throw new GalatUnggah(
      `Ukuran berkas ${(berkas.size / 1024 / 1024).toFixed(1)} MB melebihi batas ${aturan.maksMb} MB.`,
    );
  }

  const ekstensiAsli = extname(berkas.name).toLowerCase();
  if (!aturan.ekstensi.includes(ekstensiAsli)) {
    throw new GalatUnggah(
      `Format berkas ${ekstensiAsli || "tanpa ekstensi"} tidak diizinkan. Gunakan: ${aturan.ekstensi.join(", ")}.`,
    );
  }

  const isi = Buffer.from(await berkas.arrayBuffer());
  const tipeSesuai = await tipeSebenarnya(isi);
  if (!tipeSesuai || !aturan.tipe.includes(tipeSesuai)) {
    throw new GalatUnggah(
      "Isi berkas tidak sesuai dengan format yang dipilih. Format berkas kemungkinan " +
        "telah diganti nama ekstensinya.",
    );
  }

  // Nama berkas: nama aman + hash isi, sehingga nama asli dari pengguna tidak
  // pernah dipakai langsung sebagai path dan berkas identik tidak menimpa.
  const date = new Date();
  const subFolder = `${kategori}/${date.getFullYear()}/${date.getMonth() + 1}`;
  const hash = createHash("sha256").update(isi).digest("hex").slice(0, 12);
  const namaSimpan = `${namaBerkasAman(berkas.name.replace(/\.[^.]+$/, ""))}-${hash}${ekstensiAsli}`;

  const folderTujuan = join(folderUnggah(), subFolder);
  await mkdir(folderTujuan, { recursive: true });
  await writeFile(join(folderTujuan, namaSimpan), isi);

  return {
    path: `${subFolder}/${namaSimpan}`,
    namaAsli: berkas.name,
    ukuran: berkas.size,
    tipe: tipeSesuai,
  };
}

/**
 * Membaca magic bytes untuk memastikan jenis berkas sesungguhnya.
 * Mengembalikan MIME standar, atau null bila tidak dikenali.
 */
async function tipeSebenarnya(isi: Buffer): Promise<string | null> {
  if (isi.length < 12) return null;
  const kepala = isi.subarray(0, 12);

  // PDF: %PDF-
  if (kepala.subarray(0, 5).toString("latin1") === "%PDF-") {
    return "application/pdf";
  }
  // JPEG: FF D8 FF
  if (kepala[0] === 0xff && kepala[1] === 0xd8 && kepala[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    kepala[0] === 0x89 &&
    kepala[1] === 0x50 &&
    kepala[2] === 0x4e &&
    kepala[3] === 0x47
  ) {
    return "image/png";
  }
  // ZIP (docx/xlsx adalah container ZIP): PK\x03\x04
  if (
    kepala[0] === 0x50 &&
    kepala[1] === 0x4b &&
    kepala[2] === 0x03 &&
    kepala[3] === 0x04
  ) {
    // Bedakan docx/xlsx dengan membaca nama direktori pertama di dalam ZIP.
    const teks = isi.subarray(0, Math.min(isi.length, 4096)).toString("latin1");
    if (teks.includes("word/")) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    if (teks.includes("xl/")) {
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }
    return "application/zip";
  }
  // OLE2 / .doc lama: D0 CF 11 E0 A1 B1 1A E1
  if (
    kepala[0] === 0xd0 &&
    kepala[1] === 0xcf &&
    kepala[2] === 0x11 &&
    kepala[3] === 0xe0
  ) {
    return "application/msword";
  }
  return null;
}
