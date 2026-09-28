/**
 * Pembacaan data disposisi (server side).
 *
 * Dipisahkan dari `aksi.ts` karena berkas "use server" hanya boleh mengekspor
 * fungsi async; fungsi pembacaan di sini tetap bisa `await` dan dipakai
 * langsung oleh server component tanpa melewati server action.
 */
import { and, desc, eq, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { wajibMasuk } from "@/lib/auth/hak-akses";
import { db, schema } from "@/lib/db";
import { tanggalSql } from "@/lib/utils";

/**
 * Daftar disposisi milik pengguna (PRD 6.D).
 *  - kotak-masuk: disposisi yang menunggu tindak lanjut pengguna.
 *  - keluar     : disposisi yang dibuat pengguna (pemantauan pimpinan).
 */
export async function ambilDisposisi(mode: "kotak-masuk" | "keluar") {
  const sesi = await wajibMasuk("dashboard/disposisi");
  const kolom =
    mode === "kotak-masuk" ? schema.disposisi.keUserId : schema.disposisi.dariUserId;

  // Dua alias agar nama pengirim dan penerima dapat ditampilkan sekaligus.
  const penerima = alias(schema.pegawai, "penerima_disposisi");
  const pengirim = alias(schema.pegawai, "pengirim_disposisi");

  return db
    .select({
      id: schema.disposisi.id,
      suratMasukId: schema.disposisi.suratMasukId,
      instruksi: schema.disposisi.instruksi,
      catatan: schema.disposisi.catatan,
      status: schema.disposisi.status,
      batasWaktu: schema.disposisi.batasWaktu,
      dibacaPada: schema.disposisi.dibacaPada,
      selesaiPada: schema.disposisi.selesaiPada,
      level: schema.disposisi.level,
      nomorAgenda: schema.suratMasuk.nomorAgenda,
      perihal: schema.suratMasuk.perihal,
      namaPenerima: penerima.namaLengkap,
      namaPengirim: pengirim.namaLengkap,
    })
    .from(schema.disposisi)
    .innerJoin(schema.suratMasuk, eq(schema.disposisi.suratMasukId, schema.suratMasuk.id))
    .innerJoin(penerima, eq(schema.disposisi.keUserId, penerima.id))
    .innerJoin(pengirim, eq(schema.disposisi.dariUserId, pengirim.id))
    .where(eq(kolom, sesi.id))
    .orderBy(desc(schema.disposisi.createdAt))
    .limit(100);
}

/** Disposisi yang lewat batas waktu (badge "Terlambat", PRD 6.D). */
export async function hitungDisposisiTerlambat(): Promise<number> {
  const baris = await db
    .select({ id: schema.disposisi.id })
    .from(schema.disposisi)
    .where(
      and(
        lte(schema.disposisi.batasWaktu, tanggalSql(new Date())),
        eq(schema.disposisi.status, "menunggu"),
      ),
    );
  return baris.length;
}

/** Daftar disposisi milik seorang pegawai (untuk penyampaian hasil). */
export async function disposisiPegawai(pegawaiId: string) {
  return db
    .select({ id: schema.disposisi.id, status: schema.disposisi.status })
    .from(schema.disposisi)
    .where(eq(schema.disposisi.keUserId, pegawaiId));
}
