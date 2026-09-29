"use server";

import { revalidatePath } from "next/cache";

import { adalahPengelolaAbsensi, wajibMasuk } from "@/lib/auth/hak-akses";
import {
  catatAbsensi as catat,
  hapusAbsensi as hapus,
  ubahAbsensi as ubah,
} from "@/lib/operasi/absensi";
import type { HasilForm } from "@/lib/validasi/konten";

/** Server action: menambah catatan absensi (Admin / Kasubbag Umum & Kepegawaian). */
export async function catatAbsensi(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/absensi");
  if (!adalahPengelolaAbsensi(sesi)) {
    return { galat: "Anda tidak berwenang mencatat absensi." };
  }

  const hasil = await catat(sesi.id, form);
  if (hasil.sukses) revalidatePath("/dashboard/absensi");
  return hasil;
}

/** Server action: mengubah catatan absensi. */
export async function ubahAbsensi(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/absensi");
  if (!adalahPengelolaAbsensi(sesi)) {
    return { galat: "Anda tidak berwenang mengubah absensi." };
  }

  const id = String(form.get("id") ?? "");
  const hasil = await ubah(sesi.id, id, form);
  if (hasil.sukses) revalidatePath("/dashboard/absensi");
  return hasil;
}

/** Server action: menghapus catatan absensi. */
export async function hapusAbsensi(id: string): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/absensi");
  if (!adalahPengelolaAbsensi(sesi)) {
    return { galat: "Anda tidak berwenang menghapus absensi." };
  }

  const hasil = await hapus(sesi.id, id);
  revalidatePath("/dashboard/absensi");
  return hasil;
}
