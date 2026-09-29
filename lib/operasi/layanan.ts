/**
 * Logika bisnis layanan kepegawaian publik (portal /layanan).
 * `syarat` dan `alur` disimpan sebagai JSON array; di formulir diisi satu
 * butir per baris.
 */
import { and, eq, ne } from "drizzle-orm";

import { catatAksi } from "@/lib/audit";
import { db, schema } from "@/lib/db";
import { buatSlug } from "@/lib/utils";
import { galatZod, skemaLayanan, type HasilForm } from "@/lib/validasi/konten";

export interface HasilLayanan extends HasilForm {
  id?: string;
  slug?: string;
}

/** Memecah teks multi-baris menjadi daftar butir (JSON array). */
export function keDaftarJson(teks: string): string {
  const butir = teks
    .split(/\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  return butir.length > 0 ? JSON.stringify(butir) : "";
}

/** Menyusun kembali JSON array menjadi teks multi-baris untuk formulir. */
export function dariDaftarJson(nilai: string | null | undefined): string {
  if (!nilai) return "";
  try {
    const hasil = JSON.parse(nilai);
    return Array.isArray(hasil) ? hasil.map(String).join("\n") : "";
  } catch {
    return "";
  }
}

async function slugUnik(dasar: string, kecualiId?: string): Promise<string> {
  const awal = dasar || "layanan";
  let kandidat = awal;
  for (let i = 2; i < 50; i += 1) {
    const bentrok = await db
      .select({ id: schema.layanan.id })
      .from(schema.layanan)
      .where(
        kecualiId
          ? and(eq(schema.layanan.slug, kandidat), ne(schema.layanan.id, kecualiId))
          : eq(schema.layanan.slug, kandidat),
      )
      .limit(1);
    if (bentrok.length === 0) return kandidat;
    kandidat = `${awal}-${i}`;
  }
  return `${awal}-${Date.now()}`;
}

export async function buatLayanan(userId: string, form: FormData): Promise<HasilLayanan> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaLayanan.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian layanan.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;
  const slug = await slugUnik(buatSlug(data.slug || data.judul));

  const [tersimpan] = await db
    .insert(schema.layanan)
    .values({
      judul: data.judul,
      slug,
      ringkasan: data.ringkasan || null,
      deskripsi: data.deskripsi,
      syarat: keDaftarJson(data.syarat) || null,
      alur: keDaftarJson(data.alur) || null,
      waktuPenyelesaian: data.waktuPenyelesaian || null,
      dasarHukum: data.dasarHukum || null,
      unitId: data.unitId || null,
      urutan: data.urutan ?? 0,
      publik: data.publik,
      createdBy: userId,
    })
    .returning({ id: schema.layanan.id });

  await catatAksi({
    userId,
    aksi: "create",
    entitas: "layanan",
    entitasId: tersimpan.id,
    perubahan: `Layanan: ${data.judul}`,
  });

  return { sukses: "Layanan tersimpan.", id: tersimpan.id, slug };
}

export async function ubahLayanan(
  userId: string,
  id: string,
  form: FormData,
): Promise<HasilLayanan> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaLayanan.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian layanan.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;
  const slug = await slugUnik(buatSlug(data.slug || data.judul), id);

  await db
    .update(schema.layanan)
    .set({
      judul: data.judul,
      slug,
      ringkasan: data.ringkasan || null,
      deskripsi: data.deskripsi,
      syarat: keDaftarJson(data.syarat) || null,
      alur: keDaftarJson(data.alur) || null,
      waktuPenyelesaian: data.waktuPenyelesaian || null,
      dasarHukum: data.dasarHukum || null,
      unitId: data.unitId || null,
      urutan: data.urutan ?? 0,
      publik: data.publik,
      updatedAt: new Date(),
    })
    .where(eq(schema.layanan.id, id));

  await catatAksi({
    userId,
    aksi: "update",
    entitas: "layanan",
    entitasId: id,
    perubahan: `Ubah layanan: ${data.judul}`,
  });

  return { sukses: "Layanan diperbarui.", slug };
}

export async function hapusLayanan(userId: string, id: string): Promise<HasilForm> {
  const baris = await db
    .select({ judul: schema.layanan.judul })
    .from(schema.layanan)
    .where(eq(schema.layanan.id, id))
    .limit(1);
  if (baris.length === 0) return { galat: "Layanan tidak ditemukan." };

  await db.delete(schema.layanan).where(eq(schema.layanan.id, id));

  await catatAksi({
    userId,
    aksi: "delete",
    entitas: "layanan",
    entitasId: id,
    perubahan: `Hapus layanan: ${baris[0].judul}`,
  });

  return { sukses: "Layanan dihapus." };
}
