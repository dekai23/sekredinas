/**
 * Pembacaan data surat masuk (server side).
 *
 * Berpisah dari `aksi.ts` karena berkas "use server" hanya boleh mengekspor
 * fungsi async; helper di sini tetap dapat dipakai langsung oleh server
 * component tanpa melalui server action.
 */
import { and, count, eq, gte, lte, ne, type SQL } from "drizzle-orm";

import type { SesiPengguna } from "@/lib/auth/sesi";
import { db, schema } from "@/lib/db";

/**
 * Surat bertanda "rahasia" hanya boleh dilihat oleh Admin dan Pimpinan
 * (PRD 6.B). Dipakai bersama oleh daftar, detail, dan pencarian.
 */
export function bolehLihatRahasia(sesi: SesiPengguna, sifat: string): boolean {
  if (sifat !== "rahasia") return true;
  return sesi.role === "admin" || sesi.role === "pimpinan";
}

/**
 * Syarat WHERE tambahan sesuai kewenangan.
 * Pegawai biasa tidak melihat surat bertanda "rahasia".
 */
export function syaratRahasia(sesi: SesiPengguna): SQL | undefined {
  return bolehLihatRahasia(sesi, "rahasia")
    ? undefined
    : ne(schema.suratMasuk.sifat, "rahasia");
}

/** Jumlah surat masuk pada satu status (untuk kartu dashboard). */
export async function hitungSuratMasuk(status?: string): Promise<number> {
  const baris = await db
    .select({ n: count() })
    .from(schema.suratMasuk)
    .where(status ? eq(schema.suratMasuk.status, status as never) : undefined);
  return baris[0]?.n ?? 0;
}

/** Jumlah surat masuk dalam rentang tanggal (format YYYY-MM-DD). */
export async function hitungSuratMasukRentang(
  mulai: string,
  selesai: string,
  status?: string,
): Promise<number> {
  const syarat: SQL[] = [
    gte(schema.suratMasuk.tanggalTerima, mulai),
    lte(schema.suratMasuk.tanggalTerima, selesai),
  ];
  if (status) syarat.push(eq(schema.suratMasuk.status, status as never));

  const baris = await db
    .select({ n: count() })
    .from(schema.suratMasuk)
    .where(and(...syarat));
  return baris[0]?.n ?? 0;
}

