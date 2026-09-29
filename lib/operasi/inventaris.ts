/**
 * Logika bisnis inventaris aset (PRD 6.I).
 * Kode aset dibuat otomatis `INV-{KATEGORI}-{URUT}` saat aset baru disimpan.
 */
import { eq } from "drizzle-orm";

import { catatAksi } from "@/lib/audit";
import { db, schema } from "@/lib/db";
import { kodeAsetInventaris } from "@/lib/db/nomor";
import { galatZod, skemaInventaris, type HasilForm } from "@/lib/validasi/konten";

export interface HasilInventaris extends HasilForm {
  id?: string;
  kodeAset?: string;
}

export async function buatInventaris(
  userId: string,
  form: FormData,
): Promise<HasilInventaris> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaInventaris.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian aset.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  const kodeAset = await kodeAsetInventaris(data.kategori);

  const [tersimpan] = await db
    .insert(schema.inventaris)
    .values({
      kodeAset,
      namaAset: data.namaAset,
      kategori: data.kategori,
      merek: data.merek || null,
      tahunPerolehan: data.tahunPerolehan,
      jumlah: data.jumlah,
      satuan: data.satuan || "unit",
      kondisi: data.kondisi,
      lokasi: data.lokasi || null,
      nilaiPerolehan: data.nilaiPerolehan,
      nomorPolisi: data.nomorPolisi || null,
      nomorBmn: data.nomorBmn || null,
      sumberDana: data.sumberDana || null,
      penanggungJawabId: data.penanggungJawabId || null,
    })
    .returning({ id: schema.inventaris.id });

  await catatAksi({
    userId,
    aksi: "create",
    entitas: "inventaris",
    entitasId: tersimpan.id,
    perubahan: `Aset ${kodeAset}: ${data.namaAset}`,
  });

  return { sukses: `Aset ${kodeAset} tersimpan.`, id: tersimpan.id, kodeAset };
}

export async function ubahInventaris(
  userId: string,
  id: string,
  form: FormData,
): Promise<HasilInventaris> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaInventaris.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian aset.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  await db
    .update(schema.inventaris)
    .set({
      namaAset: data.namaAset,
      kategori: data.kategori,
      merek: data.merek || null,
      tahunPerolehan: data.tahunPerolehan,
      jumlah: data.jumlah,
      satuan: data.satuan || "unit",
      kondisi: data.kondisi,
      lokasi: data.lokasi || null,
      nilaiPerolehan: data.nilaiPerolehan,
      nomorPolisi: data.nomorPolisi || null,
      nomorBmn: data.nomorBmn || null,
      sumberDana: data.sumberDana || null,
      penanggungJawabId: data.penanggungJawabId || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.inventaris.id, id));

  await catatAksi({
    userId,
    aksi: "update",
    entitas: "inventaris",
    entitasId: id,
    perubahan: `Ubah aset: ${data.namaAset}`,
  });

  return { sukses: "Data aset diperbarui." };
}

export async function hapusInventaris(userId: string, id: string): Promise<HasilForm> {
  const baris = await db
    .select({ kodeAset: schema.inventaris.kodeAset })
    .from(schema.inventaris)
    .where(eq(schema.inventaris.id, id))
    .limit(1);
  if (baris.length === 0) return { galat: "Aset tidak ditemukan." };

  await db.delete(schema.inventaris).where(eq(schema.inventaris.id, id));

  await catatAksi({
    userId,
    aksi: "delete",
    entitas: "inventaris",
    entitasId: id,
    perubahan: `Hapus aset: ${baris[0].kodeAset}`,
  });

  return { sukses: "Aset dihapus." };
}
