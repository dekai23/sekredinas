/**
 * Logika bisnis berita / artikel / kegiatan portal publik (docs/ARSITEKTUR.md).
 * Hanya baris `publik = true` yang ditayangkan di portal.
 */
import { and, eq, ne } from "drizzle-orm";

import { catatAksi } from "@/lib/audit";
import { db, schema } from "@/lib/db";
import { buatSlug, tanggalWit } from "@/lib/utils";
import { galatZod, skemaBerita, type HasilForm } from "@/lib/validasi/konten";

export interface HasilBerita extends HasilForm {
  id?: string;
  slug?: string;
}

/** Memastikan slug unik; menambahkan akhiran angka bila sudah terpakai. */
async function slugUnik(dasar: string, kecualiId?: string): Promise<string> {
  const awal = dasar || "berita";
  let kandidat = awal;
  for (let i = 2; i < 50; i += 1) {
    const bentrok = await db
      .select({ id: schema.berita.id })
      .from(schema.berita)
      .where(
        kecualiId
          ? and(eq(schema.berita.slug, kandidat), ne(schema.berita.id, kecualiId))
          : eq(schema.berita.slug, kandidat),
      )
      .limit(1);
    if (bentrok.length === 0) return kandidat;
    kandidat = `${awal}-${i}`;
  }
  return `${awal}-${Date.now()}`;
}

export async function buatBerita(userId: string, form: FormData): Promise<HasilBerita> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaBerita.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian berita.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;
  const slug = await slugUnik(buatSlug(data.slug || data.judul));

  const [tersimpan] = await db
    .insert(schema.berita)
    .values({
      judul: data.judul,
      slug,
      ringkasan: data.ringkasan || null,
      isi: data.isi,
      kategori: data.kategori,
      gambarUrl: data.gambarUrl || null,
      publik: data.publik,
      noindex: data.noindex,
      tanggalTerbit: data.tanggalTerbit ? tanggalWit(data.tanggalTerbit) : new Date(),
      createdBy: userId,
    })
    .returning({ id: schema.berita.id });

  await catatAksi({
    userId,
    aksi: "create",
    entitas: "berita",
    entitasId: tersimpan.id,
    perubahan: `Berita: ${data.judul}`,
  });

  return { sukses: "Berita diterbitkan.", id: tersimpan.id, slug };
}

export async function ubahBerita(
  userId: string,
  id: string,
  form: FormData,
): Promise<HasilBerita> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaBerita.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian berita.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;
  const slug = await slugUnik(buatSlug(data.slug || data.judul), id);

  await db
    .update(schema.berita)
    .set({
      judul: data.judul,
      slug,
      ringkasan: data.ringkasan || null,
      isi: data.isi,
      kategori: data.kategori,
      gambarUrl: data.gambarUrl || null,
      publik: data.publik,
      noindex: data.noindex,
      tanggalTerbit: data.tanggalTerbit ? tanggalWit(data.tanggalTerbit) : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.berita.id, id));

  await catatAksi({
    userId,
    aksi: "update",
    entitas: "berita",
    entitasId: id,
    perubahan: `Ubah berita: ${data.judul}`,
  });

  return { sukses: "Berita diperbarui.", slug };
}

export async function hapusBerita(userId: string, id: string): Promise<HasilForm> {
  const baris = await db
    .select({ judul: schema.berita.judul })
    .from(schema.berita)
    .where(eq(schema.berita.id, id))
    .limit(1);
  if (baris.length === 0) return { galat: "Berita tidak ditemukan." };

  await db.delete(schema.berita).where(eq(schema.berita.id, id));

  await catatAksi({
    userId,
    aksi: "delete",
    entitas: "berita",
    entitasId: id,
    perubahan: `Hapus berita: ${baris[0].judul}`,
  });

  return { sukses: "Berita dihapus." };
}
