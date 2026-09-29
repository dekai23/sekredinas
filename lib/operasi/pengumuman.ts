/**
 * Logika bisnis pengumuman (PRD 6.H).
 *
 * Sebuah pengumuman dapat bersifat internal (tampil di aplikasi) dan/atau
 * publik (tayang di portal /pengumuman). Jadwal tayang diatur lewat
 * tanggalMulai & tanggalBerakhir.
 */
import { eq } from "drizzle-orm";

import { catatAksi } from "@/lib/audit";
import { db, schema } from "@/lib/db";
import { tanggalWit } from "@/lib/utils";
import { galatZod, skemaPengumuman, type HasilForm } from "@/lib/validasi/konten";

export interface HasilPengumuman extends HasilForm {
  id?: string;
}

export async function buatPengumuman(
  userId: string,
  form: FormData,
): Promise<HasilPengumuman> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaPengumuman.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian pengumuman.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  const [tersimpan] = await db
    .insert(schema.pengumuman)
    .values({
      judul: data.judul,
      ringkasan: data.ringkasan || null,
      isi: data.isi,
      prioritas: data.prioritas,
      kategori: data.kategori,
      internal: data.internal || (!data.publik ? true : data.internal),
      publik: data.publik,
      tanggalMulai: data.tanggalMulai ? tanggalWit(data.tanggalMulai) : new Date(),
      tanggalBerakhir: data.tanggalBerakhir ? tanggalWit(data.tanggalBerakhir) : null,
      createdBy: userId,
    })
    .returning({ id: schema.pengumuman.id });

  await catatAksi({
    userId,
    aksi: "create",
    entitas: "pengumuman",
    entitasId: tersimpan.id,
    perubahan: `Pengumuman: ${data.judul}${data.publik ? " (publik)" : ""}`,
  });

  return { sukses: "Pengumuman diterbitkan.", id: tersimpan.id };
}

export async function ubahPengumuman(
  userId: string,
  id: string,
  form: FormData,
): Promise<HasilPengumuman> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaPengumuman.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian pengumuman.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  await db
    .update(schema.pengumuman)
    .set({
      judul: data.judul,
      ringkasan: data.ringkasan || null,
      isi: data.isi,
      prioritas: data.prioritas,
      kategori: data.kategori,
      internal: data.internal || (!data.publik ? true : data.internal),
      publik: data.publik,
      tanggalMulai: data.tanggalMulai ? tanggalWit(data.tanggalMulai) : new Date(),
      tanggalBerakhir: data.tanggalBerakhir ? tanggalWit(data.tanggalBerakhir) : null,
      updatedAt: new Date(),
    })
    .where(eq(schema.pengumuman.id, id));

  await catatAksi({
    userId,
    aksi: "update",
    entitas: "pengumuman",
    entitasId: id,
    perubahan: `Ubah pengumuman: ${data.judul}`,
  });

  return { sukses: "Pengumuman diperbarui." };
}

export async function hapusPengumuman(userId: string, id: string): Promise<HasilForm> {
  const baris = await db
    .select({ judul: schema.pengumuman.judul })
    .from(schema.pengumuman)
    .where(eq(schema.pengumuman.id, id))
    .limit(1);
  if (baris.length === 0) return { galat: "Pengumuman tidak ditemukan." };

  await db.delete(schema.pengumuman).where(eq(schema.pengumuman.id, id));

  await catatAksi({
    userId,
    aksi: "delete",
    entitas: "pengumuman",
    entitasId: id,
    perubahan: `Hapus pengumuman: ${baris[0].judul}`,
  });

  return { sukses: "Pengumuman dihapus." };
}

/** Ringkasan periode pengumuman untuk ditampilkan pada kartu. */
export function rentangPengumuman(
  mulai: Date,
  berakhir: Date | null,
): string {
  if (!berakhir) return "Berlaku sampai dicabut";
  return `Berakhir ${berakhir.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;
}
