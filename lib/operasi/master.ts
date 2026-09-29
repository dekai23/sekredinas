/**
 * Logika bisnis data master: unit kerja, kategori surat, dan pengaturan
 * instansi. Dipisahkan dari server action agar dapat diuji.
 */
import { and, eq, ne } from "drizzle-orm";

import { catatAksi } from "@/lib/audit";
import { db, schema } from "@/lib/db";
import {
  galatZod,
  skemaKategori,
  skemaPengaturan,
  skemaUnitKerja,
  type HasilForm,
} from "@/lib/validasi/konten";

export interface HasilMaster extends HasilForm {
  id?: string;
}

/* ---------------------------- UNIT KERJA --------------------------- */

export async function buatUnitKerja(
  userId: string,
  form: FormData,
): Promise<HasilMaster> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  // Pilihan induk "Pemerintah Kabupaten Yahukimo" bukan unit kerja.
  if (objek.indukId === "__pemkab__") {
    objek.indukPemkab = "on";
    objek.indukId = "";
  }
  const hasil = skemaUnitKerja.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian unit kerja.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  const bentrok = await db
    .select({ id: schema.unitKerja.id })
    .from(schema.unitKerja)
    .where(eq(schema.unitKerja.kode, data.kode))
    .limit(1);
  if (bentrok.length > 0) {
    return { field: { kode: "Kode unit sudah dipakai." } };
  }

  const [tersimpan] = await db
    .insert(schema.unitKerja)
    .values({
      nama: data.nama,
      kode: data.kode,
      jenis: data.jenis,
      indukId: data.indukPemkab ? null : data.indukId || null,
      indukPemkab: data.indukPemkab,
      urutan: data.urutan ?? 0,
      pejabatEselon: data.pejabatEselon || null,
      publik: data.publik,
    })
    .returning({ id: schema.unitKerja.id });

  await catatAksi({
    userId,
    aksi: "create",
    entitas: "unit_kerja",
    entitasId: tersimpan.id,
    perubahan: `Unit kerja ${data.kode}: ${data.nama}`,
  });

  return { sukses: "Unit kerja ditambahkan.", id: tersimpan.id };
}

export async function ubahUnitKerja(
  userId: string,
  id: string,
  form: FormData,
): Promise<HasilMaster> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  if (objek.indukId === "__pemkab__") {
    objek.indukPemkab = "on";
    objek.indukId = "";
  }
  const hasil = skemaUnitKerja.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian unit kerja.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  const bentrok = await db
    .select({ id: schema.unitKerja.id })
    .from(schema.unitKerja)
    .where(and(eq(schema.unitKerja.kode, data.kode), ne(schema.unitKerja.id, id)))
    .limit(1);
  if (bentrok.length > 0) return { field: { kode: "Kode unit sudah dipakai." } };

  await db
    .update(schema.unitKerja)
    .set({
      nama: data.nama,
      kode: data.kode,
      jenis: data.jenis,
      indukId: data.indukPemkab ? null : data.indukId || null,
      indukPemkab: data.indukPemkab,
      urutan: data.urutan ?? 0,
      pejabatEselon: data.pejabatEselon || null,
      publik: data.publik,
      updatedAt: new Date(),
    })
    .where(eq(schema.unitKerja.id, id));

  await catatAksi({
    userId,
    aksi: "update",
    entitas: "unit_kerja",
    entitasId: id,
    perubahan: `Ubah unit ${data.kode}: ${data.nama}`,
  });

  return { sukses: "Unit kerja diperbarui." };
}

