/**
 * Logika bisnis surat masuk, dipisahkan dari server action.
 *
 * TUJUAN: aturan bisnis (validasi, nomor agenda, penyimpanan berkas, audit)
 * dapat diuji tanpa harus melalui peramban, sementara berkas `aksi.ts` tetap
 * tipis: memeriksa sesi, memanggil fungsi di sini, lalu mengarahkan ulang.
 */
import { eq } from "drizzle-orm";

import { catatAksi } from "@/lib/audit";
import { db, schema } from "@/lib/db";
import { nomorAgendaSuratMasuk } from "@/lib/db/nomor";
import { ATURAN_SURAT_MASUK, GalatUnggah, simpanBerkas } from "@/lib/unggah";
import {
  galatZod,
  skemaSuratMasuk,
  type HasilForm,
} from "@/lib/validasi/surat";

/**
 * Mendaftarkan surat masuk baru (PRD 6.B).
 *
 * Urutan langkah penting:
 *  1. validasi kolom (Zod),
 *  2. berkas scan wajib ada,
 *  3. berkas disimpan & diverifikasi (ukuran, MIME nyata),
 *  4. nomor agenda dibuat SETELAH berkas aman tersimpan,
 *  5. baris surat disimpan, lalu audit log ditulis.
 */
export async function daftarSuratMasuk(
  userId: string,
  form: FormData,
): Promise<HasilForm & { id?: string; nomorAgenda?: string }> {
  const hasil = skemaSuratMasuk.safeParse(
    Object.fromEntries(
      [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
    ),
  );
  if (!hasil.success) {
    return { galat: "Periksa kembali isian formulir.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  const berkas = form.get("berkas");
  if (!(berkas instanceof File) || berkas.size === 0) {
    return { field: { berkas: "Berkas scan PDF wajib diunggah." } };
  }

  let unggah;
  try {
    unggah = await simpanBerkas(berkas, ATURAN_SURAT_MASUK, "surat-masuk");
  } catch (galat) {
    if (galat instanceof GalatUnggah) {
      return { field: { berkas: galat.message } };
    }
    throw galat;
  }

  // Nomor agenda dibuat setelah berkas aman, agar nomor tidak terbuang.
  const nomorAgenda = await nomorAgendaSuratMasuk();

  const [tersimpan] = await db
    .insert(schema.suratMasuk)
    .values({
      nomorAgenda,
      nomorSurat: data.nomorSurat || null,
      asalSurat: data.asalSurat,
      perihal: data.perihal,
      tanggalSurat: data.tanggalSurat,
      tanggalTerima: data.tanggalTerima,
      kategoriId: data.kategoriId || null,
      sifat: data.sifat,
      catatan: data.catatan || null,
      fileUrl: unggah.path,
      fileName: unggah.namaAsli,
      fileSize: unggah.ukuran,
      status: "terkirim",
      createdBy: userId,
    })
    .returning({ id: schema.suratMasuk.id });

  await catatAksi({
    userId,
    aksi: "create",
    entitas: "surat_masuk",
    entitasId: tersimpan.id,
    perubahan: `Nomor agenda ${nomorAgenda} dari ${data.asalSurat}`,
  });

  return { sukses: "Surat terdaftar.", id: tersimpan.id, nomorAgenda };
}

/** Mengubah status surat masuk dan mencatat perubahannya (PRD 6.B). */
export async function ubahStatus(
  userId: string,
  id: string,
  status: "dibaca" | "didisposisi" | "selesai" | "arsip",
): Promise<void> {
  const sekarang = await db
    .select({ status: schema.suratMasuk.status })
    .from(schema.suratMasuk)
    .where(eq(schema.suratMasuk.id, id))
    .limit(1);
  if (sekarang.length === 0) throw new Error("Surat tidak ditemukan.");
  if (sekarang[0].status === status) return;

  await db
    .update(schema.suratMasuk)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.suratMasuk.id, id));

  await catatAksi({
    userId,
    aksi: "update",
    entitas: "surat_masuk",
    entitasId: id,
    perubahan: `status ${sekarang[0].status} -> ${status}`,
  });
}
