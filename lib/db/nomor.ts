/**
 * Penomoran otomatis (PRD 6.B dan 6.C).
 *
 * Dua nomor yang berbeda:
 *  - Nomor agenda surat masuk : `SM-2026-0001` (reset tiap tahun)
 *  - Nomor surat keluar       : `KP/001/SEK-UK/IX/2026`
 *      {KODE_KATEGORI}/{URUT}/{KODE_UNIT}/{BULAN_ROMAWI}/{TAHUN}
 *
 * Pengambilan nomor memakai SATU pernyataan SQL (upsert) sehingga tetap unik
 * walau dua orang Stored Procedures berjalan bersamaan:
 *
 *   insert into nomor_urut (konteks, nilai) values (?, 1)
 *   on conflict (konteks) do update set nilai = nomor_urut.nilai + 1
 *   returning nilai;
 */
import { eq, sql } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { bulanRomawi } from "@/lib/utils";

/** Naikkan penghitung dan kembalikan nilai barunya. */
async function ambilUrut(konteks: string): Promise<number> {
  const baris = await db
    .insert(schema.nomorUrut)
    .values({ konteks, nilai: 1 })
    .onConflictDoUpdate({
      target: schema.nomorUrut.konteks,
      set: { nilai: sql`${schema.nomorUrut.nilai} + 1`, updatedAt: new Date() },
    })
    .returning({ nilai: schema.nomorUrut.nilai });

  return baris[0].nilai;
}

/** Nomor urut saat ini tanpa menaikkan (untuk pratinjau / prediksi). */
export async function lihatUrut(konteks: string): Promise<number> {
  const baris = await db
    .select({ nilai: schema.nomorUrut.nilai })
    .from(schema.nomorUrut)
    .where(eq(schema.nomorUrut.konteks, konteks))
    .limit(1);
  return baris[0]?.nilai ?? 0;
}

/** Konfigurasi penomoran (bisa diubah lewat menu Pengaturan pada Fase 5). */
export const POLA_NOMOR = {
  /** Panjang nomor urut pada nomor agenda surat masuk. */
  agendaDigit: 4,
  /** Panjang nomor urut pada nomor surat keluar. */
  keluarDigit: 3,
  /** Awalan nomor agenda surat masuk. */
  prefiksAgenda: "SM",
} as const;

/**
 * Nomor agenda surat masuk, contoh `SM-2026-0001`.
 * Penghitung memakai konteks per tahun agar otomatis reset setiap 1 Januari.
 */
export async function nomorAgendaSuratMasuk(
  tanggal: Date = new Date(),
): Promise<string> {
  const tahun = tanggal.getFullYear();
  const urut = await ambilUrut(`SM/${tahun}`);
  return `${POLA_NOMOR.prefiksAgenda}-${tahun}-${String(urut).padStart(
    POLA_NOMOR.agendaDigit,
    "0",
  )}`;
}

/**
 * Nomor surat keluar, contoh `KP/001/SEK-UK/IX/2026`.
 *
 * Konteks penghitung mencakup kategori, unit penerbit, dan bulan sehingga urut
 * dimulai dari 1 untuk setiap kombinasi - sesuai praktik penomoran surat dinas.
 * Nomor tetap dijamin unik oleh `uniqueIndex` pada tabel surat_keluar.
 */
export async function nomorSuratKeluar({
  kodeKategori,
  kodeUnit,
  tanggal,
}: {
  kodeKategori: string;
  kodeUnit: string;
  tanggal?: Date;
}): Promise<string> {
  const tgl = tanggal ?? new Date();
  const tahun = tgl.getFullYear();
  const bulan = bulanRomawi(tgl);
  const konteks = `SK/${tahun}/${kodeUnit}/${bulan}/${kodeKategori}`;
  const urut = await ambilUrut(konteks);
  return `${kodeKategori}/${String(urut).padStart(POLA_NOMOR.keluarDigit, "0")}/${kodeUnit}/${bulan}/${tahun}`;
}

/** Kode inventaris, contoh `INV-ALAT-0007` (PRD 6.I). */
export async function kodeAsetInventaris(kategori: string): Promise<string> {
  const kode = kategori.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "ASN";
  const urut = await ambilUrut(`INV/${kode}`);
  return `INV-${kode}-${String(urut).padStart(4, "0")}`;
}

/** Hapus semua penghitung (dipakai saat reset dev). */
export async function resetPenghitung(konteks?: string): Promise<void> {
  if (konteks) {
    await db.delete(schema.nomorUrut).where(eq(schema.nomorUrut.konteks, konteks));
    return;
  }
  await db.delete(schema.nomorUrut);
}
