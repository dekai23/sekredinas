/**
 * Logika bisnis agenda kegiatan (PRD 6.F).
 * Agenda dapat ditandai publik agar tampil di portal; agenda internal hanya
 * untuk pengguna yang login.
 */
import { eq } from "drizzle-orm";

import { catatAksi } from "@/lib/audit";
import { db, schema } from "@/lib/db";
import { waktuWit } from "@/lib/utils";
import { galatZod, skemaAgenda, type HasilForm } from "@/lib/validasi/konten";

export interface HasilAgenda extends HasilForm {
  id?: string;
}

export async function buatAgenda(userId: string, form: FormData): Promise<HasilAgenda> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaAgenda.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian agenda.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  const [tersimpan] = await db
    .insert(schema.agenda)
    .values({
      judul: data.judul,
      deskripsi: data.deskripsi || null,
      lokasi: data.lokasi || null,
      mulai: waktuWit(data.mulai),
      selesai: data.selesai ? waktuWit(data.selesai) : null,
      jenis: data.jenis,
      publik: data.publik,
      penanggungJawabId: data.penanggungJawabId || null,
      createdBy: userId,
    })
    .returning({ id: schema.agenda.id });

  await catatAksi({
    userId,
    aksi: "create",
    entitas: "agenda",
    entitasId: tersimpan.id,
    perubahan: `Agenda: ${data.judul} (${data.mulai})`,
  });

  return { sukses: "Agenda tersimpan.", id: tersimpan.id };
}

export async function ubahAgenda(
  userId: string,
  id: string,
  form: FormData,
): Promise<HasilAgenda> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaAgenda.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian agenda.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  await db
    .update(schema.agenda)
    .set({
      judul: data.judul,
      deskripsi: data.deskripsi || null,
      lokasi: data.lokasi || null,
      mulai: waktuWit(data.mulai),
      selesai: data.selesai ? waktuWit(data.selesai) : null,
      jenis: data.jenis,
      publik: data.publik,
      penanggungJawabId: data.penanggungJawabId || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.agenda.id, id));

  await catatAksi({
    userId,
    aksi: "update",
    entitas: "agenda",
    entitasId: id,
    perubahan: `Ubah agenda: ${data.judul}`,
  });

  return { sukses: "Agenda diperbarui." };
}

export async function hapusAgenda(userId: string, id: string): Promise<HasilForm> {
  const baris = await db
    .select({ judul: schema.agenda.judul })
    .from(schema.agenda)
    .where(eq(schema.agenda.id, id))
    .limit(1);
  if (baris.length === 0) return { galat: "Agenda tidak ditemukan." };

  await db.delete(schema.agenda).where(eq(schema.agenda.id, id));

  await catatAksi({
    userId,
    aksi: "delete",
    entitas: "agenda",
    entitasId: id,
    perubahan: `Hapus agenda: ${baris[0].judul}`,
  });

  return { sukses: "Agenda dihapus." };
}
