/**
 * Logika bisnis arsip digital (PRD 6.E), dipisahkan dari server action.
 *
 * Aturan: format multi-berkas (PDF/DOCX/XLSX/JPG/PNG) sampai 25 MB, metadata
 * wajib (judul, kategori, file), tag free-text dipisah koma. Berkas disimpan
 * lewat `simpanBerkas` sehingga diverifikasi magic bytes-nya.
 */
import { eq } from "drizzle-orm";

import { catatAksi } from "@/lib/audit";
import { db, schema } from "@/lib/db";
import { ATURAN_ARSIP, GalatUnggah, simpanBerkas } from "@/lib/unggah";
import { galatZod, skemaArsip, type HasilForm } from "@/lib/validasi/konten";

export interface HasilArsip extends HasilForm {
  id?: string;
}

/** Menyimpan berkas arsip baru. Berkas wajib ada. */
export async function unggahArsip(
  userId: string,
  form: FormData,
): Promise<HasilArsip> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaArsip.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian formulir.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  const berkas = form.get("berkas");
  if (!(berkas instanceof File) || berkas.size === 0) {
    return { field: { berkas: "Berkas arsip wajib dipilih." } };
  }

  let unggah;
  try {
    unggah = await simpanBerkas(berkas, ATURAN_ARSIP, "arsip");
  } catch (galat) {
    if (galat instanceof GalatUnggah) return { field: { berkas: galat.message } };
    throw galat;
  }

  const [tersimpan] = await db
    .insert(schema.arsip)
    .values({
      judul: data.judul,
      deskripsi: data.deskripsi || null,
      kategori: data.kategori || null,
      kodeKlasifikasi: data.kodeKlasifikasi || null,
      tahun: data.tahun,
      unitId: data.unitId || null,
      fileUrl: unggah.path,
      fileName: unggah.namaAsli,
      fileSize: unggah.ukuran,
      fileType: unggah.tipe,
      tags: data.tags || null,
      uploadedBy: userId,
    })
    .returning({ id: schema.arsip.id });

  await catatAksi({
    userId,
    aksi: "create",
    entitas: "arsip",
    entitasId: tersimpan.id,
    perubahan: `Unggah arsip: ${data.judul}`,
  });

  return { sukses: "Arsip berhasil diunggah.", id: tersimpan.id };
}

/** Menghapus satu berkas arsip beserta barisnya. */
export async function hapusArsip(userId: string, id: string): Promise<HasilForm> {
  const baris = await db
    .select({ judul: schema.arsip.judul })
    .from(schema.arsip)
    .where(eq(schema.arsip.id, id))
    .limit(1);
  if (baris.length === 0) return { galat: "Arsip tidak ditemukan." };

  await db.delete(schema.arsip).where(eq(schema.arsip.id, id));

  await catatAksi({
    userId,
    aksi: "delete",
    entitas: "arsip",
    entitasId: id,
    perubahan: `Hapus arsip: ${baris[0].judul}`,
  });

  return { sukses: "Arsip dihapus." };
}

/** Memecah string tag menjadi daftar bersih. */
export function pecahTag(tags: string | null | undefined): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