export async function hapusUnitKerja(userId: string, id: string): Promise<HasilForm> {
  const anak = await db
    .select({ id: schema.unitKerja.id })
    .from(schema.unitKerja)
    .where(eq(schema.unitKerja.indukId, id))
    .limit(1);
  if (anak.length > 0) {
    return { galat: "Unit ini masih memiliki sub unit. Hapus atau pindahkan sub unit dulu." };
  }

  const baris = await db
    .select({ kode: schema.unitKerja.kode })
    .from(schema.unitKerja)
    .where(eq(schema.unitKerja.id, id))
    .limit(1);
  if (baris.length === 0) return { galat: "Unit kerja tidak ditemukan." };

  await db.delete(schema.unitKerja).where(eq(schema.unitKerja.id, id));

  await catatAksi({
    userId,
    aksi: "delete",
    entitas: "unit_kerja",
    entitasId: id,
    perubahan: `Hapus unit ${baris[0].kode}`,
  });

  return { sukses: "Unit kerja dihapus." };
}

/* --------------------------- KATEGORI SURAT ------------------------ */

export async function buatKategori(
  userId: string,
  form: FormData,
): Promise<HasilMaster> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaKategori.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian kategori.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  const bentrok = await db
    .select({ id: schema.kategoriSurat.id })
    .from(schema.kategoriSurat)
    .where(eq(schema.kategoriSurat.kode, data.kode))
    .limit(1);
  if (bentrok.length > 0) return { field: { kode: "Kode kategori sudah dipakai." } };

  const [tersimpan] = await db
    .insert(schema.kategoriSurat)
    .values({
      nama: data.nama,
      kode: data.kode,
      uraian: data.uraian || null,
      aktif: data.aktif,
    })
    .returning({ id: schema.kategoriSurat.id });

  await catatAksi({
    userId,
    aksi: "create",
    entitas: "kategori_surat",
    entitasId: tersimpan.id,
    perubahan: `Kategori ${data.kode}: ${data.nama}`,
  });

  return { sukses: "Kategori ditambahkan.", id: tersimpan.id };
}

export async function ubahKategori(
  userId: string,
  id: string,
  form: FormData,
): Promise<HasilMaster> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaKategori.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian kategori.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  const bentrok = await db
    .select({ id: schema.kategoriSurat.id })
    .from(schema.kategoriSurat)
    .where(and(eq(schema.kategoriSurat.kode, data.kode), ne(schema.kategoriSurat.id, id)))
    .limit(1);
  if (bentrok.length > 0) return { field: { kode: "Kode kategori sudah dipakai." } };

  await db
    .update(schema.kategoriSurat)
    .set({ nama: data.nama, kode: data.kode, uraian: data.uraian || null, aktif: data.aktif })
    .where(eq(schema.kategoriSurat.id, id));

  await catatAksi({
    userId,
    aksi: "update",
    entitas: "kategori_surat",
    entitasId: id,
    perubahan: `Ubah kategori ${data.kode}: ${data.nama}`,
  });

  return { sukses: "Kategori diperbarui." };
}

export async function hapusKategori(userId: string, id: string): Promise<HasilForm> {
  const baris = await db
    .select({ kode: schema.kategoriSurat.kode })
    .from(schema.kategoriSurat)
    .where(eq(schema.kategoriSurat.id, id))
    .limit(1);
  if (baris.length === 0) return { galat: "Kategori tidak ditemukan." };

  await db.delete(schema.kategoriSurat).where(eq(schema.kategoriSurat.id, id));

  await catatAksi({
    userId,
    aksi: "delete",
    entitas: "kategori_surat",
    entitasId: id,
    perubahan: `Hapus kategori ${baris[0].kode}`,
  });

  return { sukses: "Kategori dihapus." };
}

/* ---------------------------- PENGATURAN --------------------------- */

export async function simpanPengaturan(
  userId: string,
  form: FormData,
): Promise<HasilForm> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaPengaturan.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian pengaturan.", field: galatZod(hasil.error) };
  }

  const data = hasil.data;
  for (const [kunci, nilai] of Object.entries(data)) {
    await db
      .insert(schema.pengaturan)
      .values({ kunci, nilai })
      .onConflictDoUpdate({
        target: schema.pengaturan.kunci,
        set: { nilai, updatedAt: new Date() },
      });
  }

  await catatAksi({
    userId,
    aksi: "update",
    entitas: "pengaturan",
    perubahan: "Identitas instansi diperbarui",
  });

  return { sukses: "Pengaturan disimpan." };
}
