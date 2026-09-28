"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { boleh, wajibMasuk } from "@/lib/auth/hak-akses";
import { daftarSuratMasuk, ubahStatus } from "@/lib/operasi/surat-masuk";
import type { HasilForm } from "@/lib/validasi/surat";

/**
 * Server action: registrasi surat masuk baru (PRD 6.B).
 *
 * Berkas ini sengaja tipis - seluruh aturan bisnis ada di
 * `lib/operasi/surat-masuk.ts` supaya dapat diuji tanpa peramban.
 * Tugas di sini hanya: memastikan sesi & kewenangan, memanggil operasi,
 * lalu mengarahkan pengguna ke halaman detail.
 */
export async function registrasiSuratMasuk(
  _state: HasilForm | null,
  form: FormData,
): Promise<HasilForm> {
  const sesi = await wajibMasuk("dashboard/surat-masuk");
  if (!boleh(sesi, "surat-masuk.buat")) {
    return { galat: "Anda tidak berwenang menambah surat masuk." };
  }

  const hasil = await daftarSuratMasuk(sesi.id, form);
  if (!hasil.id) return hasil;

  revalidatePath("/dashboard/surat-masuk");
  redirect(`/dashboard/surat-masuk/${hasil.id}?terdaftar=${hasil.nomorAgenda}`);
}

/** Server action: mengubah status surat masuk. */
export async function ubahStatusSuratMasuk(
  id: string,
  status: "dibaca" | "didisposisi" | "selesai" | "arsip",
): Promise<void> {
  const sesi = await wajibMasuk("dashboard/surat-masuk");
  if (!boleh(sesi, "surat-masuk.ubah")) {
    throw new Error("Anda tidak berwenang mengubah status surat.");
  }

  await ubahStatus(sesi.id, id, status);

  revalidatePath(`/dashboard/surat-masuk/${id}`);
  revalidatePath("/dashboard/surat-masuk");
}
