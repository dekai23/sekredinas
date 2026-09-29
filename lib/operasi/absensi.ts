/**
 * Logika bisnis absensi (presensi) ASN harian.
 *
 * Akses dibatasi untuk Admin serta Kepala Sub Bagian Umum dan Kepegawaian
 * (pemeriksaan kewenangan dilakukan di server action). Satu pegawai hanya
 * boleh memiliki satu catatan per tanggal.
 */
import { and, eq, ne } from "drizzle-orm";

import { catatAksi } from "@/lib/audit";
import { db, schema } from "@/lib/db";
import { waktuWit } from "@/lib/utils";
import { galatZod, skemaAbsensi, type HasilForm } from "@/lib/validasi/konten";

export interface HasilAbsensi extends HasilForm {
  id?: string;
}

/** Menggabungkan tanggal (YYYY-MM-DD) + jam (HH:mm) menjadi Date WIT. */
function waktuCatatan(tanggal: string, jam: string): Date | null {
  if (!jam) return null;
  return waktuWit(`${tanggal}T${jam}`);
}

export async function catatAbsensi(
  pencatatId: string,
  form: FormData,
): Promise<HasilAbsensi> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaAbsensi.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian absensi.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  const pegawai = await db
    .select({ id: schema.pegawai.id, aktif: schema.pegawai.aktif })
    .from(schema.pegawai)
    .where(eq(schema.pegawai.id, data.pegawaiId))
    .limit(1);
  if (pegawai.length === 0) return { field: { pegawaiId: "Pegawai tidak ditemukan." } };
  if (!pegawai[0].aktif) return { field: { pegawaiId: "Pegawai tidak aktif." } };

  const sudahAda = await db
    .select({ id: schema.absensi.id })
    .from(schema.absensi)
    .where(
      and(eq(schema.absensi.pegawaiId, data.pegawaiId), eq(schema.absensi.tanggal, data.tanggal)),
    )
    .limit(1);
  if (sudahAda.length > 0) {
    return { galat: "Sudah ada catatan absensi untuk pegawai ini pada tanggal tersebut." };
  }

  const [tersimpan] = await db
    .insert(schema.absensi)
    .values({
      pegawaiId: data.pegawaiId,
      tanggal: data.tanggal,
      status: data.status,
      jamMasuk: waktuCatatan(data.tanggal, data.jamMasuk),
      jamPulang: waktuCatatan(data.tanggal, data.jamPulang),
      keterangan: data.keterangan || null,
      dicatatOlehId: pencatatId,
    })
    .returning({ id: schema.absensi.id });

  await catatAksi({
    userId: pencatatId,
    aksi: "create",
    entitas: "absensi",
    entitasId: tersimpan.id,
    perubahan: `Absensi ${data.tanggal} (${data.status})`,
  });

  return { sukses: "Catatan absensi tersimpan.", id: tersimpan.id };
}

export async function ubahAbsensi(
  pencatatId: string,
  id: string,
  form: FormData,
): Promise<HasilAbsensi> {
  const objek = Object.fromEntries(
    [...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"),
  );
  const hasil = skemaAbsensi.safeParse(objek);
  if (!hasil.success) {
    return { galat: "Periksa kembali isian absensi.", field: galatZod(hasil.error) };
  }
  const data = hasil.data;

  const bentrok = await db
    .select({ id: schema.absensi.id })
    .from(schema.absensi)
    .where(
      and(
        eq(schema.absensi.pegawaiId, data.pegawaiId),
        eq(schema.absensi.tanggal, data.tanggal),
        ne(schema.absensi.id, id),
      ),
    )
    .limit(1);
  if (bentrok.length > 0) {
    return { galat: "Pegawai ini sudah memiliki catatan pada tanggal tersebut." };
  }

  await db
    .update(schema.absensi)
    .set({
      pegawaiId: data.pegawaiId,
      tanggal: data.tanggal,
      status: data.status,
      jamMasuk: waktuCatatan(data.tanggal, data.jamMasuk),
      jamPulang: waktuCatatan(data.tanggal, data.jamPulang),
      keterangan: data.keterangan || null,
      dicatatOlehId: pencatatId,
      updatedAt: new Date(),
    })
    .where(eq(schema.absensi.id, id));

  await catatAksi({
    userId: pencatatId,
    aksi: "update",
    entitas: "absensi",
    entitasId: id,
    perubahan: `Ubah absensi ${data.tanggal} (${data.status})`,
  });

  return { sukses: "Catatan absensi diperbarui." };
}

export async function hapusAbsensi(pencatatId: string, id: string): Promise<HasilForm> {
  const baris = await db
    .select({ tanggal: schema.absensi.tanggal })
    .from(schema.absensi)
    .where(eq(schema.absensi.id, id))
    .limit(1);
  if (baris.length === 0) return { galat: "Catatan absensi tidak ditemukan." };

  await db.delete(schema.absensi).where(eq(schema.absensi.id, id));

  await catatAksi({
    userId: pencatatId,
    aksi: "delete",
    entitas: "absensi",
    entitasId: id,
    perubahan: `Hapus absensi ${baris[0].tanggal}`,
  });

  return { sukses: "Catatan absensi dihapus." };
}
