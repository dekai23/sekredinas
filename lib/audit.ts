/**
 * Pencatatan audit log (PRD 6.B & 8.2).
 *
 * Setiap perubahan penting pada persuratan dicatat: siapa, apa, dan kapan.
 * Baris audit tidak boleh diubah atau dihapus oleh pengguna.
 */
import { headers } from "next/headers";

import { db, schema } from "@/lib/db";

export type Aksi =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "unduh"
  | "setujui"
  | "tolak"
  | "disposisi"
  | "arsip"
  | "lihat";

export interface CatatanAudit {
  userId: string | null;
  aksi: Aksi;
  entitas: string;
  entitasId?: string | null;
  /** Ringkasan perubahan, mis. "terkirim -> selesai". */
  perubahan?: string | null;
}

/**
 * Membaca alamat IP Pengirim.
 *
 * `headers()` hanya tersedia di dalam lingkup permintaan Next.js. Saat kode
 * dipanggil dari skrip (mis. seeding atau pengujian), fungsi ini harus tetap
 * aman dan mengembalikan null - bukan melempar galat.
 */
async function alamatPengirim(): Promise<string | null> {
  try {
    const daftar = await headers();
    return (
      daftar.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      daftar.get("x-real-ip") ??
      null
    );
  } catch {
    return null;
  }
}

/** Mencatat satu aktivitas. Gagal menulis log tidak boleh menggagalkan aksi. */
export async function catatAksi(catatan: CatatanAudit): Promise<void> {
  try {
    await db.insert(schema.auditLog).values({
      userId: catatan.userId,
      aksi: catatan.aksi,
      entitas: catatan.entitas,
      entitasId: catatan.entitasId ?? null,
      perubahan: catatan.perubahan ?? null,
      ip: await alamatPengirim(),
    });
  } catch (galat) {
    // Audit log bersifat pelengkap: jangan menggagalkan operasi bisnis.
    console.error("[audit] gagal mencatat:", galat);
  }
}

/** Membuat notifikasi internal untuk seorang pegawai. */
export async function beriNotifikasi({
  userId,
  judul,
  pesan,
  tipe,
  link,
}: {
  userId: string;
  judul: string;
  pesan: string;
  tipe: string;
  link?: string;
}): Promise<void> {
  await db.insert(schema.notifikasi).values({
    userId,
    judul,
    pesan,
    tipe,
    link: link ?? null,
  });
}
