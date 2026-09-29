/**
 * Halaman diagnostik sementara untuk memastikan koneksi database pada
 * lingkungan deploy (mis. Netlify). Tidak menampilkan data sensitif - hanya
 * nama variabel yang dipakai, status koneksi, dan pesan galat singkat.
 *
 * HAPUS berkas ini setelah deployment dipastikan berjalan.
 */
import { count, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sumber = process.env.DATABASE_URL
    ? "DATABASE_URL"
    : process.env.NETLIFY_DATABASE_URL
      ? "NETLIFY_DATABASE_URL"
      : process.env.NETLIFY_DB_URL
        ? "NETLIFY_DB_URL"
        : "PGlite (lokal/folder)";

  const hasil = {
    sumber,
    terhubung: false,
    tabelAda: false,
    jumlahPegawai: 0,
    jumlahPengaturan: 0,
    galat: null as string | null,
  };

  try {
    await db.execute(sql`select 1`);
    hasil.terhubung = true;

    try {
      const [pegawai] = await db.select({ n: count() }).from(schema.pegawai);
      const [pengaturan] = await db.select({ n: count() }).from(schema.pengaturan);
      hasil.tabelAda = true;
      hasil.jumlahPegawai = Number(pegawai?.n ?? 0);
      hasil.jumlahPengaturan = Number(pengaturan?.n ?? 0);
    } catch (galat) {
      hasil.galat = `tabel: ${galat instanceof Error ? galat.message : String(galat)}`;
    }
  } catch (galat) {
    hasil.galat = `koneksi: ${galat instanceof Error ? galat.message : String(galat)}`;
  }

  return NextResponse.json(hasil, { headers: { "Cache-Control": "no-store" } });
}
